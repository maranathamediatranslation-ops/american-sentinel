import { Moon } from "lucide-react";
import { useState } from "react";
import { useRouteLoaderData } from "react-router";

import type { loader as rootLoader } from "~/root";
import { applyTheme, type Theme } from "~/lib/theme";

// A toggle button: "Dark mode", pressed or not. Light is the default.
export function ThemeToggle() {
  const serverTheme = useRouteLoaderData<typeof rootLoader>("root")?.theme ?? "light";
  // The root loader doesn't re-run on navigation, so after a toggle its value
  // is stale. Outside of hydration, the page's own attribute is the truth.
  const [theme, setTheme] = useState<Theme>(() =>
    typeof document !== "undefined" && document.documentElement.dataset.theme === "dark"
      ? "dark"
      : serverTheme,
  );
  const dark = theme === "dark";

  function toggle() {
    const next: Theme = dark ? "light" : "dark";
    applyTheme(next);
    setTheme(next);
  }

  return (
    <button
      type="button"
      aria-pressed={dark}
      onClick={toggle}
      className={`inline-flex min-h-11 items-center gap-2 rounded-control border px-3 text-label transition-colors ${
        dark
          ? "border-on-masthead-muted bg-on-masthead-muted text-masthead"
          : "border-on-masthead-muted/50 text-on-masthead-muted hover:border-on-masthead-muted hover:text-on-masthead"
      }`}
    >
      <Moon aria-hidden="true" className="size-4" />
      {/* The name stays "Dark mode"; aria-pressed says whether it's on. */}
      <span className="sr-only sm:not-sr-only">Dark mode</span>
    </button>
  );
}
