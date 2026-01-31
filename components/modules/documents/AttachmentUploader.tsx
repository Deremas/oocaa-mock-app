"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export function AttachmentUploader({ documentId }: { documentId: string }) {
  const [isPending, startTransition] = useTransition();
  const [kind, setKind] = useState("PAYMENT_RECEIPT");
  const [file, setFile] = useState<File | null>(null);

  const upload = () => {
    if (!file) return;
    startTransition(async () => {
      const formData = new FormData();
      formData.append("kind", kind);
      formData.append("file", file);
      await fetch(`/api/documents/${documentId}/attachments`, {
        method: "POST",
        body: formData,
      });
      setFile(null);
      window.location.reload();
    });
  };

  return (
    <div className="flex flex-wrap items-center gap-3">
      <Select value={kind} onValueChange={setKind}>
        <SelectTrigger className="w-48">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="PAYMENT_RECEIPT">Payment receipt</SelectItem>
          <SelectItem value="SUPPORTING">Supporting</SelectItem>
        </SelectContent>
      </Select>
      <input
        type="file"
        onChange={(event) => setFile(event.target.files?.[0] ?? null)}
        accept=".pdf,.png,.jpg,.jpeg"
        className="text-sm"
      />
      <Button onClick={upload} disabled={isPending || !file}>
        {isPending ? "Uploading..." : "Upload"}
      </Button>
    </div>
  );
}
