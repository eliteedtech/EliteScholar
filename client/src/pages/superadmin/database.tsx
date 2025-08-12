import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Database, RefreshCw, Eye, Info } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface TableInfo {
  table_name: string;
  record_count: number;
  columns: string[];
}

interface TableData {
  [key: string]: any;
}

export default function DatabasePage() {
  const [selectedTable, setSelectedTable] = useState<string>("");

  // Fetch table information
  const { data: tablesInfo, isLoading, refetch } = useQuery({
    queryKey: ['/api/superadmin/database/tables'],
  });

  // Fetch specific table data using React Query
  const { data: currentTableData, isLoading: isTableLoading } = useQuery<TableData[]>({
    queryKey: ['/api/superadmin/database/tables', selectedTable],
    enabled: !!selectedTable
  });

  const handleTableSelect = (tableName: string) => {
    setSelectedTable(tableName);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <RefreshCw className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Database className="h-6 w-6" />
          <h1 className="text-2xl font-bold">Database Viewer</h1>
        </div>
        <Button onClick={() => refetch()} size="sm" variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Tables Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.isArray(tablesInfo) && (tablesInfo as TableInfo[]).map((table) => (
          <Card 
            key={table.table_name} 
            className={`cursor-pointer transition-colors hover:bg-accent ${
              selectedTable === table.table_name ? 'ring-2 ring-primary' : ''
            }`}
            onClick={() => handleTableSelect(table.table_name)}
          >
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center justify-between">
                <span>{table.table_name}</span>
                <Badge variant="secondary">{table.record_count}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">
                {table.columns?.length || 0} columns
              </p>
              <div className="flex items-center gap-2 mt-2">
                <Eye className="h-3 w-3" />
                <span className="text-xs">Click to view data</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Table Selector */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="h-5 w-5" />
            Table Data Viewer
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 items-center mb-4">
            <Select value={selectedTable} onValueChange={handleTableSelect}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Select a table" />
              </SelectTrigger>
              <SelectContent>
                {Array.isArray(tablesInfo) && (tablesInfo as TableInfo[]).map((table) => (
                  <SelectItem key={table.table_name} value={table.table_name}>
                    {table.table_name} ({table.record_count})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            {selectedTable && isTableLoading && (
              <div className="flex items-center text-sm text-muted-foreground">
                <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                Loading table data...
              </div>
            )}
          </div>

          {/* Table Data Display */}
          {selectedTable && currentTableData && Array.isArray(currentTableData) && currentTableData.length > 0 && (
            <div className="border rounded-lg overflow-hidden">
              <div className="max-h-96 overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      {Object.keys(currentTableData[0]).map((column) => (
                        <TableHead key={column} className="font-semibold">
                          {column}
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {currentTableData.map((row, index) => (
                      <TableRow key={index}>
                        {Object.values(row).map((value, cellIndex) => (
                          <TableCell key={cellIndex} className="max-w-xs truncate">
                            {value === null ? (
                              <span className="text-muted-foreground italic">null</span>
                            ) : typeof value === 'object' ? (
                              <span className="text-xs font-mono bg-muted px-1 rounded">
                                {JSON.stringify(value)}
                              </span>
                            ) : (
                              String(value)
                            )}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}

          {selectedTable && currentTableData && Array.isArray(currentTableData) && currentTableData.length === 0 && !isTableLoading && (
            <div className="text-center py-8 text-muted-foreground">
              <Database className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No data found in {selectedTable}</p>
            </div>
          )}

          {!selectedTable && (
            <div className="text-center py-8 text-muted-foreground">
              <Database className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Select a table to view its data</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}