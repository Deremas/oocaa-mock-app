"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatDate } from "@/components/common/format";
import { Badge } from "@/components/ui/badge";
import { auditActionBadgeClass } from "@/lib/ui/status";

type Branch = { id: string; name: string; isActive?: boolean };
type AuditRow = {
  id: string;
  action: string;
  actorEmail?: string | null;
  entityType: string;
  createdAt: string;
  detailsJson: Record<string, unknown>;
};

export function AuditLogTable({
  branches,
  showBranch,
}: {
  branches: Branch[];
  showBranch: boolean;
}) {
  const activeBranches = branches.filter((branch) => branch.isActive !== false);
  const [rows, setRows] = useState<AuditRow[]>([]);
  const [selected, setSelected] = useState<AuditRow | null>(null);
  const [filters, setFilters] = useState({
    action: "",
    actor: "",
    branchId: "",
    dateFrom: "",
    dateTo: "",
    docNo: "",
  });

  const fetchLogs = async () => {
    const params = new URLSearchParams();
    if (filters.action) params.set("action", filters.action);
    if (filters.actor) params.set("actor", filters.actor);
    if (filters.branchId) params.set("branchId", filters.branchId);
    if (filters.dateFrom) params.set("dateFrom", filters.dateFrom);
    if (filters.dateTo) params.set("dateTo", filters.dateTo);
    if (filters.docNo) params.set("docNo", filters.docNo);
    const res = await fetch(`/api/audit?${params.toString()}`);
    if (res.ok) {
      const data = await res.json();
      setRows(data);
    }
  };

  useEffect(() => {
    fetchLogs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="space-y-4">
      <div className="grid gap-3 rounded-lg border border-slate-200 bg-slate-100 p-4 md:grid-cols-6">
        <div>
          <label className="text-xs text-muted-foreground">Action</label>
          <Select value={filters.action} onValueChange={(value) => setFilters((f) => ({ ...f, action: value }))}>
            <SelectTrigger>
              <SelectValue placeholder="All" />
            </SelectTrigger>
            <SelectContent>
              {[
                "LOGIN",
                "DOCUMENT_CREATED",
                "DOCUMENT_UPDATED",
                "FILE_UPLOADED",
                "STATUS_CHANGED",
                "DOCUMENT_REJECTED",
                "USER_CREATED",
                "USER_DISABLED",
                "USER_ENABLED",
              ].map((action) => (
                <SelectItem key={action} value={action}>
                  {action}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="text-xs text-muted-foreground">Actor</label>
          <Input
            value={filters.actor}
            onChange={(event) => setFilters((f) => ({ ...f, actor: event.target.value }))}
            placeholder="email"
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
                {activeBranches.map((branch) => (
                  <SelectItem key={branch.id} value={branch.id}>
                    {branch.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ) : null}
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
        <div>
          <label className="text-xs text-muted-foreground">Doc No</label>
          <Input
            value={filters.docNo}
            onChange={(event) => setFilters((f) => ({ ...f, docNo: event.target.value }))}
            placeholder="OOCAA-..."
          />
        </div>
      </div>
      <div className="flex justify-end">
        <Button onClick={fetchLogs}>Apply Filters</Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Action</TableHead>
            <TableHead>Actor</TableHead>
            <TableHead>Entity</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Details</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row.id}>
              <TableCell>
                <Badge className={auditActionBadgeClass(row.action)}>{row.action}</Badge>
              </TableCell>
              <TableCell>{row.actorEmail ?? "-"}</TableCell>
              <TableCell>{row.entityType}</TableCell>
              <TableCell>{formatDate(row.createdAt)}</TableCell>
              <TableCell>
                <Button variant="outline" size="sm" onClick={() => setSelected(row)}>
                  View
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <Dialog open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Audit Details</DialogTitle>
          </DialogHeader>
          <pre className="max-h-80 overflow-auto rounded bg-slate-950/90 p-3 text-xs text-slate-50">
            {JSON.stringify(selected?.detailsJson ?? {}, null, 2)}
          </pre>
        </DialogContent>
      </Dialog>
    </div>
  );
}
