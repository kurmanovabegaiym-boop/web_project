"use client";

import { useEffect } from "react";
import { useSettingsStore } from "@/hooks/useSettingsStore";

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const { theme, density, doNotDisturb } = useSettingsStore();

  useEffect(() => {
    // Apply Theme
    const root = document.documentElement;
    root.classList.remove("light", "dark");
    
    if (theme === "system") {
      const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
      root.classList.add(systemTheme);
      root.dataset.theme = systemTheme;
    } else {
      root.classList.add(theme);
      root.dataset.theme = theme;
    }

    // Apply Density
    root.dataset.density = density;

    // Apply DND to dataset (useful for CSS or global selectors if needed)
    root.dataset.dnd = doNotDisturb ? "true" : "false";
    
    // As requested: "(если включен → отключить уведомления и звуки)"
    if (typeof window !== "undefined") {
      (window as any).__DND_ACTIVE__ = doNotDisturb;
      
      // Подавляем системные уведомления если DND включен
      if (doNotDisturb) {
        // override notification methods if any exist
        (window as any).__ORIGINAL_NOTIFICATION__ = (window as any).__ORIGINAL_NOTIFICATION__ || window.Notification;
        window.Notification = function() { return {} } as any;
        Object.assign(window.Notification, (window as any).__ORIGINAL_NOTIFICATION__);
        
        // Подавить Audio если используется для уведомлений
        (window as any).__ORIGINAL_AUDIO__ = (window as any).__ORIGINAL_AUDIO__ || window.Audio;
        window.Audio = function() { 
          return { play: () => Promise.resolve(), pause: () => {} } 
        } as any;
      } else {
        if ((window as any).__ORIGINAL_NOTIFICATION__) {
          window.Notification = (window as any).__ORIGINAL_NOTIFICATION__;
        }
        if ((window as any).__ORIGINAL_AUDIO__) {
          window.Audio = (window as any).__ORIGINAL_AUDIO__;
        }
      }
    }

    console.log("[SETTINGS_APPLIED]", { theme, density, doNotDisturb });
    
  }, [theme, density, doNotDisturb]);

  return <>{children}</>;
}
