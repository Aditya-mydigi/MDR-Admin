import { NextResponse } from "next/server";
import { prismaIndia, prismaUSA } from "@/lib/prisma";
import { sendAccountStatusEmail } from "@/lib/email"; // <-- we'll add this helper below
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "myultrasecretkey123";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params;

    // Extract JWT token from cookies
    const cookieHeader = req.headers.get("cookie") || "";
    const tokenMatch = cookieHeader.match(/session=([^;]+)/);
    const token = tokenMatch ? tokenMatch[1] : null;

    if (!token) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    // Verify admin identity
    const decoded = jwt.verify(token, JWT_SECRET) as { email: string; role?: string };
    const adminEmail = decoded.email;

    // ✅ Helper to update user_plan_active and return email
    async function updateUserStatus(db: any, status: boolean) {
      try {
        return await db.users.update({
          where: { id },
          data: { user_plan_active: status },
          select: { id: true, email: true, first_name: true },
        });
      } catch {
        return null;
      }
    }

    // Disable user (India first, then USA)
    let updatedUser = await updateUserStatus(prismaIndia, false);
    if (!updatedUser) updatedUser = await updateUserStatus(prismaUSA, false);

    if (!updatedUser) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });
    }

    // ✅ Send email notification
    await sendAccountStatusEmail(updatedUser.email, false);

    console.log(`⚠️ Admin ${adminEmail} disabled user: ${updatedUser.email}`);
    return NextResponse.json({
      success: true,
      message: `User ${updatedUser.email} has been disabled and notified.`,
    });
  } catch (error) {
    console.error("❌ Error disabling user:", error);
    return NextResponse.json(
      { success: false, error: "Failed to disable user" },
      { status: 500 }
    );
  }
}
