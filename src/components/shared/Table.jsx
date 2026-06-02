"use client";
import { useState, useEffect, useContext } from "react";
import { ChevronDown, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import MyModal from "@/components/shared/MyModal";
import { alertContext } from "@/hooks/alertContext";
import { moveTicketToTrash, getUserInfo } from "@/api/tickets";

export default function Table({ data = [], loading, columns, reload, page }) {
  const [selectedRows, setSelectedRows] = useState(new Set());
  const [trashTicketId, setTrashTicketId] = useState(null);
  const [trashLoading, setTrashLoading] = useState(false);
  const [userType, setUserType] = useState("");
  const router = useRouter();
  const { setAlertCtx } = useContext(alertContext);

  useEffect(() => {
    getUserInfo()
      .then((r) => setUserType(r.data.data[0]?.user_type || ""))
      .catch(() => {});
  }, []);

  const canSeeActions = userType !== "client";

  const toggleRow = (id) => {
    const n = new Set(selectedRows);
    n.has(id) ? n.delete(id) : n.add(id);
    setSelectedRows(n);
  };
  const toggleAll = () => {
    setSelectedRows(
      selectedRows.size === data.length
        ? new Set()
        : new Set(data.map((r) => r.ticket_id)),
    );
  };

  const handleTrash = async () => {
    if (!trashTicketId) return;
    setTrashLoading(true);
    try {
      const res = await moveTicketToTrash(trashTicketId);
      setAlertCtx({
        title: "Success",
        message: res?.data?.message || "Ticket moved to trash.",
        type: "success",
      });
      setTrashTicketId(null);
      reload?.(page);
    } catch (err) {
      setAlertCtx({
        title: "Error",
        message:
          err?.response?.data?.message || "Failed to move ticket to trash.",
        type: "error",
      });
    } finally {
      setTrashLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="w-full bg-white rounded-sm border border-gray-200 p-10 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <>
      {/* Trash confirmation modal */}
      {trashTicketId && (
        <MyModal
          toggle
          title="Send to Trash"
          body={
            <p className="text-sm text-gray-700 text-center">
              Are you sure you want to move this ticket to trash?
            </p>
          }
          closeMethod={() => setTrashTicketId(null)}
          submitMethod={handleTrash}
          submitLabel={trashLoading ? "Moving..." : "Move to Trash"}
          submitClass="bg-red-600 hover:bg-red-700"
        />
      )}

      <div
        className="w-full bg-white rounded-sm border border-gray-200"
        style={{ overflowX: "scroll" }}
      >
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              <th className="w-12 px-4 py-3">
                <input
                  type="checkbox"
                  checked={data.length > 0 && selectedRows.size === data.length}
                  onChange={toggleAll}
                  className="cursor-pointer"
                />
              </th>
              {columns.map((col) => (
                <th
                  key={col.label}
                  className="px-4 py-3 text-left text-sm font-medium text-gray-600"
                >
                  {col.label}
                  {col.label === "LAST MESSAGE" && (
                    <ChevronDown className="inline w-4 h-4 ml-1" />
                  )}
                </th>
              ))}
              {canSeeActions && (
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">
                  ACTION
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {data.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length + (canSeeActions ? 2 : 1)}
                  className="text-center py-10 text-gray-400 text-sm"
                >
                  No tickets found
                </td>
              </tr>
            ) : (
              data.map((row) => (
                <tr
                  key={row.ticket_id}
                  onClick={() => router.push(`/tickets/${row.ticket_id}`)}
                  className="border-b border-gray-200 cursor-pointer hover:bg-blue-50 transition"
                >
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selectedRows.has(row.ticket_id)}
                      onClick={(e) => e.stopPropagation()}
                      onChange={() => toggleRow(row.ticket_id)}
                      className="cursor-pointer"
                    />
                  </td>
                  {columns.map((col) => (
                    <td key={col.value} className="px-4 py-3">
                      {col.render ? col.render(row) : row[col.value]}
                    </td>
                  ))}
                  {canSeeActions && (
                    <td className="px-4 py-3">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setTrashTicketId(row.ticket_id);
                        }}
                        className="p-1.5 rounded hover:bg-red-100 transition-colors"
                        title="Move to trash"
                      >
                        <Trash2 className="w-4 h-4 text-red-500 hover:text-red-700" />
                      </button>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
