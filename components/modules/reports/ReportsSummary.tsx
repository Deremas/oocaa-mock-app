"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

type Branch = { id: string; name: string };

type ReportPayload = {
  totalsByStatus: Array<{ status: string; _count: { status: number } }>;
  totalsByBranch: Array<{ branchId: string; _count: { branchId: number } }>;
  totalCount: number;
};

export function ReportsSummary({
  branches,
  showBranch,
}: {
  branches: Branch[];
  showBranch: boolean;
}) {
  const [filters, setFilters] = useState({
    dateFrom: "",
    dateTo: "",
    branchId: "",
  });
  const [data, setData] = useState<ReportPayload>({
    totalsByStatus: [],
    totalsByBranch: [],
    totalCount: 0,
  });

  const fetchSummary = async () => {
    const params = new URLSearchParams();
    if (filters.dateFrom) params.set("dateFrom", filters.dateFrom);
    if (filters.dateTo) params.set("dateTo", filters.dateTo);
    if (filters.branchId) params.set("branchId", filters.branchId);
    const res = await fetch(`/api/reports/summary?${params.toString()}`);
    if (res.ok) {
      const payload = await res.json();
      setData(payload);
    }
  };

  useEffect(() => {
    fetchSummary();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const exportCsv = () => {
    const lines: string[] = [];
    lines.push("Total Documents," + data.totalCount);
    lines.push("");
    lines.push("Status,Total");
    data.totalsByStatus.forEach((item) => {
      lines.push(`${item.status},${item._count.status}`);
    });
    if (data.totalsByBranch.length > 0) {
      lines.push("");
      lines.push("Branch,Total");
      data.totalsByBranch.forEach((item) => {
        const branchName = branches.find((b) => b.id === item.branchId)?.name ?? item.branchId;
        lines.push(`${branchName},${item._count.branchId}`);
      });
    }

    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "oocaa-reports.csv";
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-3 md:grid-cols-4">
        <div>
          <label className="text-xs text-muted-foreground">From</label>
          <Input
            type="date"
            value={filters.dateFrom}
            onChange={(event) => setFilters((f) => ({ ...f, dateFrom: event.target.value }))}
          />
        </div>
        <div>
          <label className="text-xs text-muted-foreground">To</label>
          <Input
            type="date"
            value={filters.dateTo}
            onChange={(event) => setFilters((f) => ({ ...f, dateTo: event.target.value }))}
          />
        </div>
        {showBranch ? (
          <div>
            <label className="text-xs text-muted-foreground">Branch</label>
            <Select value={filters.branchId} onValueChange={(value) => setFilters((f) => ({ ...f, branchId: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="All" />
              </SelectTrigger>
              <SelectContent>
                {branches.map((branch) => (
                  <SelectItem key={branch.id} value={branch.id}>
                    {branch.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ) : null}
        <div className="flex items-end gap-2">
          <Button onClick={fetchSummary}>Apply</Button>
          <Button variant="outline" onClick={exportCsv}>
            Export CSV
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Total Documents</CardTitle>
        </CardHeader>
        <CardContent className="text-3xl font-semibold">{data.totalCount}</CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Totals by Status</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Status</TableHead>
                <TableHead>Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.totalsByStatus.map((item) => (
                <TableRow key={item.status}>
                  <TableCell>{item.status}</TableCell>
                  <TableCell>{item._count.status}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {data.totalsByBranch.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Totals by Branch</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Branch</TableHead>
                  <TableHead>Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.totalsByBranch.map((item) => (
                  <TableRow key={item.branchId}>
                    <TableCell>{branches.find((b) => b.id === item.branchId)?.name ?? item.branchId}</TableCell>
                    <TableCell>{item._count.branchId}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
