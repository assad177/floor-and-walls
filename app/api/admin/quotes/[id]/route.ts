import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { status } = await req.json();

    const updatedQuote = await prisma.quote.update({
      where: { id: params.id },
      data: { status },
    });

    return NextResponse.json(updatedQuote);
  } catch (error) {
    return NextResponse.json({ error: "Failed to update quote" }, { status: 500 });
  }
}