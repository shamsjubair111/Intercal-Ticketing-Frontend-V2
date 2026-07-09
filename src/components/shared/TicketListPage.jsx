"use client";
import { useContext, useEffect, useState, Suspense, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { alertContext } from "@/hooks/alertContext";
import { useTicketContext } from "@/context/TicketContext";
import { getUserInfo } from "@/api/tickets";
import Filter from "@/components/shared/Filter";
import Pagination from "@/components/shared/Pagination";
import Table from "@/components/shared/Table";
import { ticketColumns } from "@/utils/tableColumns";
import { Plus, SlidersHorizontal } from "lucide-react";

const TABLE_COLUMN_STORAGE_KEY = "ticket_table_visible_columns";
const PRIORITY_COLUMN_LABELS = new Set(["CLIENT COMPANY", "REQUESTER NAME"]);

function ColumnSelector({ columns, visibleColumnLabels, setVisibleColumnLabels }) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    function handleOutsideClick(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  const toggleColumn = (label) => {
    const isSelected = visibleColumnLabels.includes(label);
    if (isSelected && visibleColumnLabels.length === 1) return;

    setVisibleColumnLabels((prev) =>
      isSelected ? prev.filter((item) => item !== label) : [...prev, label],
    );
  };

  const resetColumns = () => setVisibleColumnLabels(columns.map((c) => c.label));

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setOpen((p) => !p)}
        className="inline-flex items-center gap-2 rounded border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
      >
        <SlidersHorizontal className="h-4 w-4" /> Columns
      </button>
      {open && (
        <div className="absolute right-auto lg:right-0 z-30 mt-2 w-64 rounded-md border border-gray-200 bg-white p-3 shadow-lg">
          <div className="mb-2 flex items-center justify-between border-b border-gray-100 pb-2">
            <p className="text-sm font-semibold text-gray-700">Visible columns</p>
            <button
              onClick={resetColumns}
              className="text-xs font-medium text-blue-600 hover:underline"
            >
              Reset
            </button>
          </div>
          <div className="max-h-72 space-y-2 overflow-y-auto pr-1">
            {columns.map((col) => {
              const checked = visibleColumnLabels.includes(col.label);
              const disabled = checked && visibleColumnLabels.length === 1;
              return (
                <label
                  key={col.label}
                  className={`flex items-center gap-2 rounded px-2 py-1 text-sm ${disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer hover:bg-gray-50"}`}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    disabled={disabled}
                    onChange={() => toggleColumn(col.label)}
                    className="accent-blue-600"
                  />
                  <span className="flex-1 text-gray-700">{col.label}</span>
                  {PRIORITY_COLUMN_LABELS.has(col.label) && (
                    <span className="rounded bg-blue-50 px-1.5 py-0.5 text-[10px] font-semibold text-blue-700">
                      Priority
                    </span>
                  )}
                </label>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function TicketListView({ title, fetchFn, hideTitleBar = false }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setAlertCtx } = useContext(alertContext);
  const { selectedStatus } = useTicketContext();

  const [tickets, setTickets] = useState([]);
  const [totalTickets, setTotalTickets] = useState(0);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState([]);
  const [userType, setUserType] = useState("");
  const [visibleColumnLabels, setVisibleColumnLabels] = useState(() =>
    ticketColumns.map((c) => c.label),
  );
  const timerRef = useRef(null);

  const page = parseInt(searchParams.get("page") || "1", 10);
  const setPage = (p) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", p.toString());
    router.push(`?${params.toString()}`, { scroll: false });
  };

  useEffect(() => {
    getUserInfo()
      .then((r) => setUserType(r.data.data[0]?.user_type || ""))
      .catch(() => {});
  }, []);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(TABLE_COLUMN_STORAGE_KEY);
      if (!saved) return;
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) {
        const valid = parsed
          .map((label) => (label === "REQUESTER" ? "REQUESTER NAME" : label))
          .filter((label) => ticketColumns.some((col) => col.label === label));
        if (valid.length) setVisibleColumnLabels([...new Set(valid)]);
      }
    } catch {
      localStorage.removeItem(TABLE_COLUMN_STORAGE_KEY);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(
      TABLE_COLUMN_STORAGE_KEY,
      JSON.stringify(visibleColumnLabels),
    );
  }, [visibleColumnLabels]);

  const buildParams = (currentFilters, currentStatus) => {
    const p = {};
    currentFilters.forEach((f) => {
      if (!f.value?.trim()) return;
      if (f.label === "Status") p.status = f.value;
      else if (f.label === "Priority") p.priority = f.value;
      else if (f.label === "Service Type") p.service_type = f.value;
      else if (f.label === "Start Date") p.start_date = f.value;
      else if (f.label === "End Date") p.end_date = f.value;
      else if (f.label === "Ticket ID") p.ticket_id = f.value.trim();
      else if (f.label === "Company Name") p.client_companies = f.value.trim();
    });
    if (!p.status && currentStatus) p.status = currentStatus;
    return p;
  };

  const runFetch = async (pageNo, currentFilters, currentStatus) => {
    setLoading(true);
    setTickets([]);
    try {
      const params = buildParams(currentFilters, currentStatus);
      const res = await fetchFn(pageNo, params);
      setTickets(res.data.data || []);
      setTotalTickets(res.data.total_data || res.data.total_tickets || 0);
    } catch (err) {
      setAlertCtx({
        title: "Error",
        message: err?.response?.data?.message,
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Debounce text inputs (Ticket ID, Company Name), instant for others
    const hasTextInput = filters.some(
      (f) => f.type === "text" && f.value?.trim(),
    );
    const delay = hasTextInput ? 700 : 0;

    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      runFetch(page, filters, selectedStatus);
    }, delay);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [page, filters, selectedStatus]);

  return (
    <div className="flex flex-col h-full">
      <div className="bg-gray-50 px-6 pt-6 pb-3 flex-shrink-0">
        {!hideTitleBar && (
          <div className="border border-gray-200 rounded-sm bg-white flex items-center justify-between min-h-[52px] px-3 md:px-5 w-full mb-4">
            <h3 className="font-bold text-base md:text-[18px] py-2">{title}</h3>
            <button
              onClick={() => router.push("/issue-ticket")}
              className="md:hidden bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded text-sm font-medium flex items-center gap-1"
            >
              <Plus className="w-4 h-4" /> New Ticket
            </button>
          </div>
        )}

        <Filter
          onFilterChange={setFilters}
          userType={userType}
          rightAction={
            <ColumnSelector
              columns={ticketColumns}
              visibleColumnLabels={visibleColumnLabels}
              setVisibleColumnLabels={setVisibleColumnLabels}
            />
          }
        />

        <Pagination
          totalItems={totalTickets}
          itemsPerPage={10}
          currentPage={page}
          onPageChange={setPage}
          label="tickets"
        />
      </div>

      <div className="flex-1 overflow-y-auto px-6 pb-6">
        <Table
          data={tickets}
          loading={loading}
          columns={ticketColumns}
          visibleColumnLabels={visibleColumnLabels}
          reload={(p) => runFetch(p, filters, selectedStatus)}
          page={page}
        />
      </div>
    </div>
  );
}

export default function TicketListPage({ title, fetchFn, hideTitleBar = false }) {
  return (
    <Suspense>
      <TicketListView title={title} fetchFn={fetchFn} hideTitleBar={hideTitleBar} />
    </Suspense>
  );
}
