import { Link, NavLink } from "react-router";

import { ThemeToggle } from "./ThemeToggle";
import { paths } from "~/lib/content";

const nav = [
  { label: "Articles", to: paths.articles(), match: "/article" },
  { label: "Books", to: paths.books(), match: "/book" },
  { label: "Presentations", to: paths.presentations(), match: "/presentation" },
  { label: "Links", to: paths.links(), match: "/links" },
];

export function SiteHeader() {
  return (
    <header className="bg-masthead text-on-masthead [&_:focus-visible]:outline-focus-on-masthead">
      <a
        href="#main"
        className="sr-only bg-page px-4 py-3 text-label text-primary focus:not-sr-only focus:absolute focus:start-4 focus:top-4 focus:z-10"
      >
        Skip to content
      </a>
      <div className="page-gutter flex items-center justify-between gap-4 pt-6 pb-4 lg:pt-10 lg:pb-6">
        <Link to={paths.home()} className="inline-block font-slab text-wordmark">
          American Sentinel
        </Link>
        <ThemeToggle />
      </div>
      <nav aria-label="Main" className="border-t border-on-masthead-muted/30">
        <ul className="page-gutter flex gap-x-6 overflow-x-auto lg:gap-x-10">
          {nav.map((item) => (
            <li key={item.to} className="shrink-0">
              <NavLink
                to={item.to}
                className={({ isActive }) =>
                  [
                    "block border-b-4 py-3 text-nav transition-colors hover:text-on-masthead",
                    isActive
                      ? "border-focus-on-masthead text-on-masthead"
                      : "border-transparent text-on-masthead-muted",
                  ].join(" ")
                }
              >
                {item.label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </header>
  );
}
