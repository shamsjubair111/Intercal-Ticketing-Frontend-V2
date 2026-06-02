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
import { Plus } from "lucide-react";

function TicketListView({ title, fetchFn }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setAlertCtx } = useContext(alertContext);
  const { selectedStatus } = useTicketContext();

  const [tickets, setTickets] = useState([]);
  const [totalTickets, setTotalTickets] = useState(0);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState([]);
  const [userType, setUserType] = useState("");
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
    } catch {
      setAlertCtx({
        title: "Error",
        message: "Failed to load tickets.",
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
        <div className="border border-gray-200 rounded-sm bg-white flex items-center justify-between min-h-[52px] px-3 md:px-5 w-full mb-4">
          <h3 className="font-bold text-base md:text-[18px] py-2">{title}</h3>
          <button
            onClick={() => router.push("/issue-ticket")}
            className="md:hidden bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded text-sm font-medium flex items-center gap-1"
          >
            <Plus className="w-4 h-4" /> New Ticket
          </button>
        </div>

        <Filter onFilterChange={setFilters} userType={userType} />

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
          reload={(p) => runFetch(p, filters, selectedStatus)}
          page={page}
        />
      </div>
    </div>
  );
}

export default function TicketListPage({ title, fetchFn }) {
  return (
    <Suspense>
      <TicketListView title={title} fetchFn={fetchFn} />
    </Suspense>
  );
}
