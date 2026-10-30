import { data, redirect } from "react-router";

import type { Route } from "./+types/download";
import { registerDownload } from "~/lib/content";

// Resource route: counts the download, then sends the reader to the file.
export async function loader({ params }: Route.LoaderArgs) {
  const id = Number(params.id);
  if (!Number.isInteger(id) || id <= 0) throw data(null, { status: 404 });
  const url = await registerDownload(id);
  if (!url) throw data(null, { status: 404 });
  return redirect(url, { headers: { "X-Robots-Tag": "noindex" } });
}
