import { useEffect, useRef, useState } from "react";
import { Link } from "react-router";

import { AdStack, usePageAds } from "./Ads";
import { Byline } from "./Byline";
import { cardHref, type Card, type Item } from "~/lib/content";
import { summaryRepeatsBody } from "~/lib/format";
import { focusStyle } from "~/lib/images";

type Props = {
  article: Item;
  related: Card[];
};

// The sidebar sticks 24px from the top. When it's taller than the screen
// (e.g. with an ad under the list), it sticks by its bottom edge instead, so
// all of it can still be seen while the article scrolls.
function useStickySidebar() {
  const ref = useRef<HTMLElement>(null);
  const [top, setTop] = useState(24);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const update = () => setTop(Math.min(24, window.innerHeight - el.offsetHeight - 24));
    update();
    const observer = new ResizeObserver(update);
    observer.observe(el);
    window.addEventListener("resize", update);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", update);
    };
  }, []);
  return { ref, top };
}

// Body and sidebar columns, from 1140px.
const columns =
  "min-[1140px]:grid min-[1140px]:grid-cols-[minmax(0,42rem)_minmax(18rem,1fr)] min-[1140px]:gap-x-12";

export function ArticleView({ article, related }: Props) {
  const showStandfirst = !summaryRepeatsBody(article.summary, article.body);
  const ads = usePageAds();
  const sidebar = useStickySidebar();
  return (
    <article className="page-gutter pt-8 lg:pt-12">
      <div className="mx-auto max-w-[52rem] min-[1140px]:max-w-[68rem]">
        {/* Title, summary and byline span the full width of the image below. */}
        <header className="flex flex-col gap-4">
          {article.kicker && <p className="text-kicker text-accent">{article.kicker}</p>}
          {/* Pretty wrapping (not balance) so the title fills the width. */}
          <h1 className="font-slab text-headline-1 [text-wrap:pretty]">{article.title}</h1>
          {showStandfirst && article.summary && (
            // Stored summary HTML, rendered as written.
            <div
              className="font-serif text-standfirst text-primary [&_p]:m-0"
              dangerouslySetInnerHTML={{ __html: article.summary }}
            />
          )}
          <Byline
            author={article.author}
            publishedAt={article.publishedAt}
            linkAuthor
            className="flex flex-col gap-1 border-t border-rule pt-3"
          />
        </header>

        {article.imageUrl && (
          <figure className="mt-8">
            <img
              src={article.imageUrl}
              alt=""
              style={focusStyle(article.imageUrl)}
              className="aspect-video w-full object-cover"
            />
          </figure>
        )}

        <div className={`mt-8 flex flex-col gap-12 ${columns}`}>
          {/* Stored article HTML, rendered exactly as written. */}
          <div
            className="article-body"
            dangerouslySetInnerHTML={{ __html: article.body }}
          />

          {related.length > 0 && (
            <aside
              ref={sidebar.ref}
              aria-labelledby="related"
              style={{ top: sidebar.top }}
              className="min-[1140px]:sticky min-[1140px]:self-start"
            >
              <h2
                id="related"
                className="border-t border-rule pt-3 font-slab text-headline-4 min-[1140px]:border-t-0 min-[1140px]:pt-0"
              >
                More articles
              </h2>
              <ul className="mt-2">
                {related.map((card) => (
                  <li key={card.slug} className="border-b border-rule">
                    <Link
                      to={cardHref(card)}
                      className="group flex items-start gap-4 py-3 transition-colors hover:bg-hover focus-visible:bg-hover"
                    >
                      <div className="min-w-0 flex-1">
                        <p
                          title={card.title}
                          className="line-clamp-2 font-slab font-semibold group-hover:line-clamp-none group-focus-visible:line-clamp-none"
                        >
                          {card.title}
                        </p>
                        {card.author && (
                          <p className="mt-1 text-meta text-secondary">{card.author.name}</p>
                        )}
                      </div>
                      {card.imageUrl && (
                        <img
                          src={card.imageUrl}
                          alt=""
                          style={focusStyle(card.imageUrl)}
                          loading="lazy"
                          decoding="async"
                          className="aspect-square w-20 shrink-0 bg-surface object-cover"
                        />
                      )}
                    </Link>
                  </li>
                ))}
              </ul>
              {/* Below the rail width, the left top ad sits here; the others
                  go above the footer (routes/layout.tsx). */}
              <AdStack ads={[ads.left_top]} />
            </aside>
          )}
        </div>
      </div>
    </article>
  );
}
