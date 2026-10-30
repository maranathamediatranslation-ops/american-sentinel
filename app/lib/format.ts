const dateFormat = new Intl.DateTimeFormat("en-US", {
  year: "numeric",
  month: "long",
  day: "numeric",
  timeZone: "UTC",
});

// "May 19, 2024". UTC so server and browser render the same date.
export function formatDate(value: string | null | undefined): string | null {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : dateFormat.format(date);
}

export function formatCount(value: number): string {
  return value.toLocaleString("en-US");
}

// Many summaries are the item's own first paragraph. Showing the summary as a
// standfirst too would print it twice.
export function summaryRepeatsBody(summary: string | null, body: string) {
  const start = stripHtml(summary).slice(0, 120);
  return start.length > 0 && stripHtml(body).includes(start);
}

// Removes tags for places that show text only (cards, meta descriptions).
// The words themselves are left exactly as stored.
export function stripHtml(html: string | null | undefined): string {
  if (!html) return "";
  return html
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&rsquo;/g, "’")
    .replace(/&lsquo;/g, "‘")
    .replace(/&ldquo;/g, "“")
    .replace(/&rdquo;/g, "”")
    .replace(/&mdash;/g, "—")
    .replace(/&ndash;/g, "–")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();
}
