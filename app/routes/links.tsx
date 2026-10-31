import type { Route } from "./+types/links";
import { PageHeader } from "~/components/PageHeader";
import { listLinks, paths } from "~/lib/content";
import { seo } from "~/lib/seo";

export async function loader() {
  return { links: await listLinks() };
}

export function meta() {
  return seo({
    title: "Links",
    description: "Other websites on religious liberty and liberty of conscience.",
    path: paths.links(),
  });
}

export default function Links({ loaderData }: Route.ComponentProps) {
  const { links } = loaderData;
  return (
    <div className="page-gutter">
      <PageHeader title="Links" />
      {links.length > 0 ? (
        <ul className="max-w-[65ch] border-b border-rule">
          {links.map((link) => (
            <li key={link.id} className="flex gap-4 border-t border-rule py-5">
              {link.imageUrl && (
                <img
                  src={link.imageUrl}
                  alt=""
                  loading="lazy"
                  className="aspect-video w-28 shrink-0 self-start object-cover sm:w-40"
                />
              )}
              <div className="min-w-0">
                <h2 className="font-slab text-headline-4">
                  <a
                    href={link.url}
                    rel="noopener"
                    className="text-accent underline underline-offset-4 hover:text-primary"
                  >
                    {link.title}
                  </a>
                </h2>
                <p className="mt-1 text-meta break-all text-secondary">{link.url}</p>
                {link.description && (
                  // Stored description HTML, rendered as written.
                  <div
                    className="mt-3 font-serif text-quote [&_p]:m-0"
                    dangerouslySetInnerHTML={{ __html: link.description }}
                  />
                )}
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="font-serif text-body text-secondary">No links yet.</p>
      )}
    </div>
  );
}
