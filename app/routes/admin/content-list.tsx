import { ImageIcon, Plus } from "lucide-react";
import { data, Link } from "react-router";

import type { Route } from "./+types/content-list";
import { StatusBadge } from "~/components/admin/StatusBadge";
import { Button } from "~/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "~/components/ui/table";
import { isSection, listContent, SECTIONS } from "~/lib/admin";
import { formatDate } from "~/lib/format";
import { imageUrl } from "~/lib/images";

export async function clientLoader({ params }: Route.ClientLoaderArgs) {
  if (!isSection(params.section)) throw data(null, { status: 404 });
  const section = SECTIONS[params.section];
  return { section: params.section, ...section, items: await listContent(section.type) };
}
clientLoader.hydrate = true as const;

export default function ContentList({ loaderData }: Route.ComponentProps) {
  const { section, label, singular, items } = loaderData;
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">{label}</h1>
        <Button asChild>
          <Link to={`/admin/${section}/new`}>
            <Plus aria-hidden="true" />
            New {singular}
          </Link>
        </Button>
      </div>

      {items.length === 0 ? (
        <p className="text-muted-foreground">No {label.toLowerCase()} yet.</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-20">Image</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Published</TableHead>
                <TableHead>Updated</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item) => {
                const src = imageUrl(item.coverPath);
                return (
                  <TableRow key={item.id}>
                    <TableCell>
                      <div className="relative aspect-video w-16 overflow-hidden rounded bg-muted">
                        {src ? (
                          <img src={src} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover" />
                        ) : (
                          <ImageIcon aria-label="No image" className="absolute inset-0 m-auto size-4 text-muted-foreground" />
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="max-w-md whitespace-normal">
                      <Link
                        to={`/admin/${section}/${item.id}`}
                        className="font-semibold hover:underline"
                      >
                        {item.title}
                      </Link>
                      <p className="text-sm text-muted-foreground">/{item.slug}</p>
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={item.status} />
                    </TableCell>
                    <TableCell className="tabular-nums">{formatDate(item.publishedAt) ?? "—"}</TableCell>
                    <TableCell className="tabular-nums">{formatDate(item.updatedAt)}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
