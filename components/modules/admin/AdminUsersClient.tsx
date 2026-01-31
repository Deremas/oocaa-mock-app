"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";

type UserRow = {
  id: string;
  name: string;
  email: string;
  role: string;
  branchName?: string | null;
  branchId?: string | null;
  isActive: boolean;
};

type Branch = { id: string; name: string; isActive?: boolean };

export function AdminUsersClient({ users, branches }: { users: UserRow[]; branches: Branch[] }) {
  const [isPending, startTransition] = useTransition();
  const activeBranches = branches.filter((branch) => branch.isActive !== false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "BRANCH_ADMIN",
    branchId: "",
  });
  const [editUser, setEditUser] = useState<UserRow | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<UserRow | null>(null);
  const [editForm, setEditForm] = useState({
    name: "",
    email: "",
    role: "",
    branchId: "",
  });

  const update = (key: keyof typeof form, value: string) => setForm((prev) => ({ ...prev, [key]: value }));

  const createUser = () => {
    startTransition(async () => {
      await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      window.location.reload();
    });
  };

  const toggleActive = (id: string, next: boolean) => {
    startTransition(async () => {
      await fetch(`/api/admin/users/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: next }),
      });
      window.location.reload();
    });
  };

  const openEdit = (user: UserRow) => {
    setEditUser(user);
    setEditForm({
      name: user.name,
      email: user.email,
      role: user.role,
      branchId: user.branchId ?? "",
    });
  };

  const saveEdit = () => {
    if (!editUser) return;
    startTransition(async () => {
      await fetch(`/api/admin/users/${editUser.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editForm.name,
          email: editForm.email,
          role: editForm.role,
          branchId: editForm.branchId || null,
        }),
      });
      window.location.reload();
    });
  };

  const deleteUser = (user: UserRow) => {
    setDeleteTarget(user);
  };

  const confirmDelete = () => {
    if (!deleteTarget) return;
    startTransition(async () => {
      await fetch(`/api/admin/users/${deleteTarget.id}`, { method: "DELETE" });
      window.location.reload();
    });
  };

  const resetPassword = (id: string) => {
    const nextPassword = window.prompt("New password for this user?");
    if (!nextPassword) return;
    startTransition(async () => {
      await fetch(`/api/admin/users/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resetPassword: nextPassword }),
      });
      window.location.reload();
    });
  };

  return (
    <div className="space-y-6">
      <div className="rounded-xl border bg-white p-4">
        <div className="rounded-lg border border-slate-200 bg-slate-100 p-3 grid gap-4 md:grid md:grid-cols-5">
        <Input placeholder="Name" value={form.name} onChange={(e) => update("name", e.target.value)} />
        <Input placeholder="Email" value={form.email} onChange={(e) => update("email", e.target.value)} />
        <Input
          placeholder="Password"
          type="password"
          value={form.password}
          onChange={(e) => update("password", e.target.value)}
        />
        <Select value={form.role} onValueChange={(value) => update("role", value)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {["HQ_ADMIN", "BRANCH_ADMIN", "AUDITOR"].map((role) => (
              <SelectItem key={role} value={role}>
                {role}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={form.branchId} onValueChange={(value) => update("branchId", value)}>
          <SelectTrigger>
            <SelectValue placeholder="Branch (optional)" />
          </SelectTrigger>
          <SelectContent>
            {activeBranches.map((branch) => (
              <SelectItem key={branch.id} value={branch.id}>
                {branch.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="md:col-span-5 flex justify-end">
          <Button onClick={createUser} disabled={isPending}>
            {isPending ? "Saving..." : "Create user"}
          </Button>
        </div>
        </div>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Branch</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user) => (
            <TableRow key={user.id}>
              <TableCell>{user.name}</TableCell>
              <TableCell>{user.email}</TableCell>
              <TableCell>{user.role}</TableCell>
              <TableCell>{user.branchName ?? "-"}</TableCell>
              <TableCell>
                {user.isActive ? (
                  <Badge className="bg-green-700 text-white">Active</Badge>
                ) : (
                  <Badge className="bg-slate-400 text-white">Disabled</Badge>
                )}
              </TableCell>
              <TableCell>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => toggleActive(user.id, !user.isActive)}
                    disabled={isPending}
                    className={user.isActive ? "border-red-200 text-red-600 hover:bg-red-50" : ""}
                  >
                    {user.isActive ? "Disable" : "Enable"}
                  </Button>
                  <Dialog open={editUser?.id === user.id} onOpenChange={(open) => !open && setEditUser(null)}>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm" onClick={() => openEdit(user)}>
                        Edit
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Edit User</DialogTitle>
                      </DialogHeader>
                      <div className="grid gap-3">
                        <Input
                          placeholder="Name"
                          value={editForm.name}
                          onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))}
                        />
                        <Input
                          placeholder="Email"
                          value={editForm.email}
                          onChange={(e) => setEditForm((f) => ({ ...f, email: e.target.value }))}
                        />
                        <Select
                          value={editForm.role}
                          onValueChange={(value) => setEditForm((f) => ({ ...f, role: value }))}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {["HQ_ADMIN", "BRANCH_ADMIN", "AUDITOR"].map((role) => (
                              <SelectItem key={role} value={role}>
                                {role}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Select
                          value={editForm.branchId}
                          onValueChange={(value) => setEditForm((f) => ({ ...f, branchId: value }))}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Branch (optional)" />
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
                    onClick={() => deleteUser(user)}
                    disabled={isPending}
                    className="border-red-200 text-red-600 hover:bg-red-50"
                  >
                    Delete
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => resetPassword(user.id)}
                    disabled={isPending}
                  >
                    Reset Password
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <ConfirmDialog
        open={!!deleteTarget}
        title="Disable user?"
        description={
          deleteTarget
            ? `This will disable ${deleteTarget.name}. You can re-enable the account later.`
            : undefined
        }
        confirmLabel="Disable user"
        onConfirm={confirmDelete}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      />
    </div>
  );
}
