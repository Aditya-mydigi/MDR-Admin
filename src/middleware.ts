import { NextRequest, NextResponse } from "next/server";
import jwt, { VerifyErrors } from "jsonwebtoken";
import { prismaPanel } from "@/lib/prisma-panel";
import { onlineAdmins } from "@/lib/presence";

const JWT_SECRET = process.env.JWT_SECRET || "myultrasecretkey123";

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const token = req.cookies.get("session")?.value;

  // Allow login and auth routes
  if (pathname.startsWith("/login") || pathname.startsWith("/api/auth")) {
    return NextResponse.next();
  }

  if (!token) {
    console.log("No token, redirecting to /login");
    return NextResponse.redirect(new URL("/login", req.url));
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { email?: string };

    if (!decoded.email) {
      return NextResponse.redirect(new URL("/login", req.url));
    }

    // Check if user exisrs and is admin
    const user = await prismaPanel.mdrPanelUser.findFirst({
      where: {
        email: decoded.email.toLowerCase(),
        role: "admin",
        isactive: true,
      },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.redirect(new URL("/login", req.url));
    }

    onlineAdmins.set(user.id, Date.now());

    return NextResponse.next();
  } catch (err) {
    const error = err as VerifyErrors | Error;
    console.error("Invalid token:", error.message);
    return NextResponse.redirect(new URL("/login", req.url));
  }
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/api/mdr-org/:path*"
  ],
  runtime: "nodejs",
};