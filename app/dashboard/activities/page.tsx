"use client";

import { useEffect, useState, useMemo } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { format } from "date-fns";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  LabelList,
} from "recharts";
import { Download, Search } from "lucide-react";

interface Task {
  id: string;
  leadName?: string;
  leadDetails?: string;
  taskStatus?: string;
  createdAt?: string;
  updatedAt?: string;
  assignedTo?: string; // employee id
}

interface Employee {
  id: string;
  name: string;
  role: string;
  email?: string;
}

interface Activity {
  id: string;
  subject: string;
  description: string;
  status: string;
  created_at: string;
  employeeName: string;
  month: string;
}

export default function EmployeeDashboard() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedMonth, setSelectedMonth] = useState("All");

  // 🔹 Fetch employees
  const fetchEmployees = async () => {
    try {
      const res = await fetch("/api/employees");
      const data: Employee[] = await res.json();
      setEmployees(data);
    } catch {
      toast.error("Failed to load employees");
    }
  };

  // 🔹 Fetch tasks & map with employee names
  const fetchActivities = async () => {
    try {
      const res = await fetch("/api/tasks");
      const tasks: Task[] = await res.json();

      const completed = tasks
        .filter((t) => t.taskStatus === "completed")
        .map((t) => {
          const created = new Date(t.createdAt || new Date());
          const emp = employees.find((e) => e.id === t.assignedTo);
          return {
            id: t.id,
            subject: t.leadName || "Unnamed Task",
            description: t.leadDetails || "",
            status: "completed",
            created_at: created.toISOString(),
            employeeName: emp ? emp.name : "Unknown",
            month: format(created, "MMM yyyy"),
          };
        });

      setActivities(completed);
    } catch {
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    (async () => {
      await fetchEmployees();
    })();
  }, []);

  // jab employees load ho jayein to tasks fetch karo
  useEffect(() => {
    if (employees.length > 0) fetchActivities();
  }, [employees]);

  // 🔎 Filters (✅ sorted by most recent first)
  const filteredData = useMemo(() => {
    const filtered = activities.filter((a) => {
      const matchesSearch =
        a.subject.toLowerCase().includes(search.toLowerCase()) ||
        a.employeeName.toLowerCase().includes(search.toLowerCase());
      const matchesMonth =
        selectedMonth === "All" || a.month === selectedMonth;
      return matchesSearch && matchesMonth;
    });

    // ✅ Sort by created_at descending (latest first)
    return filtered.sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }, [activities, search, selectedMonth]);

  // 📊 Group for Chart
  const groupedData = Object.values(
    filteredData.reduce((acc: any, act) => {
      const key = `${act.month}-${act.employeeName}`;
      if (!acc[key])
        acc[key] = { month: act.month, employee: act.employeeName, count: 0 };
      acc[key].count += 1;
      return acc;
    }, {})
  );

  // 📤 Export to CSV
  const exportToSheet = () => {
    const header = ["ID", "Subject", "Employee", "Month", "Date"];
    const rows = activities.map((a) => [
      a.id,
      a.subject,
      a.employeeName,
      a.month,
      format(new Date(a.created_at), "dd MMM yyyy"),
    ]);
    const csvContent =
      "data:text/csv;charset=utf-8," +
      [header, ...rows].map((r) => r.join(",")).join("\n");

    const link = document.createElement("a");
    link.href = encodeURI(csvContent);
    link.download = "Employee_Tasks.csv";
    link.click();
    toast.success("Sheet exported successfully!");
  };

  // 🗓️ Unique month list
  const monthOptions = useMemo(() => {
    const months = Array.from(new Set(activities.map((a) => a.month)));
    return ["All", ...months];
  }, [activities]);

  return (
    <DashboardLayout>
      <div className="p-6 flex gap-6">
        {/* 🧾 Left Side: Table */}
        <div className="flex-1">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold text-slate-800">
              Employee Task Sheet
            </h1>
            <Button onClick={exportToSheet} size="sm" variant="outline">
              <Download className="w-4 h-4 mr-2" /> Export Sheet
            </Button>
          </div>

          {/* 🔍 Filters */}
          <div className="flex items-center gap-3 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search by employee or subject..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8 pr-3 py-2 text-sm border rounded-md w-full focus:outline-none focus:ring-1 focus:ring-blue-400"
              />
            </div>

            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="border rounded-md text-sm px-3 py-2"
            >
              {monthOptions.map((m) => (
                <option key={m}>{m}</option>
              ))}
            </select>
          </div>

          {/* 🧾 Table */}
          <div className="border rounded-lg overflow-hidden bg-white shadow-sm">
            <table className="w-full text-sm">
              <thead className="bg-slate-100 text-slate-700">
                <tr>
                  <th className="p-3 text-left">Lead Name</th>
                  <th className="p-3 text-left">Employee</th>
                  <th className="p-3 text-left">Month</th>
                  <th className="p-3 text-left">Date</th>
                  <th className="p-3 text-left">Status</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={5} className="p-4 text-center text-slate-500">
                      Loading...
                    </td>
                  </tr>
                ) : filteredData.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-4 text-center text-slate-500">
                      No results found
                    </td>
                  </tr>
                ) : (
                  filteredData.map((a) => (
                    <tr
                      key={a.id}
                      className="hover:bg-slate-50 border-b last:border-none"
                    >
                      <td className="p-3">{a.subject}</td>
                      <td className="p-3">{a.employeeName}</td>
                      <td className="p-3">{a.month}</td>
                      <td className="p-3">
                        {format(new Date(a.created_at), "dd MMM yyyy")}
                      </td>
                      <td className="p-3 text-green-600 font-medium">
                        Completed
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* 📊 Right Side: Compact Chart */}
        <div className="w-[360px]">
          <Card className="p-5 shadow-sm border bg-gradient-to-br from-white to-slate-50">
            <h2 className="text-base font-semibold text-slate-800 mb-2">
              Monthly Completions
            </h2>
            <div className="h-[380px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={groupedData}
                  margin={{ top: 60, right: 10, left: -10, bottom: 20 }}
                >
                  <defs>
                    <linearGradient id="barColor" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.9} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.2} />
                    </linearGradient>
                  </defs>
                  <XAxis
                    dataKey="month"
                    tick={{ fill: "#64748b", fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fill: "#64748b", fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      background: "#fff",
                      border: "1px solid #e2e8f0",
                      borderRadius: "8px",
                    }}
                    formatter={(val, name, props) => [
                      `${val} task${Number(val) > 1 ? "s" : ""}`,
                      props.payload.employee,
                    ]}
                  />
                  <Bar
                    dataKey="count"
                    fill="url(#barColor)"
                    radius={[6, 6, 0, 0]}
                    barSize={25}
                  >
                    <LabelList
                      dataKey="employee"
                      position="top"
                      className="text-[10px] fill-slate-600"
                    />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
