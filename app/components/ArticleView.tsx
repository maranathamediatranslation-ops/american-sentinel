import { Link } from "react-router";

import { CardImage } from "./ArticleCard";
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
      <header className="mx-auto flex max-w-[65ch] flex-col gap-4 min-[1140px]:max-w-[76rem]">
        {article.kicker && <p className="text-kicker text-accent">{article.kicker}</p>}
        <h1 className="font-slab text-headline-1">{article.title}</h1>
        {showStandfirst && article.summary && (
          // Stored summary HTML, rendered as written.
          <div
            className="max-w-[52rem] font-serif text-standfirst text-primary [&_p]:m-0"
            dangerouslySetInnerHTML={{ __html: article.summary }}
          />
        )}
      </header>

      {article.imageUrl && (
        <figure className="mx-auto mt-8 max-w-[52rem] min-[1140px]:max-w-[76rem]">
          <img src={article.imageUrl} alt="" className="aspect-video w-full object-cover" />
        </figure>
      )}

      <div className="mx-auto mt-8 grid max-w-[65ch] gap-x-10 gap-y-8 border-t border-rule pt-4 min-[1140px]:max-w-[76rem] min-[1140px]:grid-cols-[minmax(15rem,1fr)_minmax(0,42rem)_minmax(15rem,1fr)]">
        <Byline
          author={article.author}
          publishedAt={article.publishedAt}
          linkAuthor
          className="flex flex-col gap-1 min-[1140px]:justify-self-end min-[1140px]:text-right"
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
                  <li key={card.slug} className="flex items-start gap-3 border-b border-rule py-3">
                    <div className="min-w-0 flex-1">
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
                    </div>
                    <CardImage card={card} className="w-20 shrink-0" />
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
