import { data, redirect } from "react-router";

import type { Route } from "./+types/user.view";
import { ArticleCard } from "~/components/ArticleCard";
import { PageHeader } from "~/components/PageHeader";
import { getPerson, listByPerson, paths } from "~/lib/content";
import { seo } from "~/lib/seo";

const roleLabel: Record<string, string> = {
  author: "Author",
  narrator: "Narrator",
  presenter: "Presenter",
  translator: "Translator",
  editor: "Editor",
};

export async function loader({ params }: Route.LoaderArgs) {
  // Old links use mixed case, e.g. /user/view/Sean.
  const lower = params.slug.toLowerCase();
  if (lower !== params.slug) throw redirect(paths.author(lower), 301);
  const person = await getPerson(params.slug);
  if (!person) throw data(null, { status: 404 });
  return { person, items: await listByPerson(person.id) };
}

export function meta({ loaderData }: Route.MetaArgs) {
  if (!loaderData) return [{ title: "Page not found - American Sentinel" }];
  const { person, items } = loaderData;
  return seo({
    title: person.name,
    description: person.bio ?? `Articles, books and presentations by ${person.name}.`,
    path: paths.author(person.slug),
    image: items.find((i) => i.imageUrl)?.imageUrl,
  });
}

export default function PersonPage({ loaderData }: Route.ComponentProps) {
  const { person, items } = loaderData;
  return (
    <div className="page-gutter">
      <PageHeader title={person.name}>
        {person.bio && (
          <div
            className="font-serif text-standfirst [&_p]:mb-3"
            dangerouslySetInnerHTML={{ __html: person.bio }}
          />
        )}
      </PageHeader>
      {items.length > 0 ? (
        <ul className="grid grid-cols-1 gap-x-6 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
          {items.map((item) => (
            <li key={item.id}>
              <ArticleCard
                card={{
                  ...item,
                  // Say what kind of item it is and the person's part in it.
                  kicker: [
                    { article: "Article", book: "Book", presentation: "Presentation" }[item.type],
                    item.roles
                      // Authors and presenters are implied; name only other roles, e.g. narrator.
                      .filter((r) => r !== "author" && !(r === "presenter" && item.type === "presentation"))
                      .map((r) => roleLabel[r] ?? r)
                      .join(", "),
                  ]
                    .filter(Boolean)
                    .join(", "),
                  author: null,
                }}
                headingLevel="h2"
              />
            </li>
          ))}
        </ul>
      ) : (
        <p className="font-serif text-body text-secondary">Nothing published yet.</p>
      )}
    </div>
  );
}
