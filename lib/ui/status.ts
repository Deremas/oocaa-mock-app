export type DocumentStatus = "SUBMITTED" | "REVIEWED" | "APPROVED" | "REJECTED";

export function statusBadgeClass(status: string) {
  switch (status) {
    case "APPROVED":
      return "bg-green-700 text-white";
    case "REVIEWED":
      return "bg-blue-600 text-white";
    case "REJECTED":
      return "bg-red-600 text-white";
    default:
      return "bg-slate-200 text-slate-800";
  }
}

export function auditActionBadgeClass(action: string) {
  switch (action) {
    case "LOGIN":
      return "bg-slate-200 text-slate-800";
    case "FILE_UPLOADED":
      return "bg-blue-100 text-blue-800";
    case "DOCUMENT_CREATED":
      return "bg-green-100 text-green-800";
    case "STATUS_CHANGED":
      return "bg-amber-100 text-amber-800";
    default:
      return "bg-slate-100 text-slate-700";
  }
}
