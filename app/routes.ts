import { type RouteConfig, index, layout, prefix, route } from "@react-router/dev/routes";

// Design previews with placeholder data, available only in `npm run dev`.
const devRoutes =
  process.env.NODE_ENV === "production"
    ? []
    : [route("dev/home", "routes/dev.home.tsx"), route("dev/article", "routes/dev.article.tsx")];

export default [
  layout("routes/layout.tsx", [
    index("routes/home.tsx"),
    route("article/all", "routes/article.all.tsx"),
    route("article/view/:slug", "routes/article.view.tsx"),
    route("book/all", "routes/book.all.tsx"),
    route("book/view/:slug", "routes/book.view.tsx"),
    route("presentation/all", "routes/presentation.all.tsx"),
    route("presentation/view/:slug", "routes/presentation.view.tsx"),
    route("links", "routes/links.tsx"),
    route("user/view/:slug", "routes/user.view.tsx"),
    ...devRoutes,
    route("*", "routes/not-found.tsx"),
  ]),
  route("download/:id", "routes/download.tsx"),

  // Admin: client-only, outside the public layout.
  ...prefix("admin", [
    route("login", "routes/admin/login.tsx"),
    route("logout", "routes/admin/logout.tsx"),
    layout("routes/admin/layout.tsx", [
      index("routes/admin/dashboard.tsx"),
      route("links", "routes/admin/links.tsx"),
      route("links/new", "routes/admin/link-edit.tsx", { id: "admin-link-new" }),
      route("links/:id", "routes/admin/link-edit.tsx"),
      route(":section", "routes/admin/content-list.tsx"),
      route(":section/new", "routes/admin/content-edit.tsx", { id: "admin-content-new" }),
      route(":section/:id", "routes/admin/content-edit.tsx"),
    ]),
  ]),
] satisfies RouteConfig;
