"use client";

import React, { useState, useEffect, useMemo } from "react";
import { X, Search } from "lucide-react";
import Image from "next/image";

interface Employee {
  id: string;
  name: string;
  role: string;
  avatar?: string;
}

interface TransferLeadModalProps {
  open: boolean;
  onClose: () => void;
  leadName: string;
  onTransfer: (employeeId: string) => void;
}

export const TransferLeadModal: React.FC<TransferLeadModalProps> = ({
  open,
  onClose,
  leadName,
  onTransfer,
}) => {
  const [search, setSearch] = useState("");
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    const fetchEmployees = async () => {
      setLoading(true);
      try {
        const res = await fetch("/api/employees", { cache: "no-store" });
        const data = await res.json();
        setEmployees(data);
      } catch (err) {
        console.error("Error loading employees:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchEmployees();
  }, [open]);

  const filteredEmployees = useMemo(
    () =>
      employees.filter((emp) =>
        emp.name.toLowerCase().includes(search.toLowerCase())
      ),
    [search, employees]
  );

  if (!open) return null;

  const handleTransfer = async (employee: Employee) => {
    const transferJSON = {
      id: `req_${Date.now()}`,
      leadId: null,
      name: employee.name,
      leadName,
      leadDetails: null,
      assignedTo: employee.id,
      requestedBy: "admin",
      status: "pending",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    try {
      const res = await fetch("/api/transferLead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(transferJSON),
      });
      const result = await res.json();
      if (result.success) onTransfer(employee.id);
    } catch (err) {
      console.error("Transfer failed:", err);
    }

    onClose();
  };

  return (
    <div
      className="fixed inset-0 bg-black/10 flex justify-center items-center z-[9999] animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md transform transition-all duration-200 scale-100 animate-scaleIn"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-800">
            Transfer Lead
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        <p className="text-gray-600 mb-4">
          Select an employee to transfer{" "}
          <span className="font-semibold text-gray-800">{leadName}</span> to.
        </p>

        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-2.5 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search employee..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
          />
        </div>

        {/* Employee List */}
        {loading ? (
          <p className="text-center text-gray-500 py-6">Loading employees...</p>
        ) : (
          <div className="flex flex-col gap-3 max-h-80 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
            {filteredEmployees.length > 0 ? (
              filteredEmployees.map((emp) => (
                <button
                  key={emp.id}
                  onClick={() => handleTransfer(emp)}
                  className="flex items-center gap-3 p-3 border rounded-xl hover:bg-indigo-50 transition-all group"
                >
                  <Image
                    src={
                      emp.avatar ||
                      "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_960_720.png"
                    }
                    alt={emp.name}
                    width={40}
                    height={40}
                    className="rounded-full border object-cover"
                  />
                  <div className="flex flex-col text-left flex-grow">
                    <span className="font-medium text-gray-800 group-hover:text-indigo-600 transition">
                      {emp.name}
                    </span>
                    <span className="text-sm text-gray-500">{emp.role}</span>
                  </div>
                </button>
              ))
            ) : (
              <p className="text-center text-gray-500 py-6">No employees found.</p>
            )}
          </div>
        )}

        <button
          onClick={onClose}
          className="mt-6 w-full bg-gray-100 py-2 rounded-lg hover:bg-gray-200 transition"
        >
          Cancel
        </button>
      </div>
    </div>
  );
};

