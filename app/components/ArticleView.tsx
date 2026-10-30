import { Link } from "react-router";

import { Byline } from "./Byline";
import { cardHref, type Card, type Item } from "~/lib/content";
import { formatDate, summaryRepeatsBody } from "~/lib/format";

type Props = {
  article: Item;
  related: Card[];
};

export function ArticleView({ article, related }: Props) {
  const showStandfirst = !summaryRepeatsBody(article.summary, article.body);
  return (
    <article className="page-gutter pt-8 lg:pt-12">
      <header className="flex max-w-[52rem] flex-col gap-4">
        {article.kicker && <p className="text-kicker text-accent">{article.kicker}</p>}
        <h1 className="font-slab text-headline-1">{article.title}</h1>
        {showStandfirst && article.summary && (
          // Stored summary HTML, rendered as written.
          <div
            className="font-serif text-standfirst text-primary [&_p]:m-0"
            dangerouslySetInnerHTML={{ __html: article.summary }}
          />
        )}
      </header>

      <div className="mt-8 grid gap-x-10 gap-y-8 border-t border-rule pt-4 min-[1140px]:grid-cols-[12rem_minmax(0,65ch)_1fr]">
        <Byline
          author={article.author}
          publishedAt={article.publishedAt}
          linkAuthor
          className="flex flex-col gap-1"
        />

        {/* Stored article HTML, rendered exactly as written. */}
        <div
          className="article-body"
          dangerouslySetInnerHTML={{ __html: article.body }}
        />

        {related.length > 0 && (
          <aside aria-labelledby="related" className="min-[1140px]:max-w-80">
            <h2 id="related" className="border-t border-rule pt-3 font-slab text-headline-4 min-[1140px]:border-t-0 min-[1140px]:pt-0">
              More articles
            </h2>
            <ul className="mt-2">
              {related.map((card) => {
                const date = formatDate(card.publishedAt);
                return (
                  <li key={card.slug} className="border-b border-rule py-3">
                    <Link
                      to={cardHref(card)}
                      className="font-slab font-semibold underline-offset-4 hover:underline"
                    >
                      {card.title}
                    </Link>
                    {date && card.publishedAt && (
                      <p className="mt-1 text-meta text-secondary">
                        <time dateTime={card.publishedAt}>{date}</time>
                      </p>
                    )}
                  </li>
                );
              })}
            </ul>
          </aside>
        )}
      </div>
    </article>
  );
}
