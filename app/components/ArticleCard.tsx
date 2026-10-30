import { Link } from "react-router";

import { Byline } from "./Byline";
import { cardHref, type Card } from "~/lib/content";
import { stripHtml } from "~/lib/format";

type Props = {
  card: Card;
  // "lead" is the first story on the homepage; "compact" drops the summary.
  size?: "lead" | "standard" | "compact";
  headingLevel?: "h2" | "h3";
  // Off for cards that sit directly under a section rule, to avoid a double line.
  rule?: boolean;
  className?: string;
};

const headline = {
  lead: "text-display",
  standard: "text-headline-4",
  compact: "text-headline-4",
};

export function ArticleCard({
  card,
  size = "standard",
  headingLevel = "h3",
  rule = true,
  className = "",
}: Props) {
  const Heading = headingLevel;
  const summary = size === "compact" ? "" : stripHtml(card.summary);
  return (
    <article
      className={`group relative flex h-full flex-col gap-3 pt-3 pb-6 transition-colors hover:bg-hover ${rule ? "border-t border-rule" : ""} ${className}`}
    >
      {card.kicker && <p className="text-kicker text-accent">{card.kicker}</p>}
      <Heading className={`font-slab ${headline[size]}`}>
        <Link
          to={cardHref(card)}
          className="after:absolute after:inset-0 group-hover:underline group-hover:decoration-1 group-hover:underline-offset-4"
        >
          {card.title}
        </Link>
      </Heading>
      {summary && (
        <p
          className={
            size === "lead"
              ? "font-serif text-standfirst text-primary"
              : // Headlines only on phones keeps the stacked list short.
                "hidden font-serif text-quote text-secondary md:line-clamp-3"
          }
        >
          {summary}
        </p>
      )}
      <Byline
        author={card.author}
        publishedAt={card.publishedAt}
        className={size === "lead" ? "" : "mt-auto"}
      />
    </article>
  );
}
