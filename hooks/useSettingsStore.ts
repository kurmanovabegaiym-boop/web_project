import { create } from "zustand";
import { persist } from "zustand/middleware";

interface SettingsState {
  theme: "light" | "dark" | "system";
  setTheme: (theme: "light" | "dark" | "system") => void;
  
  doNotDisturb: boolean;
  setDoNotDisturb: (dnd: boolean) => void;
  
  density: "compact" | "normal" | "spacious";
  setDensity: (density: "compact" | "normal" | "spacious") => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      theme: "dark", // default theme
      setTheme: (theme) => set({ theme }),
      
      doNotDisturb: false,
      setDoNotDisturb: (doNotDisturb) => set({ doNotDisturb }),
      
      density: "normal",
      setDensity: (density) => set({ density }),
    }),
    {
      name: "messenger-settings", // key in localStorage
    }
  )
);
