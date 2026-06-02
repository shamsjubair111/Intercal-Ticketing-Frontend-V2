"use client";
import { useContext, useState } from "react";
import { getDeptWiseReport } from "@/api/tickets";
import { alertContext } from "@/hooks/alertContext";
import { Download } from "lucide-react";

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
  { label: "Core Network Operations", value: "core" },
  { label: "NPI", value: "npi" },
];
const S =
  "w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500";

export default function DeptKpiPage() {
  const { setAlertCtx } = useContext(alertContext);
  const [service, setService] = useState("");
  const [team, setTeam] = useState("");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [fileURL, setFileURL] = useState("");
  const [fileName, setFileName] = useState("");
  const [loading, setLoading] = useState(false);

  const handle = () => {
    if (!service) {
      setAlertCtx({
        title: "Validation",
        message: "Please select a service.",
        type: "error",
      });
      return;
    }
    setLoading(true);
    setFileURL("");
    getDeptWiseReport(service, team, start || undefined, end || undefined)
      .then((r) => {
        const url = r.data?.public_url || r.data?.data?.url || r.data?.url;
        if (url) {
          setFileURL(url);
          setFileName(decodeURIComponent(url.split("/").pop()));
        } else {
          setAlertCtx({
            title: "Info",
            message: "No file URL returned.",
            type: "info",
          });
        }
      })
      .catch(() =>
        setAlertCtx({
          title: "Error",
          message: "Failed to generate report.",
          type: "error",
        }),
      )
      .finally(() => setLoading(false));
  };

  const officeViewerUrl = fileURL
    ? `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(fileURL)}`
    : "";

  const isPdf = fileURL.toLowerCase().includes(".pdf");

  return (
    <div className="px-6 py-6">
      <div className="border border-gray-200 rounded-sm bg-white flex items-center min-h-[52px] px-3 md:px-5 w-full mb-6">
        <h3 className="font-bold text-base md:text-[18px] py-2">
          Report by Department
        </h3>
      </div>

      <div className="bg-white border border-gray-200 rounded-sm p-5 mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Service *
            </label>
            <select
              value={service}
              onChange={(e) => setService(e.target.value)}
              className={S}
            >
              <option value="">Select Service</option>
              {SERVICES.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Team
            </label>
            <select
              value={team}
              onChange={(e) => setTeam(e.target.value)}
              className={S}
            >
              <option value="">All Teams</option>
              {TEAMS.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
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
        <div className="flex justify-between">
          <button
            onClick={() => {
              setService("");
              setTeam("");
              setStart("");
              setEnd("");
              setFileURL("");
            }}
            className="px-4 py-2 text-sm text-gray-600 bg-gray-100 rounded hover:bg-gray-200"
          >
            Clear
          </button>
          <button
            onClick={handle}
            disabled={loading || !service}
            className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? "Generating..." : "Generate Report"}
          </button>
        </div>
      </div>

      {fileURL && (
        <div className="bg-white border border-gray-200 rounded-sm p-4">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-gray-500 truncate max-w-xs">
              {fileName}
            </p>
            <a
              href={fileURL}
              download={fileName}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-white bg-blue-600 rounded hover:bg-blue-700 flex-shrink-0"
            >
              <Download className="w-4 h-4" /> Download
            </a>
          </div>
          <iframe
            src={isPdf ? fileURL : officeViewerUrl}
            width="100%"
            height="600px"
            frameBorder="0"
            title="Report Preview"
            className="border border-gray-200 rounded"
          />
        </div>
      )}
    </div>
  );
}
