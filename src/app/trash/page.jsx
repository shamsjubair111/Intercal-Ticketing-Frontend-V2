"use client";

import { useEffect, useState, useContext, Suspense } from "react";
import { getTrashTickets, restoreTicketFromTrash } from "@/api/tickets";
import Pagination from "@/components/shared/Pagination";
import { AlertCircle, Loader2, RotateCcw, XCircle } from "lucide-react";
import { alertContext } from "@/hooks/alertContext";
import DeleteTrashTicketModal from "./DeleteTrashTicketModal";
import ClearTrashModal from "./ClearTrashModal";
import { useRouter, useSearchParams } from "next/navigation";

function TrashPage() {
  const [tickets, setTickets] = useState([]);
  const [totalTickets, setTotalTickets] = useState(0);
  const [loading, setLoading] = useState(false);
  const [deleteData, setDeleteData] = useState(null);
  const [showClearModal, setShowClearModal] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setAlertCtx } = useContext(alertContext);

  const page = parseInt(searchParams.get("page") || "1", 10);
  const setPage = (newPage) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", newPage.toString());
    router.push(`?${params.toString()}`, { scroll: false });
  };

  const fetchTrashTickets = async (pageNo) => {
    try {
      setLoading(true);
      const res = await getTrashTickets(pageNo);
      setTickets(res?.data?.data || []);
      setTotalTickets(res?.data?.total_tickets || 0);
    } catch {
      setAlertCtx({
        title: "Error",
        message: "Failed to load trash tickets!",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrashTickets(page);
  }, [page]);

  const handleRestore = async (ticketId) => {
    try {
      const res = await restoreTicketFromTrash(ticketId);
      setAlertCtx({
        title: "Success",
        message: res?.data?.message || "Ticket restored successfully!",
        type: "success",
      });
      fetchTrashTickets(page);
    } catch (err) {
      setAlertCtx({
        title: "Error",
        message:
          err?.response?.data?.message || "Failed to restore the ticket!",
        type: "error",
      });
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="bg-gray-50 px-6 pt-6 pb-3 flex-shrink-0">
        <div className="border border-gray-200 rounded-sm bg-white flex items-center justify-between h-[52px] px-5 w-full mb-4">
          <h3 className="font-bold text-[18px]">Trash Tickets</h3>
          <button
            onClick={() => setShowClearModal(true)}
            className="bg-red-600 hover:bg-red-700 text-white text-sm px-4 py-2 rounded"
          >
            Clear Trash
          </button>
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
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                  ACTIONS
                </th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan="5" className="py-10 text-center">
                    <Loader2 className="animate-spin w-6 h-6 mx-auto text-gray-500" />
                  </td>
                </tr>
              )}
              {!loading && tickets.length === 0 && (
                <tr>
                  <td colSpan="5" className="py-10 text-center text-gray-600">
                    <AlertCircle className="w-6 h-6 mx-auto mb-2 text-gray-500" />
                    No trash tickets found.
                  </td>
                </tr>
              )}
              {!loading &&
                tickets.map((ticket) => (
                  <tr
                    key={ticket.ticket_id}
                    className="border-b border-gray-200 hover:bg-blue-50 transition cursor-pointer"
                    onClick={() => router.push(`/tickets/${ticket.ticket_id}`)}
                  >
                    <td className="px-4 py-3 text-sm">{ticket.ticket_id}</td>
                    <td className="px-4 py-3 text-sm">{ticket.client_name}</td>
                    <td className="px-4 py-3 text-sm truncate max-w-[200px]">
                      {ticket.title}
                    </td>
                    <td className="px-4 py-3 text-sm capitalize">
                      {ticket.status}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRestore(ticket.ticket_id);
                          }}
                          className="p-2 rounded bg-yellow-100 hover:bg-yellow-200 transition"
                          title="Restore"
                        >
                          <RotateCcw className="w-4 h-4 text-yellow-700" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeleteData(ticket);
                          }}
                          className="p-2 rounded bg-red-100 hover:bg-red-200 transition"
                          title="Delete permanently"
                        >
                          <XCircle className="w-4 h-4 text-red-700" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>

      <DeleteTrashTicketModal
        deleteData={deleteData}
        onClose={() => setDeleteData(null)}
        onSuccess={() => fetchTrashTickets(page)}
      />
      <ClearTrashModal
        open={showClearModal}
        onClose={() => setShowClearModal(false)}
        onSuccess={() => fetchTrashTickets(page)}
      />
    </div>
  );
}

export default function TrashTicketsPage() {
  return (
    <Suspense>
      <TrashPage />
    </Suspense>
  );
}
