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

// Book covers are portrait; everything else is cropped to 16:9.
export function CardImage({
  card,
  className = "",
  eager = false,
}: {
  card: Pick<Card, "imageUrl" | "type">;
  className?: string;
  eager?: boolean;
}) {
  if (!card.imageUrl) return null;
  return (
    <img
      src={card.imageUrl}
      alt=""
      loading={eager ? "eager" : "lazy"}
      decoding="async"
      className={`${card.type === "book" ? "aspect-[2/3]" : "aspect-video"} bg-surface object-cover ${className}`}
    />
  );
}

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
  const titleBlock = (
    <>
      {card.kicker && <p className="truncate text-kicker text-accent">{card.kicker}</p>}
      <Heading className={`font-slab ${headline[size]}`}>
        <Link
          to={cardHref(card)}
          className="after:absolute after:inset-0 group-hover:underline group-hover:decoration-1 group-hover:underline-offset-4"
        >
          {card.title}
        </Link>
      </Heading>
    </>
  );
  if (size === "compact") {
    // Side-column cards keep a thumbnail beside the headline, stretched to the
    // full height of the tightly packed text.
    return (
      <article
        className={`group relative flex h-full gap-3 py-3 transition-colors hover:bg-hover ${rule ? "border-t border-rule" : ""} ${className}`}
      >
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          {titleBlock}
          <Byline author={card.author} publishedAt={card.publishedAt} className="mt-auto" />
        </div>
        {card.imageUrl && (
          <div className="relative w-36 shrink-0 md:w-48 xl:w-32">
            <CardImage card={card} className="absolute inset-0 size-full" />
          </div>
        )}
      </article>
    );
  }

  const summary = stripHtml(card.summary);
  return (
    <article
      className={`group relative flex h-full flex-col gap-3 pt-3 pb-6 transition-colors hover:bg-hover ${rule ? "border-t border-rule" : ""} ${className}`}
    >
      {card.imageUrl && (
        <CardImage
          card={card}
          eager={size === "lead"}
          className={card.type === "book" ? "w-24" : "mb-1 w-full"}
        />
      )}
      {titleBlock}
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
