import Link from "next/link";
import { Nav } from "@/components/modules/layout/Nav";
import LogoutButton from "@/components/modules/layout/LogoutButton";
import { Separator } from "@/components/ui/separator";
import { Role } from "@prisma/client";

type AppShellProps = {
  children: React.ReactNode;
  user: {
    name: string;
    email: string;
    role: Role;
  };
};

export function AppShell({ children, user }: AppShellProps) {
  return (
    <div className="app-page flex min-h-screen">
      <aside className="w-64 border-r bg-white px-4 py-6">
        <Link href="/dashboard" className="text-xl font-semibold">
          OOCAA DMS
        </Link>
        <p className="mt-1 text-xs uppercase tracking-wide text-muted-foreground">Mock App</p>
        <Separator className="my-4" />
        <Nav role={user.role} />
      </aside>
      <main className="flex-1">
        <header className="flex items-center justify-between border-b bg-white px-8 py-4">
          <div>
            <p className="text-sm font-medium">{user.name}</p>
            <p className="text-xs text-muted-foreground">{user.email}</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-muted px-3 py-1 text-xs font-medium">
              {user.role.replace("_", " ")}
            </span>
            <LogoutButton />
          </div>
        </header>
        <section className="p-8">{children}</section>
      </main>
    </div>
  );
}
