// Public-site colour theme. Light unless the reader picked dark with the
// switcher. Stored in a cookie (not localStorage) so the server renders the
// chosen theme and the page never flashes the wrong one.
export type Theme = "light" | "dark";

const COOKIE = "theme";
const ONE_YEAR = 60 * 60 * 24 * 365;

export function themeFromCookie(header: string | null): Theme {
  const match = header?.match(/(?:^|;\s*)theme=(light|dark)(?:;|$)/);
  return match?.[1] === "dark" ? "dark" : "light";
}

// Browser only: applies the theme immediately and remembers it.
export function applyTheme(theme: Theme) {
  document.documentElement.dataset.theme = theme;
  document.cookie = `${COOKIE}=${theme}; Path=/; Max-Age=${ONE_YEAR}; SameSite=Lax`;
}
