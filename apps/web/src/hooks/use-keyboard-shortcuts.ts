import { useEffect } from "react";

type ShortcutHandler = () => void;

interface ShortcutConfig {
  key: string;
  handler: ShortcutHandler;
  description: string;
  requiresNoModifiers?: boolean;
}

export function useKeyboardShortcuts(shortcuts: ShortcutConfig[]) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Ignore shortcuts when typing in inputs, textareas, or content-editable elements
      const target = event.target as HTMLElement;
      const isInput =
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.tagName === "SELECT" ||
        target.isContentEditable;

      for (const shortcut of shortcuts) {
        const matchesKey = event.key === shortcut.key;
        const noModifiers = !(
          event.ctrlKey ||
          event.metaKey ||
          event.altKey ||
          event.shiftKey
        );

        // Skip if we're in an input and the shortcut requires no modifiers
        if (isInput && shortcut.requiresNoModifiers !== false) {
          continue;
        }

        if (matchesKey && (shortcut.requiresNoModifiers ? noModifiers : true)) {
          event.preventDefault();
          shortcut.handler();
          break;
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [shortcuts]);
}

export const SHORTCUTS_HELP = [
  { key: "n", description: "Nuovo appartamento" },
  { key: "/", description: "Cerca zona" },
  { key: "m", description: "Cambia vista (Lista/Mappa)" },
  { key: "s", description: "Vai a Statistiche" },
  { key: "Escape", description: "Chiudi form/modal" },
  { key: "?", description: "Mostra shortcuts" },
];
