import { NextRequest, NextResponse } from "next/server";
import { isValidCredentials, createSessionToken, SESSION_COOKIE, SESSION_DURATION_MS } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!isValidCredentials(email, password)) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    // Create a session token
    const token = createSessionToken();
    const expiresAt = new Date(Date.now() + SESSION_DURATION_MS);

    await prisma.adminSession.create({
      data: { token, expiresAt },
    });

    // Set cookie
    const response = NextResponse.json({ success: true });
    response.cookies.set(SESSION_COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      expires: expiresAt,
      path: "/",
    });

    return response;
  } catch (err) {
    console.error("Login error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
