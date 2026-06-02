"use client";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { AlertProvider } from "@/hooks/alertContext";
import Header from "@/components/Header";
import Sidebar from "@/components/shared/Sidebar";
import { TicketProvider } from "@/context/TicketContext";
import { Menu, X } from "lucide-react";

const PUBLIC_PATHS = ["/", "/reset-password"];
const SIDEBAR_PATHS = [
  "/dashboard",
  "/my-tickets",
  "/assigned-tickets",
  "/forwarded-tickets",
  "/tickets",
  "/issue-ticket",
  "/edit-profile",
  "/kpi",
  "/trash",
  "/permanently-deleted",
  "/topics",
];

function SidebarLayout({ children }) {
  const pathname = usePathname();
  const isDetails = /^\/(tickets|trash|permanently-deleted)\/[^/]+$/.test(
    pathname,
  );
  const [open, setOpen] = useState(false);

  return (
    <div className="flex flex-col md:flex-row h-[calc(100vh-4rem)]">
      {!isDetails && (
        <>
          {open && (
            <div
              className="md:hidden fixed inset-0 bg-black/50 z-40"
              onClick={() => setOpen(false)}
            />
          )}
          <aside
            className={`fixed md:static inset-y-0 left-0 z-40 w-80 border-r border-gray-200 bg-white overflow-y-auto transform transition-transform duration-300 ease-in-out md:transform-none ${open ? "translate-x-0" : "-translate-x-full md:translate-x-0"}`}
            style={{ top: "4rem" }}
          >
            <Sidebar onNavigate={() => setOpen(false)} />
          </aside>
          <button
            onClick={() => setOpen(!open)}
            className="md:hidden fixed bottom-4 right-4 z-50 bg-blue-600 text-white p-3 rounded-full shadow-lg hover:bg-blue-700 transition-colors"
            aria-label="Toggle menu"
          >
            {open ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </>
      )}
      <main className="flex-1 bg-gray-50 overflow-y-auto w-full">
        {children}
      </main>
    </div>
  );
}

export default function ClientLayout({ children }) {
  const pathname = usePathname();
  const isPublic = PUBLIC_PATHS.includes(pathname);
  const hasSidebar = SIDEBAR_PATHS.some((p) => pathname.startsWith(p));

  return (
    <AlertProvider>
      {!isPublic && <Header />}
      <div className={`${isPublic ? "" : "pt-16"} min-h-screen bg-gray-50`}>
        {hasSidebar ? (
          <TicketProvider>
            <SidebarLayout>{children}</SidebarLayout>
          </TicketProvider>
        ) : (
          children
        )}
      </div>
    </AlertProvider>
  );
}
