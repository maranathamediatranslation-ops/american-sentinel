// Ads: shared by the public site (display) and the admin (editing).
// Table: public.ads (supabase/migrations/20261121000000_ads.sql).
import { imageUrl } from "./images";
import { getSupabase } from "./supabase";

export const AD_SLOTS = {
  left_top: "Left, top",
  left_bottom: "Left, bottom",
  right_top: "Right, top",
  right_bottom: "Right, bottom",
} as const;
export type AdSlot = keyof typeof AD_SLOTS;
export const AD_SLOT_KEYS = Object.keys(AD_SLOTS) as AdSlot[];

export const AD_PAGES = {
  home: "Homepage",
  article: "Each article",
  articles: "Article list",
  book: "Each book",
  books: "Book list",
  presentation: "Each presentation",
  presentations: "Presentation list",
  links: "Links page",
  author: "Author pages",
} as const;
export type AdPage = keyof typeof AD_PAGES;

export type AdKind = "image" | "embed";

// What the public site needs to show one ad.
export type Ad = {
  id: number;
  kind: AdKind;
  slot: AdSlot;
  imageUrl: string | null;
  bannerUrl: string | null;
  linkUrl: string | null;
  alt: string;
  embedHtml: string | null;
  pages: AdPage[];
};

type Row = Record<string, unknown>;
const str = (value: unknown) => (typeof value === "string" && value.trim() ? value : null);

export function isAdSlot(value: unknown): value is AdSlot {
  return typeof value === "string" && value in AD_SLOTS;
}

export function isAdPage(value: unknown): value is AdPage {
  return typeof value === "string" && value in AD_PAGES;
}

// Live ads only: row-level security hides inactive and out-of-schedule rows
// from visitors. Returns [] if the table doesn't exist yet, so the site keeps
// working before the migration runs.
export async function listLiveAds(): Promise<Ad[]> {
  const { data, error } = await getSupabase()
    .from("ads")
    .select("id, kind, slot, image_path, banner_image_path, link_url, alt_text, embed_html, pages, active, starts_at, ends_at")
    .eq("active", true)
    .order("position");
  if (error) return [];
  const now = Date.now();
  return (data as Row[])
    .filter((row) => isAdSlot(row.slot))
    // Signed-in staff can read every row, so check the schedule here too.
    .filter((row) => !row.starts_at || Date.parse(String(row.starts_at)) <= now)
    .filter((row) => !row.ends_at || Date.parse(String(row.ends_at)) > now)
    .map((row) => ({
      id: Number(row.id),
      kind: row.kind === "embed" ? "embed" : "image",
      slot: row.slot as AdSlot,
      imageUrl: imageUrl(str(row.image_path)),
      bannerUrl: imageUrl(str(row.banner_image_path)),
      linkUrl: str(row.link_url),
      alt: str(row.alt_text) ?? "",
      embedHtml: str(row.embed_html),
      pages: Array.isArray(row.pages) ? (row.pages as unknown[]).filter(isAdPage) : [],
    }));
}

// Which kind of page a public URL is, for the per-ad page setting.
export function adPageFor(pathname: string): AdPage | null {
  if (pathname === "/") return "home";
  const map: [RegExp, AdPage][] = [
    [/^\/article\/all\/?$/, "articles"],
    [/^\/article\/view\//, "article"],
    [/^\/book\/all\/?$/, "books"],
    [/^\/book\/view\//, "book"],
    [/^\/presentation\/all\/?$/, "presentations"],
    [/^\/presentation\/view\//, "presentation"],
    [/^\/links\/?$/, "links"],
    [/^\/user\/view\//, "author"],
  ];
  return map.find(([pattern]) => pattern.test(pathname))?.[1] ?? null;
}

function hash(text: string) {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) h = Math.imul(h ^ text.charCodeAt(i), 16777619);
  return h >>> 0;
}

// One ad per slot for this page. When several ads share a slot, the choice
// rotates by visit (`seed`, made once per page load on the server) and by page,
// and is the same on the server and in the browser, so hydration matches.
export function pickAds(ads: Ad[], pathname: string, seed: number): Partial<Record<AdSlot, Ad>> {
  const page = adPageFor(pathname);
  if (!page) return {};
  const picked: Partial<Record<AdSlot, Ad>> = {};
  for (const slot of AD_SLOT_KEYS) {
    const candidates = ads.filter((ad) => ad.slot === slot && (ad.pages.length === 0 || ad.pages.includes(page)));
    if (candidates.length) picked[slot] = candidates[hash(`${seed}:${pathname}:${slot}`) % candidates.length];
  }
  return picked;
}
