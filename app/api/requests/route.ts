import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const filePath = path.join(process.cwd(), "lib", "leadRequests.json");

// GET — Read all requests
export async function GET() {
  try {
    const data = fs.readFileSync(filePath, "utf-8");
    return NextResponse.json(JSON.parse(data));
  } catch (err) {
    console.error("Error reading requests:", err);
    return NextResponse.json({ error: "Failed to load requests" }, { status: 500 });
  }
}

// PUT — Update request status
export async function PUT(req: Request) {
  try {
    const { id, status } = await req.json();
    const data = fs.readFileSync(filePath, "utf-8");
    const requests = JSON.parse(data);

    const index = requests.findIndex((r: any) => r.id === id);
    if (index === -1) {
      return NextResponse.json({ error: "Request not found" }, { status: 404 });
    }

    requests[index].status = status;
    requests[index].updatedAt = new Date().toISOString();

    fs.writeFileSync(filePath, JSON.stringify(requests, null, 2));
    return NextResponse.json({ success: true, updated: requests[index] });
  } catch (err) {
    console.error("Error updating request:", err);
    return NextResponse.json({ error: "Failed to update request" }, { status: 500 });
  }
}
