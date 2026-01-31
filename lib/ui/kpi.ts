import {
  CheckCircle2,
  FileText,
  LayoutDashboard,
  SearchCheck,
  XCircle,
} from "lucide-react";

export type KpiType = "total" | "submitted" | "reviewed" | "approved" | "rejected";

export function kpiCardClass(type: KpiType) {
  switch (type) {
    case "submitted":
      return "border-l-4 border-l-slate-400";
    case "reviewed":
      return "border-l-4 border-l-blue-600";
    case "approved":
      return "border-l-4 border-l-green-800";
    case "rejected":
      return "border-l-4 border-l-red-600";
    default:
      return "border-l-4 border-l-blue-800";
  }
}

export function kpiIconClass(type: KpiType) {
  switch (type) {
    case "submitted":
      return "text-slate-500";
    case "reviewed":
      return "text-blue-600";
    case "approved":
      return "text-green-800";
    case "rejected":
      return "text-red-600";
    default:
      return "text-blue-800";
  }
}

export function kpiIcon(type: KpiType) {
  switch (type) {
    case "submitted":
      return FileText;
    case "reviewed":
      return SearchCheck;
    case "approved":
      return CheckCircle2;
    case "rejected":
      return XCircle;
    default:
      return LayoutDashboard;
  }
}
