import { type RouteConfig, index, layout, route } from "@react-router/dev/routes";

// Design previews with placeholder data, available only in `npm run dev`.
const devRoutes =
  process.env.NODE_ENV === "production"
    ? []
    : [route("dev/home", "routes/dev.home.tsx"), route("dev/article", "routes/dev.article.tsx")];

export default [
  layout("routes/layout.tsx", [
    index("routes/home.tsx"),
    route("article/view/:slug", "routes/article.view.tsx"),
    ...devRoutes,
  ]),
] satisfies RouteConfig;
