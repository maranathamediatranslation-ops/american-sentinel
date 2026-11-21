import { useEffect, useRef, useState } from "react";
import { useLocation, useRouteLoaderData } from "react-router";

import { pickAds, type Ad, type AdSlot } from "~/lib/ads";
import { plainImageUrl } from "~/lib/images";

// Side rails appear from this width; below it the same ads show in the page.
export const RAIL_QUERY = "(min-width: 1440px)";

type LayoutData = { ads: Ad[]; adSeed: number };

// The ads chosen for the current page, one per slot.
export function usePageAds(): Partial<Record<AdSlot, Ad>> {
  const data = useRouteLoaderData("routes/layout") as LayoutData | undefined;
  const { pathname } = useLocation();
  return data ? pickAds(data.ads, pathname, data.adSeed) : {};
}

// null until mounted (the server can't know the screen width).
function useMediaQuery(query: string): boolean | null {
  const [matches, setMatches] = useState<boolean | null>(null);
  useEffect(() => {
    const list = window.matchMedia(query);
    const update = () => setMatches(list.matches);
    update();
    list.addEventListener("change", update);
    return () => list.removeEventListener("change", update);
  }, [query]);
  return matches;
}

function Label() {
  return <p className="text-caption text-secondary">Advertisement</p>;
}

// Ad network code (e.g. AdSense), entered by staff in the admin. Scripts in
// innerHTML don't run, so each is re-created; a library already on the page
// (same src) isn't loaded twice. Mounted only where it's visible, because
// network ads refuse to fill a hidden, zero-width box.
function AdEmbed({ html, where }: { html: string; where: "rail" | "page" }) {
  const ref = useRef<HTMLDivElement>(null);
  const isWide = useMediaQuery(RAIL_QUERY);
  const visible = isWide !== null && (where === "rail" ? isWide : !isWide);

  useEffect(() => {
    const box = ref.current;
    if (!box || !visible) return;
    box.innerHTML = html;
    box.querySelectorAll("script").forEach((old) => {
      const script = document.createElement("script");
      for (const { name, value } of Array.from(old.attributes)) script.setAttribute(name, value);
      script.text = old.text;
      if (script.src && Array.from(document.scripts).some((s) => s !== old && s.src === script.src)) {
        old.remove();
        return;
      }
      old.replaceWith(script);
    });
    return () => {
      box.innerHTML = "";
    };
  }, [html, visible]);

  return <div ref={ref} className="w-full" />;
}

function AdLink({ ad, children }: { ad: Ad; children: React.ReactNode }) {
  if (!ad.linkUrl) return <>{children}</>;
  return (
    <a
      href={ad.linkUrl}
      target="_blank"
      rel="sponsored noopener"
      className="block outline-offset-2 transition-opacity hover:opacity-90 motion-reduce:transition-none"
    >
      {children}
    </a>
  );
}

// Tall ad in a side rail: as wide as the rail (200–300px, by screen width).
// With two ads in a rail each gets at most half the screen's height, so both
// stay in view; a lone ad may use the full height. Images are never cropped.
function RailAd({ ad, single }: { ad: Ad; single: boolean }) {
  if (ad.kind === "embed") {
    return ad.embedHtml ? <AdEmbed html={ad.embedHtml} where="rail" /> : null;
  }
  if (!ad.imageUrl) return null;
  return (
    <AdLink ad={ad}>
      <img
        src={plainImageUrl(ad.imageUrl) ?? undefined}
        alt={ad.alt}
        loading="lazy"
        decoding="async"
        className={`block w-full object-contain object-left-top ${
          single ? "max-h-[calc(100dvh-6rem)]" : "max-h-[calc((100dvh-9rem)/2)]"
        }`}
      />
    </AdLink>
  );
}

export function AdRail({ ads }: { ads: (Ad | undefined)[] }) {
  const shown = ads.filter((ad): ad is Ad => !!ad);
  return (
    <aside aria-label="Advertisements" className="hidden min-[1440px]:block">
      {shown.length > 0 && (
        <div className="sticky top-6 flex flex-col gap-6 pt-8">
          {shown.map((ad) => (
            <div key={ad.id} className="flex flex-col gap-1">
              <Label />
              <RailAd ad={ad} single={shown.length === 1} />
            </div>
          ))}
        </div>
      )}
    </aside>
  );
}

// Ad inside the page (below the rail width). Uses the wide banner image when
// there is one, otherwise the tall image, up to 300px wide (a 320 × 600
// creative at near its own size).
function PageAd({ ad, inSidebar = false }: { ad: Ad; inSidebar?: boolean }) {
  if (ad.kind === "embed") {
    return ad.embedHtml ? <AdEmbed html={ad.embedHtml} where="page" /> : null;
  }
  // The sidebar is narrow and tall: prefer the tall image there.
  const wide = !!ad.bannerUrl && !(inSidebar && ad.imageUrl);
  const src = wide ? ad.bannerUrl : ad.imageUrl;
  if (!src) return null;
  return (
    <AdLink ad={ad}>
      <img
        src={plainImageUrl(src) ?? undefined}
        alt={ad.alt}
        loading="lazy"
        decoding="async"
        className={
          wide
            ? "block max-h-64 w-full object-contain object-left"
            : "block h-auto w-full max-w-[300px] object-contain object-left-top"
        }
      />
    </AdLink>
  );
}

// A row of ads in the page: between homepage sections and above the footer.
// Hidden where the side rails show them.
// `sectioned` lines the row up with homepage sections (title 3 of 12 columns).
export function AdRow({ ads, sectioned = false }: { ads: (Ad | undefined)[]; sectioned?: boolean }) {
  const shown = ads.filter((ad): ad is Ad => !!ad);
  if (shown.length === 0) return null;
  return (
    <aside
      aria-label="Advertisements"
      className={`border-t border-rule pt-3 min-[1440px]:hidden ${sectioned ? "lg:grid lg:grid-cols-12 lg:gap-x-6" : ""}`}
    >
      <div className={sectioned ? "lg:col-span-3" : ""}>
        <Label />
      </div>
      <ul className={`mt-2 grid gap-6 sm:grid-cols-2 ${sectioned ? "lg:col-span-9 lg:mt-0" : ""}`}>
        {shown.map((ad) => (
          <li key={ad.id}>
            <PageAd ad={ad} />
          </li>
        ))}
      </ul>
    </aside>
  );
}

// Ad in the article sidebar, under "More articles". Shown at full size; the
// sidebar sticks by its bottom edge when it's taller than the screen
// (useStickySidebar in ArticleView).
export function AdStack({ ads }: { ads: (Ad | undefined)[] }) {
  const shown = ads.filter((ad): ad is Ad => !!ad);
  if (shown.length === 0) return null;
  return (
    <div aria-label="Advertisements" role="complementary" className="mt-8 flex flex-col gap-6 min-[1440px]:hidden">
      {shown.map((ad) => (
        <div key={ad.id} className="flex flex-col gap-1">
          <Label />
          <PageAd ad={ad} inSidebar />
        </div>
      ))}
    </div>
  );
}
