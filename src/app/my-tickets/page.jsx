"use client";
import TicketListPage from "@/components/shared/TicketListPage";
import { getTicketByStatus } from "@/api/tickets";
export default function MyTicketsPage() { return <TicketListPage title="My Tickets" fetchFn={getTicketByStatus} />; }
