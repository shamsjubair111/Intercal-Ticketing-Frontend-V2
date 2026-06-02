"use client";
import { useState, useEffect, useRef } from "react";
import { Plus, X } from "lucide-react";

const ALL_FILTERS = [
  {
    id: 1,
    label: "Status",
    type: "select",
    options: ["open", "in progress", "on hold", "closed"],
  },
  {
    id: 2,
    label: "Priority",
    type: "select",
    options: ["low", "medium", "high"],
  },
  {
    id: 3,
    label: "Service Type",
    type: "select",
    options: ["Internet", "Cloud", "IpTelephony", "SMS"],
  },
  { id: 4, label: "Start Date", type: "date" },
  { id: 5, label: "End Date", type: "date" },
  { id: 6, label: "Ticket ID", type: "text", searchKey: "ticket_id" },
  { id: 7, label: "Company Name", type: "text", searchKey: "client_companies" },
];

export default function Filter({ onFilterChange, userType = "" }) {
  const [isOpen, setIsOpen] = useState(false);
  const [selected, setSelected] = useState([]);
  const internalUpdate = useRef(false);

  const visibleFilters = ALL_FILTERS.filter(
    (f) => !(f.id === 7 && userType === "client"),
  );

  // Load from localStorage on mount only
  useEffect(() => {
    const saved = localStorage.getItem("ticket_filters");
    if (saved) {
      try {
        const p = JSON.parse(saved);
        if (Array.isArray(p) && p.length) setSelected(p);
      } catch {
        localStorage.removeItem("ticket_filters");
      }
    }
  }, []);

  // Listen for storage events from OTHER tabs only (e.g. logo click clearing filters)
  useEffect(() => {
    const handler = (e) => {
      if (e.key === "ticket_filters") {
        if (internalUpdate.current) return; // ignore our own writes
        const saved = localStorage.getItem("ticket_filters");
        setSelected(saved ? JSON.parse(saved) : []);
      }
    };
    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  }, []);

  // Notify parent and save to localStorage when selected changes
  useEffect(() => {
    internalUpdate.current = true;
    onFilterChange?.(selected);
    localStorage.setItem("ticket_filters", JSON.stringify(selected));
    // Reset flag after a tick
    setTimeout(() => {
      internalUpdate.current = false;
    }, 0);
  }, [selected]);

  const add = (opt) => {
    if (selected.some((f) => f.id === opt.id)) return;
    setSelected((p) => [...p, { ...opt, value: "" }]);
    setIsOpen(false);
  };

  const change = (id, value) =>
    setSelected((p) => p.map((f) => (f.id === id ? { ...f, value } : f)));

  const remove = (id) => setSelected((p) => p.filter((f) => f.id !== id));

  return (
    <div className="w-full bg-white rounded-sm border border-gray-200">
      <div className="flex items-center py-3 pl-4 pr-4">
        <div className="relative">
          <button
            onClick={() => setIsOpen((p) => !p)}
            className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Add filter
          </button>
          {isOpen && (
            <div className="absolute top-full left-0 mt-2 w-48 bg-white border border-gray-200 rounded-md shadow-lg z-20">
              {visibleFilters.map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => add(opt)}
                  disabled={selected.some((f) => f.id === opt.id)}
                  className="w-full cursor-pointer text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {opt.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {selected.length > 0 && (
          <div className="ml-4 flex gap-3 overflow-x-auto whitespace-nowrap px-2 py-1 max-w-full">
            {selected.map((f) => (
              <div
                key={f.id}
                className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded px-2 py-1 text-xs"
              >
                <span className="text-sm text-gray-700 font-medium">
                  {f.label}:
                </span>

                {f.type === "select" && (
                  <select
                    value={f.value}
                    onChange={(e) => change(f.id, e.target.value)}
                    className="border border-gray-300 rounded-md px-2 py-1 text-sm cursor-pointer"
                  >
                    <option value="">Select</option>
                    {f.options.map((o) => (
                      <option key={o} value={o}>
                        {o}
                      </option>
                    ))}
                  </select>
                )}

                {f.type === "date" && (
                  <input
                    type="date"
                    value={f.value}
                    onChange={(e) => change(f.id, e.target.value)}
                    className="border border-gray-300 rounded-md px-2 py-1 text-sm cursor-pointer"
                  />
                )}

                {f.type === "text" && (
                  <input
                    type="text"
                    value={f.value}
                    onChange={(e) => change(f.id, e.target.value)}
                    placeholder={`Enter ${f.label.toLowerCase()}...`}
                    className="border border-gray-300 rounded-md px-2 py-1 text-sm w-36"
                  />
                )}

                <button
                  onClick={() => remove(f.id)}
                  className="cursor-pointer text-gray-400 hover:text-red-500"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
