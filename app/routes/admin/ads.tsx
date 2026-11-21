import { Code, ImageIcon, Plus } from "lucide-react";
import { Link } from "react-router";

import type { Route } from "./+types/ads";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "~/components/ui/table";
import { listAds, type AdRecord } from "~/lib/admin";
import { AD_PAGES, AD_SLOTS } from "~/lib/ads";
import { imageUrl } from "~/lib/images";

export async function clientLoader() {
  try {
    return { ads: await listAds(), missingTable: false };
  } catch (error) {
    // Before the migration runs, say so instead of failing the page.
    if (/relation|does not exist|schema cache/i.test((error as Error).message)) return { ads: [], missingTable: true };
    throw error;
  }
}
clientLoader.hydrate = true as const;

function status(ad: AdRecord): { label: string; variant: "default" | "secondary" | "outline" } {
  const today = new Date().toISOString().slice(0, 10);
  if (!ad.active) return { label: "Off", variant: "outline" };
  if (ad.startsOn && ad.startsOn > today) return { label: `Starts ${ad.startsOn}`, variant: "secondary" };
  if (ad.endsOn && ad.endsOn < today) return { label: "Ended", variant: "outline" };
  return { label: "Live", variant: "default" };
}

export default function AdminAds({ loaderData }: Route.ComponentProps) {
  const { ads, missingTable } = loaderData;
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">Ads</h1>
        {!missingTable && (
          <Button asChild>
            <Link to="/admin/ads/new">
              <Plus aria-hidden="true" />
              New ad
            </Link>
          </Button>
        )}
      </div>
      {missingTable ? (
        <p role="alert" className="rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm">
          The ads table doesn’t exist yet. Run <code>supabase/migrations/20261121000000_ads.sql</code> in the Supabase
          SQL Editor, then reload this page.
        </p>
      ) : ads.length === 0 ? (
        <p className="text-muted-foreground">No ads yet.</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16">Ad</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Slot</TableHead>
                <TableHead>Pages</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {ads.map((ad) => {
                const src = imageUrl(ad.imagePath);
                const state = status(ad);
                return (
                  <TableRow key={ad.id}>
                    <TableCell>
                      <div className="relative flex h-16 w-10 items-center justify-center overflow-hidden rounded bg-muted">
                        {ad.kind === "embed" ? (
                          <Code aria-label="Ad network" className="size-4 text-muted-foreground" />
                        ) : src ? (
                          <img src={src} alt="" loading="lazy" className="h-full w-full object-contain" />
                        ) : (
                          <ImageIcon aria-label="No image" className="size-4 text-muted-foreground" />
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="max-w-xs whitespace-normal">
                      <Link to={`/admin/ads/${ad.id}`} className="font-semibold hover:underline">
                        {ad.name}
                      </Link>
                      <p className="text-sm break-all text-muted-foreground">
                        {ad.kind === "embed" ? "Ad network" : ad.linkUrl || "No link"}
                      </p>
                    </TableCell>
                    <TableCell>{AD_SLOTS[ad.slot]}</TableCell>
                    <TableCell className="max-w-xs whitespace-normal text-sm">
                      {ad.pages.length ? ad.pages.map((page) => AD_PAGES[page]).join(", ") : "Every page"}
                    </TableCell>
                    <TableCell>
                      <Badge variant={state.variant}>{state.label}</Badge>
                    </TableCell>
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
