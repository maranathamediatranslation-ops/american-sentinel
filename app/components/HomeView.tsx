import { ArticleCard } from "./ArticleCard";
import { BookCard } from "./BookCard";
import { PresentationCard } from "./PresentationCard";
import { Section } from "./Section";
import { paths, type Card } from "~/lib/content";

type Props = {
  articles: Card[];
  popular: Card[];
  books: Card[];
  presentations: Card[];
};

export function HomeView({ articles, popular, books, presentations }: Props) {
  const [lead, ...rest] = articles;
  const latest = rest.slice(0, 5);
  // The lead is already the biggest story; don't repeat it under Popular.
  const mostRead = popular.filter((card) => card.id !== lead?.id).slice(0, 2);

  return (
    <div className="page-gutter flex flex-col gap-10 pt-4 lg:gap-12 lg:pt-6">
      <h1 className="sr-only">American Sentinel</h1>

      {/* Hero: Popular (left) · lead story (centre) · Latest (right).
          Source order is lead, Popular, Latest, so phones read the lead first;
          from xl the columns are placed with `order`. */}
      <section aria-label="Top stories" className="border-t border-rule pt-3">
        {lead ? (
          <div className="grid grid-cols-1 gap-x-8 gap-y-8 md:grid-cols-2 xl:grid-cols-[minmax(0,1fr)_minmax(0,2fr)_minmax(0,1fr)]">
            <div className="md:col-span-2 xl:order-2 xl:col-span-1">
              <ArticleCard card={lead} size="lead" headingLevel="h2" rule={false} />
            </div>

            {mostRead.length > 0 && (
              <section aria-labelledby="popular" className="xl:order-1">
                <h2 id="popular" className="pb-2 font-slab text-headline-3">
                  Popular
                </h2>
                <ol>
                  {mostRead.map((card) => (
                    <li key={card.id}>
                      <ArticleCard card={card} size="small" />
                    </li>
                  ))}
                </ol>
              </section>
            )}

            {latest.length > 0 && (
              <section aria-labelledby="latest" className="xl:order-3">
                <h2 id="latest" className="pb-2 font-slab text-headline-3">
                  Latest
                </h2>
                <ol>
                  {latest.map((card) => (
                    <li key={card.id}>
                      {/* Headlines only in this column. */}
                      <ArticleCard card={{ ...card, imageUrl: null }} size="compact" />
                    </li>
                  ))}
                </ol>
              </section>
            )}
          </div>
        ) : (
          <p className="font-serif text-body text-secondary">No articles yet.</p>
        )}
      </section>

      {books.length > 0 && (
        <Section id="books" title="Books" more={{ to: paths.books(), label: "All books" }}>
          <ul className="grid grid-cols-2 gap-x-6 gap-y-8 md:grid-cols-4 xl:grid-cols-6">
            {books.map((card) => (
              <li key={card.slug}>
                <BookCard card={card} />
              </li>
            ))}
          </ul>
        </Section>
      )}

      {presentations.length > 0 && (
        <Section
          id="presentations"
          title="Presentations"
          more={{ to: paths.presentations(), label: "All presentations" }}
        >
          <ul className="grid gap-x-6 gap-y-8 sm:grid-cols-2 md:grid-cols-3 2xl:grid-cols-4">
            {presentations.map((card) => (
              <li key={card.slug}>
                <PresentationCard card={card} />
              </li>
            ))}
          </ul>
        </Section>
      )}
    </div>
  );
}
