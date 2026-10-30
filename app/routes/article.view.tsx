import { data } from "react-router";

import type { Route } from "./+types/article.view";
import { ArticleView } from "~/components/ArticleView";
import { getItem, listCards, paths } from "~/lib/content";
import { seo } from "~/lib/seo";

export async function loader({ params }: Route.LoaderArgs) {
  const [article, latest] = await Promise.all([
    getItem("article", params.slug),
    listCards("article", 6),
  ]);
  if (!article) throw data(null, { status: 404 });
  const related = latest.filter((card) => card.slug !== article.slug).slice(0, 5);
  return { article, related };
}

export function meta({ loaderData }: Route.MetaArgs) {
  if (!loaderData) return [{ title: "Page not found - American Sentinel" }];
  const { article } = loaderData;
  return seo({
    title: article.title,
    description: article.summary ?? article.body,
    path: paths.article(article.slug),
    type: "article",
    image: article.imageUrl,
  });
}

export default function ArticlePage({ loaderData }: Route.ComponentProps) {
  return <ArticleView {...loaderData} />;
}
