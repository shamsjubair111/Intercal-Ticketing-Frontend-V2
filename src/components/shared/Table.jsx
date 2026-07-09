"use client";
import { useMemo, useState, useEffect, useContext, useRef } from "react";
import {
  ChevronDown,
  Trash2,
  X,
  MoreVertical,
  ExternalLink,
  Check,
} from "lucide-react";
import { useRouter } from "next/navigation";
import MyModal from "@/components/shared/MyModal";
import { alertContext } from "@/hooks/alertContext";
import {
  moveTicketToTrash,
  getUserInfo,
  pickTicket,
  dropTicket,
} from "@/api/tickets";

const PRIORITY_COLUMN_LABELS = new Set(["CLIENT COMPANY", "REQUESTER NAME"]);

export default function Table({
  data = [],
  loading,
  columns,
  reload,
  page,
  visibleColumnLabels,
}) {
  const [selectedRows, setSelectedRows] = useState(new Set());
  const [trashTicketId, setTrashTicketId] = useState(null);
  const [trashLoading, setTrashLoading] = useState(false);
  const [pickRow, setPickRow] = useState(null);
  const [pickLoading, setPickLoading] = useState(false);
  const [dropRow, setDropRow] = useState(null);
  const [dropCause, setDropCause] = useState("");
  const [dropLoading, setDropLoading] = useState(false);
  const [userData, setUserData] = useState(null);
  const [openActionRow, setOpenActionRow] = useState(null);
  const actionMenuRef = useRef(null);
  const router = useRouter();
  const { setAlertCtx } = useContext(alertContext);

  useEffect(() => {
    getUserInfo()
      .then((r) => setUserData(r.data.data[0] || null))
      .catch(() => {});
  }, []);

  useEffect(() => {
    function handleOutsideClick(e) {
      if (actionMenuRef.current && !actionMenuRef.current.contains(e.target)) {
        setOpenActionRow(null);
      }
    }

    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  const userType = userData?.user_type || "";
  const canSeeActions = userType !== "client";

  const visibleColumns = useMemo(() => {
    const selected = new Set(visibleColumnLabels || columns.map((c) => c.label));
    return columns
      .filter((col) => selected.has(col.label))
      .sort((a, b) => {
        const ap = PRIORITY_COLUMN_LABELS.has(a.label) ? 0 : 1;
        const bp = PRIORITY_COLUMN_LABELS.has(b.label) ? 0 : 1;
        return ap - bp;
      });
  }, [columns, visibleColumnLabels]);

  const getColumnClassName = (col) => {
    if (col.label === "CLIENT COMPANY") return "min-w-[220px] w-[240px]";
    if (col.label === "REQUESTER NAME") return "min-w-[190px] w-[210px]";
    return col.className || "min-w-[150px]";
  };

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

  const openTicket = (ticketId) => router.push(`/tickets/${ticketId}`);

  const openTicketInNewTab = (ticketId) => {
    window.open(`/tickets/${ticketId}`, "_blank", "noopener,noreferrer");
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
        message: err?.response?.data?.message,
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
        message: err?.response?.data?.message,
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
        message: err?.response?.data?.message,
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

      {pickRow && (
        <MyModal
          toggle
          title="Pick Ticket"
          body={
            <p className="text-sm text-gray-700">
              Assign ticket <span className="font-semibold">{pickRow.ticket_id}</span> to
              yourself?
            </p>
          }
          closeMethod={() => setPickRow(null)}
          submitMethod={handlePick}
          submitLabel={pickLoading ? "Picking..." : "Yes, Pick"}
        />
      )}

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
              <button onClick={() => { setDropRow(null); setDropCause(""); }}>
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
                onClick={() => { setDropRow(null); setDropCause(""); }}
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

      <div className="w-full bg-white rounded-sm border border-gray-200 overflow-x-auto">
        <table className="w-full min-w-[760px] table-auto">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              <th className="sticky left-0 z-20 w-12 bg-gray-50 px-3 py-3">
                <input
                  type="checkbox"
                  checked={data.length > 0 && selectedRows.size === data.length}
                  onChange={toggleAll}
                  className="cursor-pointer"
                />
              </th>
              {visibleColumns.map((col) => (
                <th
                  key={col.label}
                  className={`px-3 py-3 text-left text-xs font-semibold text-gray-600 whitespace-nowrap ${getColumnClassName(col)}`}
                >
                  {col.label}
                  {col.label === "LAST MESSAGE" && (
                    <ChevronDown className="inline w-4 h-4 ml-1" />
                  )}
                </th>
              ))}
              {canSeeActions && (
                <th className="sticky right-0 z-20 w-16 bg-gray-50 px-3 py-3 text-center text-xs font-semibold text-gray-600 whitespace-nowrap">
                  ACTION
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {data.length === 0 ? (
              <tr>
                <td
                  colSpan={visibleColumns.length + (canSeeActions ? 2 : 1)}
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
                const menuOpen = openActionRow === row.ticket_id;

                return (
                  <tr
                    key={row.ticket_id}
                    onClick={() => openTicket(row.ticket_id)}
                    className="border-b border-gray-200 cursor-pointer hover:bg-blue-50 transition"
                  >
                    <td className="sticky left-0 z-10 bg-white px-3 py-3 align-middle group-hover:bg-blue-50">
                      <input
                        type="checkbox"
                        checked={selectedRows.has(row.ticket_id)}
                        onClick={(e) => e.stopPropagation()}
                        onChange={() => toggleRow(row.ticket_id)}
                        className="cursor-pointer"
                      />
                    </td>
                    {visibleColumns.map((col) => (
                      <td
                        key={col.value || col.label}
                        className={`px-3 py-3 align-middle text-sm text-gray-700 ${getColumnClassName(col)}`}
                      >
                        <div className="line-clamp-2 break-words">
                          {col.render ? col.render(row) : row[col.value]}
                        </div>
                      </td>
                    ))}
                    {canSeeActions && (
                      <td
                        className="sticky right-0 z-10 bg-white px-3 py-3 text-center align-middle"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="relative inline-block text-left" ref={menuOpen ? actionMenuRef : null}>
                          <button
                            onClick={() =>
                              setOpenActionRow(menuOpen ? null : row.ticket_id)
                            }
                            className="rounded-full p-1.5 text-gray-500 hover:bg-gray-100 hover:text-gray-800"
                            title="Actions"
                          >
                            <MoreVertical className="h-5 w-5" />
                          </button>

                          {menuOpen && (
                            <div className="absolute right-0 z-30 mt-2 w-48 rounded-md border border-gray-200 bg-white py-1 shadow-lg">
                              <button
                                onClick={() => openTicketInNewTab(row.ticket_id)}
                                className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
                              >
                                <ExternalLink className="h-4 w-4" /> Open in new tab
                              </button>
                              {canPick && (
                                <button
                                  onClick={() => {
                                    setPickRow(row);
                                    setOpenActionRow(null);
                                  }}
                                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-green-700 hover:bg-green-50"
                                >
                                  <Check className="h-4 w-4" /> Pick
                                </button>
                              )}
                              {canDrop && (
                                <button
                                  onClick={() => {
                                    setDropRow(row);
                                    setDropCause("");
                                    setOpenActionRow(null);
                                  }}
                                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-orange-700 hover:bg-orange-50"
                                >
                                  <X className="h-4 w-4" /> Drop
                                </button>
                              )}
                              <button
                                onClick={() => {
                                  setTrashTicketId(row.ticket_id);
                                  setOpenActionRow(null);
                                }}
                                className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50"
                              >
                                <Trash2 className="h-4 w-4" /> Delete
                              </button>
                            </div>
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
