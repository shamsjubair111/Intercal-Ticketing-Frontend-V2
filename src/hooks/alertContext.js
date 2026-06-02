"use client";
import React, { createContext, useState, useContext } from "react";

export const alertContext = createContext();

export const AlertProvider = ({ children }) => {
  const [alert, setAlert] = useState({ title: "", message: "", type: "" });

  const setAlertCtx = (data) => {
    setAlert(data);
    setTimeout(() => setAlert({ title: "", message: "", type: "" }), 4000);
  };

  return (
    <alertContext.Provider value={{ ...alert, setAlertCtx }}>
      {children}
      {alert.message && (
        <div className={`fixed bottom-6 right-6 z-[9999] rounded-md shadow-lg px-5 py-3 text-white text-sm font-medium transition-all ${
          alert.type === "success" ? "bg-green-600" : alert.type === "error" ? "bg-red-600" : "bg-blue-600"
        }`}>
          <p className="font-semibold">{alert.title}</p>
          <p>{alert.message}</p>
        </div>
      )}
    </alertContext.Provider>
  );
};

export const useAlert = () => useContext(alertContext);
