import { NextResponse } from "next/server";

export const runtime = 'edge'; // Use the Edge runtime for best performance

export async function GET() {
  return NextResponse.json({
    status: "ok",
    message: "Ping successful. The Vercel serverless function is running.",
    timestamp: new Date().toISOString(),
  });
}
