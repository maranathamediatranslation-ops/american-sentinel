import { getSupabase } from "./supabase";
import { imageUrl } from "./images";

// Column names verified against the live project on 2026-10-30 by reading rows
// with the anon key. Replace the Row casts with generated types once
// app/lib/database.types.ts exists.

export type ContentType = "article" | "book" | "presentation";

export type Person = { name: string; slug: string | null };

export type Card = {
  id: number;
  type: ContentType;
  slug: string;
  title: string;
  summary: string | null;
  publishedAt: string | null;
  author: Person | null;
  // Category for articles, series for presentations.
  kicker: string | null;
  imageUrl: string | null;
};

export type Item = Card & { body: string };

export type BookDetails = {
  format: string | null;
  pageCount: number | null;
  bookDownloads: number;
  audioDownloads: number;
};

export type Presentation = {
  contentId: number;
  videoProvider: string;
  videoRef: string;
  seriesPosition: number | null;
  series: { slug: string; title: string } | null;
};

export type LinkRow = {
  id: number;
  title: string;
  url: string;
  description: string | null;
  imageUrl: string | null;
};

type Row = Record<string, unknown>;

const str = (v: unknown) => (typeof v === "string" && v !== "" ? v : null);
const num = (v: unknown) => (typeof v === "number" ? v : null);

function toCard(row: Row): Card {
  const authorName = str(row.author_name);
  return {
    id: Number(row.id),
    type: row.type as ContentType,
    slug: String(row.slug),
    title: String(row.title ?? ""),
    summary: str(row.summary),
    publishedAt: str(row.published_at),
    author: authorName ? { name: authorName, slug: str(row.author_slug) } : null,
    kicker: str(row.taxonomy_title),
    imageUrl: imageUrl(str(row.cover_path)),
  };
}

function toPresentation(row: Row): Presentation {
  const series = row.series as Row | null;
  return {
    contentId: Number(row.content_id),
    videoProvider: String(row.video_provider ?? ""),
    videoRef: String(row.video_ref ?? ""),
    seriesPosition: num(row.series_position),
    series: series ? { slug: String(series.slug), title: String(series.title) } : null,
  };
}

export function videoThumbnail(p: Pick<Presentation, "videoProvider" | "videoRef">) {
  return p.videoProvider === "youtube" && p.videoRef
    ? `https://i.ytimg.com/vi/${encodeURIComponent(p.videoRef)}/hqdefault.jpg`
    : null;
}

async function presentationsFor(ids: number[]) {
  if (ids.length === 0) return new Map<number, Presentation>();
  const { data, error } = await getSupabase()
    .from("presentations")
    .select("content_id, series_position, video_provider, video_ref, series(slug, title)")
    .in("content_id", ids);
  if (error) throw new Error(`presentations: ${error.message}`);
  return new Map((data as Row[]).map((row) => [Number(row.content_id), toPresentation(row)]));
}

// Presentation cards take their kicker (series) and image (video thumbnail)
// from the presentations table.
async function withPresentationData(cards: Card[]) {
  const byId = await presentationsFor(cards.filter((c) => c.type === "presentation").map((c) => c.id));
  return cards.map((card) => {
    const p = byId.get(card.id);
    if (!p) return card;
    return {
      ...card,
      kicker: card.kicker ?? p.series?.title ?? null,
      imageUrl: card.imageUrl ?? videoThumbnail(p),
    };
  });
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
  const cards = (data as Row[]).map(toCard);
  return type === "presentation" ? withPresentationData(cards) : cards;
}

// Most-read items by view count. Editors can keep an item out of this list
// with content_items.exclude_from_most_read.
export async function listPopular(type: ContentType, limit: number) {
  const { data, error } = await getSupabase()
    .from("content_cards")
    .select("*")
    .eq("type", type)
    .eq("exclude_from_most_read", false)
    .order("view_count", { ascending: false })
    .limit(limit);
  if (error) throw new Error(`content_cards popular (${type}): ${error.message}`);
  return (data as Row[]).map(toCard);
}

// The body comes from content_items; author and category come from the
// content_cards view, which already joins them.
export async function getItem(type: ContentType, slug: string): Promise<Item | null> {
  const supabase = getSupabase();
  const [item, card] = await Promise.all([
    supabase
      .from("content_items")
      .select("id, body")
      .eq("type", type)
      .eq("slug", slug)
      .eq("status", "published")
      .maybeSingle(),
    supabase.from("content_cards").select("*").eq("type", type).eq("slug", slug).maybeSingle(),
  ]);
  if (item.error) throw new Error(`content_items (${type}/${slug}): ${item.error.message}`);
  if (card.error) throw new Error(`content_cards (${type}/${slug}): ${card.error.message}`);
  if (!item.data || !card.data) return null;
  return { ...toCard(card.data as Row), body: String((item.data as Row).body ?? "") };
}

export async function getBookDetails(contentId: number): Promise<BookDetails> {
  const supabase = getSupabase();
  const [book, totals] = await Promise.all([
    supabase
      .from("books")
      .select("page_count, book_formats(title)")
      .eq("content_id", contentId)
      .maybeSingle(),
    supabase
      .from("content_download_totals")
      .select("book_downloads, audio_downloads")
      .eq("content_id", contentId)
      .maybeSingle(),
  ]);
  if (book.error) throw new Error(`books (${contentId}): ${book.error.message}`);
  if (totals.error) throw new Error(`content_download_totals (${contentId}): ${totals.error.message}`);
  const b = (book.data ?? {}) as Row;
  const t = (totals.data ?? {}) as Row;
  return {
    format: str((b.book_formats as Row | null)?.title),
    pageCount: num(b.page_count),
    bookDownloads: num(t.book_downloads) ?? 0,
    audioDownloads: num(t.audio_downloads) ?? 0,
  };
}

export async function getPresentation(contentId: number) {
  return (await presentationsFor([contentId])).get(contentId) ?? null;
}

// Other presentations in the same series, in series order.
export async function listSeriesPresentations(seriesSlug: string) {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("presentations")
    .select("content_id, series_position, video_provider, video_ref, series!inner(slug, title)")
    .eq("series.slug", seriesSlug)
    .order("series_position", { ascending: true, nullsFirst: false });
  if (error) throw new Error(`presentations (${seriesSlug}): ${error.message}`);
  const presentations = (data as Row[]).map(toPresentation);
  const cards = await cardsById(presentations.map((p) => p.contentId));
  return presentations.flatMap((p) => {
    const card = cards.get(p.contentId);
    return card ? [{ ...card, kicker: p.series?.title ?? null, imageUrl: card.imageUrl ?? videoThumbnail(p) }] : [];
  });
}

async function cardsById(ids: number[]) {
  if (ids.length === 0) return new Map<number, Card>();
  const { data, error } = await getSupabase().from("content_cards").select("*").in("id", ids);
  if (error) throw new Error(`content_cards: ${error.message}`);
  return new Map((data as Row[]).map((row) => [Number(row.id), toCard(row)]));
}

// All presentations grouped by series, series in their set order.
export async function listPresentationsBySeries() {
  const supabase = getSupabase();
  const [cards, rows] = await Promise.all([
    listCards("presentation"),
    supabase
      .from("presentations")
      .select("content_id, series_position, video_provider, video_ref, series(slug, title, position, image_path)"),
  ]);
  if (rows.error) throw new Error(`presentations: ${rows.error.message}`);
  const byId = new Map((rows.data as Row[]).map((row) => [Number(row.content_id), row]));

  const groups = new Map<
    string,
    { slug: string; title: string; position: number; imageUrl: string | null; items: (Card & { order: number })[] }
  >();
  for (const card of cards) {
    const row = byId.get(card.id);
    const series = (row?.series ?? null) as Row | null;
    const key = series ? String(series.slug) : "";
    if (!groups.has(key)) {
      groups.set(key, {
        slug: key,
        title: series ? String(series.title) : "Other presentations",
        position: series ? (num(series.position) ?? 999) : 1000,
        imageUrl: series ? imageUrl(str(series.image_path)) : null,
        items: [],
      });
    }
    groups.get(key)!.items.push({ ...card, order: num(row?.series_position) ?? 999 });
  }
  return [...groups.values()]
    .sort((a, b) => a.position - b.position || a.title.localeCompare(b.title))
    .map((g) => ({ ...g, items: g.items.sort((a, b) => a.order - b.order) }));
}

export async function listLinks(): Promise<LinkRow[]> {
  const { data, error } = await getSupabase()
    .from("links")
    // "*" so this works before and after links.image_path is added.
    .select("*")
    .order("position", { ascending: true, nullsFirst: false });
  if (error) throw new Error(`links: ${error.message}`);
  return (data as Row[]).map((row) => ({
    id: Number(row.id),
    title: String(row.title ?? ""),
    url: String(row.url ?? ""),
    description: str(row.description),
    imageUrl: imageUrl(str(row.image_path)),
  }));
}

export type MediaFile = { id: number; kind: string; label: string | null };

// Downloadable files for an item. The URL itself is not sent to the page:
// links go through /download/:id, which counts the download first.
export async function listMediaFiles(contentId: number): Promise<MediaFile[]> {
  const { data, error } = await getSupabase()
    .from("media_files")
    .select("id, kind, label")
    .eq("content_id", contentId)
    .order("position", { ascending: true });
  if (error) throw new Error(`media_files (${contentId}): ${error.message}`);
  return (data as Row[]).map((row) => ({
    id: Number(row.id),
    kind: String(row.kind),
    label: str(row.label),
  }));
}

// Counts the download and returns the file URL, or null if the file or its
// item isn't published.
export async function registerDownload(mediaFileId: number) {
  const { data, error } = await getSupabase().rpc("register_download", {
    p_media_file_id: mediaFileId,
  });
  if (error) throw new Error(`register_download (${mediaFileId}): ${error.message}`);
  return str(data);
}

export type PersonPage = { id: number; slug: string; name: string; bio: string | null };

export async function getPerson(slug: string): Promise<PersonPage | null> {
  const { data, error } = await getSupabase()
    .from("people")
    .select("id, slug, display_name, bio")
    .eq("slug", slug)
    .maybeSingle();
  if (error) throw new Error(`people (${slug}): ${error.message}`);
  if (!data) return null;
  const row = data as Row;
  return { id: Number(row.id), slug: String(row.slug), name: String(row.display_name), bio: str(row.bio) };
}

// Everything a person wrote, narrated or presented, newest first.
export async function listByPerson(personId: number) {
  const { data, error } = await getSupabase()
    .from("content_contributors")
    .select("content_id, role")
    .eq("person_id", personId);
  if (error) throw new Error(`content_contributors (${personId}): ${error.message}`);
  const roles = new Map<number, string[]>();
  for (const row of data as Row[]) {
    const id = Number(row.content_id);
    roles.set(id, [...(roles.get(id) ?? []), String(row.role)]);
  }
  const cards = await withPresentationData([...(await cardsById([...roles.keys()])).values()]);
  return cards
    .map((card) => ({ ...card, roles: roles.get(card.id) ?? [] }))
    .sort((a, b) => (b.publishedAt ?? "").localeCompare(a.publishedAt ?? ""));
}

export const paths = {
  home: () => "/",
  articles: () => "/article/all",
  article: (slug: string) => `/article/view/${slug}`,
  books: () => "/book/all",
  book: (slug: string) => `/book/view/${slug}`,
  presentations: () => "/presentation/all",
  presentation: (slug: string) => `/presentation/view/${slug}`,
  author: (slug: string) => `/user/view/${slug}`,
  download: (mediaFileId: number) => `/download/${mediaFileId}`,
  links: () => "/links",
};

export function cardHref(card: Pick<Card, "type" | "slug">) {
  if (card.type === "book") return paths.book(card.slug);
  if (card.type === "presentation") return paths.presentation(card.slug);
  return paths.article(card.slug);
}
