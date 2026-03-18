import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { Sidebar } from "@/components/layout/sidebar";

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const user = session.user as Record<string, any>;

  return (
    <div className="min-h-screen">
      <Sidebar role={user.role} userName={user.name || "User"} />
      <main className="lg:ml-64 min-h-screen">{children}</main>
    </div>
  );
}
