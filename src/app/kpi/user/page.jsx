"use client";
import { useContext, useState } from "react";
import { getUserSummaryByDateRange } from "@/api/tickets";
import { alertContext } from "@/hooks/alertContext";
import { Download } from "lucide-react";

const S =
  "w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500";

export default function UserKpiPage() {
  const { setAlertCtx } = useContext(alertContext);
  const [username, setUsername] = useState("");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handle = () => {
    if (!username) {
      setAlertCtx({
        title: "Validation",
        message: "Enter a username.",
        type: "error",
      });
      return;
    }
    setLoading(true);
    setResult(null);
    getUserSummaryByDateRange(username, start || undefined, end || undefined)
      .then((r) => setResult(r.data))
      .catch(() =>
        setAlertCtx({
          title: "Error",
          message: "Failed to generate report.",
          type: "error",
        }),
      )
      .finally(() => setLoading(false));
  };

  const fileName = result?.public_url
    ? decodeURIComponent(result.public_url.split("/").pop())
    : "";

  // Microsoft Office Online viewer — renders xlsx exactly as Excel
  const officeViewerUrl = result?.public_url
    ? `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(result.public_url)}`
    : "";

  return (
    <div className="px-6 py-6">
      <div className="border border-gray-200 rounded-sm bg-white flex items-center min-h-[52px] px-3 md:px-5 w-full mb-6">
        <h3 className="font-bold text-base md:text-[18px] py-2">
          Report by Username
        </h3>
      </div>

      {/* Form */}
      <div className="bg-white border border-gray-200 rounded-sm p-5 mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Username or Email *
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value.trim())}
              onKeyDown={(e) => e.key === "Enter" && handle()}
              placeholder="Enter username or email"
              className={S}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Start Date
            </label>
            <input
              type="date"
              value={start}
              onChange={(e) => setStart(e.target.value)}
              className={S}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              End Date
            </label>
            <input
              type="date"
              value={end}
              onChange={(e) => setEnd(e.target.value)}
              className={S}
            />
          </div>
        </div>
        <div className="flex justify-end">
          <button
            onClick={handle}
            disabled={loading || !username}
            className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? "Generating..." : "Generate"}
          </button>
        </div>
      </div>

      {/* Preview */}
      {result?.public_url && (
        <div className="bg-white border border-gray-200 rounded-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-gray-500 truncate max-w-xs">
              {fileName}
            </p>
            <a
              href={result.public_url}
              download={fileName}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-white bg-blue-600 rounded hover:bg-blue-700 flex-shrink-0"
            >
              <Download className="w-4 h-4" /> Download
            </a>
          </div>
          <iframe
            src={officeViewerUrl}
            width="100%"
            height="600px"
            frameBorder="0"
            title="Excel Preview"
          />
        </div>
      )}
    </div>
  );
}
