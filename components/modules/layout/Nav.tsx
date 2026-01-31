import Link from "next/link";
import { Role } from "@prisma/client";
import {
  Activity,
  BarChart3,
  DatabaseBackup,
  Files,
  FilePlus,
  LayoutDashboard,
  UserCog,
} from "lucide-react";

const baseItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/documents", label: "Documents", icon: Files },
  { href: "/reports", label: "Reports", icon: BarChart3 },
  { href: "/audit", label: "Audit Logs", icon: Activity },
];

const adminItems = [
  { href: "/admin/users", label: "Admin / Users", icon: UserCog },
  { href: "/admin/backup", label: "Admin / Backup", icon: DatabaseBackup },
];

export function Nav({ role }: { role: Role }) {
  const items =
    role === Role.HQ_ADMIN
      ? [...baseItems, { href: "/documents/new", label: "New Document", icon: FilePlus }, ...adminItems]
      : role === Role.BRANCH_ADMIN
      ? [...baseItems, { href: "/documents/new", label: "New Document", icon: FilePlus }]
      : baseItems;
  return (
    <nav className="space-y-2">
      {items.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
        >
          <item.icon className="h-4 w-4" />
          {item.label}
        </Link>
      ))}
    </nav>
  );
}
