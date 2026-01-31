"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { RejectDialog } from "@/components/modules/documents/RejectDialog";

export function DocumentActions({
  documentId,
  canReview,
  canApprove,
}: {
  documentId: string;
  canReview: boolean;
  canApprove: boolean;
}) {
  const [isPending, startTransition] = useTransition();

  return (
    <div className="flex flex-wrap gap-3">
      {canReview ? (
        <Button
          onClick={() =>
            startTransition(async () => {
              await fetch(`/api/documents/${documentId}/status`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ nextStatus: "REVIEWED" }),
              });
              window.location.reload();
            })
          }
          disabled={isPending}
        >
          {isPending ? "Updating..." : "Mark Reviewed"}
        </Button>
      ) : null}
      {canApprove ? (
        <>
          <Button
            onClick={() =>
              startTransition(async () => {
                await fetch(`/api/documents/${documentId}/status`, {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ nextStatus: "APPROVED" }),
                });
                window.location.reload();
              })
            }
            disabled={isPending}
            variant="success"
          >
            Approve
          </Button>
          <RejectDialog documentId={documentId} />
        </>
      ) : null}
    </div>
  );
}
