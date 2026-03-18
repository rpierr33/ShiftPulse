import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const exportRecord = await db.payrollExport.findUnique({
    where: { id },
  });

  if (!exportRecord) {
    return NextResponse.json({ error: "Export not found" }, { status: 404 });
  }

  // Verify the caller is an admin/manager of this company
  const membership = await db.companyMembership.findFirst({
    where: {
      userId: session.user.id,
      companyId: exportRecord.companyId,
      status: "APPROVED",
      role: { in: ["admin", "manager"] },
    },
  });

  if (!membership) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const headers = new Headers();
  headers.set("Content-Type", "text/csv; charset=utf-8");
  headers.set(
    "Content-Disposition",
    `attachment; filename="${exportRecord.fileName}"`
  );

  return new NextResponse(exportRecord.data, { status: 200, headers });
}
