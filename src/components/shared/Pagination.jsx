"use client";
export default function Pagination({ totalItems = 0, itemsPerPage = 10, currentPage = 1, onPageChange, label = "items" }) {
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const handlePageChange = (p) => { if (p >= 1 && p <= totalPages) onPageChange?.(p); };
  const getPages = () => {
    const pages = []; const max = 2; const half = Math.floor(max / 2);
    if (totalPages <= max) { for (let i = 1; i <= totalPages; i++) pages.push(i); }
    else if (currentPage <= half + 1) { for (let i = 1; i <= max; i++) pages.push(i); pages.push("..."); pages.push(totalPages); }
    else if (currentPage >= totalPages - half) { pages.push(1); pages.push("..."); for (let i = totalPages - max + 1; i <= totalPages; i++) pages.push(i); }
    else { pages.push(1); pages.push("..."); for (let i = currentPage - 1; i <= currentPage + 1; i++) pages.push(i); pages.push("..."); pages.push(totalPages); }
    return pages;
  };
  return (
    <div className="flex items-center justify-between border border-gray-200 px-2 rounded-sm">
      <span className="text-sm text-gray-600">{totalItems.toLocaleString()}+ {label}</span>
      <div className="flex items-center gap-2">
        <button onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1} className="p-2 text-gray-600 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed rounded">←</button>
        {getPages().map((p, i) => (
          <button key={i} onClick={() => typeof p === "number" && handlePageChange(p)} disabled={p === "..."}
            className={`px-3 py-1 rounded text-sm font-medium ${p === currentPage ? "bg-blue-500 text-white" : p === "..." ? "cursor-default text-gray-600" : "text-gray-600 hover:bg-gray-100"}`}>
            {p}
          </button>
        ))}
        <button onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages} className="p-2 text-gray-600 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed rounded">→</button>
      </div>
    </div>
  );
}
