"use client";

import React, { useEffect, useMemo, useState } from "react";
import  { toast } from "sonner";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card } from "@/components/ui/card";
import { Check, X as XIcon, ChevronDown, ChevronUp, Search as SearchIcon } from "lucide-react";
import employeesData from "@/lib/data.json";

type Employee = {
  id: string;
  name: string;
  role?: string;
  email?: string;
  whatsapp?: string;
  discord?: string;
  avatar?: string;
};

type Req = {
  id: string;
  leadId?: string | null;
  leadName: string;
  leadDetails?: string | null;
  assignedTo: string;
  requestedBy?: string;
  status: "pending" | "approved" | "rejected";
  sentVia?: "whatsapp" | "discord" | "email" | string;
  createdAt: string;
  updatedAt?: string;
};

const StatusPill: React.FC<{ status: Req["status"] }> = ({ status }) => {
  const colors: Record<Req["status"], string> = {
    pending: "bg-yellow-100 text-yellow-800",
    approved: "bg-green-100 text-green-800",
    rejected: "bg-red-100 text-red-800",
  };
  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[status]}`}>
      {status.toUpperCase()}
    </span>
  );
};

export default function RequestsPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [requests, setRequests] = useState<Req[]>([]);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<"admin" | "employee">("admin");
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "pending" | "approved" | "rejected">("all");
  const [expandedRequestId, setExpandedRequestId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const loadRequests = async () => {
    try {
      const res = await fetch("/api/requests", { cache: "no-store" });
      const data = await res.json();
      setRequests(data);
    } catch (e) {
      console.error(e);
      toast.error("Failed to load requests ⚠️");
    }
  };

  useEffect(() => {
    setEmployees(employeesData);
    if (employeesData.length > 0 && !selectedEmployeeId) {
      setSelectedEmployeeId(employeesData[0].id);
    }
    loadRequests().then(() => setLoading(false));
  }, []);

  const getEmployeeName = (id: string) =>
  employees.find((e) => e.id === id)?.name || "Unknown";

const getEmployeeAvatar = (id: string) =>
  employees.find((e) => e.id === id)?.avatar ||
  "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_960_720.png";

const filtered = useMemo(() => {
  let list = requests;

  // Role filter
  if (role === "employee" && selectedEmployeeId) {
    list = list.filter((r) => r.assignedTo === selectedEmployeeId);
  }

  // Status filter
  if (filter !== "all") list = list.filter((r) => r.status === filter);

  // Search filter by employee name
  if (searchQuery.trim() !== "") {
    const q = searchQuery.toLowerCase();
    list = list.filter((r) => {
      const employeeName = getEmployeeName(r.assignedTo).toLowerCase();
      return employeeName.includes(q);
    });
  }

  return list.sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
}, [requests, filter, role, selectedEmployeeId, searchQuery, employees]);

 
  const updateStatus = async (id: string, status: Req["status"]) => {
    try {
      await fetch("/api/requests", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
      });
      toast.success(`Request ${status} `);
      await loadRequests();
    } catch (e) {
      console.error(e);
      toast.error("Status not updated ⚠️");
    }
  };

  // Dynamic summary stats based on filtered list
  const summaryStats = useMemo(() => {
    const total = filtered.length;
    const pending = filtered.filter((r) => r.status === "pending").length;
    const approved = filtered.filter((r) => r.status === "approved").length;
    const rejected = filtered.filter((r) => r.status === "rejected").length;
    return [
      { label: "Total", value: total, key: "all" },
      { label: "Pending", value: pending, key: "pending" },
      { label: "Approved", value: approved, key: "approved" },
      { label: "Rejected", value: rejected, key: "rejected" },
    ];
  }, [filtered]);

  return (
    <DashboardLayout>
      
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-800">Requests Dashboard</h1>
            <p className="text-slate-500 text-sm mt-1">
              Manage, approve, or reject employee requests with ease
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex border rounded overflow-hidden">
              <button
                onClick={() => setRole("admin")}
                className={`px-4 py-2 text-sm font-medium ${
                  role === "admin"
                    ? "bg-slate-900 text-white"
                    : "bg-white text-slate-600 hover:bg-slate-100"
                }`}
              >
                Admin
              </button>
              <button
                onClick={() => setRole("employee")}
                className={`px-4 py-2 text-sm font-medium ${
                  role === "employee"
                    ? "bg-slate-900 text-white"
                    : "bg-white text-slate-600 hover:bg-slate-100"
                }`}
              >
                Employee
              </button>
            </div>

            {role === "employee" && (
              <select
                className="border rounded px-3 py-2 text-sm"
                value={selectedEmployeeId ?? ""}
                onChange={(e) => setSelectedEmployeeId(e.target.value)}
              >
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.name}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>

        {/* Search bar */}
        <div className="flex items-center border rounded p-2 max-w-sm">
          <SearchIcon className="w-4 h-4 text-slate-500 mr-2" />
          <input
    type="text"
    placeholder="Search by employee name..."
    className="flex-1 outline-none text-sm"
    value={searchQuery}
    onChange={(e) => setSearchQuery(e.target.value)}
  />
</div>

        {/* Summary Cards (Clickable) */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {summaryStats.map((stat) => (
            <Card
              key={stat.label}
              onClick={() => setFilter(stat.key as any)}
              className={`p-4 text-center cursor-pointer transition-all hover:shadow-lg rounded-2xl ${
                filter === stat.key
                  ? "bg-slate-900 text-white scale-[1.02]"
                  : "bg-white hover:bg-slate-50"
              }`}
            >
              <div className="text-sm opacity-70">{stat.label}</div>
              <div className="text-2xl font-bold">{stat.value}</div>
            </Card>
          ))}
        </div>

        {/* Requests List */}
        <Card className="p-5">
          <h2 className="text-lg font-semibold text-slate-800 mb-4">
            {filter === "all"
              ? "All Requests"
              : `${filter.charAt(0).toUpperCase() + filter.slice(1)} Requests`}
          </h2>
          {loading ? (
            <p className="text-center text-slate-500 py-6">Loading...</p>
          ) : filtered.length === 0 ? (
            <p className="text-center text-slate-500 py-6">No requests found.</p>
          ) : (
            <div className="space-y-4">
              {filtered.map((r) => (
                <div
                  key={r.id}
                  className="p-4 rounded-xl border hover:shadow-md transition-all cursor-pointer bg-white"
                >
                  <div
                    className="flex justify-between items-center"
                    onClick={() =>
                      setExpandedRequestId(expandedRequestId === r.id ? null : r.id)
                    }
                  >
                    <div className="flex items-center gap-4">
                      <img
                        src={getEmployeeAvatar(r.assignedTo)}
                        alt="avatar"
                        className="w-12 h-12 rounded-full object-cover border"
                      />
                      <div>
                        <h3 className="font-medium text-slate-800">{r.leadName}</h3>
                        <p className="text-xs text-slate-500">
                          Assigned to: <strong>{getEmployeeName(r.assignedTo)}</strong> •{" "}
                          {new Date(r.createdAt).toLocaleString()}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <StatusPill status={r.status} />
                      {expandedRequestId === r.id ? (
                        <ChevronUp className="w-4 h-4 text-slate-500" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-slate-500" />
                      )}
                    </div>
                  </div>

                  {expandedRequestId === r.id && (
                    <div className="mt-4 p-4 bg-slate-50 rounded-lg text-sm text-slate-700 space-y-1">
                      <p>
                        <strong>Details:</strong> {r.leadDetails || "No details provided."}
                      </p>
                      <p>
                        <strong>Requested By:</strong> {r.requestedBy || "-"}
                      </p>
                      <p>
                        <strong>Sent Via:</strong> {r.sentVia || "-"}
                      </p>
                      <p>
                        <strong>Status:</strong> <StatusPill status={r.status} />
                      </p>

                      {role === "employee" &&
                        selectedEmployeeId === r.assignedTo &&
                        r.status === "pending" && (
                          <div className="flex gap-2 mt-3">
                            <button
                              onClick={() => updateStatus(r.id, "approved")}
                              className="px-4 py-1.5 rounded bg-emerald-600 text-white text-sm flex items-center gap-2 hover:bg-emerald-700 transition"
                            >
                              <Check className="w-4 h-4" /> Approve
                            </button>
                            <button
                              onClick={() => updateStatus(r.id, "rejected")}
                              className="px-4 py-1.5 rounded bg-red-600 text-white text-sm flex items-center gap-2 hover:bg-red-700 transition"
                            >
                              <XIcon className="w-4 h-4" /> Reject
                            </button>
                          </div>
                        )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </DashboardLayout>
  );
}
