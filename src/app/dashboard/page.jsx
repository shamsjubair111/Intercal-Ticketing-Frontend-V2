"use client";
import { useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getDashboardData, getUserInfo } from "@/api/tickets";
import { alertContext } from "@/hooks/alertContext";
import { useTicketContext } from "@/context/TicketContext";
import dynamic from "next/dynamic";

const ReactApexChart = dynamic(() => import("react-apexcharts"), {
  ssr: false,
});

function Card({ label, count, color, onClick }) {
  return (
    <div
      onClick={count > 0 ? onClick : undefined}
      className={`bg-white rounded-sm border border-gray-200 p-5 flex items-center justify-between shadow-sm ${count > 0 ? "cursor-pointer hover:shadow-md" : ""} transition-shadow`}
    >
      <div>
        <p className="text-xs text-gray-500 uppercase tracking-wide font-medium mb-1">
          {label}
        </p>
        <p className="text-3xl font-bold text-gray-800">{count}</p>
      </div>
      <div
        className={`w-12 h-12 rounded-full ${color} flex items-center justify-center`}
      >
        <svg
          className="w-5 h-5 text-white"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2"
          />
        </svg>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const { setAlertCtx } = useContext(alertContext);
  const { setSelectedStatus } = useTicketContext();
  const [stats, setStats] = useState({
    open: 0,
    closed: 0,
    in_progress: 0,
    on_hold: 0,
  });
  const [userType, setUserType] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getDashboardData(), getUserInfo()])
      .then(([d, u]) => {
        setStats({
          open: d.data.data.open,
          closed: d.data.data.closed,
          in_progress: d.data.data.in_progress,
          on_hold: d.data.data.on_hold,
        });
        setUserType(u.data.data[0].user_type);
      })
      .catch(() =>
        setAlertCtx({
          title: "Error",
          message: "Failed to load dashboard.",
          type: "error",
        }),
      )
      .finally(() => setLoading(false));
  }, []);

  const navigateTo = (status) => {
    setSelectedStatus(status);
    router.push("/my-tickets");
  };

  const total = stats.open + stats.closed + stats.in_progress + stats.on_hold;
  const chart = {
    series:
      userType === "client"
        ? [stats.open, stats.in_progress + stats.on_hold, stats.closed]
        : [stats.open, stats.on_hold, stats.in_progress, stats.closed],
    options: {
      colors:
        userType === "client"
          ? ["#1A3954", "#1c8ced", "#8ebee8"]
          : ["#1A3954", "#516f8a", "#1c8ced", "#8ebee8"],
      chart: { type: "pie" },
      labels:
        userType === "client"
          ? ["Open", "Progress", "Closed"]
          : ["Open", "On Hold", "Progress", "Closed"],
      responsive: [
        {
          breakpoint: 480,
          options: { chart: { width: 270 }, legend: { show: false } },
        },
      ],
    },
  };

  if (loading)
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );

  return (
    <div className="px-6 py-6">
      <div className="border border-gray-200 rounded-sm bg-white flex items-center min-h-[52px] px-3 md:px-5 w-full mb-6">
        <h3 className="font-bold text-base md:text-[18px] py-2">Dashboard</h3>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        <Card
          label="Open Tickets"
          count={stats.open}
          color="bg-blue-600"
          onClick={() => navigateTo("open")}
        />
        <Card
          label="In Progress"
          count={stats.in_progress}
          color="bg-green-600"
          onClick={() => navigateTo("in progress")}
        />
        <Card
          label="On Hold"
          count={stats.on_hold}
          color="bg-orange-500"
          onClick={() => navigateTo("on hold")}
        />
        <Card
          label="Closed"
          count={stats.closed}
          color="bg-red-500"
          onClick={() => navigateTo("closed")}
        />
      </div>
      {total > 0 && (
        <div className="bg-white rounded-sm border border-gray-200 p-5 inline-block">
          <p className="text-xs font-semibold text-gray-500 uppercase mb-4">
            Ticket Distribution
          </p>
          <ReactApexChart
            options={chart.options}
            series={chart.series}
            type="pie"
            width={380}
          />
        </div>
      )}
    </div>
  );
}
