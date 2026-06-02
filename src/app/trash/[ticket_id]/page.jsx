"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState, useContext } from "react";
import { ChevronLeft, RotateCcw, XCircle } from "lucide-react";
import {
  getTicketById,
  restoreTicketFromTrash,
  deleteTicketPermanently,
} from "@/api/tickets";
import { alertContext } from "@/hooks/alertContext";
import ShowAttachments from "@/components/shared/ShowAttachments";
import * as date from "date-and-time";
import DOMPurify from "dompurify";

const pattern = date.compile("MMM DD YYYY • hh:mm A");
const safe = (html) => ({ __html: DOMPurify.sanitize(html || "") });

export default function TrashTicketDetails() {
  const { ticket_id } = useParams();
  const router = useRouter();
  const { setAlertCtx } = useContext(alertContext);
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [previewImage, setPreviewImage] = useState(null);

  useEffect(() => {
    getTicketById(ticket_id)
      .then((res) => setTicket(res?.data?.data?.[0] || null))
      .catch(() =>
        setAlertCtx({
          title: "Error",
          message: "Failed to load ticket",
          type: "error",
        }),
      )
      .finally(() => setLoading(false));
  }, [ticket_id]);

  const handleRestore = async () => {
    try {
      await restoreTicketFromTrash({ ticket_id });
      setAlertCtx({
        title: "Success",
        message: "Ticket restored from trash!",
        type: "success",
      });
      router.push("/trash");
    } catch (err) {
      setAlertCtx({
        title: "Error",
        message: err?.response?.data?.message || "Restore failed",
        type: "error",
      });
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to permanently delete this ticket?"))
      return;
    try {
      await deleteTicketPermanently(ticket_id);
      setAlertCtx({
        title: "Success",
        message: "Ticket permanently deleted!",
        type: "success",
      });
      router.push("/trash");
    } catch (err) {
      setAlertCtx({
        title: "Error",
        message: err?.response?.data?.message || "Delete failed",
        type: "error",
      });
    }
  };

  if (loading)
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  if (!ticket)
    return (
      <div className="p-10 text-center text-gray-600">Ticket not found.</div>
    );

  return (
    <div className="max-w-4xl mx-auto px-4 md:px-6 py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => router.back()}
            className="text-gray-500 hover:text-gray-800"
          >
            <ChevronLeft size={20} />
          </button>
          <h1 className="text-base md:text-lg font-bold text-gray-800">
            Trash — Ticket Details
          </h1>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleRestore}
            className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium bg-yellow-100 text-yellow-700 rounded hover:bg-yellow-200"
          >
            <RotateCcw size={14} /> Restore
          </button>
          <button
            onClick={handleDelete}
            className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium bg-red-100 text-red-700 rounded hover:bg-red-200"
          >
            <XCircle size={14} /> Delete Permanently
          </button>
        </div>
      </div>

      {/* Ticket info */}
      <div className="bg-white rounded-sm border border-gray-200 p-5 mb-4">
        <div className="flex items-start justify-between gap-3 flex-wrap mb-3">
          <h2 className="text-xl font-bold text-gray-800">{ticket.title}</h2>
          <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs rounded font-medium">
            In Trash
          </span>
        </div>
        <hr className="mb-3" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-4 text-sm">
          <div>
            <span className="font-semibold text-gray-700">Ticket ID: </span>
            <span className="font-light text-gray-600">{ticket.ticket_id}</span>
          </div>
          <div>
            <span className="font-semibold text-gray-700">Client: </span>
            <span className="font-light text-gray-600">
              {ticket.client_name}
            </span>
          </div>
          <div>
            <span className="font-semibold text-gray-700">Email: </span>
            <span className="font-light text-gray-600">
              {ticket.client_email}
            </span>
          </div>
          <div>
            <span className="font-semibold text-gray-700">Mobile: </span>
            <span className="font-light text-gray-600">
              {ticket.client_mobile}
            </span>
          </div>
          <div>
            <span className="font-semibold text-gray-700">Service: </span>
            <span className="font-light text-gray-600">
              {ticket.service_type?.toUpperCase()}
            </span>
          </div>
          <div>
            <span className="font-semibold text-gray-700">Status: </span>
            <span className="font-light text-gray-600 capitalize">
              {ticket.status}
            </span>
          </div>
          <div>
            <span className="font-semibold text-gray-700">Priority: </span>
            <span className="font-light text-gray-600 capitalize">
              {ticket.priority}
            </span>
          </div>
          <div>
            <span className="font-semibold text-gray-700">Created: </span>
            <span className="font-light text-gray-600">
              {ticket.created_at
                ? date.format(new Date(ticket.created_at), pattern)
                : "—"}
            </span>
          </div>
        </div>
        <hr className="mb-3" />
        {ticket.attachments?.length > 0 && (
          <ShowAttachments attachments={ticket.attachments} />
        )}
        <div
          className="prose prose-sm max-w-none text-sm"
          dangerouslySetInnerHTML={safe(ticket.description)}
        />
      </div>

      {/* Threads / Comments */}
      {ticket.threads?.map((t, i) => (
        <div
          key={i}
          className="bg-white rounded-sm border border-gray-200 p-4 mb-3"
        >
          <div className="flex items-center gap-2 mb-1">
            <span className="font-semibold text-sm text-gray-800">
              {t.commenter_name}
            </span>
          </div>
          <p className="text-xs text-gray-400 mb-2">
            {date.format(new Date(t.created_at), pattern)}
          </p>
          <hr className="mb-2" />
          {t.attachments?.length > 0 && (
            <ShowAttachments attachments={t.attachments} />
          )}
          <div
            className="prose prose-sm max-w-none text-sm"
            dangerouslySetInnerHTML={safe(t.contents)}
          />
        </div>
      ))}

      {previewImage && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          onClick={() => setPreviewImage(null)}
        >
          <img
            src={previewImage}
            alt="preview"
            className="max-h-full max-w-full rounded"
          />
        </div>
      )}
    </div>
  );
}
