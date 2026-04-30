"use client";
import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

type Theme = "light" | "dark";

function readInitial(): Theme {
  if (typeof document === "undefined") return "light";
  // Source of truth on the client: the data-theme attribute the server
  // already stamped on <html> from the cookie via middleware.
  const attr = document.documentElement.getAttribute("data-theme");
  if (attr === "dark" || attr === "light") return attr;
  // First-ever visit fallback: respect prefers-color-scheme.
  if (window.matchMedia?.("(prefers-color-scheme: dark)").matches) return "dark";
  return "light";
}

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("light");

  useEffect(() => {
    setTheme(readInitial());
  }, []);

  function flip() {
    const next: Theme = theme === "dark" ? "light" : "dark";
    setTheme(next);
    document.documentElement.setAttribute("data-theme", next);
    document.cookie = `theme=${next}; path=/; max-age=31536000; samesite=lax`;
    try { localStorage.setItem("theme", next); } catch {}
  }

  return (
    <button
      onClick={flip}
      className="w-10 h-10 border-[3px] border-black bg-white text-black hover:bg-black hover:text-white inline-flex items-center justify-center transition-colors"
      aria-label={theme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
      title={theme === "dark" ? "Light" : "Dark"}
    >
      {theme === "dark" ? <Sun className="w-4 h-4" strokeWidth={3} /> : <Moon className="w-4 h-4" strokeWidth={3} />}
    </button>
  );
}
