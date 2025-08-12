import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import SuperAdminLayout from "@/components/superadmin/layout";
import { Database, Play, RefreshCw, Download, Users, School, FileText, Settings } from "lucide-react";

interface TableInfo {
  table_name: string;
  row_count: number;
}

interface QueryResult {
  columns: string[];
  rows: any[][];
  rowCount: number;
  executionTime: number;
}

export default function DatabasePage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedTable, setSelectedTable] = useState<string>("");
  const [customQuery, setCustomQuery] = useState<string>("");
  const [queryResult, setQueryResult] = useState<QueryResult | null>(null);

  // Fetch database tables and their row counts
  const { data: tables = [], isLoading: tablesLoading, refetch: refetchTables } = useQuery<TableInfo[]>({
    queryKey: ["/api/database/tables"],
  });

  // Fetch table data
  const { data: tableData, isLoading: tableDataLoading, refetch: refetchTableData } = useQuery({
    queryKey: ["/api/database/table-data", selectedTable],
    enabled: !!selectedTable,
  });

  // Execute custom query mutation
  const executeQueryMutation = useMutation({
    mutationFn: async (query: string) => {
      const response = await apiRequest("POST", "/api/database/execute", { query });
      return response.json();
    },
    onSuccess: (result: QueryResult) => {
      setQueryResult(result);
      toast({
        title: "Query Executed",
        description: `Query completed in ${result.executionTime}ms. Found ${result.rowCount} rows.`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Query Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Export data mutation
  const exportDataMutation = useMutation({
    mutationFn: async (tableName: string) => {
      const response = await apiRequest("GET", `/api/database/export/${tableName}`);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `${tableName}_export.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    },
    onSuccess: () => {
      toast({
        title: "Export Complete",
        description: "Table data has been exported successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Export Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleExecuteQuery = () => {
    if (!customQuery.trim()) {
      toast({
        title: "No Query",
        description: "Please enter a SQL query to execute.",
        variant: "destructive",
      });
      return;
    }
    executeQueryMutation.mutate(customQuery);
  };

  const getTableIcon = (tableName: string) => {
    if (tableName.includes('user')) return <Users className="h-4 w-4" />;
    if (tableName.includes('school')) return <School className="h-4 w-4" />;
    if (tableName.includes('invoice')) return <FileText className="h-4 w-4" />;
    if (tableName.includes('feature')) return <Settings className="h-4 w-4" />;
    return <Database className="h-4 w-4" />;
  };

  const quickQueries = [
    { name: "All Users", query: "SELECT id, name, email, role, school_id, created_at FROM users ORDER BY created_at DESC LIMIT 50;" },
    { name: "All Schools", query: "SELECT id, school_name, short_name, admin_email, curriculum_type, subscription_status FROM schools ORDER BY created_at DESC;" },
    { name: "Recent Invoices", query: "SELECT id, school_id, invoice_number, total_amount, status, due_date, created_at FROM invoices ORDER BY created_at DESC LIMIT 20;" },
    { name: "Active Features", query: "SELECT id, name, description, price, pricing_type, is_active FROM features WHERE is_active = true;" },
    { name: "School Features", query: "SELECT sf.school_id, s.school_name, f.name as feature_name, sf.enabled FROM school_features sf JOIN schools s ON sf.school_id = s.id JOIN features f ON sf.feature_id = f.id;" },
    { name: "Grade Sections", query: "SELECT gs.id, gs.school_id, s.school_name, gs.grade_name, gs.section_id FROM grade_sections gs JOIN schools s ON gs.school_id = s.id ORDER BY s.school_name, gs.grade_name;" }
  ];

  return (
    <SuperAdminLayout 
      title="Database Management" 
      subtitle="View and manage your database tables and data"
    >
      <div className="space-y-6">
        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="flex items-center p-6">
              <Database className="h-8 w-8 text-primary mr-3" />
              <div>
                <p className="text-2xl font-bold">{tables.length}</p>
                <p className="text-xs text-muted-foreground">Total Tables</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center p-6">
              <Users className="h-8 w-8 text-blue-600 mr-3" />
              <div>
                <p className="text-2xl font-bold">{tables.find(t => t.table_name === 'users')?.row_count || 0}</p>
                <p className="text-xs text-muted-foreground">Users</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center p-6">
              <School className="h-8 w-8 text-green-600 mr-3" />
              <div>
                <p className="text-2xl font-bold">{tables.find(t => t.table_name === 'schools')?.row_count || 0}</p>
                <p className="text-xs text-muted-foreground">Schools</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center p-6">
              <FileText className="h-8 w-8 text-orange-600 mr-3" />
              <div>
                <p className="text-2xl font-bold">{tables.find(t => t.table_name === 'invoices')?.row_count || 0}</p>
                <p className="text-xs text-muted-foreground">Invoices</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="tables" className="space-y-4">
          <TabsList>
            <TabsTrigger value="tables" data-testid="tab-tables">Tables</TabsTrigger>
            <TabsTrigger value="query" data-testid="tab-query">SQL Query</TabsTrigger>
            <TabsTrigger value="quick-queries" data-testid="tab-quick-queries">Quick Queries</TabsTrigger>
          </TabsList>

          {/* Tables Tab */}
          <TabsContent value="tables" className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Database Tables</h3>
              <Button onClick={() => refetchTables()} variant="outline" size="sm" data-testid="button-refresh-tables">
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Tables List */}
              <Card className="lg:col-span-1">
                <CardHeader>
                  <CardTitle>Tables ({tables.length})</CardTitle>
                  <CardDescription>Click on a table to view its data</CardDescription>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[400px]">
                    <div className="space-y-2">
                      {tablesLoading ? (
                        <div className="flex items-center justify-center py-8">
                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                        </div>
                      ) : (
                        tables.map((table) => (
                          <div
                            key={table.table_name}
                            className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors ${
                              selectedTable === table.table_name
                                ? "bg-primary/10 border-primary"
                                : "hover:bg-slate-50"
                            }`}
                            onClick={() => setSelectedTable(table.table_name)}
                            data-testid={`table-item-${table.table_name}`}
                          >
                            <div className="flex items-center space-x-3">
                              {getTableIcon(table.table_name)}
                              <div>
                                <p className="font-medium text-sm">{table.table_name}</p>
                                <p className="text-xs text-muted-foreground">{table.row_count} rows</p>
                              </div>
                            </div>
                            <Badge variant="secondary">{table.row_count}</Badge>
                          </div>
                        ))
                      )}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>

              {/* Table Data */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <div>
                      <CardTitle>
                        {selectedTable ? `${selectedTable} Data` : "Select a Table"}
                      </CardTitle>
                      <CardDescription>
                        {selectedTable ? `Viewing data from ${selectedTable} table` : "Choose a table from the left to view its data"}
                      </CardDescription>
                    </div>
                    {selectedTable && (
                      <div className="flex gap-2">
                        <Button 
                          onClick={() => refetchTableData()} 
                          variant="outline" 
                          size="sm"
                          data-testid="button-refresh-table-data"
                        >
                          <RefreshCw className="h-4 w-4 mr-2" />
                          Refresh
                        </Button>
                        <Button
                          onClick={() => exportDataMutation.mutate(selectedTable)}
                          variant="outline"
                          size="sm"
                          disabled={exportDataMutation.isPending}
                          data-testid="button-export-table"
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Export CSV
                        </Button>
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  {selectedTable ? (
                    tableDataLoading ? (
                      <div className="flex items-center justify-center py-12">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                      </div>
                    ) : tableData?.rows?.length > 0 ? (
                      <ScrollArea className="h-[400px]">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              {tableData.columns.map((column: string) => (
                                <TableHead key={column} className="font-semibold">
                                  {column}
                                </TableHead>
                              ))}
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {tableData.rows.map((row: any[], index: number) => (
                              <TableRow key={index}>
                                {row.map((cell: any, cellIndex: number) => (
                                  <TableCell key={cellIndex} className="max-w-[200px] truncate">
                                    {cell === null ? (
                                      <span className="text-slate-400">null</span>
                                    ) : typeof cell === 'boolean' ? (
                                      <Badge variant={cell ? "default" : "secondary"}>
                                        {cell.toString()}
                                      </Badge>
                                    ) : (
                                      String(cell)
                                    )}
                                  </TableCell>
                                ))}
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </ScrollArea>
                    ) : (
                      <div className="text-center py-12">
                        <Database className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                        <p className="text-slate-500">No data found in this table</p>
                      </div>
                    )
                  ) : (
                    <div className="text-center py-12">
                      <Database className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                      <p className="text-slate-500">Select a table to view its data</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* SQL Query Tab */}
          <TabsContent value="query" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Execute Custom SQL Query</CardTitle>
                <CardDescription>Run custom SQL queries against your database</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="custom-query">SQL Query</Label>
                  <Textarea
                    id="custom-query"
                    placeholder="SELECT * FROM users LIMIT 10;"
                    value={customQuery}
                    onChange={(e) => setCustomQuery(e.target.value)}
                    className="min-h-[100px] font-mono"
                    data-testid="textarea-custom-query"
                  />
                </div>
                <Button 
                  onClick={handleExecuteQuery}
                  disabled={executeQueryMutation.isPending || !customQuery.trim()}
                  data-testid="button-execute-query"
                >
                  <Play className="h-4 w-4 mr-2" />
                  {executeQueryMutation.isPending ? "Executing..." : "Execute Query"}
                </Button>
              </CardContent>
            </Card>

            {/* Query Results */}
            {queryResult && (
              <Card>
                <CardHeader>
                  <CardTitle>Query Results</CardTitle>
                  <CardDescription>
                    Found {queryResult.rowCount} rows in {queryResult.executionTime}ms
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {queryResult.rows.length > 0 ? (
                    <ScrollArea className="h-[400px]">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            {queryResult.columns.map((column) => (
                              <TableHead key={column} className="font-semibold">
                                {column}
                              </TableHead>
                            ))}
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {queryResult.rows.map((row, index) => (
                            <TableRow key={index}>
                              {row.map((cell, cellIndex) => (
                                <TableCell key={cellIndex} className="max-w-[200px] truncate">
                                  {cell === null ? (
                                    <span className="text-slate-400">null</span>
                                  ) : typeof cell === 'boolean' ? (
                                    <Badge variant={cell ? "default" : "secondary"}>
                                      {cell.toString()}
                                    </Badge>
                                  ) : (
                                    String(cell)
                                  )}
                                </TableCell>
                              ))}
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </ScrollArea>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-slate-500">No results returned</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Quick Queries Tab */}
          <TabsContent value="quick-queries" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Quick Queries</CardTitle>
                <CardDescription>Pre-built queries for common tasks</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {quickQueries.map((quickQuery) => (
                    <Card key={quickQuery.name} className="cursor-pointer hover:bg-slate-50 transition-colors">
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-medium">{quickQuery.name}</h4>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setCustomQuery(quickQuery.query);
                              executeQueryMutation.mutate(quickQuery.query);
                            }}
                            data-testid={`button-quick-query-${quickQuery.name.toLowerCase().replace(/\s+/g, '-')}`}
                          >
                            <Play className="h-3 w-3 mr-1" />
                            Run
                          </Button>
                        </div>
                        <code className="text-xs text-slate-600 block bg-slate-100 p-2 rounded">
                          {quickQuery.query}
                        </code>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </SuperAdminLayout>
  );
}