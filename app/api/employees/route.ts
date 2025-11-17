// File: app/api/employees/route.ts

import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

const filePath = path.join(process.cwd(), "lib", "data.json");

// 🔹 Safe read function
async function readData(): Promise<any[]> {
    try {
        await fs.access(filePath);
    } catch {
        await fs.writeFile(filePath, "[]", "utf-8");
    }

    const data = await fs.readFile(filePath, "utf-8");
    try {
        return JSON.parse(data || "[]");
    } catch {
        return [];
    }
}

// 🔹 Safe write function
async function writeData(data: any[]): Promise<void> {
    await fs.writeFile(filePath, JSON.stringify(data, null, 2), "utf-8");
}

// ==========================================================

// 🔹 1. GET — fetch all employees
export async function GET() {
    const employees = await readData();
    return NextResponse.json(employees);
}

// 🔹 2. POST — add new employee
export async function POST(req: Request) {
    const newEmployee = await req.json();
    const employees = await readData();

    if (!newEmployee.email || newEmployee.email.trim() === "") {
        return NextResponse.json(
            { error: "Employee email is required" },
            { status: 400 }
        );
    }
    
    // Default values set for missing fields
    const newEmp = {
        id: String(Date.now()),
        email: newEmployee.email.trim(),
        name: newEmployee.name || "New Employee", 
        role: newEmployee.role || "Staff",
        avatar:
            "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_960_720.png",
    };

    employees.push(newEmp);
    await writeData(employees);

    return NextResponse.json(newEmp, { status: 201 });
}