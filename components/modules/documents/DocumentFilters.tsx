"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type Props = {
  branches: { id: string; name: string; isActive?: boolean }[];
  showBranch: boolean;
  initial?: { q?: string; status?: string; branchId?: string; dateFrom?: string; dateTo?: string };
};

export function DocumentFilters({ branches, showBranch, initial }: Props) {
  const router = useRouter();
  const [query, setQuery] = useState(initial?.q ?? "");
  const [status, setStatus] = useState(initial?.status ?? "");
  const [branchId, setBranchId] = useState(initial?.branchId ?? "");
  const [dateFrom, setDateFrom] = useState(initial?.dateFrom ?? "");
  const [dateTo, setDateTo] = useState(initial?.dateTo ?? "");
  const activeBranches = branches.filter((branch) => branch.isActive !== false);

  return (
    <div className="flex flex-wrap items-end gap-3 rounded-lg border border-slate-200 bg-slate-100 p-4">
      <div className="w-64">
        <label className="text-xs font-medium text-muted-foreground">Search</label>
        <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="DocNo, candidate, receipt" />
      </div>
      <div className="w-48">
        <label className="text-xs font-medium text-muted-foreground">Status</label>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger>
            <SelectValue placeholder="All" />
          </SelectTrigger>
          <SelectContent>
            {["SUBMITTED", "REVIEWED", "APPROVED", "REJECTED"].map((item) => (
              <SelectItem key={item} value={item}>
                {item}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      {showBranch ? (
        <div className="w-56">
          <label className="text-xs font-medium text-muted-foreground">Branch</label>
          <Select value={branchId} onValueChange={setBranchId}>
            <SelectTrigger>
              <SelectValue placeholder="All branches" />
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
      <div className="w-40">
        <label className="text-xs font-medium text-muted-foreground">From</label>
        <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
      </div>
      <div className="w-40">
        <label className="text-xs font-medium text-muted-foreground">To</label>
        <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
      </div>
      <Button
        onClick={() => {
          const params = new URLSearchParams();
          if (query) params.set("q", query);
          if (status) params.set("status", status);
          if (branchId) params.set("branchId", branchId);
          if (dateFrom) params.set("dateFrom", dateFrom);
          if (dateTo) params.set("dateTo", dateTo);
          router.push(`/documents?${params.toString()}`);
        }}
      >
        Apply
      </Button>
    </div>
  );
}
