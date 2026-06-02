"use client";

import { useEffect, useState, useContext } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getPermanentlyDeletedTickets } from "@/api/tickets";
import Pagination from "@/components/shared/Pagination";
import { AlertCircle, Loader2 } from "lucide-react";
import { alertContext } from "@/hooks/alertContext";
import { Suspense } from "react";

function PermanentlyDeletedPage() {
  const [tickets, setTickets] = useState([]);
  const [totalTickets, setTotalTickets] = useState(0);
  const [loading, setLoading] = useState(false);
  const { setAlertCtx } = useContext(alertContext);
  const router = useRouter();
  const searchParams = useSearchParams();

  const page = parseInt(searchParams.get("page") || "1", 10);
  const setPage = (newPage) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", newPage.toString());
    router.push(`?${params.toString()}`, { scroll: false });
  };

  const fetchDeletedTickets = async (pageNo) => {
    try {
      setLoading(true);
      const res = await getPermanentlyDeletedTickets(pageNo);
      setTickets(res?.data?.data || []);
      setTotalTickets(res?.data?.total_tickets || 0);
    } catch {
      setAlertCtx({
        title: "Error",
        message: "Failed to load permanently deleted tickets!",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDeletedTickets(page);
  }, [page]);

  return (
    <div className="flex flex-col h-full">
      <div className="bg-gray-50 px-6 pt-6 pb-3 flex-shrink-0">
        <div className="border border-gray-200 rounded-sm bg-white flex items-center h-[52px] px-5 w-full mb-4">
          <h3 className="font-bold text-[18px]">Permanently Deleted Tickets</h3>
        </div>
        <Pagination
          totalItems={totalTickets}
          itemsPerPage={10}
          currentPage={page}
          onPageChange={setPage}
          label="tickets"
        />
      </div>

      <div className="flex-1 overflow-y-auto px-6 pb-6">
        <div className="w-full bg-white rounded-sm border border-gray-200">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                  TICKET ID
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                  CLIENT
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                  TITLE
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                  STATUS
                </th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan="4" className="py-10 text-center">
                    <Loader2 className="animate-spin w-6 h-6 mx-auto text-gray-500" />
                  </td>
                </tr>
              )}
              {!loading && tickets.length === 0 && (
                <tr>
                  <td colSpan="4" className="py-10 text-center text-gray-600">
                    <AlertCircle className="w-6 h-6 mx-auto mb-2 text-gray-500" />
                    No permanently deleted tickets found.
                  </td>
                </tr>
              )}
              {!loading &&
                tickets.map((ticket) => (
                  <tr
                    key={ticket.ticket_id}
                    className="border-b border-gray-200 hover:bg-blue-50 transition cursor-pointer"
                    onClick={() =>
                      router.push(`/permanently-deleted/${ticket.ticket_id}`)
                    }
                  >
                    <td className="px-4 py-3 text-sm">{ticket.ticket_id}</td>
                    <td className="px-4 py-3 text-sm">{ticket.client_name}</td>
                    <td className="px-4 py-3 text-sm truncate max-w-[200px]">
                      {ticket.title}
                    </td>
                    <td className="px-4 py-3 text-sm capitalize">
                      {ticket.status}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default function PermanentlyDeletedTicketsPage() {
  return (
    <Suspense>
      <PermanentlyDeletedPage />
    </Suspense>
  );
}
