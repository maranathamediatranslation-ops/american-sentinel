import "~/admin.css";

import { BookOpen, ExternalLink, FileText, LayoutDashboard, Link2, LogOut, Video } from "lucide-react";
import { Form, NavLink, Outlet, redirect } from "react-router";

import type { Route } from "./+types/layout";
import { Button } from "~/components/ui/button";
import { can, getPermissions, getSessionUser, type Permission } from "~/lib/admin";

// Admin is client-only: the server renders HydrateFallback, the browser loads
// the session and permissions.
export async function clientLoader({ request }: Route.ClientLoaderArgs) {
  const user = await getSessionUser();
  if (!user) {
    const next = new URL(request.url).pathname;
    throw redirect(`/admin/login?next=${encodeURIComponent(next)}`);
  }
  return { email: user.email ?? "", permissions: await getPermissions(user.id) };
}
clientLoader.hydrate = true as const;

export function HydrateFallback() {
  return (
    <div className="flex min-h-dvh items-center justify-center text-muted-foreground">
      Loading admin…
    </div>
  );
}

export function meta() {
  return [{ title: "Admin - American Sentinel" }, { name: "robots", content: "noindex" }];
}

const nav: { to: string; label: string; icon: typeof FileText; needs: Permission; end?: boolean }[] = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard, needs: "view_stats", end: true },
  { to: "/admin/articles", label: "Articles", icon: FileText, needs: "manage_content" },
  { to: "/admin/books", label: "Books", icon: BookOpen, needs: "manage_content" },
  { to: "/admin/presentations", label: "Presentations", icon: Video, needs: "manage_content" },
  { to: "/admin/links", label: "Links", icon: Link2, needs: "manage_settings" },
];

export default function AdminLayout({ loaderData }: Route.ComponentProps) {
  const { email, permissions } = loaderData;
  const items = nav.filter((item) => can(permissions, item.needs));

  return (
    <div className="flex min-h-dvh flex-col md:flex-row">
      <aside className="flex shrink-0 flex-col gap-4 bg-sidebar p-4 text-sidebar-foreground md:sticky md:top-0 md:h-dvh md:w-60">
        <div>
          <p className="text-lg font-bold">American Sentinel</p>
          <p className="text-sm opacity-80">Admin</p>
        </div>
        <nav aria-label="Admin">
          <ul className="flex gap-1 overflow-x-auto md:flex-col">
            {items.map(({ to, label, icon: Icon, end }) => (
              <li key={to} className="shrink-0">
                <NavLink
                  to={to}
                  end={end}
                  className={({ isActive }) =>
                    `flex items-center gap-2 rounded-md px-3 py-2 text-sm font-semibold outline-sidebar-ring transition-colors hover:bg-sidebar-accent ${
                      isActive ? "bg-sidebar-accent" : ""
                    }`
                  }
                >
                  <Icon aria-hidden="true" className="size-4" />
                  {label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
        <div className="mt-auto flex flex-col gap-2 border-t border-sidebar-border pt-4 text-sm">
          <a href="/" className="flex items-center gap-2 rounded-md px-3 py-2 hover:bg-sidebar-accent">
            <ExternalLink aria-hidden="true" className="size-4" />
            View site
          </a>
          <p className="truncate px-3 opacity-80" title={email}>
            {email}
          </p>
          <Form method="post" action="/admin/logout">
            <Button
              type="submit"
              variant="ghost"
              className="w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground"
            >
              <LogOut aria-hidden="true" />
              Sign out
            </Button>
          </Form>
        </div>
      </aside>

      <main className="min-w-0 flex-1 p-4 md:p-8">
        {items.length === 0 ? (
          <div className="max-w-xl">
            <h1 className="text-2xl font-bold">No admin access</h1>
            <p className="mt-2 text-muted-foreground">
              You’re signed in as {email}, but this account has no admin permissions. Ask an
              administrator to grant them.
            </p>
          </div>
        ) : (
          <Outlet />
        )}
      </main>
    </div>
  );
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  const message = error instanceof Error ? error.message : "Something went wrong.";
  return (
    <div className="mx-auto max-w-xl p-8">
      <h1 className="text-2xl font-bold">The admin couldn’t load</h1>
      <p className="mt-2 text-muted-foreground">{message}</p>
      <a href="/admin" className="mt-4 inline-block font-semibold text-primary underline">
        Try again
      </a>
    </div>
  );
}
