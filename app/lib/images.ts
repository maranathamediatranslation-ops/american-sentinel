import { supabaseUrl } from "./supabase";

// Images live in the public 'covers' bucket. Older rows store a full URL
// (e.g. maranathamedia.com covers); uploads store a storage path.
export const IMAGE_BUCKET = "covers";

export function imageUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  if (/^https?:\/\//i.test(path)) return path;
  const clean = path.replace(/^\/+/, "").split("/").map(encodeURIComponent).join("/");
  return `${supabaseUrl}/storage/v1/object/public/${IMAGE_BUCKET}/${clean}`;
}

// True when the value points into our bucket (so it may be deleted when replaced).
export function isStoragePath(path: string | null | undefined): path is string {
  return !!path && !/^https?:\/\//i.test(path);
}
