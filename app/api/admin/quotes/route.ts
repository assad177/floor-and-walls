import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const quote = await prisma.quote.create({
      data: {
        customerName: body.name,
        customerPhone: body.phone,
        customerEmail: body.email || null,
        designDetails: body.details,
      },
    });
    return NextResponse.json({ success: true, quote });
  } catch (error) {
    return NextResponse.json({ error: "Failed to save quote" }, { status: 500 });
  }
}