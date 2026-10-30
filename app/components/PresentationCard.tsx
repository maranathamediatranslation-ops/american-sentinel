import { Link } from "react-router";

import { cardHref, type Card } from "~/lib/content";
import { formatDate } from "~/lib/format";

export function PresentationCard({ card }: { card: Card }) {
  const date = formatDate(card.publishedAt);
  return (
    <article className="group relative flex flex-col gap-3">
      <div className="aspect-video overflow-hidden bg-surface">
        {card.imageUrl && (
          <img
            src={card.imageUrl}
            alt=""
            loading="lazy"
            className="h-full w-full object-cover"
          />
        )}
      </div>
      {card.series && <p className="text-kicker text-accent">{card.series}</p>}
      <h3 className="font-slab text-headline-4">
        <Link
          to={cardHref(card)}
          className="after:absolute after:inset-0 group-hover:underline group-hover:decoration-1 group-hover:underline-offset-4"
        >
          {card.title}
        </Link>
      </h3>
      {date && card.publishedAt && (
        <p className="text-meta text-secondary">
          <time dateTime={card.publishedAt}>{date}</time>
        </p>
      )}
    </article>
  );
}
