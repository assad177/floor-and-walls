import { NextResponse } from "next/server";

export const maxDuration = 60; // Segmentation ke liye time
export const runtime = "nodejs";

const FASTAPI_URL = process.env.FASTAPI_URL ?? "http://localhost:8000";

async function callFastAPI(endpoint: string, file: File) {
  const formData = new FormData();
  formData.append("file", file, file.name || "room.jpg");

  const response = await fetch(`${FASTAPI_URL}${endpoint}`, {
    method: "POST",
    body: formData,
    cache: "no-store",
  });

  if (!response.ok) throw new Error(`${endpoint} failed`);
  return response.json();
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "No image found." }, { status: 400 });
    }

    const [segmentation, roomAnalysis, placementCandidates] = await Promise.all([
      callFastAPI("/api/v1/segment-room", file),
      callFastAPI("/api/v1/analyze-room", file),
      callFastAPI("/api/v1/placement-candidates", file),
    ]);

    return NextResponse.json({ segmentation, roomAnalysis, placementCandidates });
  } catch (error) {
    return NextResponse.json({ error: "Failed to analyze room" }, { status: 500 });
  }
}