import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await auth();

  return NextResponse.json({
    session: {
      userId: session.userId,
      orgId: session.orgId,
      orgRole: session.orgRole,
      orgSlug: session.orgSlug,
      orgPermissions: session.orgPermissions,
    },
    message: "Clerk roles test endpoint"
  });
} 