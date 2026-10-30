import { data, Link } from "react-router";

import type { Route } from "./+types/presentation.view";
import { Byline } from "~/components/Byline";
import { VideoPlayer } from "~/components/VideoPlayer";
import { getItem, getPresentation, listSeriesPresentations, paths } from "~/lib/content";
import { seo } from "~/lib/seo";

export async function loader({ params }: Route.LoaderArgs) {
  const item = await getItem("presentation", params.slug);
  if (!item) throw data(null, { status: 404 });
  const video = await getPresentation(item.id);
  const series = video?.series ? await listSeriesPresentations(video.series.slug) : [];
  return { item, video, series };
}

export function meta({ loaderData }: Route.MetaArgs) {
  if (!loaderData) return [{ title: "Page not found - American Sentinel" }];
  const { item, series } = loaderData;
  return seo({
    title: item.title,
    description: item.summary ?? item.body,
    path: paths.presentation(item.slug),
    type: "article",
    image: series.find((s) => s.id === item.id)?.imageUrl ?? item.imageUrl,
  });
}

export default function PresentationPage({ loaderData }: Route.ComponentProps) {
  const { item, video, series } = loaderData;
  return (
    <article className="page-gutter pt-8 lg:pt-12">
      <header className="flex max-w-[52rem] flex-col gap-4">
        {video?.series && <p className="text-kicker text-accent">{video.series.title}</p>}
        <h1 className="font-slab text-headline-1">{item.title}</h1>
      </header>

      <div className="mt-8 grid gap-x-10 gap-y-8 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="flex flex-col gap-6">
          {video && <VideoPlayer video={video} title={item.title} />}
          <Byline author={item.author} publishedAt={item.publishedAt} linkAuthor />
          {item.summary && (
            <div
              className="article-body"
              dangerouslySetInnerHTML={{ __html: item.summary }}
            />
          )}
          {item.body && (
            <div className="article-body" dangerouslySetInnerHTML={{ __html: item.body }} />
          )}
        </div>

        {series.length > 1 && video?.series && (
          <aside aria-labelledby="series">
            <h2 id="series" className="border-t border-rule pt-3 font-slab text-headline-4">
              {video.series.title}
            </h2>
            <ol className="mt-2 list-decimal ps-6 marker:text-meta marker:text-secondary">
              {series.map((card) => (
                <li key={card.id} className="border-b border-rule py-3">
                  {card.id === item.id ? (
                    <span aria-current="page" className="font-slab font-semibold">
                      {card.title}
                    </span>
                  ) : (
                    <Link
                      to={paths.presentation(card.slug)}
                      className="font-slab font-semibold text-accent underline-offset-4 hover:underline"
                    >
                      {card.title}
                    </Link>
                  )}
                </li>
              ))}
            </ol>
          </aside>
        )}
      </div>
    </article>
  );
}
