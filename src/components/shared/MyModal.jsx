"use client";
import { X } from "lucide-react";

export default function MyModal({ toggle, title, body, closeMethod, submitMethod, submitLabel = "Confirm", submitClass = "" }) {
  if (!toggle) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-md mx-4">
        <div className="flex items-center justify-between border-b border-gray-200 px-5 py-3">
          <h2 className="text-lg font-semibold text-gray-800">{title}</h2>
          <button onClick={closeMethod} className="text-gray-500 hover:text-gray-700 transition-colors"><X size={20} /></button>
        </div>
        <div className="px-5 py-4 text-gray-700 text-sm">{body}</div>
        <div className="flex justify-end gap-3 border-t border-gray-200 px-5 py-3">
          <button onClick={closeMethod} style={{ cursor: "pointer" }} className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded hover:bg-gray-200">Cancel</button>
          {submitMethod && (
            <button onClick={submitMethod} style={{ cursor: "pointer" }} className={`px-4 py-2 text-sm font-semibold text-white rounded ${submitClass || "bg-blue-600 hover:bg-blue-700"}`}>
              {submitLabel}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
