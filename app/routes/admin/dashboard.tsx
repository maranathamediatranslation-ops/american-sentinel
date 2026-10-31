import { Link } from "react-router";

import type { Route } from "./+types/dashboard";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { dashboardCounts } from "~/lib/admin";

export async function clientLoader() {
  return { rows: await dashboardCounts() };
}
clientLoader.hydrate = true as const;

const sections: Record<string, { label: string; to: string }> = {
  article: { label: "Articles", to: "/admin/articles" },
  book: { label: "Books", to: "/admin/books" },
  presentation: { label: "Presentations", to: "/admin/presentations" },
};

const n = (value: number) => value.toLocaleString("en-US");

export default function Dashboard({ loaderData }: Route.ComponentProps) {
  const rows = loaderData.rows.filter((row) => row.type in sections);
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {rows.map((row) => (
          <Card key={row.type}>
            <CardHeader>
              <CardTitle>
                <Link to={sections[row.type].to} className="hover:underline">
                  {sections[row.type].label}
                </Link>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
                <div>
                  <dt className="text-muted-foreground">Published</dt>
                  <dd className="text-2xl font-semibold tabular-nums">{n(row.published)}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Drafts</dt>
                  <dd className="text-2xl font-semibold tabular-nums">{n(row.drafts)}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Views</dt>
                  <dd className="font-semibold tabular-nums">{n(row.views)}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Downloads</dt>
                  <dd className="font-semibold tabular-nums">{n(row.downloads)}</dd>
                </div>
              </dl>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
