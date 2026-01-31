"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

type UserRow = {
  id: string;
  name: string;
  email: string;
  role: string;
  branchName?: string | null;
  isActive: boolean;
};

type Branch = { id: string; name: string };

export function AdminUsersClient({ users, branches }: { users: UserRow[]; branches: Branch[] }) {
  const [isPending, startTransition] = useTransition();
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "BRANCH_ADMIN",
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
      <div className="grid gap-4 rounded-xl border bg-white p-4 md:grid-cols-5">
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
            {branches.map((branch) => (
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
              <TableCell>{user.isActive ? "Active" : "Disabled"}</TableCell>
              <TableCell>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => toggleActive(user.id, !user.isActive)}
                    disabled={isPending}
                  >
                    {user.isActive ? "Disable" : "Enable"}
                  </Button>
                  <Button
                    variant="secondary"
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
    </div>
  );
}
