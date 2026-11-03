import type { Route } from "./+types/presentation.all";
import { PageHeader } from "~/components/PageHeader";
import { PresentationCard } from "~/components/PresentationCard";
import { Section } from "~/components/Section";
import { listPresentationsBySeries, paths } from "~/lib/content";
import { seo } from "~/lib/seo";

export async function loader() {
  return { series: await listPresentationsBySeries() };
}

export function meta() {
  return seo({
    title: "Presentations",
    description: "Video presentations on religious liberty, grouped into series.",
    path: paths.presentations(),
  });
}

export default function Presentations({ loaderData }: Route.ComponentProps) {
  const { series } = loaderData;
  return (
    <div className="page-gutter">
      <PageHeader title="Presentations" />
      {series.length > 0 ? (
        <div className="flex flex-col gap-16">
          {series.map((group) => (
            <Section
              key={group.slug || "other"}
              id={`series-${group.slug || "other"}`}
              title={group.title}
              image={group.imageUrl}
            >
              {/* Series are sequences, so they are ordered lists. */}
              <ol className="grid gap-x-6 gap-y-8 sm:grid-cols-2 md:grid-cols-3 2xl:grid-cols-4">
                {group.items.map((card) => (
                  <li key={card.id}>
                    {/* Kicker would repeat the section title. */}
                    <PresentationCard card={{ ...card, kicker: null }} />
                  </li>
                ))}
              </ol>
            </Section>
          ))}
        </div>
      ) : (
        <p className="font-serif text-body text-secondary">No presentations yet.</p>
      )}
    </div>
  );
}
