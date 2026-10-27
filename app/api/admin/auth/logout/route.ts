import { NextResponse } from "next/server";
import { SESSION_COOKIE } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

export async function POST() {
  const response = NextResponse.json({ success: true });
  response.cookies.set(SESSION_COOKIE, "", {
    httpOnly: true,
    expires: new Date(0),
    path: "/",
  });
  return response;
}
