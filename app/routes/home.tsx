import type { Route } from "./+types/home";
import { HomeView } from "~/components/HomeView";
import { listCards, listPopular } from "~/lib/content";
import { SITE_NAME, seo } from "~/lib/seo";

export async function loader() {
  const [articles, popular, books, presentations] = await Promise.all([
    // Lead story + 5 for the Latest column.
    listCards("article", 6),
    // 2 for Popular, plus one in case the lead story is among the most read.
    listPopular("article", 3),
    listCards("book", 4),
    listCards("presentation", 3),
  ]);
  return { articles, popular, books, presentations };
}

export function meta() {
  return seo({
    title: SITE_NAME,
    description:
      "Articles, books and presentations on religious liberty and the separation of church and state.",
    path: "/",
  });
}

export default function Home({ loaderData }: Route.ComponentProps) {
  return <HomeView {...loaderData} />;
}
