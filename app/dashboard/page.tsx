"use client";

import React, { useEffect, useMemo, useState } from "react";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card } from "@/components/ui/card";
import {
  PlusCircle,
  Search as LucideSearch,
  X as LucideX,
  Clock as LucideClock,
  Filter as LucideFilter,
} from "lucide-react";
import ReactDOM from "react-dom";
import clsx from "clsx";
import {
  FaWhatsapp,
  FaFacebook,
  FaTwitter,
  FaLinkedin,
  FaGoogleDrive,
  FaInstagram,
} from "react-icons/fa";
import {
  SiGooglesheets,
  SiNotion,
  SiAsana,
  SiGooglegemini,
} from "react-icons/si";
import { TransferLeadModal } from "./TransferLeadModal";
import sampleCustomers from "@/lib/leads.json";
import { toast } from "sonner";

// ✅ Recharts imports
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  LabelList,
} from "recharts";

type PlatformKey =
  | "whatsapp"
  | "facebook"
  | "twitter"
  | "linkedin"
  | "googledrive"
  | "googlesheets"
  | "notion"
  | "asana"
  | "googlegemini"
  | "instagram";

type PlatformInput = {
  key: PlatformKey;
  label: string;
  placeholder: string;
};

type Customer = {
  id: number;
  name: string;
  company?: string;
  leadSource?: string;
  priority?: "Low" | "Medium" | "High";
  phone?: string;
  email?: string;
  address?: string;
  product?: string;
  status: "New" | "Existing";
  platforms: { [k in PlatformKey]?: string };
  notes?: string;
  lastContacted?: string;
  createdAt: string;
};

const ALL_PLATFORMS: PlatformInput[] = [
  { key: "whatsapp", label: "WhatsApp", placeholder: "Phone number" },
  { key: "facebook", label: "Facebook", placeholder: "Profile URL" },
  { key: "instagram", label: "Instagram", placeholder: "Profile URL" },
  { key: "twitter", label: "Twitter", placeholder: "Profile URL" },
  { key: "linkedin", label: "LinkedIn", placeholder: "Profile URL" },
  { key: "googledrive", label: "Google Drive", placeholder: "Drive Link" },
  { key: "googlesheets", label: "Google Sheets", placeholder: "Sheet Link" },
  { key: "notion", label: "Notion", placeholder: "Page Link" },
  { key: "asana", label: "Asana", placeholder: "Project Link" },
  { key: "googlegemini", label: "Google Gemini", placeholder: "Account ID" },
];

const platformIcons: Record<PlatformKey, React.ReactNode> = {
  whatsapp: <FaWhatsapp />,
  facebook: <FaFacebook />,
  instagram: <FaInstagram />,
  twitter: <FaTwitter />,
  linkedin: <FaLinkedin />,
  googledrive: <FaGoogleDrive />,
  googlesheets: <SiGooglesheets />,
  notion: <SiNotion />,
  asana: <SiAsana />,
  googlegemini: <SiGooglegemini />,
};

const buildPlatformUrl = (key: PlatformKey, value: string) => {
  if (!value) return "#";
  const v = value.trim();
  switch (key) {
    case "whatsapp":
      const digits = v.replace(/[^\d+]/g, "");
      if (!digits) return "#";
      return digits.startsWith("+")
        ? `https://wa.me/${digits.replace("+", "")}`
        : `https://wa.me/${digits}`;
    default:
      return v.startsWith("http") ? v : `https://${v}`;
  }
};

const normalizeCustomer = (c: any): Customer => ({
  ...c,
  priority: ["High", "Medium", "Low"].includes(c.priority)
    ? c.priority
    : "Medium",
  status: ["New", "Existing"].includes(c.status) ? c.status : "New",
  platforms: c.platforms || {},
  createdAt: c.createdAt || new Date().toISOString(),
});

const EditableRow = ({
  label,
  value,
  multiline = false,
  onChange,
}: {
  label: string;
  value: string;
  multiline?: boolean;
  onChange?: (val: string) => void;
}) => {
  const [editValue, setEditValue] = useState(value);
  const [editing, setEditing] = useState(false);

  const save = () => {
    setEditing(false);
    onChange?.(editValue);
  };
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
      <label className="font-medium text-sm text-gray-700 w-32">{label}:</label>
      {editing ? (
        multiline ? (
          <textarea
            className="border rounded-lg px-3 py-1.5 text-sm w-full"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
          />
        ) : (
          <input
            className="border rounded-lg px-3 py-1.5 text-sm w-full"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
          />
        )
      ) : (
        <p className="text-sm text-gray-600 flex-1">{editValue || "—"}</p>
      )}
      <button
        onClick={editing ? save : () => setEditing(true)}
        className="text-blue-600 text-xs font-medium hover:underline"
      >
        {editing ? "Save" : "Edit"}
      </button>
    </div>
  );
};

export default function CustomerManagerPage() {
  const [employees, setEmployees] = useState<
    { id: string; name: string; role: string; email?: string }[]
  >([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"All" | "New" | "Existing" | "High">(
    "All"
  );
  const [selected, setSelected] = useState<Customer | null>(null);
  const [selectedLead, setSelectedLead] = useState<Customer | null>(null);
  const [transferOpen, setTransferOpen] = useState(false);
  const [isFormOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState({
    name: "",
    company: "",
    leadSource: "",
    priority: "Medium" as "Low" | "Medium" | "High",
    phone: "",
    email: "",
    address: "",
    product: "",
    status: "New" as "New" | "Existing",
    platforms: {} as { [k in PlatformKey]?: string },
    notes: "",
  });

  // ✅ Chart data
  const [groupedData, setGroupedData] = useState<
    { month: string; count: number; employee: string }[]
  >([]);

  // Fetch employees
  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const res = await fetch("/api/employees");
        const data = await res.json();
        setEmployees(data);
      } catch (err) {
        console.error("Failed to load employees:", err);
      }
    };
    fetchEmployees();
  }, []);

  // Load sample customers
  useEffect(() => {
    const normalizedSample: Customer[] = (sampleCustomers as any[]).map(
      normalizeCustomer
    );
    setCustomers(normalizedSample);
  }, []);

  // Generate chart data when employees load
  useEffect(() => {
    if (employees.length === 0) return;

    const months = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];

    const tempData = months.map((month) => {
      const count = Math.floor(Math.random() * 20) + 1;
      const employee =
        employees[Math.floor(Math.random() * employees.length)]?.name ?? "N/A";
      return { month, count, employee };
    });

    setGroupedData(tempData);
  }, [employees]);

  // Filtered customers
  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    let filtered = customers.filter((c) =>
      [c.name, c.email, c.product, c.phone, c.address, c.company, c.leadSource].some(
        (f) => (f || "").toLowerCase().includes(q)
      )
    );
    if (filter === "New") filtered = filtered.filter((c) => c.status === "New");
    if (filter === "Existing")
      filtered = filtered.filter((c) => c.status === "Existing");
    if (filter === "High") filtered = filtered.filter((c) => c.priority === "High");
    return filtered.sort(
      (a, b) => +new Date(b.createdAt) - +new Date(a.createdAt)
    );
  }, [customers, search, filter]);

  // Form handlers
  const resetForm = () =>
    setForm({
      name: "",
      company: "",
      leadSource: "",
      priority: "Medium",
      phone: "",
      email: "",
      address: "",
      product: "",
      status: "New",
      platforms: {},
      notes: "",
    });

  const saveNewLead = async () => {
    if (!form.name.trim() || !form.email.trim()) {
      toast.error("Name and Email are required!");
      return;
    }
    const newCust: Customer = {
      id: Date.now(),
      name: form.name.trim(),
      company: form.company.trim() || undefined,
      leadSource: form.leadSource.trim() || undefined,
      priority: form.priority,
      phone: form.phone.trim() || undefined,
      email: form.email.trim() || undefined,
      address: form.address.trim() || undefined,
      product: form.product.trim() || undefined,
      status: form.status,
      platforms: Object.keys(form.platforms).reduce((acc, k) => {
        const key = k as PlatformKey;
        const v = (form.platforms as any)[key];
        if (v && v.trim()) acc[key] = v.trim();
        return acc;
      }, {} as { [k in PlatformKey]?: string }),
      notes: form.notes.trim() || undefined,
      lastContacted: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    };
    try {
      const res = await fetch("/api/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newCust),
      });
      const saved = await res.json();
      setCustomers((prev) => [normalizeCustomer(saved), ...prev]);
      toast.success("New lead added successfully!");
      resetForm();
      setFormOpen(false);
    } catch (err) {
      console.error(err);
      toast.error("Failed to save new lead.");
    }
  };

  const deleteCustomer = async (id: number) => {
    try {
      await fetch(`/api/customers/${id}`, { method: "DELETE" });
      setCustomers((prev) => prev.filter((c) => c.id !== id));
      toast.success("Customer deleted successfully!");
      setSelected(null);
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete customer.");
    }
  };

  const saveChanges = async () => {
    if (!selected) return;

    try {
      const res = await fetch(`/api/customers/${selected.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(selected),
      });
      const updated = await res.json();
      setCustomers((prev) =>
        prev.map((c) => (c.id === updated.id ? updated : c))
      );
      toast.success("Changes saved!");
      setSelected(null);
    } catch (err) {
      console.error(err);
      toast.error("Failed to save changes.");
    }
  };

  const handleTransfer = (employeeId: string) => {
    const emp = employees.find((e) => e.id === employeeId);
    toast.success(`Lead transferred to ${emp?.name || "Employee"}`);
    setTransferOpen(false);
    setSelectedLead(null);
  };

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="space-y-8">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-logo font-bold text-black">Leads Management</h1>
              <p className="text-slate-600 mt-1">
                Search, view, add leads & manage customers.
              </p>
            </div>

            <div className="flex gap-3 items-center">
              <div className="relative">
                <LucideSearch className="absolute left-3 top-3 text-slate-500 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search by name, company, email, product..."
                  className="pl-9 pr-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-red-600 focus:outline-none w-64"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>

              <div className="flex items-center gap-2">
                <LucideFilter className="text-slate-600 w-4 h-4" />
                <select
                  value={filter}
                  onChange={(e) => setFilter(e.target.value as any)}
                  className="border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-red-600"
                >
                  <option value="All">All</option>
                  <option value="New">New</option>
                  <option value="Existing">Existing</option>
                  <option value="High">High Priority</option>
                </select>
              </div>

              <button
                onClick={() => {
                  resetForm();
                  setFormOpen(true);
                }}
                className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition"
              >
                <PlusCircle className="w-4 h-4" />
                New Lead
              </button>
            </div>
          </div>

          {/* 📊 Chart */}
          {groupedData.length > 0 && (
            <div className="w-full md:w-full mb-6">
              <Card className="p-5 shadow-sm border bg-gradient-to-br from-white to-slate-50">
                <h2 className="text-base font-semibold text-slate-800 mb-2">
                  Monthly Completions
                </h2>
                <div className="h-[180px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={groupedData}
                      margin={{ top: 60, right: 10, left: -10, bottom: 20 }}
                    >
                      <defs>
                        <linearGradient id="barColor" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#dc2626" stopOpacity={0.9} />
                          <stop offset="95%" stopColor="#dc2626" stopOpacity={0.2} />
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
                          dataKey="count"
                          position="top"
                          className="text-[10px] fill-slate-600"
                        />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </Card>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {visible.map((cust) => (
              <Card
                key={cust.id}
                onClick={() => setSelected(cust)}
                className="relative overflow-hidden cursor-pointer rounded-2xl p-6 bg-gradient-to-br from-white to-slate-50 shadow-md hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1"
              >
                {/* Priority / Status badge */}
                <span
                  className={clsx(
                    'absolute top-3 right-3 text-xs font-semibold px-3 py-1 rounded-full shadow-sm',
                    cust.priority === 'High'
                      ? 'bg-red-100 text-red-700 ring-1 ring-red-300'
                      : cust.status === 'New'
                        ? 'bg-black text-white'
                        : 'bg-gray-100 text-gray-700'
                  )}
                >
                  {cust.priority ?? cust.status}
                </span>

                {/* Customer info */}
                <div className="flex items-center gap-4 w-full">
                  <div className="w-16 h-16 shrink-0 rounded-full bg-gradient-to-tr from-gray-200 to-gray-100 flex items-center justify-center text-2xl font-semibold text-black shadow-inner">
                    {cust.name.charAt(0)}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-black">{cust.name}</h3>
                    {cust.company && <p className="text-sm text-slate-600">{cust.company}</p>}
                    <p className="text-xs text-slate-500 mt-1">
                      {cust.email ?? '—'} • {cust.phone ?? '—'}
                    </p>
                  </div>
                </div>

                {/* Platforms */}
                <div className="mt-4 flex items-center gap-3 flex-wrap">
                  {Object.keys(cust.platforms || {}).length === 0 ? (
                    <span className="text-xs text-slate-400">No platforms connected</span>
                  ) : (
                    Object.entries(cust.platforms!).map(([k, v]) => {
                      const key = k as PlatformKey;
                      return (
                        <a
                          key={k}
                          href={buildPlatformUrl(key, v!)}
                          target="_blank"
                          rel="noreferrer"
                          className="p-2 rounded-full bg-slate-100 hover:bg-red-50 transition-transform transform hover:scale-110 text-lg text-gray-600 shadow-sm"
                          title={`${ALL_PLATFORMS.find((p) => p.key === key)?.label}: ${v}`}
                        >
                          {platformIcons[key]}
                        </a>
                      );
                    })
                  )}
                </div>

                {/* Action Buttons */}
                <div className="mt-4 flex gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedLead(cust);
                      setTransferOpen(true);
                    }}
                    className="px-3 py-1 bg-red-600 text-white text-xs rounded-lg hover:bg-red-700 transition"
                  >
                    Transfer
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteCustomer(cust.id);
                    }}
                    className="px-3 py-1 bg-gray-200 text-gray-700 text-xs rounded-lg hover:bg-gray-300 transition"
                  >
                    Delete
                  </button>
                </div>




              </Card>
            ))}
          </div>
          <div>


            {/* ✅ Edit Modal */}
            {selected && (
              <div
                className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[99999]"
                onClick={() => setSelected(null)}
              >
                <div
                  className="bg-white/95 rounded-2xl p-6 w-full max-w-2xl shadow-2xl relative max-h-[90vh] overflow-y-auto border border-gray-200"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    className="absolute top-3 right-3 text-gray-500 hover:text-gray-700"
                    onClick={() => setSelected(null)}
                  >
                    ✕
                  </button>

                  <h2 className="text-2xl font-semibold text-gray-800">{selected.name}</h2>

                  {/* Editable Fields */}
                  <div className="mt-6 space-y-3">
                    <EditableRow
                      label="Email"
                      value={selected.email ?? ""}
                      onChange={(val) =>
                        setSelected((p) => p && { ...p, email: val })
                      }
                    />
                    <EditableRow
                      label="Phone"
                      value={selected.phone ?? ""}
                      onChange={(val) =>
                        setSelected((p) => p && { ...p, phone: val })
                      }
                    />
                    <EditableRow
                      label="Product"
                      value={selected.product ?? ""}
                      onChange={(val) =>
                        setSelected((p) => p && { ...p, product: val })
                      }
                    />
                    <EditableRow
                      label="Lead Source"
                      value={selected.leadSource ?? ""}
                      onChange={(val) =>
                        setSelected((p) => p && { ...p, leadSource: val })
                      }
                    />
                    <EditableRow
                      label="Status"
                      value={selected.status ?? ""}
                      onChange={(val) =>
                        setSelected((p) => p && { ...p, status: val as any })
                      }
                    />
                    <EditableRow
                      label="Priority"
                      value={selected.priority ?? ""}
                      onChange={(val) =>
                        setSelected((p) => p && { ...p, priority: val as any })
                      }
                    />
                    <EditableRow
                      label="Notes"
                      value={selected.notes ?? ""}
                      multiline
                      onChange={(val) =>
                        setSelected((p) => p && { ...p, notes: val })
                      }
                    />
                  </div>

                  <div className="mt-6 flex flex-col sm:flex-row gap-3">
                    <button
                      onClick={saveChanges}
                      className="flex-1 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm hover:bg-blue-700"
                    >
                      Save Changes
                    </button>

                    {/* ✅ FIXED: use selected instead of cust */}
                    <button
                      onClick={() => setTransferOpen(true)}
                      className="flex-1 px-3 py-1.5 text-sm rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition"
                    >
                      Transfer Lead
                    </button>

                    <TransferLeadModal
                      open={transferOpen}
                      onClose={() => setTransferOpen(false)}
                      leadName={selected?.name || ''}  // 👈 use selected instead of selectedLead
                      onTransfer={(employeeId: string) => {
                        handleTransfer(employeeId);
                        setSelected(null); // close inner popup if needed
                      }}
                    />

                  </div>

                  <p className="mt-4 text-xs text-center text-slate-500">
                    Last Contacted:{' '}
                    {selected.lastContacted ? new Date(selected.lastContacted).toLocaleString() : 'Never'}
                  </p>
                </div>
              </div>
            )}
          </div>


          {/* Add New Lead modal */}

          {/* Form Modal */}
          {isFormOpen &&
            typeof window !== "undefined" &&
            ReactDOM.createPortal(
              <div
                className="fixed inset-0 bg-black/50 backdrop-blur-sm [transform:translateZ(0)] flex items-center justify-center z-[99999]"
                onClick={() => setFormOpen(false)}
              >
                <div
                  className="bg-white p-5 rounded-2xl shadow-2xl w-full max-w-md relative max-h-[90vh] overflow-y-auto"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    onClick={() => setFormOpen(false)}
                    className="absolute top-3 right-3 text-slate-500 hover:text-black"
                  >
                    <LucideX className="w-5 h-5" />
                  </button>

                  <h2 className="text-xl font-semibold mb-3 text-black text-center">
                    Add New Lead
                  </h2>

                  {/* Basic Info */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <input
                      value={form.name}
                      onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                      placeholder="Full Name *"
                      className="border rounded-lg px-3 py-1.5 text-sm"
                    />
                    <input
                      value={form.company}
                      onChange={(e) => setForm((p) => ({ ...p, company: e.target.value }))}
                      placeholder="Company"
                      className="border rounded-lg px-3 py-1.5 text-sm"
                    />
                    <input
                      value={form.email}
                      onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                      placeholder="Email *"
                      className="border rounded-lg px-3 py-1.5 text-sm"
                    />
                    <input
                      value={form.phone}
                      onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
                      placeholder="Phone"
                      className="border rounded-lg px-3 py-1.5 text-sm"
                    />
                    <input
                      value={form.product}
                      onChange={(e) => setForm((p) => ({ ...p, product: e.target.value }))}
                      placeholder="Product / Service"
                      className="border rounded-lg px-3 py-1.5 text-sm"
                    />
                    <input
                      value={form.leadSource}
                      onChange={(e) => setForm((p) => ({ ...p, leadSource: e.target.value }))}
                      placeholder="Lead Source"
                      className="border rounded-lg px-3 py-1.5 text-sm"
                    />

                    <select
                      value={form.status}
                      onChange={(e) => setForm((p) => ({ ...p, status: e.target.value as any }))}
                      className="border rounded-lg px-3 py-1.5 text-sm"
                    >
                      <option value="New">New</option>
                      <option value="Existing">Existing</option>
                    </select>

                    <select
                      value={form.priority}
                      onChange={(e) => setForm((p) => ({ ...p, priority: e.target.value as any }))}
                      className="border rounded-lg px-3 py-1.5 text-sm"
                    >
                      <option value="Low">Low Priority</option>
                      <option value="Medium">Medium Priority</option>
                      <option value="High">High Priority</option>
                    </select>
                  </div>

                  {/* 🌐 Social Platforms */}
                  <div className="mt-3">
                    <label className="block text-sm font-medium text-black mb-1">
                      Connected Platforms
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {ALL_PLATFORMS.slice(0, 6).map((p) => (
                        <div
                          key={p.key}
                          className="flex items-center gap-2 border rounded-lg px-2 py-1.5 bg-slate-50"
                        >
                          <span className="text-red-600 text-lg shrink-0">
                            {platformIcons[p.key]}
                          </span>
                          <input
                            type="text"
                            placeholder={p.label}
                            value={form.platforms[p.key] || ''}
                            onChange={(e) =>
                              setForm((prev) => ({
                                ...prev,
                                platforms: { ...prev.platforms, [p.key]: e.target.value },
                              }))
                            }
                            className="flex-1 outline-none text-sm bg-transparent"
                          />
                        </div>
                      ))}

                    </div>
                  </div>

                  {/* 📝 Notes */}
                  <div className="mt-3">
                    <textarea
                      value={form.notes}
                      onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))}
                      className="border rounded-lg px-3 py-1.5 text-sm w-full min-h-[60px]"
                      placeholder="Notes..."
                    />
                  </div>

                  {/* Buttons */}
                  <div className="mt-4 flex justify-end gap-2">
                    <button
                      onClick={() => {
                        resetForm();
                        setFormOpen(false);
                      }}
                      className="px-3 py-1.5 text-sm rounded-lg border"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={saveNewLead}
                      className="px-4 py-1.5 text-sm rounded-lg bg-red-600 text-white hover:bg-red-700"
                    >
                      Save Lead
                    </button>
                  </div>
                </div>
              </div>,

              document.body
            )}

        </div>
      </DashboardLayout>

      {/* New Lead Form Modal */}
      {isFormOpen && typeof window !== "undefined" &&
        ReactDOM.createPortal(
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
            <div className="bg-white rounded-xl w-96 p-6 relative">
              <h2 className="text-lg font-bold mb-4">Add New Lead</h2>
              <button
                onClick={() => setFormOpen(false)}
                className="absolute top-4 right-4 text-gray-500 hover:text-gray-800"
              >
                <LucideX />
              </button>
              <div className="flex flex-col gap-2">
                <input
                  placeholder="Name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="border px-3 py-2 rounded-lg"
                />
                <input
                  placeholder="Email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="border px-3 py-2 rounded-lg"
                />
                <input
                  placeholder="Phone"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="border px-3 py-2 rounded-lg"
                />
                <button
                  onClick={saveNewLead}
                  className="mt-4 bg-red-600 hover:bg-red-700 text-white rounded-lg py-2 transition"
                >
                  Save
                </button>
              </div>
            </div>
          </div>,
          document.body
        )
      }

      {/* Transfer Lead Modal */}
      {transferOpen && selectedLead && typeof window !== "undefined" &&
        ReactDOM.createPortal(
          <TransferLeadModal
            open={transferOpen}
            onClose={() => {
              setTransferOpen(false);
              setSelectedLead(null);
            }}
            leadName={selectedLead.name}
            onTransfer={(employeeId: string) => handleTransfer(employeeId)}
          />,
          document.body
        )
      }

    </ProtectedRoute>
  );
}
