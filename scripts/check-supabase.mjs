// Diagnoses "TypeError: fetch failed" by showing the underlying network error.
// Run from the project folder: node scripts/check-supabase.mjs
import { readFileSync } from "node:fs";
import { lookup } from "node:dns/promises";

const env = Object.fromEntries(
  readFileSync(".env", "utf8")
    .split(/\r?\n/)
    .filter((l) => l.includes("=") && !l.startsWith("#"))
    .map((l) => [l.slice(0, l.indexOf("=")).trim(), l.slice(l.indexOf("=") + 1).trim()]),
);
const url = env.VITE_SUPABASE_URL;
const key = env.VITE_SUPABASE_ANON_KEY;
console.log("node", process.version, "| url", JSON.stringify(url), "| key length", key?.length);
for (const name of ["HTTP_PROXY", "HTTPS_PROXY", "NO_PROXY", "NODE_OPTIONS", "NODE_TLS_REJECT_UNAUTHORIZED", "NODE_EXTRA_CA_CERTS", "NODE_USE_ENV_PROXY"]) {
  const v = process.env[name] ?? process.env[name.toLowerCase()];
  if (v) console.log(`env ${name}=${v}`);
}
try {
  const host = new URL(url).hostname;
  console.log("dns", host, "->", (await lookup(host, { all: true })).map((a) => a.address).join(", "));
} catch (e) {
  console.log("DNS/URL FAILED:", e.code ?? "", e.message);
}
try {
  const res = await fetch(`${url}/rest/v1/content_cards?select=id&type=eq.book`, {
    headers: { apikey: key, Authorization: `Bearer ${key}` },
    signal: AbortSignal.timeout(15000),
  });
  console.log("fetch OK:", res.status, (await res.text()).slice(0, 120));
} catch (e) {
  console.log("FETCH FAILED:", e.message);
  let c = e.cause;
  while (c) {
    console.log("  cause:", c.code ?? "", c.message ?? c);
    c = c.cause;
  }
}
