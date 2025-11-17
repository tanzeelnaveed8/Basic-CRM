"use client";

import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { MdOutlineApps } from "react-icons/md"; // ✅ Used the new icon

import {
  LayoutDashboard,
  Users,
  UserPlus,
  Briefcase,
  SquareCheck as CheckSquare,
  Settings,
  LogOut,
  Menu,
  Bell, // Icon for the Notification Bell
} from "lucide-react";
import {
  FaWhatsapp,
  FaDiscord,
  FaInstagram,
  FaFacebook,
  FaTwitter,
  FaLinkedin,
  FaGoogleDrive,
  FaSlack,
  FaTrello,
} from "react-icons/fa";
import {
  SiGooglesheets,
  SiGooglegemini,
  SiNotion,
  SiAsana,
} from "react-icons/si";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import clsx from "clsx";

const baseNavigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Employees", href: "/dashboard/employees", icon: Users },
  { name: "Requests", href: "/dashboard/requests", icon: UserPlus },
  { name: "Task", href: "/dashboard/task", icon: Briefcase },
  { name: "Activities", href: "/dashboard/activities", icon: CheckSquare },
  { name: "Settings", href: "/dashboard/settings", icon: Settings },
];

const apps = [
  { name: "WhatsApp", icon: FaWhatsapp, color: "text-green-500", url: "https://web.whatsapp.com", iframe: false },
  { name: "Discord", icon: FaDiscord, color: "text-indigo-500", url: "https://discord.com", iframe: false },
  { name: "Instagram", icon: FaInstagram, color: "text-pink-500", url: "https://www.instagram.com", iframe: false },
  { name: "Facebook", icon: FaFacebook, color: "text-blue-600", url: "https://www.facebook.com", iframe: false },
  { name: "X (Twitter)", icon: FaTwitter, color: "text-black", url: "https://twitter.com", iframe: false },
  { name: "LinkedIn", icon: FaLinkedin, color: "text-sky-600", url: "https://www.linkedin.com", iframe: false },
  { name: "Google Sheets", icon: SiGooglesheets, color: "text-green-600", url: "https://docs.google.com/spreadsheets", iframe: false },
  { name: "Google Drive", icon: FaGoogleDrive, color: "text-blue-500", url: "https://drive.google.com", iframe: false },
];

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { profile, signOut } = useAuth();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const [employees, setEmployees] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const res = await fetch("/api/employees", { cache: "no-store" });
        const data = await res.json();
        setEmployees(data);
      } catch (e) {
        console.error("Failed to fetch employees", e);
      }
    };
    fetchEmployees();
  }, []);

  const getEmployeeName = (id: string) =>
    employees.find((e) => e.id === id)?.name || "Unknown";

  const [requests, setRequests] = useState<
    {
      createdAt: string | number | Date; leadName: string; assignedTo: string; id: string; status: string
    }[]
  >([]);

  const [showNotificationDropdown, setShowNotificationDropdown] = useState(false);
  const notificationDropdownRef = useRef<HTMLDivElement>(null);
  const [showAppDropdown, setShowAppDropdown] = useState(false);
  const appDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchRequests = async () => {
      try {
        const res = await fetch("/api/requests", { cache: "no-store" });
        const data = await res.json();
        setRequests(data);
      } catch (e) {
        console.error("Failed to fetch requests", e);
      }
    };
    fetchRequests();
    const interval = setInterval(fetchRequests, 10000);
    return () => clearInterval(interval);
  }, []);

  const pendingCount = requests.filter((r) => r.status === "pending").length;

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        notificationDropdownRef.current &&
        !notificationDropdownRef.current.contains(e.target as Node)
      ) {
        setShowNotificationDropdown(false);
      }
      if (
        appDropdownRef.current &&
        !appDropdownRef.current.contains(e.target as Node)
      ) {
        setShowAppDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const NavLinks = () => (
    <>
      {/* Base navigation */}
      {baseNavigation.map((item) => {
        const isActive = pathname === item.href;
        return (
          <Link
            key={item.name}
            href={item.href}
            className={clsx(
              "flex items-center gap-3 rounded-xl px-4 py-2 transition-all duration-200 hover:bg-gradient-to-r hover:from-red-50 hover:to-white",
              isActive
                ? "bg-gradient-to-r from-red-100 to-white text-red-600 shadow-md"
                : "text-slate-700"
            )}
            onClick={() => setMobileMenuOpen(false)}
          >
            <item.icon className="h-5 w-5" />
            <span className="font-semibold">{item.name}</span>
          </Link>
        );
      })}
    </>
  );

  // App Launcher Component
  const AppLauncher = () => (
    <div ref={appDropdownRef} className="relative">
      <button
        onClick={() => setShowAppDropdown((prev) => !prev)}
        className="relative w-10 h-10 rounded-full bg-white shadow-md hover:shadow-lg flex items-center justify-center border border-slate-200 transition-all"
        title="Open Apps"
      >
        {/* ✅ Updated icon to use MdOutlineApps */}
        <LayoutDashboard className="h-6 w-6 text-slate-700" /> 
      </button>

      {/* App Dropdown list */}
      {showAppDropdown && (
        <div className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-xl border border-slate-100 overflow-hidden z-50">
          <div className="px-4 py-3 border-b border-slate-100">
            <span className="font-semibold text-slate-800">
              Integrated Apps
            </span>
          </div>
          <div className="p-2 max-h-60 overflow-y-auto grid grid-cols-1 gap-1">
            {apps.map((app) => {
              const Icon = app.icon;
              return (
                <a
                  key={app.name}
                  href={app.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setShowAppDropdown(false)} // Close dropdown after click
                  className="flex items-center gap-3 rounded-lg px-3 py-2 bg-white hover:bg-red-50 transition-all duration-200 cursor-pointer"
                >
                  <Icon className={`h-5 w-5 ${app.color}`} />
                  <span className="text-sm font-medium text-slate-700">
                    {app.name}
                  </span>
                </a>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );

  // Notification Bell Component
  const NotificationBell = () => (
    <div ref={notificationDropdownRef} className="relative">
      <button
        onClick={() => setShowNotificationDropdown((prev) => !prev)}
        className="relative w-10 h-10 rounded-full bg-white shadow-md hover:shadow-lg flex items-center justify-center border border-slate-200 transition-all"
        title="Notifications"
      >
        <Bell className="h-5 w-5 text-slate-700" />
        {pendingCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center shadow">
            {pendingCount}
          </span>
        )}
      </button>

      {/* Dropdown list */}
      {showNotificationDropdown && (
        <div className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-xl border border-slate-100 overflow-hidden z-50">
          <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
            <span className="font-semibold text-slate-800">
              Pending Requests ({pendingCount})
            </span>
            <button
              onClick={() => (window.location.href = "/dashboard/requests")}
              className="text-xs text-blue-600 hover:underline"
            >
              View All
            </button>
          </div>

          <div className="max-h-60 overflow-y-auto">
            {pendingCount === 0 ? (
              <div className="p-4 text-center text-slate-500 text-sm">
                No pending requests!
              </div>
            ) : (
              [...requests]
                .filter((r) => r.status === "pending")
                .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                .map((r) => (
                  <div
                    key={r.id}
                    className="px-4 py-3 hover:bg-red-50 cursor-pointer border-b border-slate-50 flex justify-between items-center"
                    onClick={() =>
                      (window.location.href = `/dashboard/requests?id=${r.id}`)
                    }
                  >
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-slate-800">
                        {r.leadName || `Request #${r.id}`}
                      </span>
                      <span className="text-xs text-slate-500">
                        Assigned to: {getEmployeeName(r.assignedTo)}
                      </span>
                    </div>
                    <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-medium">
                      Pending
                    </span>
                  </div>
                ))
            )}
          </div>
        </div>
      )}
    </div>
  );


  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <div className="flex h-screen overflow-hidden">
        {/* Sidebar */}
        <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:border-r lg:border-slate-200 lg:bg-white shadow-lg">
          <div className="flex h-16 items-center gap-2 border-b border-slate-200 px-6">
            
            {/* ✅ LOGO IMAGE PLACEMENT (Desktop Sidebar) */}
            <div className="h-28 w-28 flex items-center justify-center">
                <img 
                    src="/logo.jfif" 
                    alt="Granule CRM Logo" 
                    className="h-full w-full object-contain"
                />
            </div>
            
            
            
          </div>
          <nav className="flex-1 space-y-2 px-3 py-4 overflow-y-auto">
            <NavLinks />
          </nav>
          <div className="border-t border-slate-200 p-4 bg-gradient-to-t from-white to-red-50 rounded-t-xl">
            <div className="mb-3">
              <p className="text-sm font-semibold text-slate-900">{profile?.full_name}</p>
              <p className="text-xs text-slate-500">{profile?.email}</p>
              <span className="inline-flex items-center rounded-full bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 mt-1">
                {profile?.role}
              </span>
            </div>
            <Button
              variant="outline"
              className="w-full hover:bg-red-50 hover:text-red-600 transition-all"
              onClick={signOut}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out
            </Button>
          </div>
        </aside>

        {/* Main Content */}
        <div className="flex flex-1 flex-col overflow-hidden relative">
          
          {/* Header */}
          <header className="flex h-16 items-center justify-between border-b border-slate-200 bg-white px-4 lg:px-6 shadow-sm">
            {/* Left side (Menu button for mobile) */}
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild className="lg:hidden">
                <Button variant="ghost" size="icon">
                  <Menu className="h-6 w-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-64 p-0">
                <div className="flex h-16 items-center gap-2 border-b border-slate-200 px-6">
                  
                  {/* ✅ LOGO IMAGE PLACEMENT (Mobile Sidebar) */}
                  <div className="h-10 w-10 flex items-center   justify-center">
                      <img 
                          src="/logo.jfif" // ⬅️ Corrected to use image tag
                          alt="Granule CRM Logo" 
                          className="h-full w-full object-contain"
                      />
                  </div>

                
                </div>
                <nav className="flex-1 space-y-1 px-3 py-4">
                  <NavLinks />
                </nav>
              </SheetContent>
            </Sheet>
            
            {/* Right side (App Launcher and Notification Bell) */}
            <div className="flex items-center ml-auto space-x-4">
              <AppLauncher />
              <NotificationBell />
            </div>
          </header>

          {/* Main */}
          <main className="flex-1 overflow-y-auto p-4 lg:p-6 transition-all duration-300">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}