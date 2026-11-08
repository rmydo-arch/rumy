import { createContext, useContext, useState, type ReactNode } from "react";
import { createFilterEngine } from "./filterEngine";
import type { ImageEngine } from "./types";

const EngineContext = createContext<ImageEngine | null>(null);

export function EngineProvider({ engine, children }: { engine?: ImageEngine; children: ReactNode }) {
  const [value] = useState<ImageEngine>(() => engine ?? createFilterEngine());
  return <EngineContext.Provider value={value}>{children}</EngineContext.Provider>;
}

export function useEngine(): ImageEngine {
  const ctx = useContext(EngineContext);
  if (!ctx) throw new Error("useEngine must be used inside EngineProvider");
  return ctx;
}
