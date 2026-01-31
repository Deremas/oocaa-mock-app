"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type Props = {
  documentId: string;
  initial: {
    candidateName: string;
    candidateIdNumber?: string | null;
    phone?: string | null;
    occupation: string;
    level: string;
    paymentReceiptNo?: string | null;
    paymentAmount?: number | null;
    paymentDate?: string | null;
    paymentMethod?: string | null;
  };
};

export function DocumentEditForm({ documentId, initial }: Props) {
  const [isPending, startTransition] = useTransition();
  const [form, setForm] = useState({
    candidateName: initial.candidateName ?? "",
    candidateIdNumber: initial.candidateIdNumber ?? "",
    phone: initial.phone ?? "",
    occupation: initial.occupation ?? "",
    level: initial.level ?? "",
    paymentReceiptNo: initial.paymentReceiptNo ?? "",
    paymentAmount: initial.paymentAmount ? String(initial.paymentAmount) : "",
    paymentDate: initial.paymentDate ? initial.paymentDate.slice(0, 10) : "",
    paymentMethod: initial.paymentMethod ?? "",
  });

  const update = (key: keyof typeof form, value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const submit = () => {
    startTransition(async () => {
      await fetch(`/api/documents/${documentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          paymentAmount: form.paymentAmount ? Number(form.paymentAmount) : undefined,
          paymentDate: form.paymentDate ? new Date(form.paymentDate).toISOString() : undefined,
        }),
      });
      window.location.reload();
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Edit (SUBMITTED only)</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="text-xs text-muted-foreground">Candidate name</label>
          <Input value={form.candidateName} onChange={(e) => update("candidateName", e.target.value)} />
        </div>
        <div>
          <label className="text-xs text-muted-foreground">ID number</label>
          <Input value={form.candidateIdNumber} onChange={(e) => update("candidateIdNumber", e.target.value)} />
        </div>
        <div>
          <label className="text-xs text-muted-foreground">Phone</label>
          <Input value={form.phone} onChange={(e) => update("phone", e.target.value)} />
        </div>
        <div>
          <label className="text-xs text-muted-foreground">Occupation</label>
          <Input value={form.occupation} onChange={(e) => update("occupation", e.target.value)} />
        </div>
        <div>
          <label className="text-xs text-muted-foreground">Level</label>
          <Input value={form.level} onChange={(e) => update("level", e.target.value)} />
        </div>
        <div>
          <label className="text-xs text-muted-foreground">Receipt No</label>
          <Input value={form.paymentReceiptNo} onChange={(e) => update("paymentReceiptNo", e.target.value)} />
        </div>
        <div>
          <label className="text-xs text-muted-foreground">Amount (ETB)</label>
          <Input
            type="number"
            value={form.paymentAmount}
            onChange={(e) => update("paymentAmount", e.target.value)}
          />
        </div>
        <div>
          <label className="text-xs text-muted-foreground">Payment date</label>
          <Input type="date" value={form.paymentDate} onChange={(e) => update("paymentDate", e.target.value)} />
        </div>
        <div>
          <label className="text-xs text-muted-foreground">Payment method</label>
          <Input value={form.paymentMethod} onChange={(e) => update("paymentMethod", e.target.value)} />
        </div>
        <div className="md:col-span-2 flex justify-end">
          <Button onClick={submit} disabled={isPending}>
            {isPending ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
