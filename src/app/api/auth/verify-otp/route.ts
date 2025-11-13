import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { verifyOTP } from "@/lib/otp-store";
import { authorizedEmails } from "../send-otp/route";

const JWT_SECRET = process.env.JWT_SECRET || "myultrasecretkey123";

export async function POST(req: Request) {
  try {
    const { email, otp } = await req.json();
    console.log(`Attempt for ${email.toLowerCase()} with OTP: ${otp}`);

    if (!email || !otp) {
      return NextResponse.json({ message: "Email and OTP required" }, { status: 400 });
    }

    if (!authorizedEmails.includes(email.toLowerCase())) {
      return NextResponse.json({ message: "Unauthorized email" }, { status: 403 });
    }

    const valid = verifyOTP(email.toLowerCase(), otp);
    if (!valid) {
      return NextResponse.json({ message: "Invalid or expired OTP" }, { status: 401 });
    }

    console.log(`OTP verified for ${email.toLowerCase()}`);

    const token = jwt.sign({ email: email.toLowerCase(), role: "admin" }, JWT_SECRET, {
      expiresIn: "1d",
    });

    const res = NextResponse.json({
      message: "OTP verified successfully",
      success: true,
    });

    res.cookies.set("session", token, {
      httpOnly: true,
      secure: false,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24,
    });

    // Navigate client-side (rely on client to handle redirect)
    return res;
  } catch (err) {
    console.error("Verify OTP Error:", err);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}