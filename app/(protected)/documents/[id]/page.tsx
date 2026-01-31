import { notFound } from "next/navigation";
import { DocumentStatus, Role } from "@prisma/client";
import { db } from "@/lib/db";
import { getSessionUserFromCookies } from "@/lib/auth";
import { AttachmentUploader } from "@/components/modules/documents/AttachmentUploader";
import { AttachmentList } from "@/components/modules/documents/AttachmentList";
import { DocumentActions } from "@/components/modules/documents/DocumentActions";
import { DocumentEditForm } from "@/components/modules/documents/DocumentEditForm";
import { Timeline } from "@/components/modules/documents/Timeline";
import { VersionList } from "@/components/modules/documents/VersionList";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatCurrency, formatDate } from "@/components/common/format";

export default async function DocumentDetailPage({ params }: { params: { id: string } }) {
  const session = await getSessionUserFromCookies();
  if (!session) return null;

  const document = await db.document.findUnique({
    where: { id: params.id },
    include: {
      branch: true,
      attachments: true,
      versions: { orderBy: { versionNumber: "desc" } },
    },
  });

  if (!document) {
    notFound();
  }

  if (session.role === Role.BRANCH_ADMIN && document.branchId !== session.branchId) {
    notFound();
  }

  const auditLogs = await db.auditLog.findMany({
    where: {
      OR: [
        { entityId: document.id },
        { detailsJson: { path: ["docId"], equals: document.id } },
      ],
    },
    orderBy: { createdAt: "desc" },
  });

  const canReview = session.role === Role.BRANCH_ADMIN && document.status === DocumentStatus.SUBMITTED;
  const canApprove = session.role === Role.HQ_ADMIN && document.status === DocumentStatus.REVIEWED;
  const canEdit = session.role !== Role.AUDITOR && document.status === DocumentStatus.SUBMITTED;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{document.docNo}</h1>
          <p className="text-sm text-muted-foreground">{document.branch.name}</p>
        </div>
        <Badge variant="outline">{document.status}</Badge>
      </div>

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="attachments">Attachments</TabsTrigger>
          <TabsTrigger value="workflow">Workflow</TabsTrigger>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
          <TabsTrigger value="versions">Versions</TabsTrigger>
        </TabsList>
        <TabsContent value="overview">
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Document Details</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-2">
                <div>
                  <div className="text-xs text-muted-foreground">Candidate</div>
                  <div className="text-sm font-medium">{document.candidateName}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Occupation</div>
                  <div className="text-sm font-medium">{document.occupation}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Level</div>
                  <div className="text-sm font-medium">{document.level}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Payment Amount</div>
                  <div className="text-sm font-medium">{formatCurrency(document.paymentAmount)}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Payment Date</div>
                  <div className="text-sm font-medium">{formatDate(document.paymentDate)}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Receipt No</div>
                  <div className="text-sm font-medium">{document.paymentReceiptNo ?? "-"}</div>
                </div>
                {document.status === DocumentStatus.REJECTED ? (
                  <div className="md:col-span-2">
                    <div className="text-xs text-muted-foreground">Reject Reason</div>
                    <div className="text-sm font-medium text-red-600">{document.rejectReason ?? "-"}</div>
                  </div>
                ) : null}
              </CardContent>
            </Card>
            {canEdit ? (
              <DocumentEditForm
                documentId={document.id}
                initial={{
                  candidateName: document.candidateName,
                  candidateIdNumber: document.candidateIdNumber,
                  phone: document.phone,
                  occupation: document.occupation,
                  level: document.level,
                  paymentReceiptNo: document.paymentReceiptNo,
                  paymentAmount: document.paymentAmount,
                  paymentDate: document.paymentDate?.toISOString() ?? null,
                  paymentMethod: document.paymentMethod,
                }}
              />
            ) : null}
          </div>
        </TabsContent>
        <TabsContent value="attachments">
          <Card>
            <CardHeader>
              <CardTitle>Attachments</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {document.status === DocumentStatus.SUBMITTED ? (
                <AttachmentUploader documentId={document.id} />
              ) : null}
              <AttachmentList
                attachments={document.attachments.map((attachment) => ({
                  id: attachment.id,
                  originalName: attachment.originalName,
                  kind: attachment.kind,
                  mimeType: attachment.mimeType,
                }))}
              />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="workflow">
          <Card>
            <CardHeader>
              <CardTitle>Workflow Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Actions are limited by role. Payment receipt is required to move to REVIEWED or APPROVED.
              </p>
              <DocumentActions documentId={document.id} canReview={canReview} canApprove={canApprove} />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="timeline">
          <Timeline
            items={auditLogs.map((log) => ({
              id: log.id,
              action: log.action,
              actorEmail: log.actorEmail,
              createdAt: log.createdAt,
            }))}
          />
        </TabsContent>
        <TabsContent value="versions">
          <VersionList
            versions={document.versions.map((version) => ({
              id: version.id,
              versionNumber: version.versionNumber,
              createdAt: version.createdAt,
              snapshotJson: version.snapshotJson as Record<string, unknown>,
            }))}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
