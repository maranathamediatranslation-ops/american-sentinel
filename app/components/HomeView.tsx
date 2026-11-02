import { ArticleCard } from "./ArticleCard";
import { BookCard } from "./BookCard";
import { PresentationCard } from "./PresentationCard";
import { Section } from "./Section";
import { paths, type Card } from "~/lib/content";

type Props = {
  articles: Card[];
  books: Card[];
  presentations: Card[];
};

export function HomeView({ articles, books, presentations }: Props) {
  const [lead, ...rest] = articles;
  const side = rest.slice(0, 3);
  const more = rest.slice(3);

  return (
    <div className="page-gutter flex flex-col gap-10 pt-4 lg:gap-12 lg:pt-6">
      <h1 className="sr-only">American Sentinel</h1>

      <Section
        id="latest"
        title="Latest"
        more={{ to: paths.articles(), label: "All articles" }}
        hideHeaderOnMobile
      >
        {lead ? (
          <div className="grid grid-cols-1 gap-x-6 xl:grid-cols-3">
            <div className="xl:col-span-2">
              <ArticleCard card={lead} size="lead" rule={false} />
            </div>
            <div className="flex flex-col">
              {side.map((card, i) => (
                // The first side card shares the section rule once it sits beside the lead.
                <ArticleCard
                  key={card.slug}
                  card={card}
                  size="compact"
                  className={i === 0 ? "xl:border-t-0" : ""}
                />
              ))}
            </div>
            {more.length > 0 && (
              <ul className="grid grid-cols-1 gap-x-6 md:grid-cols-3 xl:col-span-3">
                {more.map((card) => (
                  <li key={card.slug}>
                    <ArticleCard card={card} />
                  </li>
                ))}
              </ul>
            )}
          </div>
        ) : (
          <p className="font-serif text-body text-secondary">No articles yet.</p>
        )}
      </Section>

      {books.length > 0 && (
        <Section id="books" title="Books" more={{ to: paths.books(), label: "All books" }}>
          <ul className="grid grid-cols-2 gap-x-6 gap-y-8 md:grid-cols-4">
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
          <ul className="grid gap-x-6 gap-y-8 sm:grid-cols-2 md:grid-cols-3">
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
