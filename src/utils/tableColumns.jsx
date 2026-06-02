import * as date from "date-and-time";
const pattern = date.compile("MMM DD YYYY • hh:mm A");

export const ticketColumns = [
  {
    label: "REQUESTER",
    value: "client_name",
    render: (row) => (
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-blue-700 flex items-center justify-center text-white text-sm font-semibold">
          {row?.client_name?.slice(0, 2).toUpperCase() || "NA"}
        </div>
        <div>
          <div className="text-sm font-medium text-gray-900">
            {row?.client_name || "Customer"}
          </div>
          <div className="text-xs text-gray-500">
            {row?.client_mobile || row?.client_email}
          </div>
        </div>
      </div>
    ),
  },
  {
    label: "SUBJECT",
    value: "title",
    render: (row) => (
      <span className="text-sm text-gray-700 line-clamp-2">{row?.title}</span>
    ),
  },
  {
    label: "SERVICE",
    value: "service_type",
    render: (row) => (
      <span className="text-sm text-gray-700">
        {row?.service_type === "internet"
          ? "INTERNET"
          : row?.service_type?.toUpperCase() || "—"}
      </span>
    ),
  },
  {
    label: "STATUS",
    value: "status",
    render: (row) => {
      const c = {
        open: "text-blue-700",
        "in progress": "text-green-700",
        "on hold": "text-orange-600",
        closed: "text-red-600",
      };
      return (
        <span
          className={`text-sm font-medium ${c[row?.status] || "text-gray-600"}`}
        >
          {row?.status?.toUpperCase() || "—"}
        </span>
      );
    },
  },
  {
    label: "PRIORITY",
    value: "priority",
    render: (row) => {
      const c = {
        high: "text-red-600",
        medium: "text-orange-500",
        low: "text-green-600",
      };
      return (
        <span
          className={`text-sm font-medium ${c[row?.priority] || "text-gray-500"}`}
        >
          {row?.priority?.toUpperCase() || "—"}
        </span>
      );
    },
  },
  {
    label: "CREATED",
    value: "created_at",
    render: (row) => (
      <span className="text-xs text-gray-500 whitespace-nowrap">
        {row?.created_at ? date.format(new Date(row.created_at), pattern) : "—"}
      </span>
    ),
  },
];
