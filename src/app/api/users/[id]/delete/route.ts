import { NextResponse } from "next/server";
import { prismaIndia, prismaUSA } from "@/lib/prisma";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "myultrasecretkey123";

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const { region } = await req.json();
    const userId = params.id;

    if (!region) {
      return NextResponse.json(
        { success: false, error: "Region is required" },
        { status: 400 }
      );
    }

    // ✅ Extract token from cookies
    const cookieHeader = req.headers.get("cookie") || "";
    const tokenMatch = cookieHeader.match(/session=([^;]+)/);
    const token = tokenMatch ? tokenMatch[1] : null;

    if (!token) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    // ✅ Verify token
    const decoded = jwt.verify(token, JWT_SECRET) as { email: string; role?: string };
    const adminEmail = decoded.email;

    // ✅ Choose correct DB
    const prisma = (region === "India" ? prismaIndia : prismaUSA) as typeof prismaIndia;

    // ✅ Try deleting the user
    const deletedUser = await prisma.users.delete({
      where: { id: userId },
      select: { id: true, email: true },
    });

    console.log(`🗑️ Admin ${adminEmail} deleted user: ${deletedUser.email}`);

    return NextResponse.json({
      success: true,
      message: `User ${deletedUser.email} deleted successfully.`,
    });
  } catch (error: any) {
    console.error("❌ Error deleting user:", error);

    // Prisma not-found error
    if (error.code === "P2025") {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    // Invalid token error
    if (error.message?.includes("invalid signature")) {
      return NextResponse.json(
        { success: false, error: "Invalid token" },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { success: false, error: "Failed to delete user" },
      { status: 500 }
    );
  }
}
