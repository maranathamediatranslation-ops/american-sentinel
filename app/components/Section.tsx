import { Link } from "react-router";

type Props = {
  title: string;
  id: string;
  more?: { to: string; label: string };
  // e.g. a series image, shown under the title on wide screens.
  image?: string | null;
  // Drop the title row below desktop, where the content speaks for itself.
  hideHeaderOnMobile?: boolean;
  children: React.ReactNode;
};

// A homepage section: title column on the left, content on the right,
// with a rule across the top (DESIGN.md → Layouts → Homepage).
export function Section({ title, id, more, image, hideHeaderOnMobile = false, children }: Props) {
  return (
    <section
      aria-labelledby={id}
      className="grid grid-cols-1 gap-x-6 gap-y-4 border-t border-rule pt-3 lg:grid-cols-12"
    >
      <div
        className={`${hideHeaderOnMobile ? "hidden lg:flex" : "flex"} items-baseline justify-between gap-4 lg:col-span-3 lg:flex-col lg:justify-start`}
      >
        <h2 id={id} className="font-slab text-headline-2">
          {title}
        </h2>
        {more && (
          <Link
            to={more.to}
            className="text-label text-accent underline-offset-4 hover:underline"
          >
            {more.label}
          </Link>
        )}
        {image && (
          <img
            src={image}
            alt=""
            loading="lazy"
            decoding="async"
            className="hidden aspect-video w-full bg-surface object-cover lg:mt-3 lg:block"
          />
        )}
      </div>
      <div className="lg:col-span-9">{children}</div>
    </section>
  );
}
