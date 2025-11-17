// File: app/api/employees/[id]/route.ts

import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

const filePath = path.join(process.cwd(), "lib", "data.json");

// Helper functions
async function readData(): Promise<any[]> {
  const data = await fs.readFile(filePath, "utf-8");
  return JSON.parse(data || "[]");
}

async function writeData(data: any[]): Promise<void> {
  await fs.writeFile(filePath, JSON.stringify(data, null, 2), "utf-8");
}

// DELETE Employee
export async function DELETE(req: Request, context: any) {
  const idToDelete = context.params?.id;
  if (!idToDelete) {
    return NextResponse.json({ error: "ID is required" }, { status: 400 });
  }

  let employees = await readData();
  const initialLength = employees.length;

  employees = employees.filter(emp => emp.id !== idToDelete);

  if (employees.length === initialLength) {
    return NextResponse.json({ error: "Employee not found" }, { status: 404 });
  }

  await writeData(employees);
  return NextResponse.json({ message: "Employee deleted successfully" }, { status: 200 });
}

// PUT / Update Employee
export async function PUT(req: Request, context: any) {
  const idToUpdate = context.params?.id;
  if (!idToUpdate) {
    return NextResponse.json({ error: "ID is required" }, { status: 400 });
  }

  const updatedFields = await req.json();
  let employees = await readData();
  let employeeFound = false;

  employees = employees.map(emp => {
    if (emp.id === idToUpdate) {
      employeeFound = true;
      return { ...emp, ...updatedFields }; // Merge old data with new fields
    }
    return emp;
  });

  if (!employeeFound) {
    return NextResponse.json({ error: "Employee not found" }, { status: 404 });
  }

  await writeData(employees);
  const updatedEmployee = employees.find(emp => emp.id === idToUpdate);
  return NextResponse.json(updatedEmployee, { status: 200 });
}
