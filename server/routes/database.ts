import { Router } from "express";
import { z } from "zod";
import { db } from "../db";
import { sql } from "drizzle-orm";
import { authMiddleware } from "../middleware/auth";

const router = Router();

// Apply auth middleware and check for superadmin role
router.use(authMiddleware);
router.use((req: any, res, next) => {
  if (req.user?.role !== 'superadmin') {
    return res.status(403).json({ error: 'Access denied. Super admin required.' });
  }
  next();
});

// Get all tables with row counts
router.get("/tables", async (req, res) => {
  try {
    // Get all tables from information schema
    const tables = await db.execute(
      sql`
        SELECT 
          table_name,
          (
            SELECT COUNT(*) 
            FROM information_schema.tables t2 
            WHERE t2.table_name = t.table_name 
            AND t2.table_schema = 'public'
          ) as table_exists
        FROM information_schema.tables t
        WHERE table_schema = 'public' 
        AND table_type = 'BASE TABLE'
        ORDER BY table_name
      `
    );

    // Get row counts for each table
    const tablesWithCounts = await Promise.all(
      tables.map(async (table: any) => {
        try {
          const countResult = await db.execute(
            sql.raw(`SELECT COUNT(*) as count FROM "${table.table_name}"`)
          );
          return {
            table_name: table.table_name,
            row_count: Number(countResult[0]?.count) || 0
          };
        } catch (error) {
          console.error(`Error counting rows for ${table.table_name}:`, error);
          return {
            table_name: table.table_name,
            row_count: 0
          };
        }
      })
    );

    res.json(tablesWithCounts);
  } catch (error) {
    console.error("Error fetching tables:", error);
    res.status(500).json({ error: "Failed to fetch database tables" });
  }
});

// Get data from a specific table
router.get("/table-data/:tableName", async (req, res) => {
  try {
    const { tableName } = req.params;
    const limit = Math.min(parseInt(req.query.limit as string) || 100, 1000);
    const offset = parseInt(req.query.offset as string) || 0;

    // Validate table name to prevent SQL injection
    if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(tableName)) {
      return res.status(400).json({ error: "Invalid table name" });
    }

    // Get table structure first
    const columns = await db.execute(
      sql`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = ${tableName} 
        AND table_schema = 'public'
        ORDER BY ordinal_position
      `
    );

    if (columns.length === 0) {
      return res.status(404).json({ error: "Table not found" });
    }

    // Get table data
    const data = await db.execute(
      sql.raw(`SELECT * FROM "${tableName}" ORDER BY 1 LIMIT ${limit} OFFSET ${offset}`)
    );

    const columnNames = columns.map((col: any) => col.column_name);
    const rows = data.map((row: any) => columnNames.map((col: string) => row[col]));

    res.json({
      columns: columnNames,
      rows: rows,
      rowCount: data.length,
      totalRows: data.length // This would need a separate COUNT query for pagination
    });
  } catch (error) {
    console.error("Error fetching table data:", error);
    res.status(500).json({ error: "Failed to fetch table data" });
  }
});

// Execute custom SQL query
const executeQuerySchema = z.object({
  query: z.string().min(1, "Query is required")
});

router.post("/execute", async (req, res) => {
  try {
    const { query } = executeQuerySchema.parse(req.body);

    // Basic security: only allow SELECT, SHOW, DESCRIBE statements
    const trimmedQuery = query.trim().toLowerCase();
    if (!trimmedQuery.startsWith('select') && 
        !trimmedQuery.startsWith('show') && 
        !trimmedQuery.startsWith('describe') &&
        !trimmedQuery.startsWith('explain')) {
      return res.status(400).json({ 
        error: "Only SELECT, SHOW, DESCRIBE, and EXPLAIN queries are allowed for security reasons" 
      });
    }

    const startTime = Date.now();
    const result = await db.execute(sql.raw(query));
    const executionTime = Date.now() - startTime;

    // Extract column names from first row if available
    const columns = result.length > 0 ? Object.keys(result[0]) : [];
    const rows = result.map(row => columns.map(col => row[col]));

    res.json({
      columns,
      rows,
      rowCount: result.length,
      executionTime
    });
  } catch (error) {
    console.error("Error executing query:", error);
    res.status(400).json({ 
      error: error instanceof Error ? error.message : "Query execution failed" 
    });
  }
});

// Export table data as CSV
router.get("/export/:tableName", async (req, res) => {
  try {
    const { tableName } = req.params;

    // Validate table name
    if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(tableName)) {
      return res.status(400).json({ error: "Invalid table name" });
    }

    // Get table data
    const data = await db.execute(
      sql.raw(`SELECT * FROM "${tableName}" ORDER BY 1`)
    );

    if (data.length === 0) {
      return res.status(404).json({ error: "No data found in table" });
    }

    // Convert to CSV
    const columns = Object.keys(data[0]);
    const csvHeader = columns.join(",");
    const csvRows = data.map((row: any) => 
      columns.map((col: string) => {
        const value = row[col];
        if (value === null) return "";
        if (typeof value === "string" && (value.includes(",") || value.includes('"') || value.includes("\n"))) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return String(value);
      }).join(",")
    );

    const csv = [csvHeader, ...csvRows].join("\n");

    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", `attachment; filename="${tableName}_export.csv"`);
    res.send(csv);
  } catch (error) {
    console.error("Error exporting table:", error);
    res.status(500).json({ error: "Failed to export table data" });
  }
});

export { router as databaseRoutes };