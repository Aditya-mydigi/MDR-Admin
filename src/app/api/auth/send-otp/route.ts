import { NextResponse } from "next/server";
import { generateAndSendOtp } from "@/lib/email";

export const authorizedEmails = [
  "support@mydigirecords.com",
  "aditya.amparmar@gmail.com",
  "chiragbora2@gmail.com"
];

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: "Invalid email format" }, { status: 400 });
    }

    // ✅ Only allow authorized admin emails
    if (!authorizedEmails.includes(email)) {
      console.warn(`Unauthorized OTP request from: ${email}`);
      return NextResponse.json(
        { error: "This email is not authorized to access MDR Admin Panel" },
        { status: 403 }
      );
    }

    // ✅ Send OTP email
    const result = await generateAndSendOtp(email, "Admin");
    if (!result.success) {
      return NextResponse.json({ error: "Failed to send OTP" }, { status: 500 });
    }

    return NextResponse.json({
      message: "OTP sent successfully to your email",
      success: true,
    });

  } catch (error) {
    console.error("Send OTP error:", error);
    return NextResponse.json(
      { error: "An error occurred while sending OTP" },
      { status: 500 }
    );
  }
}
