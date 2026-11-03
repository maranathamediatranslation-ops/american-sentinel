import type { Route } from "./+types/article.all";
import { ArticleCard } from "~/components/ArticleCard";
import { PageHeader } from "~/components/PageHeader";
import { listCards, paths } from "~/lib/content";
import { seo } from "~/lib/seo";

export async function loader() {
  return { articles: await listCards("article") };
}

export function meta() {
  return seo({
    title: "Articles",
    description: "Articles on religious liberty and the separation of church and state.",
    path: paths.articles(),
  });
}

export default function Articles({ loaderData }: Route.ComponentProps) {
  const { articles } = loaderData;
  return (
    <div className="page-gutter">
      <PageHeader title="Articles" />
      {articles.length > 0 ? (
        <ul className="grid grid-cols-1 gap-x-6 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
          {articles.map((card) => (
            <li key={card.id}>
              <ArticleCard card={card} headingLevel="h2" />
            </li>
          ))}
        </ul>
      ) : (
        <p className="font-serif text-body text-secondary">No articles yet.</p>
      )}
    </div>
  );
}
