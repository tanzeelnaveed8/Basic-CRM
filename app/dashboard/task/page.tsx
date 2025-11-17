"use client";

import { useEffect, useState, useRef } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { formatDistanceToNow, format } from "date-fns";
import employeesData from "@/lib/data.json";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Mail, Share2 } from "lucide-react";
import { TransferLeadModal } from "@/app/dashboard/TransferLeadModal";

type Employee = {
  id: string;
  name: string;
  email?: string;
};

type Req = {
  id: string;
  leadName: string;
  leadDetails?: string | null;
  assignedTo: string;
  requestedBy?: string;
  sentVia?: string;
  status: "pending" | "approved" | "rejected" | "transferred";
  createdAt: string;
  updatedAt?: string;
};

type TaskStatus =
  | "in-process"
  | "on-hold"
  | "completed"
  | "discuss"
  | "transferred";

type Task = Req & {
  taskStatus?: TaskStatus;
};

const statusColors: Record<TaskStatus, string> = {
  "in-process": "bg-yellow-100 text-yellow-800",
  "on-hold": "bg-orange-100 text-orange-800",
  completed: "bg-green-100 text-green-800",
  discuss: "bg-blue-100 text-blue-800",
  transferred: "bg-purple-100 text-purple-800",
};

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [viewAs, setViewAs] = useState<"admin" | "employee">("admin");
  const [selectedEmployee, setSelectedEmployee] = useState<string>("");
  const [transferModalOpen, setTransferModalOpen] = useState(false);
  const [selectedLeadName, setSelectedLeadName] = useState<string>("");
  const [pendingTransferTask, setPendingTransferTask] = useState<Task | null>(
    null
  );
  const lastSyncRef = useRef<number>(0);

  // 🔄 Fetch Tasks
  const fetchTasks = async (): Promise<Task[]> => {
    const res = await fetch("/api/tasks", { cache: "no-store" });
    if (!res.ok) throw new Error("Failed to fetch tasks");
    return (await res.json()) as Task[];
  };

  // 🔄 Fetch Requests
  const fetchRequests = async (): Promise<Req[]> => {
    const res = await fetch("/api/requests", { cache: "no-store" });
    if (!res.ok) throw new Error("Failed to fetch requests");
    return (await res.json()) as Req[];
  };

  // 🔁 Sync approved requests → tasks
  const syncRequestsToTasks = async () => {
    try {
      const now = Date.now();
      if (now - lastSyncRef.current < 8000) return;
      lastSyncRef.current = now;

      const [allReqs, existingTasks] = await Promise.all([
        fetchRequests(),
        fetchTasks().catch(() => [] as Task[]),
      ]);

      const approvedReqs = allReqs.filter(
        (r) => String(r.status || "").trim().toLowerCase() === "approved"
      );

      const existingIds = new Set(existingTasks.map((t) => String(t.id)));

      const newTasks: Task[] = approvedReqs
        .filter((r) => !existingIds.has(String(r.id)))
        .map((r) => ({
          ...r,
          taskStatus: "in-process" as TaskStatus,
          createdAt: r.createdAt || new Date().toISOString(),
          updatedAt: r.updatedAt || new Date().toISOString(),
        }));

      if (newTasks.length > 0) {
        await fetch("/api/tasks", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(newTasks),
        });
        toast.success(`${newTasks.length} new task(s) added`);
      }

      const latestTasks = await fetchTasks();
      latestTasks.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

      setTasks(latestTasks);
      setLoading(false);
    } catch (err) {
      console.error("Sync error:", err);
      toast.error("Failed to sync requests → tasks");
      setLoading(false);
    }
  };

  useEffect(() => {
    setEmployees(employeesData);
    syncRequestsToTasks();

    const interval = setInterval(() => {
      syncRequestsToTasks();
    }, 12000);

    return () => clearInterval(interval);
  }, []);

  const getEmployeeName = (id: string) =>
    employees.find((e) => e.id === id)?.name || "Unknown";

  const getEmployeeEmail = (id: string) =>
    employees.find((e) => e.id === id)?.email || "";

  // ✅ Update Task Status
  const updateTaskStatus = async (id: string, newStatus: TaskStatus) => {
    try {
      // UI update
      setTasks((prev) =>
        prev.map((t) => (t.id === id ? { ...t, taskStatus: newStatus } : t))
      );

      // Backend update
      const res = await fetch("/api/tasks", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, taskStatus: newStatus }),
      });

      if (!res.ok) throw new Error("Failed to update task");
    } catch (err) {
      toast.error("Failed to update task status");
    }
  };

  // ✅ Share Lead → Open Modal
  const handleShare = (task: Task) => {
    setSelectedLeadName(task.leadName);
    setPendingTransferTask(task);
    setTransferModalOpen(true);
  };

  // ✅ Handle Email
  const handleEmail = (task: Task) => {
    const email = getEmployeeEmail(task.assignedTo);
    if (email)
      window.open(`https://mail.google.com/mail/?view=cm&fs=1&to=${email}`);
    else toast.error("No email found for this employee");
  };

  // ✅ Filtered Tasks
  const filteredTasks =
    viewAs === "admin"
      ? tasks
      : selectedEmployee
      ? tasks.filter((t) => t.assignedTo === selectedEmployee)
      : [];

  return (
    <DashboardLayout>
      <div className="space-y-6 p-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Tasks</h1>
            <p className="text-slate-600 mt-1">
              Manage and track your task progress.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Select
              value={viewAs}
              onValueChange={(val: "admin" | "employee") => setViewAs(val)}
            >
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="View As" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="employee">Employee</SelectItem>
              </SelectContent>
            </Select>

            {viewAs === "employee" && (
              <Select
                value={selectedEmployee}
                onValueChange={(val) => setSelectedEmployee(val)}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Select Employee" />
                </SelectTrigger>
                <SelectContent>
                  {employees.map((emp) => (
                    <SelectItem key={emp.id} value={emp.id}>
                      {emp.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Task Name</TableHead>
                <TableHead>Assigned To</TableHead>
                <TableHead>Sent Via</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-6">
                    Loading...
                  </TableCell>
                </TableRow>
              ) : filteredTasks.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-6">
                    No tasks found
                  </TableCell>
                </TableRow>
              ) : (
                filteredTasks.map((task) => (
                  <TableRow key={task.id}>
                    <TableCell>{task.leadName}</TableCell>
                    <TableCell>{getEmployeeName(task.assignedTo)}</TableCell>
                    <TableCell>{task.sentVia || "-"}</TableCell>
                    <TableCell>
                      <Badge
                        className={statusColors[task.taskStatus || "in-process"]}
                      >
                        {task.taskStatus}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {format(new Date(task.createdAt), "MMM dd, yyyy hh:mm a")}
                      <div className="text-xs text-gray-400">
                        {formatDistanceToNow(new Date(task.createdAt), {
                          addSuffix: true,
                        })}
                      </div>
                    </TableCell>
                    <TableCell className="text-right flex justify-end gap-2">
                      {viewAs === "employee" &&
                        task.assignedTo === selectedEmployee && (
                          <Select
                            value={task.taskStatus || "in-process"}
                            onValueChange={(val: TaskStatus) =>
                              updateTaskStatus(task.id, val)
                            }
                          >
                            <SelectTrigger className="w-[150px]">
                              <SelectValue placeholder="Status" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="in-process">
                                In Process
                              </SelectItem>
                              <SelectItem value="on-hold">On Hold</SelectItem>
                              <SelectItem value="completed">
                                Completed
                              </SelectItem>
                              <SelectItem value="discuss">Discuss</SelectItem>
                            </SelectContent>
                          </Select>
                        )}

                      {viewAs === "admin" &&
                        (task.taskStatus === "on-hold" ||
                          task.taskStatus === "discuss") && (
                          <div className="flex gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleShare(task)}
                            >
                              <Share2 className="w-4 h-4 text-blue-600" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEmail(task)}
                            >
                              <Mail className="w-4 h-4 text-green-600" />
                            </Button>
                          </div>
                        )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* ✅ Transfer Modal */}
      <TransferLeadModal
  open={transferModalOpen}
  onClose={() => setTransferModalOpen(false)}
  leadName={selectedLeadName}
  onTransfer={async (employeeId: string) => {
    if (!pendingTransferTask) return;

    const updatedId = pendingTransferTask.id;

    // ✅ Update frontend instantly
    setTasks((prev) =>
      prev.map((t) =>
        t.id === updatedId ? { ...t, taskStatus: "transferred" } : t
      )
    );

    // ✅ Update backend
    await fetch("/api/tasks", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: updatedId, taskStatus: "transferred" }),
    });

    toast.success(`Lead transferred successfully `);
  }}
/>

    </DashboardLayout>
  );
}
