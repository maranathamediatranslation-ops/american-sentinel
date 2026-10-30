import { Link } from "react-router";

type Props = {
  title: string;
  id: string;
  more?: { to: string; label: string };
  children: React.ReactNode;
};

// A homepage section: title column on the left, content on the right,
// with a rule across the top (DESIGN.md → Layouts → Homepage).
export function Section({ title, id, more, children }: Props) {
  return (
    <section
      aria-labelledby={id}
      className="grid gap-x-6 gap-y-4 border-t border-rule pt-3 lg:grid-cols-12"
    >
      <div className="flex items-baseline justify-between gap-4 lg:col-span-3 lg:flex-col lg:justify-start">
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
      </div>
      <div className="lg:col-span-9">{children}</div>
    </section>
  );
}
