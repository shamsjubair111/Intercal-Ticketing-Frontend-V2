"use client";

import { useContext } from "react";
import { X } from "lucide-react";
import { deleteTicketPermanently } from "@/api/tickets";
import { alertContext } from "@/hooks/alertContext";

export default function DeleteTrashTicketModal({
  deleteData,
  onClose,
  onSuccess,
}) {
  const { setAlertCtx } = useContext(alertContext);

  if (!deleteData) return null;

  const handleDelete = async () => {
    try {
      await deleteTicketPermanently(deleteData.ticket_id);
      setAlertCtx({
        title: "Deleted",
        message: `Ticket ${deleteData.ticket_id} permanently deleted.`,
        type: "success",
      });
      onSuccess();
      onClose();
    } catch (err) {
      setAlertCtx({
        title: "Error",
        message:
          err?.response?.data?.message ||
          "Failed to delete ticket permanently.",
        type: "error",
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-md mx-4">
        <div className="flex items-center justify-between border-b px-5 py-3">
          <h2 className="text-lg font-semibold">Delete Ticket</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X size={20} />
          </button>
        </div>
        <div className="px-5 py-4 text-gray-700 text-sm">
          Are you sure you want to permanently delete{" "}
          <span className="font-semibold">{deleteData.ticket_id}</span>?<br />
          <span className="text-red-600 font-medium">
            This action cannot be undone.
          </span>
        </div>
        <div className="flex justify-end gap-3 border-t px-5 py-3">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 text-sm"
          >
            Cancel
          </button>
          <button
            onClick={handleDelete}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 text-sm"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}
