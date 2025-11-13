import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { verifyOtpToken } from "@/lib/jwt-otp";

const SESSION_SECRET = process.env.JWT_SECRET || "myultrasecretkey123";

export async function POST(req: Request) {
  try {
    const { email, otp, otpToken } = await req.json();
    const lower = email?.toLowerCase();

    if (!email || !otp || !otpToken) {
      return NextResponse.json({ message: "Missing fields" }, { status: 400 });
    }

    // 1. Decode OTP token
    const decoded = verifyOtpToken(otpToken);
    if (!decoded) {
      return NextResponse.json({ message: "Invalid or expired OTP" }, { status: 401 });
    }

    // 2. Validate email + OTP
    if (decoded.email !== lower || decoded.otp !== otp) {
      return NextResponse.json({ message: "Invalid or expired OTP" }, { status: 401 });
    }

    // OTP valid → create session token
    const sessionToken = jwt.sign({ email: lower, role: "admin" }, SESSION_SECRET, {
      expiresIn: "1d"
    });

    const res = NextResponse.json({ success: true });

    res.cookies.set("session", sessionToken, {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24
    });

    return res;

  } catch (err) {
    console.error(err);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}
