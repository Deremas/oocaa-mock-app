"use client";

import { useEffect, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";

type BranchRow = {
  id: string;
  name: string;
  code: string;
  isActive: boolean;
  _count: { users: number; documents: number };
};

export function BranchManagement() {
  const [isPending, startTransition] = useTransition();
  const [branches, setBranches] = useState<BranchRow[]>([]);
  const [createForm, setCreateForm] = useState({ name: "", code: "" });
  const [editBranch, setEditBranch] = useState<BranchRow | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<BranchRow | null>(null);
  const [editForm, setEditForm] = useState({ name: "", code: "", isActive: true });

  const loadBranches = async () => {
    const res = await fetch("/api/admin/branches");
    if (res.ok) {
      const data = await res.json();
      setBranches(data);
    }
  };

  useEffect(() => {
    loadBranches();
  }, []);

  const createBranch = () => {
    startTransition(async () => {
      await fetch("/api/admin/branches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(createForm),
      });
      setCreateForm({ name: "", code: "" });
      loadBranches();
    });
  };

  const openEdit = (branch: BranchRow) => {
    setEditBranch(branch);
    setEditForm({ name: branch.name, code: branch.code, isActive: branch.isActive });
  };

  const saveEdit = () => {
    if (!editBranch) return;
    startTransition(async () => {
      await fetch(`/api/admin/branches/${editBranch.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm),
      });
      setEditBranch(null);
      loadBranches();
    });
  };

  const toggleActive = (branch: BranchRow) => {
    startTransition(async () => {
      await fetch(`/api/admin/branches/${branch.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !branch.isActive }),
      });
      loadBranches();
    });
  };

  const deleteBranch = (branch: BranchRow) => {
    setDeleteTarget(branch);
  };

  const confirmDelete = () => {
    if (!deleteTarget) return;
    startTransition(async () => {
      await fetch(`/api/admin/branches/${deleteTarget.id}`, { method: "DELETE" });
      setDeleteTarget(null);
      loadBranches();
    });
  };

  return (
    <div className="space-y-6">
      <div className="rounded-xl border bg-white p-4">
        <div className="rounded-lg border border-slate-200 bg-slate-100 p-3 grid gap-4 md:grid md:grid-cols-4">
          <Input
            placeholder="Branch name"
            value={createForm.name}
            onChange={(e) => setCreateForm((f) => ({ ...f, name: e.target.value }))}
          />
          <Input
            placeholder="Branch code"
            value={createForm.code}
            onChange={(e) => setCreateForm((f) => ({ ...f, code: e.target.value }))}
          />
          <div className="md:col-span-2 flex justify-end">
            <Button onClick={createBranch} disabled={isPending}>
              Create Branch
            </Button>
          </div>
        </div>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Code</TableHead>
            <TableHead className="text-right">Users</TableHead>
            <TableHead className="text-right">Documents</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {branches.map((branch) => (
            <TableRow key={branch.id}>
              <TableCell>{branch.name}</TableCell>
              <TableCell>{branch.code}</TableCell>
              <TableCell className="text-right">{branch._count.users}</TableCell>
              <TableCell className="text-right">{branch._count.documents}</TableCell>
              <TableCell>
                {branch.isActive ? (
                  <Badge className="bg-green-700 text-white">Active</Badge>
                ) : (
                  <Badge className="bg-slate-400 text-white">Inactive</Badge>
                )}
              </TableCell>
              <TableCell>
                <div className="flex gap-2">
                  <Dialog open={editBranch?.id === branch.id} onOpenChange={(open) => !open && setEditBranch(null)}>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm" onClick={() => openEdit(branch)}>
                        Edit
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Edit Branch</DialogTitle>
                      </DialogHeader>
                      <div className="grid gap-3">
                        <Input
                          placeholder="Branch name"
                          value={editForm.name}
                          onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))}
                        />
                        <Input
                          placeholder="Branch code"
                          value={editForm.code}
                          onChange={(e) => setEditForm((f) => ({ ...f, code: e.target.value }))}
                        />
                      </div>
                      <DialogFooter>
                        <Button onClick={saveEdit} disabled={isPending}>
                          Save changes
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => toggleActive(branch)}
                    disabled={isPending}
                  >
                    {branch.isActive ? "Deactivate" : "Activate"}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => deleteBranch(branch)}
                    disabled={isPending}
                    className="border-red-200 text-red-600 hover:bg-red-50"
                  >
                    Delete
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete branch?"
        description={
          deleteTarget
            ? `Delete ${deleteTarget.name}? This is only possible when no users or documents exist.`
            : undefined
        }
        confirmLabel="Delete branch"
        onConfirm={confirmDelete}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      />
    </div>
  );
}
