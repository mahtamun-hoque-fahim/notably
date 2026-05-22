"use client";

import { useEffect } from "react";

interface ShortcutMap {
  [combo: string]: (e: KeyboardEvent) => void;
}

/**
 * Binds keyboard shortcuts.
 * Keys: "cmd+k", "ctrl+n", "escape", etc.
 */
export function useKeyboardShortcuts(shortcuts: ShortcutMap) {
  useEffect(() => {
    function handler(e: KeyboardEvent) {
      const isMac = navigator.platform.toUpperCase().includes("MAC");
      const mod = isMac ? e.metaKey : e.ctrlKey;
      const key = e.key.toLowerCase();

      for (const combo of Object.keys(shortcuts)) {
        const parts = combo.toLowerCase().split("+");
        const needsMod = parts.includes("cmd") || parts.includes("ctrl");
        const needsShift = parts.includes("shift");
        const comboKey = parts[parts.length - 1];

        if (
          key === comboKey &&
          (!needsMod || mod) &&
          (!needsShift || e.shiftKey)
        ) {
          shortcuts[combo](e);
          return;
        }
      }
    }

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [shortcuts]);
}
