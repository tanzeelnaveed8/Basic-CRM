import fs from "fs";
import path from "path";
import { NextResponse } from "next/server";

const filePath = path.join(process.cwd(), "lib/leads.json");

export async function GET() {
  const data = JSON.parse(fs.readFileSync(filePath, "utf8"));
  return NextResponse.json(data);
}

export async function POST(req: Request) {
  const body = await req.json();
  const data = JSON.parse(fs.readFileSync(filePath, "utf8"));

  data.unshift(body);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));

  return NextResponse.json(body);
}
