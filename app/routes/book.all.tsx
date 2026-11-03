import type { Route } from "./+types/book.all";
import { BookCard } from "~/components/BookCard";
import { PageHeader } from "~/components/PageHeader";
import { listCards, paths } from "~/lib/content";
import { seo } from "~/lib/seo";

export async function loader() {
  return { books: await listCards("book") };
}

export function meta() {
  return seo({
    title: "Books",
    description: "Books and booklets on religious liberty, with PDF and audiobook downloads.",
    path: paths.books(),
  });
}

export default function Books({ loaderData }: Route.ComponentProps) {
  const { books } = loaderData;
  return (
    <div className="page-gutter">
      <PageHeader title="Books" />
      {books.length > 0 ? (
        <ul className="grid grid-cols-2 gap-x-6 gap-y-10 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-8">
          {books.map((card) => (
            <li key={card.id}>
              <BookCard card={card} />
            </li>
          ))}
        </ul>
      ) : (
        <p className="font-serif text-body text-secondary">No books yet.</p>
      )}
    </div>
  );
}
