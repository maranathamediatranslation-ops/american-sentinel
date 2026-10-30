import { Link } from "react-router";

import { cardHref, type Card } from "~/lib/content";

export function BookCard({ card }: { card: Card }) {
  return (
    <article className="group relative flex flex-col gap-3">
      <div className="relative aspect-[2/3] overflow-hidden bg-surface">
        {card.imageUrl ? (
          <img
            src={card.imageUrl}
            alt=""
            loading="lazy"
            className="absolute inset-0 h-full w-full object-cover"
          />
        ) : (
          // Typographic cover when no image exists.
          <div
            aria-hidden="true"
            className="h-full border-t-4 border-accent p-4 font-slab text-headline-4 text-primary"
          >
            {card.title}
          </div>
        )}
      </div>
      <h3 className="font-slab text-headline-4">
        <Link
          to={cardHref(card)}
          className="after:absolute after:inset-0 group-hover:underline group-hover:decoration-1 group-hover:underline-offset-4"
        >
          {card.title}
        </Link>
      </h3>
      {card.author && <p className="text-byline text-secondary">{card.author.name}</p>}
    </article>
  );
}
