import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({ status: "ok", app: "TemanTugas", timestamp: Date.now() });
}
