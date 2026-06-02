"use client";
import TicketListPage from "@/components/shared/TicketListPage";
import { forwardChainTickets } from "@/api/tickets";
export default function ForwardedTicketsPage() { return <TicketListPage title="Forwarded Tickets" fetchFn={forwardChainTickets} />; }
