import { isRouteErrorResponse, Outlet } from "react-router";

import type { Route } from "./+types/layout";
import { SiteFooter } from "~/components/SiteFooter";
import { SiteHeader } from "~/components/SiteHeader";

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col">
      <SiteHeader />
      <main id="main" tabIndex={-1} className="flex-1 focus:outline-none">
        {children}
      </main>
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
