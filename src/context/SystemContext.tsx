"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

type SystemType = "MDR" | "MPR";

interface SystemContextType {
  system: SystemType;
  setSystem: (system: SystemType) => void;
}

const SystemContext = createContext<SystemContextType | undefined>(undefined);

export function SystemProvider({ children }: { children: React.ReactNode }) {
  const [system, setSystem] = useState<SystemType>("MDR");

  // Load from localStorage on mount
  useEffect(() => {
    const savedSystem = localStorage.getItem("activeSystem") as SystemType;
    if (savedSystem === "MDR" || savedSystem === "MPR") {
      setSystem(savedSystem);
    }
  }, []);

  // Save to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem("activeSystem", system);
  }, [system]);

  return (
    <SystemContext.Provider value={{ system, setSystem }}>
      {children}
    </SystemContext.Provider>
  );
}

export function useSystem() {
  const context = useContext(SystemContext);
  if (context === undefined) {
    throw new Error("useSystem must be used within a SystemProvider");
  }
  return context;
}
