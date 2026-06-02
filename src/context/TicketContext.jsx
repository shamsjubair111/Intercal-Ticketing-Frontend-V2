"use client";
import { createContext, useContext, useState } from "react";

const TicketContext = createContext();

export function TicketProvider({ children }) {
  const [selectedStatus, setSelectedStatus] = useState("");
  return (
    <TicketContext.Provider value={{ selectedStatus, setSelectedStatus }}>
      {children}
    </TicketContext.Provider>
  );
}

export function useTicketContext() {
  return useContext(TicketContext);
}
