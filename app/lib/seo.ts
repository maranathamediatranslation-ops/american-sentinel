import type { MetaDescriptor } from "react-router";

import { stripHtml } from "./format";

export const SITE_NAME = "American Sentinel";
export const SITE_URL = (
  import.meta.env.VITE_SITE_URL ?? "https://american-sentinel.com"
).replace(/\/$/, "");

// Cuts at a word boundary near 155 characters.
export function describe(summary: string | null | undefined, max = 155) {
  const text = stripHtml(summary);
  if (text.length <= max) return text;
  const cut = text.slice(0, max - 1);
  const lastSpace = cut.lastIndexOf(" ");
  return `${(lastSpace > 80 ? cut.slice(0, lastSpace) : cut).replace(/[\s,;:.]+$/, "")}…`;
}

type SeoInput = {
  title: string;
  description?: string | null;
  path: string;
  type?: "website" | "article" | "book";
  image?: string | null;
  noindex?: boolean;
};

export function seo({
  title,
  description,
  path,
  type = "website",
  image,
  noindex,
}: SeoInput): MetaDescriptor[] {
  const fullTitle = title === SITE_NAME ? title : `${title} - ${SITE_NAME}`;
  const desc = describe(description);
  const url = `${SITE_URL}${path}`;
  const tags: MetaDescriptor[] = [
    { title: fullTitle },
    { tagName: "link", rel: "canonical", href: url },
    { property: "og:site_name", content: SITE_NAME },
    { property: "og:title", content: title },
    { property: "og:type", content: type === "book" ? "book" : type },
    { property: "og:url", content: url },
    { name: "twitter:card", content: image ? "summary_large_image" : "summary" },
  ];
  if (desc) {
    tags.push(
      { name: "description", content: desc },
      { property: "og:description", content: desc },
    );
  }
  if (image) tags.push({ property: "og:image", content: image });
  if (noindex) tags.push({ name: "robots", content: "noindex" });
  return tags;
}
