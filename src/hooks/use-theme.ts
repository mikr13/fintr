import { useCallback, useEffect, useSyncExternalStore } from "react";

type Theme = "light" | "dark" | "system";

const STORAGE_KEY = "fintr-theme";

function getStoredTheme(): Theme {
  if (typeof window === "undefined") return "dark";
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored === "light" || stored === "dark" || stored === "system")
    return stored;
  return "dark";
}

function getSystemPreference(): "light" | "dark" {
  if (typeof window === "undefined") return "dark";
  return window.matchMedia("(prefers-color-scheme: light)").matches
    ? "light"
    : "dark";
}

function resolveTheme(theme: Theme): "light" | "dark" {
  return theme === "system" ? getSystemPreference() : theme;
}

function applyTheme(resolved: "light" | "dark") {
  const root = document.documentElement;
  if (resolved === "light") {
    root.classList.add("light");
    root.classList.remove("dark");
  } else {
    root.classList.remove("light");
    root.classList.add("dark");
  }
}

let listeners: Array<() => void> = [];
let currentTheme: Theme = getStoredTheme();
let currentResolved: "light" | "dark" = resolveTheme(currentTheme);

function subscribe(listener: () => void) {
  listeners = [...listeners, listener];
  return () => {
    listeners = listeners.filter((l) => l !== listener);
  };
}

function emitChange() {
  for (const listener of listeners) {
    listener();
  }
}

function getThemeSnapshot(): Theme {
  return currentTheme;
}

function getResolvedSnapshot(): "light" | "dark" {
  return currentResolved;
}

if (typeof window !== "undefined") {
  applyTheme(currentResolved);

  window
    .matchMedia("(prefers-color-scheme: light)")
    .addEventListener("change", () => {
      if (currentTheme === "system") {
        currentResolved = getSystemPreference();
        applyTheme(currentResolved);
        emitChange();
      }
    });
}

export function useTheme() {
  const theme = useSyncExternalStore(subscribe, getThemeSnapshot, () => "dark" as Theme);
  const resolvedTheme = useSyncExternalStore(subscribe, getResolvedSnapshot, () => "dark" as const);

  useEffect(() => {
    applyTheme(resolvedTheme);
  }, [resolvedTheme]);

  const setTheme = useCallback((newTheme: Theme) => {
    currentTheme = newTheme;
    currentResolved = resolveTheme(newTheme);
    localStorage.setItem(STORAGE_KEY, newTheme);
    applyTheme(currentResolved);
    emitChange();
  }, []);

  return { theme, setTheme, resolvedTheme };
}
