import { NextResponse } from "next/server";
import { generateAndSendOtp } from "@/lib/email";
import { prismaPanel } from "@/lib/prisma-panel";

export async function POST(req: Request) {
  try {
    const { email } = await req.json();
    const lower = email?.toLowerCase();

    if (!lower) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    const user = await prismaPanel.mdrPanelUser.findFirst({
      where: {
        email: {
          equals: lower,
          mode: 'insensitive'
        },
        isactive: true,
        role: "admin",
      },
      select: {
        id: true,
        email: true,
        role: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized email" },
        { status: 403 }
      );
    }

    const result = await generateAndSendOtp(lower, "Admin");

    if (!result.success) {
      return NextResponse.json(
        { error: "Failed to send OTP" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "OTP sent successfully",
      otpToken: result.otpToken,
      otpExpiry: result.otpExpiry,
    });

  } catch (err) {
    console.error("Send OTP Error:", err);
    return NextResponse.json(
      { error: "Server error" },
      { status: 500 }
    );
  }
}
