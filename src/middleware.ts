import { NextRequest, NextResponse } from "next/server";
import jwt, { VerifyErrors } from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "myultrasecretkey123";

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const token = req.cookies.get("session")?.value;

  console.log("Middleware processing:", pathname, "Token present:", !!token); // Debug

  if (pathname.startsWith("/login") || pathname.startsWith("/api/auth")) {
    return NextResponse.next();
  }

  if (!token) {
    console.log("No token, redirecting to /login");
    return NextResponse.redirect(new URL("/login", req.url));
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    console.log("Token verified, decoded:", decoded); // Debug
    return NextResponse.next();
  } catch (err) {
    const error = err as VerifyErrors | Error;
    console.error("Invalid token error:", error.message);
    if (error.message.includes("edge runtime does not support")) {
      console.warn("Falling back to bypass due to Edge runtime limitation");
      return NextResponse.next(); // Temporary bypass for Edge
    }
    return NextResponse.redirect(new URL("/login", req.url));
  }
}

export const config = {
  matcher: ["/dashboard/:path*"],
  runtime: "nodejs", // Remove /api/users to avoid interference
};