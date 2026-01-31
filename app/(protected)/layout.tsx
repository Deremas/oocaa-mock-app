import { redirect } from "next/navigation";
import { AppShell } from "@/components/modules/layout/AppShell";
import { getSessionUserFromCookies } from "@/lib/auth";
import { getCurrentUser } from "@/lib/user";

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const session = await getSessionUserFromCookies();
  if (!session) {
    redirect("/login");
  }
  const user = await getCurrentUser(session);
  if (!user) {
    redirect("/login");
  }

  return (
    <AppShell
      user={{
        name: user.name,
        email: user.email,
        role: user.role,
      }}
    >
      {children}
    </AppShell>
  );
}
