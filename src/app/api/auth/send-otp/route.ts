import { NextResponse } from "next/server";
import { generateAndSendOtp } from "@/lib/email";

export const authorizedEmails = [
  "support@mydigirecords.com",
  "aditya.amparmar@gmail.com",
  "chiragbora2@gmail.com",
  "akash@mydigirecords.com",
  "rahul@mydigirecords.com",
  "hemant@mydigirecords.com",
  "saroj@mydigirecords.com",
];

export async function POST(req: Request) {
  try {
    const { email } = await req.json();
    const lower = email?.toLowerCase();

    if (!email || !authorizedEmails.includes(lower)) {
      return NextResponse.json({ error: "Unauthorized email" }, { status: 403 });
    }

    // 🔥 Now use generateAndSendOtp (this creates OTP, emails it, AND returns JWT)
    const result = await generateAndSendOtp(lower, "Admin");

    if (!result.success) {
      return NextResponse.json({ error: "Failed to send OTP" }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: "OTP sent successfully",
      otpToken: result.otpToken,  // <-- JWT containing OTP
      otpExpiry: result.otpExpiry,
    });

  } catch (err) {
    console.error("Send OTP Error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
