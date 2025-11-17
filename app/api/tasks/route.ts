import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const filePath = path.join(process.cwd(), "lib", "tasks.json");

// ✅ GET — saare tasks read karne ke liye
export async function GET() {
  try {
    const data = fs.readFileSync(filePath, "utf-8");
    return NextResponse.json(JSON.parse(data));
  } catch (err) {
    console.error("Error reading tasks:", err);
    return NextResponse.json({ error: "Failed to load tasks" }, { status: 500 });
  }
}

// ✅ PUT — task status update karne ke liye
export async function PUT(req: Request) {
  try {
    const { id, taskStatus } = await req.json();
    const data = fs.readFileSync(filePath, "utf-8");
    const tasks = JSON.parse(data);

    const index = tasks.findIndex((t: any) => t.id === id);
    if (index === -1) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    tasks[index].taskStatus = taskStatus;
    tasks[index].updatedAt = new Date().toISOString();

    fs.writeFileSync(filePath, JSON.stringify(tasks, null, 2));
    return NextResponse.json({ success: true, updated: tasks[index] });
  } catch (err) {
    console.error("Error updating task:", err);
    return NextResponse.json({ error: "Failed to update task" }, { status: 500 });
  }
}

// ✅ POST — jab naye approved tasks aaye to insert karne ke liye
export async function POST(req: Request) {
  try {
    const newTasks = await req.json();
    const data = fs.readFileSync(filePath, "utf-8");
    const tasks = JSON.parse(data);

    // overwrite or add new approved ones
    newTasks.forEach((t: any) => {
      const exists = tasks.find((x: any) => x.id === t.id);
      if (!exists) tasks.push({ ...t, taskStatus: "in-process" });
    });

    fs.writeFileSync(filePath, JSON.stringify(tasks, null, 2));
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Error writing tasks:", err);
    return NextResponse.json({ error: "Failed to save tasks" }, { status: 500 });
  }
}
