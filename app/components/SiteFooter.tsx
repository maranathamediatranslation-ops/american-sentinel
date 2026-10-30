import { Link } from "react-router";

import { paths } from "~/lib/content";

export function SiteFooter() {
  return (
    <footer className="mt-24 bg-masthead text-on-masthead-muted [&_:focus-visible]:outline-focus-on-masthead">
      <div className="page-gutter flex flex-col gap-6 py-10 sm:flex-row sm:items-end sm:justify-between">
        <nav aria-label="Footer">
          <ul className="flex flex-wrap gap-x-6 gap-y-2 text-label">
            <li>
              <Link to={paths.articles()} className="underline-offset-4 hover:underline">
                Articles
              </Link>
            </li>
            <li>
              <Link to={paths.books()} className="underline-offset-4 hover:underline">
                Books
              </Link>
            </li>
            <li>
              <Link to={paths.presentations()} className="underline-offset-4 hover:underline">
                Presentations
              </Link>
            </li>
            <li>
              <Link to={paths.links()} className="underline-offset-4 hover:underline">
                Links
              </Link>
            </li>
          </ul>
        </nav>
        <p className="text-meta">© Father of Love</p>
      </div>
    </footer>
  );
}
