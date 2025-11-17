import fs from "fs";
import path from "path";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const preferredRegion = "auto";

const filePath = path.join(process.cwd(), "lib/leads.json");

export async function PUT(req: Request, { params }: any) {
  const id = Number(params.id);
  const updates = await req.json();
  const data = JSON.parse(fs.readFileSync(filePath, "utf8"));

  const index = data.findIndex((c: any) => c.id === id);
  if (index === -1) return NextResponse.json({ error: "Not found" }, { status: 404 });

  data[index] = { ...data[index], ...updates };
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));

  return NextResponse.json(data[index]);
}

export async function DELETE(req: Request, { params }: any) {
  const id = Number(params.id);
  let data = JSON.parse(fs.readFileSync(filePath, "utf8"));

  data = data.filter((c: any) => c.id !== id);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));

  return NextResponse.json({ success: true });
}
