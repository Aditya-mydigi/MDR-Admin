import { NextResponse } from "next/server";
import { prismaPanel } from "@/lib/prisma-panel";
import { onlineAdmins, ONLINE_TTL } from "@/lib/presence";

export async function GET() {
  console.log("PRESENCE API HIT", Array.from(onlineAdmins.keys()));
  const now = Date.now();

  // cleanup expired admins
  for (const [id, ts] of onlineAdmins.entries()) {
    if (now - ts > ONLINE_TTL) {
      onlineAdmins.delete(id);
    }
  }

  return NextResponse.json({
    onlineAdminIds: Array.from(onlineAdmins.keys()),
  });
}
