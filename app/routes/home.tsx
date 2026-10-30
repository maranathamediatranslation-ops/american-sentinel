import type { Route } from "./+types/home";
import { HomeView } from "~/components/HomeView";
import { listCards } from "~/lib/content";
import { SITE_NAME, seo } from "~/lib/seo";

export async function loader() {
  const [articles, books, presentations] = await Promise.all([
    listCards("article", 10),
    listCards("book", 4),
    listCards("presentation", 3),
  ]);
  return { articles, books, presentations };
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
