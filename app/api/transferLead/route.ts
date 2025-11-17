import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();

    const filePath = path.join(process.cwd(), "lib", "leadRequests.json");
    let fileData: any[] = [];

    if (fs.existsSync(filePath)) {
      const existingData = fs.readFileSync(filePath, "utf-8");
      fileData = existingData ? JSON.parse(existingData) : [];
    }

    fileData.push(data);

    fs.writeFileSync(filePath, JSON.stringify(fileData, null, 2));

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, error: "Failed to save lead transfer" });
  }
}
