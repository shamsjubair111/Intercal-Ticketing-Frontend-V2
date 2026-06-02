"use client";
import { useContext, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import "react-quill-new/dist/quill.snow.css";
import * as date from "date-and-time";
import DOMPurify from "dompurify";
import { alertContext } from "@/hooks/alertContext";
import {
  ticketDetails,
  getUserInfo,
  addComment,
  changeStatus,
  resolveTicket,
  pickTicket,
  dropTicket,
  forwardTicket,
  addRootCause,
  updateTicket,
  getPresignedPost,
  postAttachmentToS3,
  emailList,
} from "@/api/tickets";
import ShowAttachments from "@/components/shared/ShowAttachments";
import MyModal from "@/components/shared/MyModal";
import { ChevronLeft, X, Paperclip } from "lucide-react";

const ReactQuill = dynamic(() => import("react-quill-new"), { ssr: false });

const pattern = date.compile("MMM DD YYYY • hh:mm:ss A");
const safe = (html) => ({ __html: DOMPurify.sanitize(html || "") });

const SERVICES = [
  { label: "Internet / Data", value: "Internet" },
  { label: "Cloud", value: "Cloud" },
  { label: "IP Telephony", value: "IpTelephony" },
  { label: "SMS", value: "SMS" },
];
const TEAMS = [
  { label: "Support", value: "support" },
  { label: "Revenue", value: "revenue" },
  { label: "Sales", value: "sales" },
  { label: "Corporate Support", value: "corporatesupport" },
  { label: "Core Network", value: "core" },
  { label: "NPI", value: "npi" },
];

const STATUS_COLORS = {
  open: "text-blue-700",
  "in progress": "text-green-700",
  "on hold": "text-orange-600",
  closed: "text-red-600",
};

const PRIORITY_COLORS = {
  low: "text-green-600",
  medium: "text-orange-500",
  high: "text-red-600",
};

function InfoRow({ label, value }) {
  return (
    <div className="text-sm">
      <span className="font-semibold text-gray-700">{label}: </span>
      <span className="font-light text-gray-600">{value || "—"}</span>
    </div>
  );
}

function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-md mx-4">
        <div className="flex items-center justify-between border-b px-5 py-3">
          <h2 className="text-lg font-semibold text-gray-800">{title}</h2>
          <button onClick={onClose}>
            <X size={20} className="text-gray-500" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export default function TicketDetailsPage() {
  const { id } = useParams();
  const router = useRouter();
  const { setAlertCtx } = useContext(alertContext);

  const [ticket, setTicket] = useState(null);
  const [userData, setUserData] = useState(null);
  const [userType, setUserType] = useState("");
  const [threads, setThreads] = useState([]);
  const [loading, setLoading] = useState(true);

  const [message, setMessage] = useState("");
  const [isPrivate, setIsPrivate] = useState(true);
  const [files, setFiles] = useState([]);
  const [fileKey, setFileKey] = useState(Date.now());
  const [commentLoading, setCommentLoading] = useState(false);

  const [modal, setModal] = useState(null);
  const [dropCause, setDropCause] = useState("");
  const [fwdService, setFwdService] = useState("");
  const [fwdTeam, setFwdTeam] = useState("");
  const [fwdCause, setFwdCause] = useState("");
  const [keepTrack, setKeepTrack] = useState(true);
  const [rootCauseText, setRootCauseText] = useState("");
  const [updateTitle, setUpdateTitle] = useState("");
  const [updatePriority, setUpdatePriority] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  const fetchData = () => {
    Promise.all([ticketDetails(id), getUserInfo()])
      .then(([t, u]) => {
        const td = t.data.data[0];
        const ud = u.data.data[0];
        setTicket(td);
        setThreads(td.threads || []);
        setUserData(ud);
        setUserType(ud.user_type);
      })
      .catch(() =>
        setAlertCtx({
          title: "Error",
          message: "Failed to load ticket.",
          type: "error",
        }),
      )
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  const handleReply = async () => {
    const stripped = message.replace(/<[^>]+>/g, "").trim();
    if (!stripped) return;
    setCommentLoading(true);
    let attachments = [];
    try {
      for (const f of files) {
        const gpp = await getPresignedPost(f.name);
        attachments.push(gpp.data.public_url);
        const fd = new FormData();
        const { AWSAccessKeyId, key, policy, signature } = gpp.data.data.fields;
        fd.append("Content-Type", gpp.data.data.fields["Content-Type"]);
        fd.append("key", key);
        fd.append("AWSAccessKeyId", AWSAccessKeyId);
        fd.append("policy", policy);
        fd.append("signature", signature);
        fd.append("file", f);
        await postAttachmentToS3(gpp.data.data.url, fd);
      }
    } catch {}
    addComment({
      ticket_id: id,
      contents: message,
      commenter_user_type: userData.user_type,
      commenter_id: userData.customer_id,
      commenter_name: userData.name,
      commenter_username: userData.username,
      commenter_email: userData.email,
      commenter_department: userData.department,
      commenter_team: userData.team,
      service_type: ticket.service_type,
      department: ticket.department_email,
      client_email: ticket.client_email,
      secondary_emails: ticket.secondary_emails,
      attachments,
      is_internal: userType === "client" ? false : isPrivate,
    })
      .then(() => {
        setMessage("");
        setFiles([]);
        setFileKey(Date.now());
        fetchData();
        if (ticket.status === "closed") {
          changeStatus(id, "in progress").then(() => {
            setAlertCtx({
              title: "Status changed",
              message: "Ticket reopened (In Progress).",
              type: "success",
            });
            fetchData();
          });
        } else {
          setAlertCtx({
            title: "Success",
            message: "Comment added.",
            type: "success",
          });
        }
      })
      .catch(() =>
        setAlertCtx({
          title: "Error",
          message: "Failed to add comment.",
          type: "error",
        }),
      )
      .finally(() => setCommentLoading(false));
  };

  const handlePick = () => {
    setActionLoading(true);
    pickTicket(
      ticket.ticket_id,
      userData.user_type,
      userData.customer_id,
      userData.username,
      userData.name,
      userData.email,
      userData.mobile,
      ticket.service_type,
      ticket.department_email,
      ticket.secondary_emails,
      ticket.client_email,
    )
      .then(() => {
        setAlertCtx({
          title: "Success!",
          message: "Ticket assigned to you.",
          type: "success",
        });
        setModal(null);
        fetchData();
      })
      .catch(() => {
        setAlertCtx({
          title: "Error",
          message: "Failed to pick ticket.",
          type: "error",
        });
        setModal(null);
      })
      .finally(() => setActionLoading(false));
  };

  const handleDrop = () => {
    if (!dropCause.trim()) return;
    setActionLoading(true);
    dropTicket(
      ticket.ticket_id,
      dropCause,
      userData.user_type,
      userData.customer_id,
      userData.username,
      userData.name,
      userData.email,
      userData.mobile,
      ticket.secondary_emails,
      ticket.service_type,
      ticket.department_email,
      ticket.client_email,
    )
      .then(() => {
        setAlertCtx({
          title: "Success",
          message: "Ticket dropped.",
          type: "success",
        });
        setModal(null);
        setDropCause("");
        fetchData();
      })
      .catch(() => {
        setAlertCtx({
          title: "Error",
          message: "Failed to drop ticket.",
          type: "error",
        });
        setModal(null);
      })
      .finally(() => setActionLoading(false));
  };

  const handleForward = () => {
    if (!fwdService || !fwdTeam || !fwdCause) return;
    setActionLoading(true);
    const deptEmail = emailList?.[fwdService]?.[fwdTeam] || "";
    forwardTicket({
      ticket_id: ticket.ticket_id,
      previous_service_type: ticket.service_type,
      previous_department: ticket.department,
      previous_department_email: ticket.department_email,
      new_service_type: fwdService,
      new_department: fwdTeam,
      new_department_email: deptEmail,
      secondary_emails: ticket.secondary_emails,
      forwarder_user_type: userData.user_type,
      forwarder_id: userData.customer_id,
      forwarder_username: userData.username,
      forwarder_name: userData.name,
      forwarder_email: userData.email,
      forwarder_mobile: userData.mobile,
      forward_cause: fwdCause,
      is_in_forward_chain: keepTrack,
      client_email: ticket.client_email,
    })
      .then(() => {
        setAlertCtx({
          title: "Success!",
          message: "Ticket forwarded.",
          type: "success",
        });
        setModal(null);
        router.push("/my-tickets");
      })
      .catch(() => {
        setAlertCtx({
          title: "Error",
          message: "Forwarding failed.",
          type: "error",
        });
        setModal(null);
      })
      .finally(() => setActionLoading(false));
  };

  const handleResolve = () => {
    setActionLoading(true);
    resolveTicket(
      ticket.ticket_id,
      userData.customer_id,
      userData.username,
      userData.name,
      userData.email,
      userData.mobile,
      userData.user_type,
      ticket.service_type,
      ticket.department_email,
      ticket.client_email,
      ticket.assignee_history?.[0]?.assignee_email || "",
      ticket.secondary_emails,
    )
      .then(() => {
        setAlertCtx({
          title: "Resolved!",
          message: "Ticket resolved.",
          type: "success",
        });
        setModal(null);
        fetchData();
      })
      .catch(() => {
        setAlertCtx({
          title: "Error",
          message: "Failed to resolve.",
          type: "error",
        });
        setModal(null);
      })
      .finally(() => setActionLoading(false));
  };

  const handleAddRootCause = () => {
    if (!rootCauseText.trim()) return;
    setActionLoading(true);
    addRootCause(
      ticket.ticket_id,
      rootCauseText,
      ticket.service_type,
      ticket.department_email,
      ticket.secondary_emails,
      ticket.client_email,
      ticket.assignee_history?.[0]?.assignee_email || "",
      userData.email,
    )
      .then(() => {
        setRootCauseText("");
        resolveTicket(
          ticket.ticket_id,
          userData.customer_id,
          userData.username,
          userData.name,
          userData.email,
          userData.mobile,
          userData.user_type,
          ticket.service_type,
          ticket.department_email,
          ticket.client_email,
          ticket.assignee_history?.[0]?.assignee_email || "",
          ticket.secondary_emails,
        )
          .then(() => {
            setAlertCtx({
              title: "Resolved!",
              message: "Ticket resolved.",
              type: "success",
            });
            setModal(null);
            fetchData();
          })
          .catch(() => {
            setAlertCtx({
              title: "Error",
              message: "Root cause saved but resolve failed.",
              type: "error",
            });
            setModal(null);
            fetchData();
          })
          .finally(() => setActionLoading(false));
      })
      .catch(() => {
        setAlertCtx({
          title: "Error",
          message: "Failed to save root cause.",
          type: "error",
        });
        setActionLoading(false);
      });
  };

  const handleUpdate = () => {
    if (!updateTitle && !updatePriority) {
      setAlertCtx({
        title: "Validation",
        message: "Provide at least title or priority.",
        type: "error",
      });
      return;
    }
    setActionLoading(true);
    updateTicket(ticket.ticket_id, updateTitle || null, updatePriority || null)
      .then(() => {
        setAlertCtx({
          title: "Success",
          message: "Ticket updated.",
          type: "success",
        });
        setModal(null);
        fetchData();
      })
      .catch(() =>
        setAlertCtx({
          title: "Error",
          message: "Update failed.",
          type: "error",
        }),
      )
      .finally(() => setActionLoading(false));
  };

  if (loading)
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );

  const canComment = message.replace(/<[^>]+>/g, "").trim().length > 0;
  const rootHistory = ticket?.root_cause_history || [];

  return (
    <div className="px-4 md:px-6 py-6">
      {/* Back button */}
      <div className="flex items-center gap-2 mb-4">
        <button
          onClick={() => router.back()}
          className="cursor-pointer text-gray-500 hover:text-gray-800 transition-colors"
        >
          <ChevronLeft size={20} />
        </button>
        <h1 className="text-base md:text-lg font-bold text-gray-800">
          Ticket Details
        </h1>
      </div>

      {/* Two column layout */}
      <div className="flex flex-col lg:flex-row gap-4 items-start">
        {/* LEFT — main content */}
        <div className="flex-1 min-w-0 flex flex-col gap-4">
          {/* Ticket info card */}
          <div className="bg-white rounded-sm border border-gray-200 p-5">
            <div className="flex items-start justify-between gap-3 flex-wrap mb-3">
              <div>
                <h2 className="text-xl font-bold text-gray-800">
                  {ticket?.title}
                </h2>
                <p className="text-xs text-gray-400 mt-1">
                  {ticket?.created_at
                    ? date.format(new Date(ticket.created_at), pattern)
                    : ""}
                </p>
              </div>
              <span
                className={`text-sm font-semibold ${STATUS_COLORS[ticket?.status] || "text-gray-600"}`}
              >
                {ticket?.status?.toUpperCase()}
              </span>
            </div>
            <hr className="mb-3" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-4">
              <InfoRow label="Ticket ID" value={ticket?.ticket_id} />
              <InfoRow label="Client" value={ticket?.client_name} />
              {ticket?.client_company && (
                <InfoRow label="Company" value={ticket.client_company} />
              )}
              <InfoRow label="Client Email" value={ticket?.client_email} />
              <InfoRow label="Client Mobile" value={ticket?.client_mobile} />
              <InfoRow
                label="DID Number"
                value={ticket?.did_number || "Not provided"}
              />
              <InfoRow
                label="Issued By"
                value={
                  ticket?.issuer_name
                    ? `${ticket.issuer_name} (${ticket.issuer_user_type?.toUpperCase()})`
                    : ""
                }
              />
              <InfoRow label="Issuer Email" value={ticket?.issuer_email} />
              <InfoRow
                label="Service"
                value={
                  ticket?.service_type === "internet"
                    ? "INTERNET / DATA"
                    : ticket?.service_type?.toUpperCase()
                }
              />
              <InfoRow label="Team" value={ticket?.department?.toUpperCase()} />
              <InfoRow
                label="Priority"
                value={ticket?.priority?.toUpperCase()}
              />
              {userType !== "client" && ticket?.is_assigned && (
                <InfoRow
                  label="Picked By"
                  value={ticket?.assignee_history?.[0]?.assignee_name}
                />
              )}
              {userType !== "client" &&
                ticket?.forwarder_history?.length > 0 && (
                  <InfoRow
                    label="Forward Cause"
                    value={ticket.forwarder_history[0].forward_cause}
                  />
                )}
              {ticket?.on_hold_cause && userType !== "client" && (
                <InfoRow label="Drop Cause" value={ticket.on_hold_cause} />
              )}
              {ticket?.status === "closed" && (
                <>
                  <InfoRow
                    label="Resolved By"
                    value={ticket?.resolver_history?.[0]?.resolver_name}
                  />
                  <InfoRow
                    label="Resolved At"
                    value={
                      ticket?.resolver_history?.[0]?.resolved_at
                        ? date.format(
                            new Date(ticket.resolver_history[0].resolved_at),
                            pattern,
                          )
                        : ""
                    }
                  />
                </>
              )}
            </div>
            <hr className="mb-3" />
            {ticket?.attachments?.length > 0 && (
              <ShowAttachments attachments={ticket.attachments} />
            )}
            <div
              className="prose prose-sm max-w-none text-sm"
              dangerouslySetInnerHTML={safe(ticket?.description)}
            />
          </div>

          {/* Reply */}
          <div className="bg-white rounded-sm border border-gray-200 p-5">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">
              Add Reply
            </h3>
            <div className="mb-14 border border-gray-200 rounded overflow-hidden">
              <ReactQuill
                theme="snow"
                value={message}
                onChange={setMessage}
                placeholder="Type here..."
                className="bg-white"
                style={{ height: "180px", overflowY: "auto" }}
                modules={{
                  toolbar: [
                    ["bold", "italic", "underline"],
                    ["blockquote"],
                    [{ list: "ordered" }, { list: "bullet" }],
                    ["clean"],
                  ],
                }}
              />
            </div>
            <div className="flex items-center justify-between flex-wrap gap-3">
              {userType !== "client" && (
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isPrivate}
                    onChange={(e) => setIsPrivate(e.target.checked)}
                    className="accent-blue-600"
                  />
                  <span
                    className={
                      isPrivate
                        ? "text-blue-700 font-medium"
                        : "text-orange-600"
                    }
                  >
                    {isPrivate ? "Internal Comment" : "External Comment"}
                  </span>
                </label>
              )}
              <div className="flex items-center gap-3 ml-auto">
                <label className="flex items-center gap-1.5 px-3 py-1.5 text-sm border border-gray-300 rounded cursor-pointer hover:bg-gray-50 transition-colors text-gray-600">
                  <Paperclip className="w-4 h-4" />
                  {files.length > 0
                    ? `${files.length} file${files.length > 1 ? "s" : ""} attached`
                    : "Attach"}
                  <input
                    type="file"
                    multiple
                    key={fileKey}
                    accept="image/*,video/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.zip,.csv"
                    onChange={(e) => setFiles(Array.from(e.target.files))}
                    className="hidden"
                  />
                </label>
                {files.length > 0 && (
                  <button
                    onClick={() => {
                      setFiles([]);
                      setFileKey(Date.now());
                    }}
                    className="text-xs text-red-500 hover:text-red-700"
                  >
                    Clear
                  </button>
                )}
                <button
                  onClick={handleReply}
                  disabled={!canComment || commentLoading}
                  style={{ cursor: "pointer" }}
                  className="px-5 py-2 text-sm font-semibold text-white bg-blue-600 rounded hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  {commentLoading ? "Sending..." : "Reply"}
                </button>
              </div>
            </div>
          </div>

          {/* Threads */}
          {threads.map(
            (t, i) =>
              !(userType === "client" && t.is_internal) && (
                <div
                  key={i}
                  className={`rounded-sm border border-gray-200 p-4 ${t.commenter_user_type === "client" ? "bg-teal-50" : "bg-white"}`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-sm text-gray-800">
                      {t.commenter_name}
                    </span>
                    {t.is_internal && (
                      <span className="px-2 py-0.5 bg-red-400 text-white text-xs rounded-full">
                        Internal
                      </span>
                    )}
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
              ),
          )}
        </div>

        {/* RIGHT — actions panel */}
        {userType !== "client" && (
          <div className="w-full lg:w-72 flex-shrink-0 flex flex-col gap-4">
            {/* Status card */}
            <div className="bg-white rounded-sm border border-gray-200 p-4">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                Status
              </p>
              <div
                className={`text-base font-bold ${STATUS_COLORS[ticket?.status] || "text-gray-600"}`}
              >
                {ticket?.status?.toUpperCase()}
              </div>
              <div className="mt-1 text-xs text-gray-400">
                Priority:{" "}
                <span
                  className={`font-semibold ${PRIORITY_COLORS[ticket?.priority] || "text-gray-600"}`}
                >
                  {ticket?.priority?.toUpperCase()}
                </span>
              </div>
            </div>

            {/* Ticket actions */}
            <div className="bg-white rounded-sm border border-gray-200 p-4">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                Actions
              </p>
              <div className="flex flex-col gap-2">
                {/* Root cause history */}
                {rootHistory.length > 0 && (
                  <button
                    onClick={() => setModal("viewroot")}
                    className="w-full cursor-pointer text-left px-3 py-2 text-sm font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded hover:bg-blue-100 transition-colors"
                  >
                    View Root Cause
                  </button>
                )}

                {/* Forward */}
                {ticket?.status !== "closed" && (
                  <button
                    onClick={() => setModal("forward")}
                    className="w-full cursor-pointer text-left px-3 py-2 text-sm font-medium text-gray-700 bg-gray-50 border border-gray-200 rounded hover:bg-gray-100 transition-colors"
                  >
                    Forward Ticket
                  </button>
                )}

                {/* Pick */}
                {(ticket?.status === "open" ||
                  ticket?.status === "on hold") && (
                  <button
                    onClick={() => setModal("pick")}
                    className="w-full cursor-pointer text-left px-3 py-2 text-sm font-medium text-green-700 bg-green-50 border border-green-200 rounded hover:bg-green-100 transition-colors"
                  >
                    Pick Ticket
                  </button>
                )}

                {/* Drop */}
                {ticket?.status === "in progress" && (
                  <button
                    onClick={() => setModal("drop")}
                    className="w-full cursor-pointer text-left px-3 py-2 text-sm font-medium text-red-700 bg-red-50 border border-red-200 rounded hover:bg-red-100 transition-colors"
                  >
                    Drop Ticket
                  </button>
                )}

                {/* Resolve */}
                {ticket?.status === "closed" ? (
                  <div className="w-full px-3 py-2 text-sm font-medium text-green-700 bg-green-50 border border-green-200 rounded text-center">
                    ✓ Ticket Closed
                  </div>
                ) : ticket?.status !== "open" &&
                  ticket?.status !== "on hold" ? (
                  <button
                    onClick={() => setModal("resolve")}
                    className="w-full cursor-pointer text-left px-3 py-2 text-sm font-medium text-white bg-blue-600 border border-blue-600 rounded hover:bg-blue-700 transition-colors"
                  >
                    Resolve Ticket
                  </button>
                ) : null}

                {/* Update title / priority — support and manager only */}
                {(userType === "support" || userType === "manager") &&
                  ticket?.status !== "closed" && (
                    <button
                      onClick={() => {
                        setUpdateTitle(ticket?.title || "");
                        setUpdatePriority(ticket?.priority || "");
                        setModal("update");
                      }}
                      className="w-full cursor-pointer text-left px-3 py-2 text-sm font-medium text-gray-700 bg-gray-50 border border-gray-200 rounded hover:bg-gray-100 transition-colors"
                    >
                      Update Title / Priority
                    </button>
                  )}
              </div>
            </div>

            {/* Ticket info summary */}
            <div className="bg-white rounded-sm border border-gray-200 p-4">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                Details
              </p>
              <div className="flex flex-col gap-2">
                <div className="text-xs text-gray-500">
                  Ticket ID{" "}
                  <span className="block text-gray-800 font-medium text-sm">
                    {ticket?.ticket_id}
                  </span>
                </div>
                <div className="text-xs text-gray-500">
                  Service{" "}
                  <span className="block text-gray-800 font-medium text-sm">
                    {ticket?.service_type?.toUpperCase() || "—"}
                  </span>
                </div>
                <div className="text-xs text-gray-500">
                  Team{" "}
                  <span className="block text-gray-800 font-medium text-sm">
                    {ticket?.department?.toUpperCase() || "—"}
                  </span>
                </div>
                {ticket?.is_assigned && (
                  <div className="text-xs text-gray-500">
                    Picked By{" "}
                    <span className="block text-gray-800 font-medium text-sm">
                      {ticket?.assignee_history?.[0]?.assignee_name || "—"}
                    </span>
                  </div>
                )}
                {ticket?.status === "closed" &&
                  ticket?.resolver_history?.[0] && (
                    <div className="text-xs text-gray-500">
                      Resolved By{" "}
                      <span className="block text-gray-800 font-medium text-sm">
                        {ticket.resolver_history[0].resolver_name}
                      </span>
                    </div>
                  )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      {modal === "pick" && (
        <MyModal
          toggle
          title="Pick Ticket"
          body={
            <p className="text-sm text-gray-700">
              Assign this ticket to yourself?
            </p>
          }
          closeMethod={() => setModal(null)}
          submitMethod={handlePick}
          submitLabel={actionLoading ? "Picking..." : "Yes, Pick"}
        />
      )}

      {modal === "drop" && (
        <Modal title="Add Drop Cause" onClose={() => setModal(null)}>
          <div className="px-5 py-4">
            <textarea
              value={dropCause}
              onChange={(e) => setDropCause(e.target.value.trimStart())}
              placeholder="Enter drop cause..."
              rows={4}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
            />
          </div>
          <div className="flex justify-end gap-3 border-t px-5 py-3">
            <button
              onClick={() => setModal(null)}
              className="px-4 py-2 text-sm text-gray-600 bg-gray-100 rounded hover:bg-gray-200"
            >
              Cancel
            </button>
            <button
              onClick={handleDrop}
              disabled={!dropCause.trim() || actionLoading}
              className="px-4 py-2 text-sm font-semibold text-white bg-red-600 rounded hover:bg-red-700 disabled:opacity-50"
            >
              {actionLoading ? "Dropping..." : "Submit"}
            </button>
          </div>
        </Modal>
      )}

      {modal === "forward" && (
        <Modal title="Forward Ticket" onClose={() => setModal(null)}>
          <div className="px-5 py-4 flex flex-col gap-3">
            <p className="text-xs text-red-500">(*) fields are required</p>
            <select
              value={fwdService}
              onChange={(e) => setFwdService(e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none"
            >
              <option value="">Select Service *</option>
              {SERVICES.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
            <select
              value={fwdTeam}
              onChange={(e) => setFwdTeam(e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none"
            >
              <option value="">Select Team *</option>
              {TEAMS.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
            <textarea
              value={fwdCause}
              onChange={(e) => setFwdCause(e.target.value.trimStart())}
              placeholder="Forward cause *"
              rows={3}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none"
            />
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={keepTrack}
                onChange={(e) => setKeepTrack(e.target.checked)}
                className="accent-blue-600"
              />
              {keepTrack ? "Stay in loop" : "Stay out of the loop"}
            </label>
          </div>
          <div className="flex justify-end gap-3 border-t px-5 py-3">
            <button
              onClick={() => setModal(null)}
              className="px-4 py-2 text-sm text-white bg-red-600 rounded hover:bg-red-700"
            >
              Close
            </button>
            <button
              onClick={handleForward}
              disabled={!fwdService || !fwdTeam || !fwdCause || actionLoading}
              className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {actionLoading ? "Forwarding..." : "Submit"}
            </button>
          </div>
        </Modal>
      )}

      {modal === "resolve" &&
        (rootHistory.length === 0 ? (
          <Modal title="Root Cause Summary" onClose={() => setModal(null)}>
            <div className="px-5 py-4">
              <textarea
                value={rootCauseText}
                onChange={(e) => setRootCauseText(e.target.value.trimStart())}
                placeholder="Enter root cause summary..."
                rows={4}
                maxLength={100}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none"
              />
              <p className="text-xs text-gray-400 mt-1">
                {rootCauseText.length}/100
              </p>
            </div>
            <div className="flex justify-end gap-3 border-t px-5 py-3">
              <button
                onClick={() => setModal(null)}
                className="px-4 py-2 text-sm text-white bg-red-600 rounded"
              >
                Close
              </button>
              <button
                onClick={handleAddRootCause}
                disabled={!rootCauseText.trim() || actionLoading}
                className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded disabled:opacity-50"
              >
                {actionLoading ? "Saving..." : "Submit & Resolve"}
              </button>
            </div>
          </Modal>
        ) : (
          <MyModal
            toggle
            title="Resolve Ticket"
            body={
              <p className="text-sm text-gray-700">
                Are you sure you want to resolve this ticket?
              </p>
            }
            closeMethod={() => setModal(null)}
            submitMethod={handleResolve}
            submitLabel={actionLoading ? "Resolving..." : "Resolve"}
          />
        ))}

      {modal === "viewroot" && (
        <Modal title="Root Cause History" onClose={() => setModal(null)}>
          <div className="px-5 py-4 max-h-72 overflow-y-auto flex flex-col gap-3">
            {rootHistory.map((r, i) => (
              <div
                key={i}
                className="border border-gray-200 rounded p-3 shadow-sm"
              >
                <p className="text-xs font-semibold text-gray-500 mb-1">
                  {date.format(new Date(r.root_cause_analysis_at), pattern)}
                </p>
                <hr className="mb-2" />
                <p className="text-sm text-gray-700">{r.root_cause_analysis}</p>
              </div>
            ))}
          </div>
          <div className="flex justify-end border-t px-5 py-3">
            <button
              onClick={() => setModal(null)}
              className="px-4 py-2 text-sm text-white bg-red-600 rounded hover:bg-red-700"
            >
              Close
            </button>
          </div>
        </Modal>
      )}

      {modal === "update" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg mx-4">
            <div className="flex items-center justify-between border-b px-6 py-4">
              <div>
                <h2 className="text-lg font-bold text-gray-800">
                  Update Ticket
                </h2>
                <p className="text-xs text-gray-400 mt-0.5">
                  {ticket?.ticket_id}
                </p>
              </div>
              <button
                onClick={() => setModal(null)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            <div className="px-6 py-5 flex flex-col gap-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Ticket Title
                </label>
                <input
                  type="text"
                  value={updateTitle}
                  onChange={(e) => setUpdateTitle(e.target.value)}
                  placeholder="Enter ticket title"
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                {updateTitle && updateTitle !== ticket?.title && (
                  <p className="text-xs text-orange-500 mt-1">
                    ⚠ Title will be changed
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Priority
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    {
                      value: "low",
                      label: "Low",
                      color: "text-green-700 border-green-300 bg-green-50",
                      active:
                        "border-green-500 bg-green-100 ring-2 ring-green-400",
                    },
                    {
                      value: "medium",
                      label: "Medium",
                      color: "text-orange-700 border-orange-300 bg-orange-50",
                      active:
                        "border-orange-500 bg-orange-100 ring-2 ring-orange-400",
                    },
                    {
                      value: "high",
                      label: "High",
                      color: "text-red-700 border-red-300 bg-red-50",
                      active: "border-red-500 bg-red-100 ring-2 ring-red-400",
                    },
                  ].map((p) => (
                    <button
                      key={p.value}
                      onClick={() => setUpdatePriority(p.value)}
                      className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg border-2 text-sm font-semibold transition-all cursor-pointer ${updatePriority === p.value ? p.active : p.color}`}
                    >
                      <span
                        className={`w-2 h-2 rounded-full ${p.value === "low" ? "bg-green-500" : p.value === "medium" ? "bg-orange-500" : "bg-red-500"}`}
                      />
                      {p.label}
                    </button>
                  ))}
                </div>
                {updatePriority && updatePriority !== ticket?.priority && (
                  <p className="text-xs text-orange-500 mt-1.5">
                    ⚠ Priority will change from{" "}
                    <strong>{ticket?.priority?.toUpperCase()}</strong> to{" "}
                    <strong>{updatePriority?.toUpperCase()}</strong>
                  </p>
                )}
              </div>
              <div className="bg-gray-50 rounded-lg px-4 py-3 border border-gray-200">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                  Current Values
                </p>
                <div className="flex gap-6 text-sm">
                  <div>
                    <span className="text-gray-500">Title: </span>
                    <span className="text-gray-800 font-medium">
                      {ticket?.title}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500">Priority: </span>
                    <span
                      className={`font-semibold ${ticket?.priority === "high" ? "text-red-600" : ticket?.priority === "medium" ? "text-orange-500" : "text-green-600"}`}
                    >
                      {ticket?.priority?.toUpperCase()}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3 border-t px-6 py-4">
              <button
                onClick={() => setModal(null)}
                className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdate}
                disabled={actionLoading || (!updateTitle && !updatePriority)}
                className="px-5 py-2 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {actionLoading ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
