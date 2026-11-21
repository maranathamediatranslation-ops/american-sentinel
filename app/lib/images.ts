import type { CSSProperties } from "react";

import { supabaseUrl } from "./supabase";

// Images live in the public 'covers' bucket. Older rows store a full URL
// (e.g. maranathamedia.com covers); uploads store a storage path.
export const IMAGE_BUCKET = "covers";

// The focal point an editor picked in the admin ("which part of the image to
// keep when it is cropped") travels with the stored value as a URL fragment:
// `articles/123-photo.jpg#focus=50,30` (x and y in percent). A fragment is
// never sent to the server, so the image loads exactly as before, and no
// database column or view has to change. No fragment means the centre.
export type Focus = { x: number; y: number };

const FOCUS_PATTERN = /#focus=(\d{1,3}(?:\.\d+)?),(\d{1,3}(?:\.\d+)?)$/;
const clamp = (n: number) => Math.min(100, Math.max(0, Math.round(n)));

export function splitImage(value: string | null | undefined): { path: string | null; focus: Focus | null } {
  if (!value) return { path: null, focus: null };
  const match = value.match(FOCUS_PATTERN);
  if (!match) return { path: value, focus: null };
  return {
    path: value.slice(0, match.index),
    focus: { x: clamp(Number(match[1])), y: clamp(Number(match[2])) },
  };
}

export function withFocus(path: string | null, focus: Focus | null): string | null {
  if (!path) return null;
  const base = splitImage(path).path;
  if (!focus || (clamp(focus.x) === 50 && clamp(focus.y) === 50)) return base;
  return `${base}#focus=${clamp(focus.x)},${clamp(focus.y)}`;
}

// Public URL for a stored value. The focus fragment is kept on the URL so
// components can read it back with `focusStyle`.
export function imageUrl(value: string | null | undefined): string | null {
  const { path, focus } = splitImage(value);
  if (!path) return null;
  const fragment = focus ? `#focus=${focus.x},${focus.y}` : "";
  if (/^https?:\/\//i.test(path)) return `${path}${fragment}`;
  const clean = path.replace(/^\/+/, "").split("/").map(encodeURIComponent).join("/");
  return `${supabaseUrl}/storage/v1/object/public/${IMAGE_BUCKET}/${clean}${fragment}`;
}

// `object-position` for a cropped (`object-cover`) image, from its URL.
export function focusStyle(url: string | null | undefined): CSSProperties | undefined {
  const { focus } = splitImage(url);
  return focus ? { objectPosition: `${focus.x}% ${focus.y}%` } : undefined;
}

// The URL without the focus fragment, for places outside our pages (og:image).
export function plainImageUrl(url: string | null | undefined): string | null {
  return splitImage(url).path;
}

// True when the value points into our bucket (so it may be deleted when replaced).
export function isStoragePath(path: string | null | undefined): path is string {
  return !!path && !/^https?:\/\//i.test(path);
}
