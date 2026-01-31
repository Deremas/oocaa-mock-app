"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function LoginPage() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [copied, setCopied] = useState("");

  const demoUsers = [
    { label: "HQ Admin", email: "hq@oocaa.local", password: "Passw0rd!" },
    { label: "Branch Admin (Adama)", email: "adama@oocaa.local", password: "Passw0rd!" },
    { label: "Auditor", email: "audit@oocaa.local", password: "Passw0rd!" },
  ];

  const submit = () => {
    setError("");
    startTransition(async () => {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.message ?? "Invalid credentials");
        return;
      }
      router.push("/dashboard");
    });
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>OOCAA DMS Login</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-xs text-muted-foreground">Email</label>
            <Input value={email} onChange={(e) => setEmail(e.target.value)} type="email" />
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Password</label>
            <Input value={password} onChange={(e) => setPassword(e.target.value)} type="password" />
          </div>
          {error ? <p className="text-sm text-red-600">{error}</p> : null}
          <Button className="w-full" onClick={submit} disabled={isPending}>
            {isPending ? "Signing in..." : "Login"}
          </Button>
          <div className="rounded-lg border bg-white p-3">
            <p className="text-xs font-semibold text-muted-foreground">Demo credentials</p>
            <div className="mt-3 space-y-2">
              {demoUsers.map((user) => (
                <div key={user.email} className="flex flex-wrap items-center justify-between gap-2 rounded-md border px-3 py-2 text-sm">
                  <div>
                    <div className="font-medium">{user.label}</div>
                    <div className="text-xs text-muted-foreground">{user.email}</div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setEmail(user.email);
                        setPassword(user.password);
                      }}
                    >
                      Use
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={async () => {
                        await navigator.clipboard.writeText(`${user.email}\n${user.password}`);
                        setCopied(user.label);
                        setTimeout(() => setCopied(""), 1500);
                      }}
                    >
                      {copied === user.label ? "Copied" : "Copy"}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
