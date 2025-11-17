"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import { PlusCircle, X, Edit, Save, Trash2, Loader2, Users } from "lucide-react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card } from "@/components/ui/card";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { toast } from "sonner"; // Sonner for notifications

// --- Data Structure ---

interface Employee {
  id: string;
  name: string;
  role: string;
  email: string;
  avatar?: string;
}

const DEFAULT_AVATAR =
  "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_960_720.png";

// --- Editable Employee Card Component ---

interface EditableCardProps {
  employee: Employee;
  onUpdate: (id: string, updatedData: Partial<Employee>) => void;
  onDelete: (id: string) => void;
}

const EditableEmployeeCard: React.FC<EditableCardProps> = ({ employee, onUpdate, onDelete }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<Partial<Employee>>(employee);

  const handleSave = () => {
    if (!editData.name?.trim() || !editData.email?.trim()) {
      return toast.error("Name and Email are required fields.");
    }
    onUpdate(employee.id, editData);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditData(employee); // Reset form data
  };
  
  const handleDeleteClick = () => {
    if (window.confirm(`Are you sure you want to delete ${employee.name}?`)) {
      onDelete(employee.id);
    }
  };
  
  const InputField = ({ name, placeholder, value, type = "text" }: { name: keyof Employee, placeholder: string, value: string | undefined, type?: string }) => (
    <input
      type={type}
      name={name.toString()}
      placeholder={placeholder}
      value={value || ""}
      onChange={(e) => setEditData({ ...editData, [name]: e.target.value })}
      className="w-full border rounded-lg px-3 py-1.5 text-sm text-gray-800 focus:outline-none focus:ring-1 focus:ring-red-600 transition"
      // Change: focus:ring-indigo-500 -> focus:ring-red-600
    />
  );

  return (
    <Card className="bg-white rounded-2xl p-5 shadow-lg border border-gray-100 flex flex-col items-center text-center relative hover:shadow-xl transition duration-300">
      
      {/* Edit/Save/Delete Buttons */}
      <div className="absolute top-4 right-4 flex space-x-2">
        {isEditing ? (
          <>
            <button
              onClick={handleSave}
              title="Save Changes"
              className="p-1 text-red-600 hover:text-red-700 transition"
              // Change: text-emerald-600 -> text-red-600
            >
              <Save className="w-5 h-5" />
            </button>
            <button
              onClick={handleCancel}
              title="Cancel Editing"
              className="p-1 text-gray-500 hover:text-gray-700 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </>
        ) : (
          <>
            <button
              onClick={() => setIsEditing(true)}
              title="Edit Employee"
              className="p-1 text-red-500 hover:text-red-700 transition"
              // Change: text-blue-500 -> text-red-500
            >
              <Edit className="w-5 h-5" />
            </button>
            <button
              onClick={handleDeleteClick}
              title="Delete Employee"
              className="p-1 text-red-500 hover:text-red-700 transition"
            >
              <Trash2 className="w-5 h-5" />
            </button>
          </>
        )}
      </div>

      {/* Profile Picture */}
      <Image
        src={employee.avatar || DEFAULT_AVATAR}
        alt={employee.name || "Employee Avatar"}
        width={96}
        height={96}
        className="rounded-full object-cover w-24 h-24 border-4 border-gray-100 shadow-md mb-3"
      />

      {/* Employee Info - Dynamic/Editable */}
      <div className="w-full space-y-2 mt-2">
        {isEditing ? (
          <div className="space-y-3 w-full"> {/* Added div for spacing in edit mode */}
            <InputField name="name" placeholder="Full Name" value={editData.name} />
            <InputField name="role" placeholder="Role/Position" value={editData.role} />
            <InputField name="email" placeholder="Email Address" value={editData.email} type="email" />
          </div>
        ) : (
          // Display Mode
          <>
            <h3 className="font-bold text-xl text-gray-800 mb-1">{employee.name}</h3>
            <p className="text-sm text-red-600 font-semibold mb-3">{employee.role}</p>
            {/* Change: text-indigo-600 -> text-red-600 */}
            <div className="text-sm text-gray-600 mt-2 space-y-1 w-full p-2 border-t border-dashed">
              <p className="font-medium flex justify-center items-center">
                Email: <span className="ml-2 text-gray-800 font-mono">{employee.email}</span>
              </p>
            </div>
          </>
        )}
      </div>
    </Card>
  );
};


// --- Main Employees Page Component ---

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isAddOpen, setAddOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  
  const [newEmployee, setNewEmployee] = useState({
    name: "",
    role: "",
    email: "",
  });

  // 🔹 Fetch Employees (GET)
  const fetchEmployees = async () => {
    try {
      const res = await fetch("/api/employees");
      if (!res.ok) throw new Error("Failed to fetch employees");
      const data = await res.json();
      setEmployees(data);
    } catch (error) {
      toast.error("Failed to load employee data.");
      console.error("Error fetching employees:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  // 🔹 Add Employee (POST)
  const handleAddEmployee = async () => {
    if (!newEmployee.name.trim() || !newEmployee.email.trim())
      return toast.error("Name & Email required!");

    const res = await fetch("/api/employees", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newEmployee),
    });

    if (res.ok) {
      toast.success("Employee added successfully!");
      fetchEmployees(); 
      setNewEmployee({ name: "", role: "", email: "" });
      setAddOpen(false);
    } else {
      toast.error("Failed to save employee");
    }
  };

  // 🔹 Update Employee (PUT)
  const handleUpdateEmployee = async (id: string, updatedData: Partial<Employee>) => {
    try {
      const res = await fetch(`/api/employees/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedData),
      });

      if (res.ok) {
        toast.success("Employee updated successfully!");
        fetchEmployees();
      } else {
        throw new Error("API update failed");
      }
    } catch (error) {
      toast.error("Failed to update employee. Check PUT API route.");
      console.error("Error updating employee:", error);
    }
  };

  // 🔹 Delete Employee (DELETE)
  const handleDeleteEmployee = async (id: string) => {
    try {
      const res = await fetch(`/api/employees/${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        toast.success("Employee deleted successfully!");
        fetchEmployees();
      } else {
        throw new Error("API delete failed");
      }
    } catch (error) {
      toast.error("Failed to delete employee. Check DELETE API route.");
      console.error("Error deleting employee:", error);
    }
  };


  if (loading)
    return (
      <DashboardLayout>
       <ProtectedRoute>
          <div className="flex items-center justify-center h-full text-lg text-gray-500 p-6">Loading employees...</div>
       </ProtectedRoute>
      </DashboardLayout>
    );

  return (
    <DashboardLayout>
      <div className="p-6">
        
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-semibold text-gray-800">Employees Directory</h1>
          <button
            onClick={() => setAddOpen(true)}
            className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition duration-150"
            // Change: bg-indigo-600 -> bg-red-600
          >
            <PlusCircle className="w-4 h-4" /> Add Employee
          </button>
        </div>

        {/* --- */}

        {/* Employee Grid (3 cards per row) */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {employees.length > 0 ? (
            employees.map((emp) => (
              <EditableEmployeeCard
                key={emp.id}
                employee={emp}
                onUpdate={handleUpdateEmployee}
                onDelete={handleDeleteEmployee}
              />
            ))
          ) : (
             <div className="lg:col-span-3 text-center text-gray-500 p-10 border rounded-lg bg-white shadow-sm">No employees found. Please add one!</div>
          )}
        </div>

        {/* --- */}

        {/* Add Employee Modal (Simplified Form) */}
        {isAddOpen && (
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50"
            onClick={() => setAddOpen(false)}
          >
            <div
              className="bg-white rounded-2xl p-6 w-full max-w-sm relative shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setAddOpen(false)}
                className="absolute top-3 right-3 text-gray-500 hover:text-black transition"
              >
                <X className="w-5 h-5" />
              </button>

              <h2 className="text-xl font-bold mb-5 text-center text-gray-800">
                Add New Employee
              </h2>

              <div className="space-y-3">
                <input
                  type="text"
                  placeholder="Full Name (Required)"
                  value={newEmployee.name}
                  onChange={(e) =>
                    setNewEmployee((p) => ({ ...p, name: e.target.value }))
                  }
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-red-600"
                  // Change: focus:ring-indigo-500 -> focus:ring-red-600
                  required
                />
                <input
                  type="text"
                  placeholder="Role/Position"
                  value={newEmployee.role}
                  onChange={(e) =>
                    setNewEmployee((p) => ({ ...p, role: e.target.value }))
                  }
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-red-600"
                  // Change: focus:ring-indigo-500 -> focus:ring-red-600
                />
                <input
                  type="email"
                  placeholder="Email (Required)"
                  value={newEmployee.email}
                  onChange={(e) =>
                    setNewEmployee((p) => ({ ...p, email: e.target.value }))
                  }
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-red-600"
                  // Change: focus:ring-indigo-500 -> focus:ring-red-600
                  required
                />
              </div>

              <div className="mt-6 flex justify-end gap-3">
                <button
                  onClick={() => setAddOpen(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddEmployee}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm font-medium transition"
                  // Change: bg-indigo-600 -> bg-red-600
                >
                  Save Employee
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}