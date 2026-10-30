import { getSupabase } from "./supabase";

// UNVERIFIED COLUMN NAMES. Every column this app reads is mapped in this file
// only. Check them against app/lib/database.types.ts once it is generated.

export type ContentType = "article" | "book" | "presentation";

export type Person = { name: string; slug: string | null };

export type Card = {
  type: ContentType;
  slug: string;
  title: string;
  summary: string | null;
  publishedAt: string | null;
  author: Person | null;
  series: string | null;
  imageUrl: string | null;
};

export type Article = Card & {
  body: string;
};

type Row = Record<string, unknown>;

const str = (v: unknown) => (typeof v === "string" && v !== "" ? v : null);

function person(row: Row): Person | null {
  const name = str(row.author_name);
  return name ? { name, slug: str(row.author_slug) } : null;
}

function toCard(row: Row): Card {
  return {
    type: row.type as ContentType,
    slug: String(row.slug),
    title: String(row.title ?? ""),
    summary: str(row.summary),
    publishedAt: str(row.published_at),
    author: person(row),
    series: str(row.series_title),
    imageUrl: str(row.image_url) ?? str(row.cover_url),
  };
}

export async function listCards(type: ContentType, limit?: number) {
  let query = getSupabase()
    .from("content_cards")
    .select("*")
    .eq("type", type)
    .order("published_at", { ascending: false, nullsFirst: false });
  if (limit) query = query.limit(limit);
  const { data, error } = await query;
  if (error) throw new Error(`content_cards (${type}): ${error.message}`);
  return (data as Row[]).map(toCard);
}

export async function getItem(
  type: ContentType,
  slug: string,
): Promise<Article | null> {
  const { data, error } = await getSupabase()
    .from("content_items")
    .select("*")
    .eq("type", type)
    .eq("slug", slug)
    .maybeSingle();
  if (error) throw new Error(`content_items (${type}/${slug}): ${error.message}`);
  if (!data) return null;
  const row = data as Row;
  return { ...toCard(row), type, body: String(row.body ?? "") };
}

export const paths = {
  home: () => "/",
  articles: () => "/article/all",
  article: (slug: string) => `/article/view/${slug}`,
  articlePrint: (slug: string) => `/article/print/${slug}`,
  books: () => "/book/all",
  book: (slug: string) => `/book/view/${slug}`,
  presentations: () => "/presentation/all",
  presentation: (slug: string) => `/presentation/view/${slug}`,
  author: (slug: string) => `/user/view/${slug}`,
  links: () => "/links",
};

export function cardHref(card: Pick<Card, "type" | "slug">) {
  if (card.type === "book") return paths.book(card.slug);
  if (card.type === "presentation") return paths.presentation(card.slug);
  return paths.article(card.slug);
}
