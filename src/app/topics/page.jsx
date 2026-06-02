"use client";
import { useContext, useEffect, useState } from "react";
import { alertContext } from "@/hooks/alertContext";
import { getTopics, addTopic, updateTopic, deleteTopic } from "@/api/tickets";
import { Pencil, Trash2, Plus, X, Check } from "lucide-react";

const SERVICES = [
  { label: "Internet / Data", value: "Internet" },
  { label: "Cloud", value: "Cloud" },
  { label: "IP Telephony", value: "IpTelephony" },
  { label: "SMS", value: "SMS" },
];

const SERVICE_LABELS = {
  internet: "Internet / Data",
  cloud: "Cloud",
  iptelephony: "IP Telephony",
  sms: "SMS",
};

const I =
  "w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500";
const S =
  "border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500";

export default function TopicsPage() {
  const { setAlertCtx } = useContext(alertContext);
  const [topics, setTopics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterService, setFilterService] = useState("");

  // Add form
  const [addService, setAddService] = useState("");
  const [addTopicText, setAddTopicText] = useState("");
  const [addLoading, setAddLoading] = useState(false);

  // Edit state
  const [editRow, setEditRow] = useState(null);
  const [editLoading, setEditLoading] = useState(false);

  // Delete confirmation
  const [deleteId, setDeleteId] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchTopics = () => {
    setLoading(true);
    getTopics()
      .then((r) => setTopics(r.data.topics || []))
      .catch(() =>
        setAlertCtx({
          title: "Error",
          message: "Failed to load topics.",
          type: "error",
        }),
      )
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchTopics();
  }, []);

  const handleAdd = () => {
    if (!addService || !addTopicText.trim()) return;
    setAddLoading(true);
    addTopic(addService, addTopicText.trim())
      .then(() => {
        setAlertCtx({
          title: "Success",
          message: "Topic added.",
          type: "success",
        });
        setAddTopicText("");
        setAddService("");
        fetchTopics();
      })
      .catch(() =>
        setAlertCtx({
          title: "Error",
          message: "Failed to add topic.",
          type: "error",
        }),
      )
      .finally(() => setAddLoading(false));
  };

  const handleUpdate = () => {
    if (!editRow.topic.trim()) return;
    setEditLoading(true);
    updateTopic(editRow.topic_id, editRow.service_type, editRow.topic.trim())
      .then(() => {
        setAlertCtx({
          title: "Success",
          message: "Topic updated.",
          type: "success",
        });
        setEditRow(null);
        fetchTopics();
      })
      .catch(() =>
        setAlertCtx({
          title: "Error",
          message: "Failed to update topic.",
          type: "error",
        }),
      )
      .finally(() => setEditLoading(false));
  };

  const handleDelete = () => {
    if (!deleteId) return;
    setDeleteLoading(true);
    deleteTopic(deleteId)
      .then(() => {
        setAlertCtx({
          title: "Deleted",
          message: "Topic deleted.",
          type: "success",
        });
        setDeleteId(null);
        fetchTopics();
      })
      .catch(() =>
        setAlertCtx({
          title: "Error",
          message: "Failed to delete topic.",
          type: "error",
        }),
      )
      .finally(() => setDeleteLoading(false));
  };

  const filtered = filterService
    ? topics.filter(
        (t) => t.service_type.toLowerCase() === filterService.toLowerCase(),
      )
    : topics;

  return (
    <div className="px-6 py-6">
      {/* Page title */}
      <div className="border border-gray-200 rounded-sm bg-white flex items-center min-h-[52px] px-3 md:px-5 w-full mb-6">
        <h3 className="font-bold text-base md:text-[18px] py-2">
          Topic Management
        </h3>
      </div>

      {/* Add new topic */}
      <div className="bg-white border border-gray-200 rounded-sm p-5 mb-6">
        <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
          <Plus className="w-4 h-4" /> Add New Topic
        </h4>
        <div className="flex gap-3 flex-wrap">
          <select
            value={addService}
            onChange={(e) => setAddService(e.target.value)}
            className={S}
          >
            <option value="">Select Service *</option>
            {SERVICES.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
          <input
            type="text"
            value={addTopicText}
            onChange={(e) => setAddTopicText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAdd()}
            placeholder="Enter topic name *"
            className={`${S} flex-1 min-w-[200px]`}
          />
          <button
            onClick={handleAdd}
            disabled={!addService || !addTopicText.trim() || addLoading}
            className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {addLoading ? "Adding..." : "Add Topic"}
          </button>
        </div>
      </div>

      {/* Topics table */}
      <div className="bg-white border border-gray-200 rounded-sm">
        {/* Filter bar */}
        <div className="flex items-center gap-3 px-5 py-3 border-b border-gray-200 flex-wrap">
          <span className="text-sm text-gray-600 font-medium">
            Filter by service:
          </span>
          <select
            value={filterService}
            onChange={(e) => setFilterService(e.target.value)}
            className={S}
          >
            <option value="">All Services</option>
            {SERVICES.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
          <span className="text-xs text-gray-400 ml-auto">
            {filtered.length} topic{filtered.length !== 1 ? "s" : ""}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide w-10">
                  #
                </th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide w-48">
                  Service
                </th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Topic
                </th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide w-28">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={4} className="py-10 text-center">
                    <div className="w-6 h-6 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" />
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td
                    colSpan={4}
                    className="py-10 text-center text-gray-400 text-sm"
                  >
                    No topics found
                  </td>
                </tr>
              ) : (
                filtered.map((t, i) => (
                  <tr
                    key={t.topic_id}
                    className="border-b border-gray-100 hover:bg-gray-50 transition"
                  >
                    <td className="px-5 py-3 text-sm text-gray-400">{i + 1}</td>
                    <td className="px-5 py-3">
                      {editRow?.topic_id === t.topic_id ? (
                        <select
                          value={editRow.service_type}
                          onChange={(e) =>
                            setEditRow({
                              ...editRow,
                              service_type: e.target.value,
                            })
                          }
                          className={S}
                        >
                          {SERVICES.map((s) => (
                            <option key={s.value} value={s.value}>
                              {s.label}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <span className="text-sm text-gray-700">
                          {SERVICE_LABELS[t.service_type] || t.service_type}
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3">
                      {editRow?.topic_id === t.topic_id ? (
                        <input
                          type="text"
                          value={editRow.topic}
                          onChange={(e) =>
                            setEditRow({ ...editRow, topic: e.target.value })
                          }
                          onKeyDown={(e) => {
                            if (e.key === "Enter") handleUpdate();
                            if (e.key === "Escape") setEditRow(null);
                          }}
                          className={`${I} max-w-sm`}
                          autoFocus
                        />
                      ) : (
                        <span className="text-sm text-gray-800">{t.topic}</span>
                      )}
                    </td>
                    <td className="px-5 py-3">
                      {editRow?.topic_id === t.topic_id ? (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={handleUpdate}
                            disabled={!editRow.topic.trim() || editLoading}
                            title="Save"
                            className="p-1.5 rounded bg-green-100 hover:bg-green-200 text-green-700 disabled:opacity-50 transition-colors"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setEditRow(null)}
                            title="Cancel"
                            className="p-1.5 rounded bg-gray-100 hover:bg-gray-200 text-gray-600 transition-colors"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() =>
                              setEditRow({
                                topic_id: t.topic_id,
                                service_type: t.service_type,
                                topic: t.topic,
                              })
                            }
                            title="Edit"
                            className="p-1.5 rounded bg-blue-100 hover:bg-blue-200 text-blue-700 transition-colors"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeleteId(t.topic_id)}
                            title="Delete"
                            className="p-1.5 rounded bg-red-100 hover:bg-red-200 text-red-700 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delete confirmation modal */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-sm mx-4">
            <div className="flex items-center justify-between border-b px-5 py-3">
              <h2 className="text-lg font-semibold text-gray-800">
                Delete Topic
              </h2>
              <button onClick={() => setDeleteId(null)}>
                <X size={20} className="text-gray-500" />
              </button>
            </div>
            <div className="px-5 py-4 text-sm text-gray-700">
              Are you sure you want to delete this topic?{" "}
              <span className="text-red-600 font-medium">
                This cannot be undone.
              </span>
            </div>
            <div className="flex justify-end gap-3 border-t px-5 py-3">
              <button
                onClick={() => setDeleteId(null)}
                className="px-4 py-2 text-sm text-gray-600 bg-gray-100 rounded hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleteLoading}
                className="px-4 py-2 text-sm font-semibold text-white bg-red-600 rounded hover:bg-red-700 disabled:opacity-50"
              >
                {deleteLoading ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
