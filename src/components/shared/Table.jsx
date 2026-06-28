"use client";
import { useState, useEffect, useContext } from "react";
import { ChevronDown, Trash2, X } from "lucide-react";
import { useRouter } from "next/navigation";
import MyModal from "@/components/shared/MyModal";
import { alertContext } from "@/hooks/alertContext";
import {
  moveTicketToTrash,
  getUserInfo,
  pickTicket,
  dropTicket,
} from "@/api/tickets";

export default function Table({ data = [], loading, columns, reload, page }) {
  const [selectedRows, setSelectedRows] = useState(new Set());
  const [trashTicketId, setTrashTicketId] = useState(null);
  const [trashLoading, setTrashLoading] = useState(false);
  const [pickRow, setPickRow] = useState(null);
  const [pickLoading, setPickLoading] = useState(false);
  const [dropRow, setDropRow] = useState(null);
  const [dropCause, setDropCause] = useState("");
  const [dropLoading, setDropLoading] = useState(false);
  const [userData, setUserData] = useState(null);
  const router = useRouter();
  const { setAlertCtx } = useContext(alertContext);

  useEffect(() => {
    getUserInfo()
      .then((r) => setUserData(r.data.data[0] || null))
      .catch(() => {});
  }, []);

  const userType = userData?.user_type || "";
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

  const handlePick = async () => {
    if (!pickRow || !userData) return;
    setPickLoading(true);
    try {
      await pickTicket(
        pickRow.ticket_id,
        userData.user_type,
        userData.customer_id,
        userData.username,
        userData.name,
        userData.email,
        userData.mobile,
        pickRow.service_type || "",
        pickRow.department_email || "",
        pickRow.secondary_emails || "",
        pickRow.client_email || "",
      );
      setAlertCtx({
        title: "Success!",
        message: "Ticket assigned to you.",
        type: "success",
      });
      setPickRow(null);
      reload?.(page);
    } catch (err) {
      setAlertCtx({
        title: "Error",
        message: err?.response?.data?.message || "Failed to pick ticket.",
        type: "error",
      });
    } finally {
      setPickLoading(false);
    }
  };

  const handleDrop = async () => {
    if (!dropRow || !userData || !dropCause.trim()) return;
    setDropLoading(true);
    try {
      await dropTicket(
        dropRow.ticket_id,
        dropCause.trim(),
        userData.user_type,
        userData.customer_id,
        userData.username,
        userData.name,
        userData.email,
        userData.mobile,
        dropRow.secondary_emails || "",
        dropRow.service_type || "",
        dropRow.department_email || "",
        dropRow.client_email || "",
      );
      setAlertCtx({
        title: "Success",
        message: "Ticket dropped.",
        type: "success",
      });
      setDropRow(null);
      setDropCause("");
      reload?.(page);
    } catch (err) {
      setAlertCtx({
        title: "Error",
        message: err?.response?.data?.message || "Failed to drop ticket.",
        type: "error",
      });
    } finally {
      setDropLoading(false);
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

      {/* Pick confirmation modal */}
      {pickRow && (
        <MyModal
          toggle
          title="Pick Ticket"
          body={
            <p className="text-sm text-gray-700">
              Assign ticket{" "}
              <span className="font-semibold">{pickRow.ticket_id}</span> to
              yourself?
            </p>
          }
          closeMethod={() => setPickRow(null)}
          submitMethod={handlePick}
          submitLabel={pickLoading ? "Picking..." : "Yes, Pick"}
        />
      )}

      {/* Drop modal (with cause textarea) */}
      {dropRow && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-md mx-4">
            <div className="flex items-center justify-between border-b px-5 py-3">
              <h2 className="text-lg font-semibold text-gray-800">
                Drop Ticket{" "}
                <span className="text-sm font-normal text-gray-500">
                  ({dropRow.ticket_id})
                </span>
              </h2>
              <button
                onClick={() => {
                  setDropRow(null);
                  setDropCause("");
                }}
              >
                <X size={20} className="text-gray-500" />
              </button>
            </div>
            <div className="px-5 py-4">
              <textarea
                value={dropCause}
                onChange={(e) => setDropCause(e.target.value.trimStart())}
                placeholder="Enter drop cause..."
                rows={4}
                autoFocus
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
              />
            </div>
            <div className="flex justify-end gap-3 border-t px-5 py-3">
              <button
                onClick={() => {
                  setDropRow(null);
                  setDropCause("");
                }}
                className="px-4 py-2 text-sm text-gray-600 bg-gray-100 rounded hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={handleDrop}
                disabled={!dropCause.trim() || dropLoading}
                className="px-4 py-2 text-sm font-semibold text-white bg-red-600 rounded hover:bg-red-700 disabled:opacity-50"
              >
                {dropLoading ? "Dropping..." : "Drop"}
              </button>
            </div>
          </div>
        </div>
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
              data.map((row) => {
                const status = row?.status;
                const canPick = status === "open" || status === "on hold";
                const canDrop = status === "in progress";
                return (
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
                        <div className="flex items-center gap-2">
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
                          {canPick && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setPickRow(row);
                              }}
                              className="px-3 py-1 text-xs font-semibold text-white bg-green-600 rounded hover:bg-green-700 transition-colors"
                            >
                              Pick
                            </button>
                          )}
                          {canDrop && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setDropRow(row);
                                setDropCause("");
                              }}
                              className="px-3 py-1 text-xs font-semibold text-white bg-orange-600 rounded hover:bg-orange-700 transition-colors"
                            >
                              Drop
                            </button>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
