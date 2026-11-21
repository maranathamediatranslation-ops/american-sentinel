import { isRouteErrorResponse, Outlet, useLocation } from "react-router";

import "~/app.css";

import type { Route } from "./+types/layout";
import { AdRail, AdRow, usePageAds } from "~/components/Ads";
import { SiteFooter } from "~/components/SiteFooter";
import { SiteHeader } from "~/components/SiteHeader";
import { adPageFor, listLiveAds } from "~/lib/ads";

export async function loader({ request }: Route.LoaderArgs) {
  // A new seed per page load rotates ads that share a slot (see pickAds).
  const adSeed = Math.floor(Math.random() * 2 ** 31);
  // Dev only: `?sample-ads` fills every slot with placeholders.
  if (import.meta.env.DEV && new URL(request.url).searchParams.has("sample-ads")) {
    const { sampleAds } = await import("~/dev/fixtures");
    return { ads: sampleAds, adSeed };
  }
  return { ads: await listLiveAds(), adSeed };
}

// Ads never reload on client-side navigation; the seed and list stay put.
export function shouldRevalidate() {
  return false;
}

function Shell({ children }: { children: React.ReactNode }) {
  const ads = usePageAds();
  const page = adPageFor(useLocation().pathname);
  const hasAds = Object.keys(ads).length > 0;
  // Below the rail width, ads move into the page. The homepage places them
  // between sections; article pages put the left top ad in their sidebar.
  const rowAds =
    page === "home"
      ? []
      : page === "article"
        ? [ads.right_top, ads.left_bottom, ads.right_bottom]
        : [ads.left_top, ads.right_top, ads.left_bottom, ads.right_bottom];
  return (
    <div className="flex min-h-dvh flex-col">
      <SiteHeader />
      {/* From 1440px: left rail · page · right rail (rails 200, 240, then 300px wide). */}
      <div
        className={`flex flex-1 flex-col ${
          hasAds
            ? "min-[1440px]:grid min-[1440px]:grid-cols-[200px_minmax(0,1fr)_200px] min-[1440px]:gap-x-2 min-[1440px]:px-6 min-[1680px]:grid-cols-[240px_minmax(0,1fr)_240px] min-[1920px]:grid-cols-[300px_minmax(0,1fr)_300px]"
            : ""
        }`}
      >
        {hasAds && <AdRail ads={[ads.left_top, ads.left_bottom]} />}
        <main id="main" tabIndex={-1} className="flex-1 focus:outline-none">
          {children}
          {rowAds.some(Boolean) && (
            <div className="page-gutter mt-12 min-[1440px]:hidden">
              <AdRow ads={rowAds} />
            </div>
          )}
        </main>
        {hasAds && <AdRail ads={[ads.right_top, ads.right_bottom]} />}
      </div>
      <SiteFooter />
    </div>
  );
}

export default function SiteLayout() {
  return (
    <Shell>
      <Outlet />
    </Shell>
  );
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  const notFound = isRouteErrorResponse(error) && error.status === 404;
  const detail =
    import.meta.env.DEV && error instanceof Error ? error.message : null;
  return (
    <Shell>
      <div className="page-gutter flex max-w-[52rem] flex-col gap-4 pt-12">
        <title>{notFound ? "Page not found - American Sentinel" : "Error - American Sentinel"}</title>
        <h1 className="font-slab text-headline-1">
          {notFound ? "Page not found" : "This page couldn’t be loaded"}
        </h1>
        <p className="font-serif text-body">
          {notFound
            ? "The address may be mistyped, or the page may have moved."
            : "Try again in a moment."}
        </p>
        {detail && <pre className="overflow-x-auto bg-surface p-4 text-meta">{detail}</pre>}
      </div>
    </Shell>
  );
}
