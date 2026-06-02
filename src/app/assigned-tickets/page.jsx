"use client";
import TicketListPage from "@/components/shared/TicketListPage";
import { getAssignedTicket } from "@/api/tickets";
export default function AssignedTicketsPage() { return <TicketListPage title="Assigned Tickets" fetchFn={getAssignedTicket} />; }
