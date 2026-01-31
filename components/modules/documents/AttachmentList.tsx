"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

type Attachment = {
  id: string;
  originalName: string;
  kind: string;
  mimeType: string;
};

export function AttachmentList({ attachments }: { attachments: Attachment[] }) {
  const [selected, setSelected] = useState<Attachment | null>(null);

  const isPreviewable = (attachment: Attachment) =>
    attachment.mimeType.startsWith("image/") || attachment.mimeType === "application/pdf";

  return (
    <div className="space-y-2">
      {attachments.map((attachment) => (
        <div
          key={attachment.id}
          className={`flex items-center justify-between rounded-md border bg-white px-3 py-2 ${
            isPreviewable(attachment) ? "cursor-pointer hover:bg-slate-50" : ""
          }`}
          onClick={() => {
            if (isPreviewable(attachment)) setSelected(attachment);
          }}
        >
          <div className="flex items-center gap-3">
            {attachment.mimeType.startsWith("image/") ? (
              <img
                src={`/api/attachments/${attachment.id}/download`}
                alt={attachment.originalName}
                className="h-12 w-12 rounded object-cover"
              />
            ) : (
              <div className="flex h-12 w-12 items-center justify-center rounded bg-slate-100 text-xs text-slate-500">
                {attachment.mimeType === "application/pdf" ? "PDF" : "FILE"}
              </div>
            )}
            <div>
            <p className="text-sm font-medium">{attachment.originalName}</p>
            <p className="text-xs text-muted-foreground">{attachment.kind}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isPreviewable(attachment) ? (
              <Button
                variant="outline"
                size="sm"
                onClick={(event) => {
                  event.stopPropagation();
                  setSelected(attachment);
                }}
              >
                Preview
              </Button>
            ) : null}
            <a
              className="text-sm text-primary hover:underline"
              href={`/api/attachments/${attachment.id}/download`}
              onClick={(event) => event.stopPropagation()}
            >
              Download
            </a>
          </div>
        </div>
      ))}

      <Dialog open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent className="max-w-6xl">
          <DialogHeader>
            <DialogTitle>{selected?.originalName ?? "Attachment Preview"}</DialogTitle>
          </DialogHeader>
          {selected ? (
            selected.mimeType.startsWith("image/") ? (
              <div className="space-y-3">
                <div className="flex justify-end">
                  <a
                    className="text-sm text-primary hover:underline"
                    href={`/api/attachments/${selected.id}/download`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Open full size
                  </a>
                </div>
                <img
                  src={`/api/attachments/${selected.id}/download`}
                  alt={selected.originalName}
                  className="max-h-[75vh] w-full object-contain rounded"
                />
              </div>
            ) : (
              <iframe
                src={`/api/attachments/${selected.id}/download`}
                className="h-[75vh] w-full rounded"
                title={selected.originalName}
              />
            )
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
