"use client";
import { useState } from "react";

const FILE_ICONS = { pdf: "📄", doc: "📝", docx: "📝", xls: "📊", xlsx: "📊", ppt: "📊", pptx: "📊", zip: "🗜️", csv: "📊" };
const getType = (url) => { const ext = url.split("?")[0].split(".").pop().toLowerCase(); if (["jpg","jpeg","png","gif","webp","bmp"].includes(ext)) return "image"; if (["mp4","webm","ogg","mov"].includes(ext)) return "video"; return ext; };
const getName = (url) => decodeURIComponent(url.split("?")[0].split("/").pop());

export default function ShowAttachments({ attachments = [] }) {
  const [lightbox, setLightbox] = useState(null);
  return (
    <div className="flex flex-wrap gap-2 mb-3">
      {attachments.map((src, i) => {
        const type = getType(src);
        if (type === "image") return <img key={i} src={src} alt="" width={200} className="rounded cursor-pointer border border-gray-200 hover:opacity-90 object-cover" onClick={() => setLightbox(src)} />;
        if (type === "video") return <video key={i} src={src} controls className="rounded max-w-xs" />;
        return (
          <a key={i} href={src} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-3 py-2 border border-gray-200 rounded text-sm text-blue-700 hover:bg-blue-50 bg-gray-50">
            <span>{FILE_ICONS[type] || "📎"}</span><span className="max-w-[200px] truncate">{getName(src)}</span>
          </a>
        );
      })}
      {lightbox && <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4" onClick={() => setLightbox(null)}><img src={lightbox} alt="" className="max-h-full max-w-full rounded" /></div>}
    </div>
  );
}
