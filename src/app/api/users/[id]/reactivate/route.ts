import { NextResponse } from "next/server";
import { prismaIndia, prismaUSA } from "@/lib/prisma";
import { sendAccountStatusEmail } from "@/lib/email";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "myultrasecretkey123";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params;

    const cookieHeader = req.headers.get("cookie") || "";
    const tokenMatch = cookieHeader.match(/session=([^;]+)/);
    const token = tokenMatch ? tokenMatch[1] : null;

    if (!token) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const decoded = jwt.verify(token, JWT_SECRET) as { email: string };
    const adminEmail = decoded.email;

    async function updateUserStatus(db: any, status: boolean) {
      try {
        return await db.users.update({
          where: { id },
          data: { user_plan_active: status },
          select: { id: true, email: true },
        });
      } catch {
        return null;
      }
    }

    // Try India, then USA
    let updatedUser = await updateUserStatus(prismaIndia, true);
    if (!updatedUser) updatedUser = await updateUserStatus(prismaUSA, true);

    if (!updatedUser) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });
    }

    await sendAccountStatusEmail(updatedUser.email, true);

    console.log(`✅ Admin ${adminEmail} reactivated user: ${updatedUser.email}`);
    return NextResponse.json({
      success: true,
      message: `User ${updatedUser.email} reactivated successfully.`,
    });
  } catch (error) {
    console.error("❌ Error reactivating user:", error);
    return NextResponse.json(
      { success: false, error: "Failed to reactivate user" },
      { status: 500 }
    );
  }
}
