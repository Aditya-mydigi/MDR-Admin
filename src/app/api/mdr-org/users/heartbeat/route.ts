import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import { prismaPanel } from "@/lib/prisma-panel";
import { onlineAdmins } from "@/lib/presence";

const JWT_SECRET = process.env.JWT_SECRET!;

export async function POST() {
  const cookieStore = await cookies();
  const token = cookieStore.get("session")?.value;

  if (!token) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { email?: string };
    if (!decoded.email) {
      return NextResponse.json({ ok: false }, { status: 401 });
    }

    const user = await prismaPanel.mdrPanelUser.findFirst({
      where: {
        email: decoded.email.toLowerCase(),
        role: "admin",
        isactive: true,
      },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json({ ok: false }, { status: 403 });
    }

    // 🔥 MARK ADMIN AS ONLINE
    onlineAdmins.set(user.id, Date.now());

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Heartbeat error:", err);
    return NextResponse.json({ ok: false }, { status: 401 });
  }
}
