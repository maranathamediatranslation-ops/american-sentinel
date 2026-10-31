// Admin data access. Browser only: every call runs with the signed-in user's
// session, so Row Level Security decides what they may read and change.
import { IMAGE_BUCKET, isStoragePath } from "./images";
import { getSupabase } from "./supabase";

type Row = Record<string, unknown>;

export type ContentType = "article" | "book" | "presentation";
export type ContentStatus = "draft" | "scheduled" | "published" | "hidden" | "archived";
export const STATUSES: ContentStatus[] = ["draft", "scheduled", "published", "hidden", "archived"];

export type Permission =
  | "admin"
  | "manage_content"
  | "publish_content"
  | "manage_people"
  | "manage_store"
  | "manage_contacts"
  | "manage_settings"
  | "view_stats";

// URL segment → content type, and back.
export const SECTIONS = {
  articles: { type: "article", label: "Articles", singular: "article" },
  books: { type: "book", label: "Books", singular: "book" },
  presentations: { type: "presentation", label: "Presentations", singular: "presentation" },
} as const;
export type Section = keyof typeof SECTIONS;

export function isSection(value: string | undefined): value is Section {
  return !!value && value in SECTIONS;
}

const db = () => getSupabase();

function fail(context: string, error: { message: string } | null): never {
  throw new Error(`${context}: ${error?.message ?? "unknown error"}`);
}

// ---------------------------------------------------------------------------
// Session & permissions
// ---------------------------------------------------------------------------

export async function getSessionUser() {
  const { data } = await db().auth.getSession();
  return data.session?.user ?? null;
}

export async function signIn(email: string, password: string) {
  const { error } = await db().auth.signInWithPassword({ email, password });
  return error?.message ?? null;
}

export async function signOut() {
  await db().auth.signOut();
}

export async function getPermissions(userId: string): Promise<Permission[]> {
  const { data, error } = await db()
    .from("profile_permissions")
    .select("permission")
    .eq("profile_id", userId);
  if (error) fail("profile_permissions", error);
  return (data as Row[]).map((r) => r.permission as Permission);
}

export function can(perms: Permission[], needed: Permission) {
  return perms.includes("admin") || perms.includes(needed);
}

// ---------------------------------------------------------------------------
// Dashboard
// ---------------------------------------------------------------------------

export type DashboardRow = {
  type: string;
  published: number;
  drafts: number;
  views: number;
  downloads: number;
};

export async function dashboardCounts(): Promise<DashboardRow[]> {
  const { data, error } = await db().from("dashboard_counts").select("*");
  if (error) fail("dashboard_counts", error);
  return (data as Row[]).map((r) => ({
    type: String(r.type),
    published: Number(r.published ?? 0),
    drafts: Number(r.drafts ?? 0),
    views: Number(r.views ?? 0),
    downloads: Number(r.downloads ?? 0),
  }));
}

// ---------------------------------------------------------------------------
// Content (articles, books, presentations)
// ---------------------------------------------------------------------------

export type ContentListItem = {
  id: number;
  title: string;
  slug: string;
  status: ContentStatus;
  publishedAt: string | null;
  coverPath: string | null;
  updatedAt: string;
};

export async function listContent(type: ContentType): Promise<ContentListItem[]> {
  const { data, error } = await db()
    .from("content_items")
    .select("id, title, slug, status, published_at, cover_path, updated_at")
    .eq("type", type)
    .order("updated_at", { ascending: false });
  if (error) fail(`content_items (${type})`, error);
  return (data as Row[]).map((r) => ({
    id: Number(r.id),
    title: String(r.title),
    slug: String(r.slug),
    status: r.status as ContentStatus,
    publishedAt: (r.published_at as string) ?? null,
    coverPath: (r.cover_path as string) ?? null,
    updatedAt: String(r.updated_at),
  }));
}

export type ContentRecord = {
  id: number | null;
  type: ContentType;
  title: string;
  slug: string;
  summary: string;
  body: string;
  status: ContentStatus;
  publishedAt: string | null;
  taxonomyId: number | null;
  coverPath: string | null;
  personId: number | null;
  // book
  formatId: number | null;
  pageCount: number | null;
  // presentation
  seriesId: number | null;
  seriesPosition: number | null;
  videoRef: string;
};

export function emptyContent(type: ContentType): ContentRecord {
  return {
    id: null,
    type,
    title: "",
    slug: "",
    summary: "",
    body: "",
    status: "draft",
    publishedAt: null,
    taxonomyId: null,
    coverPath: null,
    personId: null,
    formatId: null,
    pageCount: null,
    seriesId: null,
    seriesPosition: null,
    videoRef: "",
  };
}

const primaryRole = (type: ContentType) => (type === "presentation" ? "presenter" : "author");

export async function getContent(type: ContentType, id: number): Promise<ContentRecord | null> {
  const supabase = db();
  const { data, error } = await supabase
    .from("content_items")
    .select("id, type, title, slug, summary, body, status, published_at, taxonomy_id, cover_path")
    .eq("type", type)
    .eq("id", id)
    .maybeSingle();
  if (error) fail(`content_items (${id})`, error);
  if (!data) return null;
  const r = data as Row;

  const [contributor, book, presentation] = await Promise.all([
    supabase
      .from("content_contributors")
      .select("person_id")
      .eq("content_id", id)
      .eq("role", primaryRole(type))
      .order("position")
      .limit(1)
      .maybeSingle(),
    type === "book"
      ? supabase.from("books").select("format_id, page_count").eq("content_id", id).maybeSingle()
      : Promise.resolve({ data: null, error: null }),
    type === "presentation"
      ? supabase
          .from("presentations")
          .select("series_id, series_position, video_ref")
          .eq("content_id", id)
          .maybeSingle()
      : Promise.resolve({ data: null, error: null }),
  ]);
  const b = (book.data ?? {}) as Row;
  const p = (presentation.data ?? {}) as Row;

  return {
    id: Number(r.id),
    type,
    title: String(r.title ?? ""),
    slug: String(r.slug ?? ""),
    summary: String(r.summary ?? ""),
    body: String(r.body ?? ""),
    status: r.status as ContentStatus,
    publishedAt: (r.published_at as string) ?? null,
    taxonomyId: (r.taxonomy_id as number) ?? null,
    coverPath: (r.cover_path as string) ?? null,
    personId: ((contributor.data as Row | null)?.person_id as number) ?? null,
    formatId: (b.format_id as number) ?? null,
    pageCount: (b.page_count as number) ?? null,
    seriesId: (p.series_id as number) ?? null,
    seriesPosition: (p.series_position as number) ?? null,
    videoRef: String(p.video_ref ?? ""),
  };
}

// Saves the item, its type-specific row and its primary author/presenter.
// Returns the item id.
export async function saveContent(record: ContentRecord): Promise<number> {
  const supabase = db();
  const values = {
    type: record.type,
    title: record.title,
    slug: record.slug,
    summary: record.summary || null,
    body: record.body || null,
    status: record.status,
    published_at: record.publishedAt,
    taxonomy_id: record.taxonomyId,
    cover_path: record.coverPath,
  };

  let id = record.id;
  if (id) {
    const { error } = await supabase.from("content_items").update(values).eq("id", id);
    if (error) fail("Saving", error);
  } else {
    const { data, error } = await supabase.from("content_items").insert(values).select("id").single();
    if (error) fail("Creating", error);
    id = Number((data as Row).id);
  }

  if (record.type === "book") {
    const { error } = await supabase
      .from("books")
      .upsert({ content_id: id, format_id: record.formatId, page_count: record.pageCount });
    if (error) fail("Saving book details", error);
  }
  if (record.type === "presentation") {
    const { error } = await supabase.from("presentations").upsert({
      content_id: id,
      series_id: record.seriesId,
      series_position: record.seriesPosition,
      video_provider: "youtube",
      video_ref: record.videoRef || null,
    });
    if (error) fail("Saving video details", error);
  }

  const role = primaryRole(record.type);
  const { error: clearError } = await supabase
    .from("content_contributors")
    .delete()
    .eq("content_id", id)
    .eq("role", role);
  if (clearError) fail("Updating author", clearError);
  if (record.personId) {
    const { error } = await supabase
      .from("content_contributors")
      .insert({ content_id: id, person_id: record.personId, role, position: 1 });
    if (error) fail("Updating author", error);
  }

  return id;
}

export async function deleteContent(id: number, coverPath: string | null) {
  const { error } = await db().from("content_items").delete().eq("id", id);
  if (error) fail("Deleting", error);
  await removeImage(coverPath);
}

// ---------------------------------------------------------------------------
// Links
// ---------------------------------------------------------------------------

export type LinkRecord = {
  id: number | null;
  title: string;
  url: string;
  description: string;
  position: number;
  imagePath: string | null;
};

function toLink(r: Row): LinkRecord {
  return {
    id: Number(r.id),
    title: String(r.title ?? ""),
    url: String(r.url ?? ""),
    description: String(r.description ?? ""),
    position: Number(r.position ?? 0),
    imagePath: (r.image_path as string) ?? null,
  };
}

export async function listLinks(): Promise<LinkRecord[]> {
  const { data, error } = await db().from("links").select("*").order("position");
  if (error) fail("links", error);
  return (data as Row[]).map(toLink);
}

export async function getLink(id: number): Promise<LinkRecord | null> {
  const { data, error } = await db().from("links").select("*").eq("id", id).maybeSingle();
  if (error) fail(`links (${id})`, error);
  return data ? toLink(data as Row) : null;
}

export async function saveLink(link: LinkRecord): Promise<number> {
  const values: Row = {
    title: link.title,
    url: link.url,
    description: link.description || null,
    position: link.position,
    image_path: link.imagePath,
  };
  if (link.id) {
    const { error } = await db().from("links").update(values).eq("id", link.id);
    if (error) fail("Saving link", error);
    return link.id;
  }
  const { data, error } = await db().from("links").insert(values).select("id").single();
  if (error) fail("Creating link", error);
  return Number((data as Row).id);
}

export async function deleteLink(id: number, imagePath: string | null) {
  const { error } = await db().from("links").delete().eq("id", id);
  if (error) fail("Deleting link", error);
  await removeImage(imagePath);
}

// ---------------------------------------------------------------------------
// Options for selects
// ---------------------------------------------------------------------------

export type Option = { id: number; label: string };

async function options(table: string, label: string, filter?: [string, string]) {
  let query = db().from(table).select(`id, ${label}`).order(label);
  if (filter) query = query.eq(filter[0], filter[1]);
  const { data, error } = await query;
  if (error) fail(table, error);
  return (data as unknown as Row[]).map((r) => ({ id: Number(r.id), label: String(r[label]) }));
}

export async function contentOptions(type: ContentType) {
  const taxonomyKind = { article: "article_category", book: "book_theme", presentation: "presentation_theme" }[type];
  const [taxonomies, people, formats, series] = await Promise.all([
    options("taxonomies", "title", ["kind", taxonomyKind]),
    options("people", "display_name"),
    type === "book" ? options("book_formats", "title") : Promise.resolve([] as Option[]),
    type === "presentation" ? options("series", "title") : Promise.resolve([] as Option[]),
  ]);
  return { taxonomies, people, formats, series };
}

// ---------------------------------------------------------------------------
// Images
// ---------------------------------------------------------------------------

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/avif"];

export function checkImage(file: File): string | null {
  if (!IMAGE_TYPES.includes(file.type)) return "Choose a JPEG, PNG, WebP, GIF or AVIF image.";
  if (file.size > MAX_IMAGE_BYTES) return "Choose an image smaller than 5 MB.";
  return null;
}

// Uploads to covers/<folder>/<timestamp>-<name> and returns the storage path.
export async function uploadImage(file: File, folder: string): Promise<string> {
  const name = file.name
    .toLowerCase()
    .replace(/[^a-z0-9.]+/g, "-")
    .replace(/^-+|-+$/g, "");
  const path = `${folder}/${Date.now()}-${name || "image"}`;
  const { error } = await db()
    .storage.from(IMAGE_BUCKET)
    .upload(path, file, { contentType: file.type, cacheControl: "31536000" });
  if (error) fail("Uploading image", error);
  return path;
}

// Removes an uploaded image. Full URLs (images hosted elsewhere) are left alone.
export async function removeImage(path: string | null) {
  if (!isStoragePath(path)) return;
  await db().storage.from(IMAGE_BUCKET).remove([path]);
}

// ---------------------------------------------------------------------------
// Form helpers
// ---------------------------------------------------------------------------

export function slugify(text: string) {
  return text
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120);
}

export const SLUG_PATTERN = /^[a-z0-9][a-z0-9-]*$/;

// Accepts a YouTube URL or a bare video ID and returns the ID.
export function youtubeId(input: string) {
  const value = input.trim();
  if (!value) return "";
  try {
    const url = new URL(value);
    if (url.hostname.endsWith("youtu.be")) return url.pathname.slice(1);
    const v = url.searchParams.get("v");
    if (v) return v;
    const match = url.pathname.match(/\/(?:embed|shorts|live)\/([^/?]+)/);
    if (match) return match[1];
  } catch {
    // Not a URL: treat it as an ID.
  }
  return value;
}
