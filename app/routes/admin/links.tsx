import { ImageIcon, Plus } from "lucide-react";
import { Link } from "react-router";

import type { Route } from "./+types/links";
import { Button } from "~/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "~/components/ui/table";
import { listLinks } from "~/lib/admin";
import { imageUrl } from "~/lib/images";

export async function clientLoader() {
  return { links: await listLinks() };
}
clientLoader.hydrate = true as const;

export default function AdminLinks({ loaderData }: Route.ComponentProps) {
  const { links } = loaderData;
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">Links</h1>
        <Button asChild>
          <Link to="/admin/links/new">
            <Plus aria-hidden="true" />
            New link
          </Link>
        </Button>
      </div>
      {links.length === 0 ? (
        <p className="text-muted-foreground">No links yet.</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-20">Image</TableHead>
                <TableHead>Title</TableHead>
                <TableHead className="w-20 text-end">Order</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {links.map((link) => {
                const src = imageUrl(link.imagePath);
                return (
                  <TableRow key={link.id}>
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
                      <Link to={`/admin/links/${link.id}`} className="font-semibold hover:underline">
                        {link.title}
                      </Link>
                      <p className="text-sm break-all text-muted-foreground">{link.url}</p>
                    </TableCell>
                    <TableCell className="text-end tabular-nums">{link.position}</TableCell>
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
