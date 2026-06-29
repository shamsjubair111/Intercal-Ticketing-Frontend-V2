import * as date from "date-and-time";
const pattern = date.compile("MMM DD YYYY • hh:mm A");

export const ticketColumns = [
  {
    label: "CLIENT COMPANY",
    value: "client_company",
    className: "min-w-[180px] max-w-[220px]",
    render: (row) => (
      <span
        className="block text-sm font-medium text-gray-800 truncate"
        title={row?.client_company || ""}
      >
        {row?.client_company || "—"}
      </span>
    ),
  },
  {
    label: "REQUESTER",
    value: "client_name",
    className: "min-w-[220px] max-w-[260px]",
    render: (row) => (
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-10 h-10 shrink-0 rounded-full bg-blue-700 flex items-center justify-center text-white text-sm font-semibold">
          {row?.client_name?.slice(0, 2).toUpperCase() || "NA"}
        </div>
        <div className="min-w-0">
          <div
            className="text-sm font-medium text-gray-900 truncate"
            title={row?.client_name || ""}
          >
            {row?.client_name || "Customer"}
          </div>
          <div
            className="text-xs text-gray-500 truncate"
            title={row?.client_mobile || row?.client_email || ""}
          >
            {row?.client_mobile || row?.client_email}
          </div>
        </div>
      </div>
    ),
  },
  {
    label: "SUBJECT",
    value: "title",
    className: "min-w-[240px] max-w-[320px]",
    render: (row) => (
      <span
        className="block text-sm text-gray-700 line-clamp-2"
        title={row?.title || ""}
      >
        {row?.title}
      </span>
    ),
  },
  {
    label: "SERVICE",
    value: "service_type",
    className: "min-w-[110px] whitespace-nowrap",
    render: (row) => (
      <span className="text-sm text-gray-700 whitespace-nowrap">
        {row?.service_type === "internet"
          ? "INTERNET"
          : row?.service_type?.toUpperCase() || "—"}
      </span>
    ),
  },
  {
    label: "STATUS",
    value: "status",
    className: "min-w-[120px] whitespace-nowrap",
    render: (row) => {
      const c = {
        open: "text-blue-700",
        "in progress": "text-green-700",
        "on hold": "text-orange-600",
        closed: "text-red-600",
      };
      return (
        <span
          className={`text-sm font-medium whitespace-nowrap ${c[row?.status] || "text-gray-600"}`}
        >
          {row?.status?.toUpperCase() || "—"}
        </span>
      );
    },
  },
  {
    label: "PRIORITY",
    value: "priority",
    className: "min-w-[100px] whitespace-nowrap",
    render: (row) => {
      const c = {
        high: "text-red-600",
        medium: "text-orange-500",
        low: "text-green-600",
      };
      return (
        <span
          className={`text-sm font-medium whitespace-nowrap ${c[row?.priority] || "text-gray-500"}`}
        >
          {row?.priority?.toUpperCase() || "—"}
        </span>
      );
    },
  },
  {
    label: "CREATED",
    value: "created_at",
    className: "min-w-[180px] whitespace-nowrap",
    render: (row) => (
      <span className="text-xs text-gray-500 whitespace-nowrap">
        {row?.created_at ? date.format(new Date(row.created_at), pattern) : "—"}
      </span>
    ),
  },
];
