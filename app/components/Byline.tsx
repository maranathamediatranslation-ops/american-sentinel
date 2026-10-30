import { Link } from "react-router";

import { paths, type Person } from "~/lib/content";
import { formatDate } from "~/lib/format";

type Props = {
  author: Person | null;
  publishedAt: string | null;
  // Cards render the name as text, because the whole card is already a link.
  linkAuthor?: boolean;
  className?: string;
};

export function Byline({ author, publishedAt, linkAuthor = false, className = "" }: Props) {
  const date = formatDate(publishedAt);
  if (!author && !date) return null;
  return (
    <div className={className}>
      {author && (
        <p className="text-byline text-primary">
          By{" "}
          {linkAuthor && author.slug ? (
            <Link
              to={paths.author(author.slug)}
              className="text-accent underline-offset-4 hover:underline"
            >
              {author.name}
            </Link>
          ) : (
            author.name
          )}
        </p>
      )}
      {date && publishedAt && (
        <p className="text-meta text-secondary">
          <time dateTime={publishedAt}>{date}</time>
        </p>
      )}
    </div>
  );
}
