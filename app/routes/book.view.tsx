import { data } from "react-router";

import type { Route } from "./+types/book.view";
import { Byline } from "~/components/Byline";
import { getBookDetails, getItem, listMediaFiles, paths } from "~/lib/content";
import { formatCount, summaryRepeatsBody } from "~/lib/format";
import { seo } from "~/lib/seo";

export async function loader({ params }: Route.LoaderArgs) {
  const book = await getItem("book", params.slug);
  if (!book) throw data(null, { status: 404 });
  const [details, files] = await Promise.all([getBookDetails(book.id), listMediaFiles(book.id)]);
  return { book, details, files };
}

const fileLabel: Record<string, string> = {
  book_pdf: "Download PDF",
  book_epub: "Download EPUB",
  audio_full: "Download audiobook",
  audio_chapters: "Download audiobook chapters",
  audio: "Download audio",
  powerpoint: "Download PowerPoint",
  transcript: "Download transcript",
};

export function meta({ loaderData }: Route.MetaArgs) {
  if (!loaderData) return [{ title: "Page not found - American Sentinel" }];
  const { book } = loaderData;
  return seo({
    title: book.title,
    description: book.summary ?? book.body,
    path: paths.book(book.slug),
    type: "book",
    image: book.imageUrl,
  });
}

export default function BookPage({ loaderData }: Route.ComponentProps) {
  const { book, details, files } = loaderData;
  const primaryId = (files.find((f) => f.kind === "book_pdf") ?? files[0])?.id;
  const facts = [
    details.format,
    details.pageCount ? `${formatCount(details.pageCount)} pages` : null,
  ].filter(Boolean);

  return (
    <article className="page-gutter pt-8 lg:pt-12">
      <div className="mx-auto max-w-[calc(16rem+3rem+65ch)] min-[1140px]:max-w-[76rem]">
        <div className="grid gap-8 md:grid-cols-[minmax(0,16rem)_1fr] lg:gap-12">
          <div className="mx-auto w-full max-w-64 md:mx-0">
            {book.imageUrl ? (
              <img src={book.imageUrl} alt={`Cover of ${book.title}`} className="w-full" />
            ) : (
              <div
                aria-hidden="true"
                className="aspect-[2/3] border-t-4 border-accent bg-surface p-4 font-slab text-headline-4"
              >
                {book.title}
              </div>
            )}
          </div>

          <div className="flex max-w-[65ch] flex-col gap-4 min-[1140px]:max-w-none">
            {facts.length > 0 && <p className="text-kicker text-accent">{facts.join(", ")}</p>}
            <h1 className="font-slab text-headline-1">{book.title}</h1>
            <Byline author={book.author} publishedAt={book.publishedAt} linkAuthor />
            {book.summary && !summaryRepeatsBody(book.summary, book.body) && (
              // Stored summary HTML, rendered as written.
              <div
                className="max-w-[65ch] font-serif text-standfirst [&_p]:mb-3"
                dangerouslySetInnerHTML={{ __html: book.summary }}
              />
            )}
            {files.length > 0 && (
              <ul className="flex flex-wrap gap-3 pt-2">
                {files.map((file) => (
                  <li key={file.id}>
                    {/* nofollow: crawlers following these would inflate the counts. */}
                    <a
                      href={paths.download(file.id)}
                      rel="nofollow"
                      className={`inline-flex min-h-11 items-center rounded-control px-5 text-label transition-colors ${
                        file.id === primaryId
                          ? "bg-accent text-on-accent hover:bg-masthead hover:text-on-masthead"
                          : "border border-accent text-accent hover:bg-accent-tint"
                      }`}
                    >
                      {fileLabel[file.kind] ?? file.label ?? "Download"}
                    </a>
                  </li>
                ))}
              </ul>
            )}
            <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 border-t border-rule pt-4 text-meta">
              <dt className="text-secondary">PDF downloads</dt>
              <dd className="tabular-nums">{formatCount(details.bookDownloads)}</dd>
              <dt className="text-secondary">Audiobook downloads</dt>
              <dd className="tabular-nums">{formatCount(details.audioDownloads)}</dd>
            </dl>
          </div>
        </div>

        {book.body && (
          <div className="mt-12 border-t border-rule pt-8 md:ms-[calc(16rem+3rem)]">
            <div
              className="article-body"
              dangerouslySetInnerHTML={{ __html: book.body }}
            />
          </div>
        )}
      </div>
    </article>
  );
}
