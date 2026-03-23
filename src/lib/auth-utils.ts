import { auth } from "@/auth";
import { redirect } from "next/navigation";
import type { UserRole } from "@prisma/client";
import type { SessionUser } from "@/types";

export async function getSessionUser(): Promise<SessionUser> {
  const session = await auth();
  if (!session?.user) redirect("/login");
  return session.user as SessionUser;
}

export async function requireRole(...roles: UserRole[]): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!roles.includes(user.role)) {
    redirect(getRoleHome(user.role));
  }
  return user;
}

export function getRoleHome(role: UserRole): string {
  switch (role) {
    case "WORKER":
      return "/worker/dashboard";
    case "COMPANY":
      return "/company/dashboard";
    case "CLIENT":
      return "/client/dashboard";
    case "ADMIN":
      return "/admin/dashboard";
    default:
      return "/login";
  }
}
