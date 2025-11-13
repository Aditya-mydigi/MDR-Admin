import { NextResponse } from "next/server";
import { prismaIndia, prismaUSA } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { sendPasswordResetEmail } from "@/lib/email";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const { region, email } = await req.json();
    const userId = params.id;

    if (!region || !email) {
      return NextResponse.json(
        { success: false, error: "Region and email are required" },
        { status: 400 }
      );
    }

    // ✅ Explicit typing to resolve overload ambiguity
    const prisma = (region === "India" ? prismaIndia : prismaUSA) as typeof prismaIndia;

    // ✅ Generate random password
    const newPassword = Math.random().toString(36).slice(-8) + "@A1";

    // ✅ Hash password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // ✅ Update user password
    await prisma.users.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    // ✅ Send email to user
    await sendPasswordResetEmail(email, newPassword);

    return NextResponse.json({
      success: true,
      message: "Password updated and sent to user's email successfully.",
    });
  } catch (error) {
    console.error("Error resetting password:", error);
    return NextResponse.json(
      { success: false, error: "Failed to reset password." },
      { status: 500 }
    );
  }
}
