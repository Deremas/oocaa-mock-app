"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ClipboardList, Receipt, User } from "lucide-react";

type Branch = { id: string; name: string };

export function DocumentForm({ branches }: { branches: Branch[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [form, setForm] = useState({
    branchId: branches.length === 1 ? branches[0]?.id ?? "" : "",
    candidateName: "",
    candidateIdNumber: "",
    phone: "",
    occupation: "",
    level: "I",
    paymentReceiptNo: "",
    paymentAmount: "",
    paymentDate: "",
    paymentMethod: "",
  });
  const [attachmentKind, setAttachmentKind] = useState("PAYMENT_RECEIPT");
  const [attachmentFile, setAttachmentFile] = useState<File | null>(null);
  const [error, setError] = useState("");

  const update = (key: keyof typeof form, value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const submit = () => {
    setError("");
    if (!form.branchId) {
      setError("Please select a branch.");
      return;
    }
    if (!form.paymentReceiptNo || !form.paymentAmount || !form.paymentDate || !form.paymentMethod) {
      setError("Payment fields are required.");
      return;
    }
    startTransition(async () => {
      const payload = {
        ...form,
        paymentAmount: form.paymentAmount ? Number(form.paymentAmount) : undefined,
        paymentDate: form.paymentDate ? new Date(form.paymentDate).toISOString() : undefined,
      };
      const res = await fetch("/api/documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        const data = await res.json();
        if (attachmentFile) {
          const formData = new FormData();
          formData.append("kind", attachmentKind);
          formData.append("file", attachmentFile);
          await fetch(`/api/documents/${data.id}/attachments`, {
            method: "POST",
            body: formData,
          });
        }
        router.push(`/documents/${data.id}`);
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.message ?? "Failed to save document.");
      }
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center gap-2">
          <User className="h-4 w-4 text-blue-800" />
          <CardTitle>Candidate</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="text-xs text-muted-foreground">Branch</label>
            <Select value={form.branchId} onValueChange={(value) => update("branchId", value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select branch" />
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
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center gap-2">
          <ClipboardList className="h-4 w-4 text-blue-800" />
          <CardTitle>Assessment</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="text-xs text-muted-foreground">Occupation</label>
            <Input value={form.occupation} onChange={(e) => update("occupation", e.target.value)} />
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Level</label>
            <Select value={form.level} onValueChange={(value) => update("level", value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {["I", "II", "III", "IV"].map((level) => (
                  <SelectItem key={level} value={level}>
                    {level}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center gap-2">
          <Receipt className="h-4 w-4 text-green-800" />
          <CardTitle>Payment</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
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
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center gap-2">
          <Receipt className="h-4 w-4 text-blue-800" />
          <CardTitle>Attachments</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="text-xs text-muted-foreground">Attachment kind</label>
            <Select value={attachmentKind} onValueChange={setAttachmentKind}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="PAYMENT_RECEIPT">Payment receipt (required for review)</SelectItem>
                <SelectItem value="SUPPORTING">Supporting document</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Upload file</label>
            <input
              type="file"
              accept=".pdf,.png,.jpg,.jpeg"
              onChange={(event) => setAttachmentFile(event.target.files?.[0] ?? null)}
              className="mt-2 text-sm"
            />
            <p className="mt-2 text-xs text-muted-foreground">
              PDF/PNG/JPG up to 10MB. You can add more files after saving.
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-2">
        {error ? <p className="mr-auto text-sm text-red-600">{error}</p> : null}
        <Button variant="outline" onClick={() => router.push("/documents")}>
          Cancel
        </Button>
        <Button onClick={submit} disabled={isPending}>
          {isPending ? "Saving..." : "Save Document"}
        </Button>
      </div>
    </div>
  );
}
