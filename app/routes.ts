import { type RouteConfig, index, layout, route } from "@react-router/dev/routes";

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
] satisfies RouteConfig;
