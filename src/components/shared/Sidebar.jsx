"use client";
import { Plus, Info } from "lucide-react";
import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { getUserInfo } from "@/api/tickets";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { useTicketContext } from "@/context/TicketContext";

export default function Sidebar({ onNavigate }) {
  const { selectedStatus, setSelectedStatus } = useTicketContext();
  const router = useRouter();
  const pathname = usePathname();
  const [userType, setUserType] = useState("");
  const [isKpiUser, setIsKpiUser] = useState(false);

  useEffect(() => {
    getUserInfo()
      .then((r) => {
        const u = r.data.data[0];
        setUserType(u.user_type || "");
        setIsKpiUser(["hod", "sales"].includes(u.user_type));
      })
      .catch(() => {});
  }, []);

  const active = (key) => {
    if (key === "dashboard") return pathname === "/dashboard";
    if (key === "my")
      return pathname === "/my-tickets" || pathname.startsWith("/tickets/");
    if (key === "assigned") return pathname === "/assigned-tickets";
    if (key === "forwarded") return pathname === "/forwarded-tickets";
    if (key === "kpiDept") return pathname === "/kpi/department";
    if (key === "kpiUser") return pathname === "/kpi/user";
    if (key === "issue") return pathname === "/issue-ticket";
    if (key === "profile") return pathname === "/edit-profile";
    if (key === "trash")
      return pathname === "/trash" || pathname.startsWith("/trash/");
    if (key === "permaTrash")
      return (
        pathname === "/permanently-deleted" ||
        pathname.startsWith("/permanently-deleted/")
      );
    if (key === "topics") return pathname === "/topics";
    return false;
  };

  const go = (path) => {
    router.push(path);
    onNavigate?.();
  };

  const clearFilterStatus = () => {
    try {
      const saved = localStorage.getItem("ticket_filters");
      if (saved)
        localStorage.setItem(
          "ticket_filters",
          JSON.stringify(JSON.parse(saved).filter((f) => f.label !== "Status")),
        );
      window.dispatchEvent(new Event("storage"));
    } catch {}
  };

  const isAdmin = userType === "admin";
  const canSeePermaDeleted = userType === "admin" || userType === "hod";

  return (
    <div className="w-full bg-background border-r border-border flex flex-col min-h-full relative">
      {/* Top */}
      <div className="sticky top-0 z-20 bg-white border-b border-border p-3 md:p-4">
        <div className="flex items-center justify-between mb-3 md:mb-4">
          <h1 className="text-lg md:text-xl font-bold text-foreground">
            Tickets
          </h1>
          <Button
            size="sm"
            onClick={() => {
              router.push("/issue-ticket");
              onNavigate?.();
            }}
            className="bg-blue-600 hover:bg-blue-700 text-white gap-1 cursor-pointer text-xs md:text-sm px-2 md:px-3"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">New ticket</span>
            <span className="sm:hidden">New</span>
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Main nav */}
        <div className="p-3 md:p-4 border-b border-border">
          <Item
            label="Dashboard"
            active={active("dashboard")}
            onClick={() => go("/dashboard")}
          />
          <Item
            label="My Tickets"
            active={active("my")}
            onClick={() => go("/my-tickets")}
          />
          {userType !== "client" && (
            <Item
              label="Assigned Tickets"
              active={active("assigned")}
              onClick={() => go("/assigned-tickets")}
            />
          )}
          {userType !== "client" && (
            <Item
              label="Forwarded Tickets"
              active={active("forwarded")}
              onClick={() => go("/forwarded-tickets")}
            />
          )}
          {isKpiUser && (
            <>
              <Item
                label="Report by Department"
                active={active("kpiDept")}
                onClick={() => go("/kpi/department")}
              />
              <Item
                label="Report by User"
                active={active("kpiUser")}
                onClick={() => go("/kpi/user")}
              />
            </>
          )}
        </div>

        {/* Statuses */}
        <div className="p-3 md:p-4 border-b border-border">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-muted-foreground font-semibold text-xs uppercase tracking-wide">
              Statuses
            </h3>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="w-4 h-4 text-muted-foreground cursor-pointer" />
                </TooltipTrigger>
                <TooltipContent
                  side="top"
                  className="bg-slate-800 text-white text-xs rounded px-2 py-1 shadow-md"
                >
                  <p>Filter tickets by status.</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <div className="space-y-2">
            {[
              { label: "All", value: "" },
              { label: "Open", value: "open" },
              { label: "In Progress", value: "in progress" },
              { label: "On Hold", value: "on hold" },
              { label: "Closed", value: "closed" },
            ].map(({ label, value }) => (
              <Item
                key={label}
                label={label}
                active={selectedStatus === value}
                onClick={() => {
                  clearFilterStatus();
                  setSelectedStatus(value);
                  if (pathname !== "/my-tickets") router.push("/my-tickets");
                  onNavigate?.();
                }}
              />
            ))}
          </div>
        </div>

        {/* Folders — all users see Trash, only admin/hod see Permanently Deleted */}
        <div className="p-3 md:p-4 border-b border-border">
          <h3 className="text-muted-foreground font-semibold text-xs uppercase tracking-wide mb-3">
            Folders
          </h3>
          <div className="space-y-2">
            <Item
              label="Trash"
              active={active("trash")}
              onClick={() => go("/trash")}
            />
            {canSeePermaDeleted && (
              <Item
                label="Permanently Deleted"
                active={active("permaTrash")}
                onClick={() => go("/permanently-deleted")}
              />
            )}
          </div>
        </div>

        {/* Admin only */}
        {isAdmin && (
          <div className="p-3 md:p-4 border-b border-border">
            <h3 className="text-muted-foreground font-semibold text-xs uppercase tracking-wide mb-3">
              Admin
            </h3>
            <div className="space-y-2">
              <Item
                label="Topic Management"
                active={active("topics")}
                onClick={() => go("/topics")}
              />
            </div>
          </div>
        )}

        {/* Account */}
        <div className="p-3 md:p-4">
          <h3 className="text-muted-foreground font-semibold text-xs uppercase tracking-wide mb-3">
            Account
          </h3>
          <Item
            label="Edit Profile"
            active={active("profile")}
            onClick={() => go("/edit-profile")}
          />
        </div>
      </div>

      {/* Footer */}
      <div className="hidden md:block sticky bottom-0 z-20 bg-white border-t border-border p-4">
        <Button
          variant="outline"
          className="w-full text-foreground border-border hover:bg-muted bg-transparent text-sm"
        >
          Internal Ticketing
        </Button>
      </div>
    </div>
  );
}

function Item({ label, active, onClick }) {
  return (
    <div
      onClick={onClick}
      className={`flex items-center justify-between py-2 px-2 rounded cursor-pointer transition-all duration-150 ${
        active
          ? "bg-blue-100 text-blue-700 font-semibold"
          : "hover:bg-muted text-foreground"
      }`}
    >
      <span className="text-sm">{label}</span>
    </div>
  );
}
