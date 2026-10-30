// Placeholder content for the dev-only design previews (/dev/home, /dev/article).
// Not real articles; never imported by production routes.
import type { Card, Item } from "~/lib/content";

const author = { name: "Sample Author", slug: "sample-author" };

const titles = [
  "Placeholder headline long enough to wrap onto a second line at most widths",
  "A shorter placeholder headline",
  "Placeholder headline for a compact card in the side column",
  "Third side-column headline, also placeholder",
  "Placeholder headline for the grid below the lead story",
  "Another placeholder headline of medium length",
  "Placeholder",
  "A deliberately long placeholder headline to test how three-line headlines sit in the grid beside shorter ones",
  "Placeholder headline nine",
  "Placeholder headline ten",
];

const summary =
  "Placeholder summary. This sentence stands in for the article’s stored summary so the card and standfirst sizes can be judged at a realistic length, roughly two lines on desktop.";

export const sampleArticles: Card[] = titles.map((title, i) => ({
  id: i + 1,
  type: "article",
  slug: `sample-${i + 1}`,
  title,
  summary,
  publishedAt: new Date(Date.UTC(2024, 4, 19 - i * 3)).toISOString(),
  author: i % 3 === 2 ? null : author,
  kicker: i % 2 === 0 ? "Sample series name" : null,
  imageUrl: null,
}));

export const sampleBooks: Card[] = [
  "Placeholder book title",
  "A longer placeholder book title that wraps",
  "Booklet title",
  "Fourth placeholder book",
].map((title, i) => ({
  id: 100 + i,
  type: "book",
  slug: `sample-book-${i + 1}`,
  title,
  summary,
  publishedAt: null,
  author,
  kicker: null,
  imageUrl: null,
}));

export const samplePresentations: Card[] = [1, 2, 3].map((n) => ({
  id: 200 + n,
  type: "presentation",
  slug: `sample-presentation-${n}`,
  title: `Placeholder presentation ${n}`,
  summary: null,
  publishedAt: new Date(Date.UTC(2023, 8, n * 7)).toISOString(),
  author,
  kicker: "Sample presentation series",
  imageUrl: null,
}));

const paragraph =
  "This is placeholder text for checking the article page. It runs long enough to show the measure, the line height and the rhythm between paragraphs, which is what readers of long historical texts notice first. It contains no real source material.";

// Mimics the markup of a Word export: inline styles, footnote anchors
// (#_ftn1 ↔ #_ftnref1) and the footnote list appended to the body.
const body = `
<p class="MsoNormal" style="font-family:'Times New Roman';font-size:12pt">${paragraph} A footnote reference follows this sentence.<a href="#_ftn1" name="_ftnref1" title=""><sup>[1]</sup></a></p>
<p>${paragraph}</p>
<blockquote><p>Placeholder block quote. Reprinted texts quote earlier sources at length, so this block runs to several lines to show the inset, the rule and the slightly smaller size against the body text around it. (Sample source, January 1, 1890)</p></blockquote>
<p>${paragraph} <em>An italic phrase</em> and <strong>a bold phrase</strong> show the serif’s true italic and weight. A second footnote reference.<a href="#_ftn2" name="_ftnref2" title=""><sup>[2]</sup></a></p>
<h2>Placeholder subheading</h2>
<p>${paragraph}</p>
<blockquote><p>A second, shorter placeholder quotation.</p></blockquote>
<p>${paragraph} <a href="#">A link inside the body text</a> shows the link color and underline.</p>
<h3>Placeholder third-level heading</h3>
<p>${paragraph}</p>
<div style="mso-element:footnote-list"><br clear="all"><hr align="left" size="1" width="33%">
<div style="mso-element:footnote" id="ftn1"><p class="MsoFootnoteText"><a href="#_ftnref1" name="_ftn1" title="">[1]</a> Placeholder footnote one. Footnotes cite sources and dates.</p></div>
<div style="mso-element:footnote" id="ftn2"><p class="MsoFootnoteText"><a href="#_ftnref2" name="_ftn2" title="">[2]</a> Placeholder footnote two, longer, so that it wraps onto a second line and shows the footnote line height on the surface panel.</p></div>
</div>`;

export const sampleArticle: Item = {
  ...sampleArticles[0],
  slug: "sample-article",
  body,
};
