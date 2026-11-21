import { ArrowLeft, Code, ImageIcon } from "lucide-react";
import { useState } from "react";
import { data, Form, Link, redirect, useLocation, useNavigation, useSearchParams } from "react-router";

import type { Route } from "./+types/ad-edit";
import { DeleteButton } from "~/components/admin/DeleteButton";
import { ImageField, resolveImageField } from "~/components/admin/ImageField";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Separator } from "~/components/ui/separator";
import { Textarea } from "~/components/ui/textarea";
import { AD_PAGES, AD_SLOTS, isAdPage, isAdSlot, type AdKind, type AdSlot } from "~/lib/ads";
import { checkImage, deleteAd, emptyAd, getAd, removeImage, saveAd, uploadImage } from "~/lib/admin";

export async function clientLoader({ params }: Route.ClientLoaderArgs) {
  if (!params.id) return { ad: emptyAd() };
  const ad = await getAd(Number(params.id));
  if (!ad) throw data(null, { status: 404 });
  return { ad };
}
clientLoader.hydrate = true as const;

function friendly(message: string) {
  if (message.includes("relation") && message.includes("ads"))
    return "The ads table doesn’t exist yet. Run supabase/migrations/20261121000000_ads.sql in the Supabase SQL Editor first.";
  if (message.includes("ads_dates_in_order")) return "The end date must be after the start date.";
  if (message.includes("row-level security")) return "Your account doesn’t have permission to make this change.";
  return message;
}

export async function clientAction({ params, request }: Route.ClientActionArgs) {
  const id = params.id ? Number(params.id) : null;
  const form = await request.formData();

  if (form.get("intent") === "delete" && id) {
    try {
      await deleteAd(id);
    } catch (error) {
      return { error: friendly((error as Error).message) };
    }
    throw redirect("/admin/ads");
  }

  const name = String(form.get("name") ?? "").trim();
  const kind: AdKind = form.get("kind") === "embed" ? "embed" : "image";
  const slot = form.get("slot");
  const linkUrl = String(form.get("linkUrl") ?? "").trim();
  const embedHtml = String(form.get("embedHtml") ?? "").trim();
  const startsOn = String(form.get("startsOn") ?? "");
  const endsOn = String(form.get("endsOn") ?? "");

  if (!name) return { error: "Enter a name for this ad." };
  if (!isAdSlot(slot)) return { error: "Choose where the ad goes." };
  if (kind === "image" && linkUrl) {
    try {
      const parsed = new URL(linkUrl);
      if (!["http:", "https:"].includes(parsed.protocol)) throw new Error();
    } catch {
      return { error: "Enter the link as a full web address, starting with https://." };
    }
  }
  if (kind === "embed" && !embedHtml) return { error: "Paste the ad network’s code." };
  if (startsOn && endsOn && endsOn < startsOn) return { error: "The end date must be on or after the start date." };

  const image = await resolveImageField(form, "ads", uploadImage, checkImage);
  if (image.error) return { error: friendly(image.error) };
  const banner = await resolveImageField(form, "ads", uploadImage, checkImage, "banner");
  if (banner.error) {
    await removeImage(image.uploaded);
    return { error: friendly(banner.error) };
  }
  if (kind === "image" && !image.value) {
    await removeImage(banner.uploaded);
    return { error: "Add the ad’s image." };
  }

  let savedId: number;
  try {
    savedId = await saveAd({
      id,
      name,
      kind,
      slot,
      imagePath: image.value,
      bannerImagePath: banner.value,
      linkUrl: kind === "image" ? linkUrl : "",
      altText: String(form.get("altText") ?? "").trim(),
      embedHtml: kind === "embed" ? embedHtml : "",
      pages: form.getAll("pages").filter(isAdPage),
      active: form.get("active") === "on",
      startsOn,
      endsOn,
      position: Number(form.get("position") ?? 0) || 0,
    });
  } catch (error) {
    await removeImage(image.uploaded);
    await removeImage(banner.uploaded);
    return { error: friendly((error as Error).message) };
  }
  if (image.replaced) await removeImage(image.replaced);
  if (banner.replaced) await removeImage(banner.replaced);
  throw redirect(`/admin/ads/${savedId}?saved=1`);
}

// The four slots drawn as a page, so the choice reads at a glance.
function SlotPicker({ value }: { value: AdSlot }) {
  const [slot, setSlot] = useState<AdSlot>(value);
  const option = (key: AdSlot) => (
    <label
      key={key}
      className={`flex flex-1 cursor-pointer items-center justify-center rounded-md border-2 p-2 text-center text-xs font-semibold transition-colors has-[:focus-visible]:ring-3 has-[:focus-visible]:ring-ring/50 ${
        slot === key ? "border-primary bg-primary/10 text-primary" : "border-dashed hover:border-primary/60"
      }`}
    >
      <input
        type="radio"
        name="slot"
        value={key}
        checked={slot === key}
        onChange={() => setSlot(key)}
        className="sr-only"
      />
      {AD_SLOTS[key]}
    </label>
  );
  return (
    <fieldset className="grid gap-2">
      <legend className="mb-2 text-sm font-medium">Where it goes</legend>
      <div className="grid h-52 max-w-md grid-cols-[5.5rem_1fr_5.5rem] gap-2">
        <div className="flex flex-col gap-2">
          {option("left_top")}
          {option("left_bottom")}
        </div>
        <div aria-hidden="true" className="flex flex-col gap-1.5 rounded-md bg-muted p-3">
          <div className="h-3 w-2/3 rounded-sm bg-muted-foreground/30" />
          <div className="h-2 rounded-sm bg-muted-foreground/20" />
          <div className="h-2 rounded-sm bg-muted-foreground/20" />
          <div className="h-2 w-5/6 rounded-sm bg-muted-foreground/20" />
          <p className="mt-auto text-center text-xs text-muted-foreground">Page</p>
        </div>
        <div className="flex flex-col gap-2">
          {option("right_top")}
          {option("right_bottom")}
        </div>
      </div>
      <p className="text-sm text-muted-foreground">
        Beside the page on screens 1440px and wider. On smaller screens the ad moves into the page: between homepage
        sections, under “More articles” on articles (top slots only), and above the footer elsewhere. Several ads in one
        slot take turns.
      </p>
    </fieldset>
  );
}

export default function AdEdit({ loaderData, actionData }: Route.ComponentProps) {
  const { ad } = loaderData;
  const [search] = useSearchParams();
  const location = useLocation();
  const busy = useNavigation().state === "submitting";
  const isNew = ad.id === null;
  const [kind, setKind] = useState<AdKind>(ad.kind);

  return (
    <div className="flex max-w-3xl flex-col gap-6">
      <div className="flex flex-col gap-2">
        <Link to="/admin/ads" className="flex w-fit items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft aria-hidden="true" className="size-4" />
          Ads
        </Link>
        <h1 className="text-2xl font-bold">{isNew ? "New ad" : ad.name}</h1>
      </div>

      {search.get("saved") && !actionData?.error && (
        <p role="status" className="rounded-lg border border-primary/40 bg-primary/10 px-4 py-3 text-sm">
          Saved.
        </p>
      )}
      {actionData?.error && (
        <p role="alert" className="rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {actionData.error}
        </p>
      )}

      <Form key={location.key} method="post" encType="multipart/form-data" className="flex flex-col gap-6">
        <div className="grid gap-4 sm:grid-cols-[1fr_8rem]">
          <div className="grid gap-2">
            <Label htmlFor="name">Name</Label>
            <Input id="name" name="name" defaultValue={ad.name} required aria-describedby="name-hint" />
            <p id="name-hint" className="text-sm text-muted-foreground">
              Only shown here in the admin, e.g. “Spring book sale”.
            </p>
          </div>
          <div className="grid content-start gap-2">
            <Label htmlFor="position">Order</Label>
            <Input id="position" name="position" type="number" defaultValue={ad.position} />
          </div>
        </div>

        <label className="flex w-fit items-center gap-2 text-sm font-medium">
          <input type="checkbox" name="active" defaultChecked={ad.active} className="size-4 accent-primary" />
          Show this ad on the site
        </label>

        <Separator />

        <SlotPicker value={ad.slot} />

        <fieldset className="grid gap-2">
          <legend className="mb-2 text-sm font-medium">Pages</legend>
          <div className="grid gap-2 sm:grid-cols-3">
            {(Object.keys(AD_PAGES) as (keyof typeof AD_PAGES)[]).map((page) => (
              <label key={page} className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  name="pages"
                  value={page}
                  defaultChecked={ad.pages.includes(page)}
                  className="size-4 accent-primary"
                />
                {AD_PAGES[page]}
              </label>
            ))}
          </div>
          <p className="text-sm text-muted-foreground">Leave all unticked to show it on every page.</p>
        </fieldset>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="grid gap-2">
            <Label htmlFor="startsOn">Start date</Label>
            <Input id="startsOn" name="startsOn" type="date" defaultValue={ad.startsOn} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="endsOn">End date</Label>
            <Input id="endsOn" name="endsOn" type="date" defaultValue={ad.endsOn} aria-describedby="dates-hint" />
          </div>
          <p id="dates-hint" className="text-sm text-muted-foreground sm:col-span-2">
            Optional. The ad shows from the start of the first day to the end of the last.
          </p>
        </div>

        <Separator />

        <fieldset className="grid gap-2">
          <legend className="mb-2 text-sm font-medium">Type</legend>
          <div className="grid gap-3 sm:grid-cols-2">
            {(
              [
                { value: "image", title: "Your own ad", text: "An image that links to a page.", Icon: ImageIcon },
                { value: "embed", title: "Ad network", text: "Code from Google AdSense or another network.", Icon: Code },
              ] as const
            ).map(({ value, title, text, Icon }) => (
              <label
                key={value}
                className={`flex cursor-pointer gap-3 rounded-lg border-2 p-3 transition-colors has-[:focus-visible]:ring-3 has-[:focus-visible]:ring-ring/50 ${
                  kind === value ? "border-primary bg-primary/5" : "hover:border-primary/60"
                }`}
              >
                <input
                  type="radio"
                  name="kind"
                  value={value}
                  checked={kind === value}
                  onChange={() => setKind(value)}
                  className="sr-only"
                />
                <Icon aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-primary" />
                <span>
                  <span className="block font-semibold">{title}</span>
                  <span className="block text-sm text-muted-foreground">{text}</span>
                </span>
              </label>
            ))}
          </div>
        </fieldset>

        {/* Both sets of fields stay in the form so switching type loses nothing;
            the action keeps only the chosen type's values. */}
        <div className={kind === "image" ? "flex flex-col gap-6" : "hidden"}>
          <ImageField
            current={ad.imagePath}
            label="Image for the side rails"
            hint="Tall, shown 160px wide and never cropped. 320 × 600 px works well. JPEG, PNG, WebP, GIF or AVIF, up to 5 MB."
            focus={false}
          />
          <ImageField
            current={ad.bannerImagePath}
            prefix="banner"
            label="Wide image for smaller screens (optional)"
            hint="Shown inside the page below 1440px. 970 × 250 or 728 × 90 px work well. Without it, the tall image is used."
            focus={false}
          />
          <div className="grid gap-2">
            <Label htmlFor="linkUrl">Link</Label>
            <Input id="linkUrl" name="linkUrl" type="url" defaultValue={ad.linkUrl} placeholder="https://" />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="altText">Image description</Label>
            <Input id="altText" name="altText" defaultValue={ad.altText} aria-describedby="alt-hint" />
            <p id="alt-hint" className="text-sm text-muted-foreground">
              What the ad says, for people using screen readers, e.g. “Spring sale: 30% off all books”.
            </p>
          </div>
        </div>

        <div className={kind === "embed" ? "grid gap-2" : "hidden"}>
          <Label htmlFor="embedHtml">Ad network code</Label>
          <Textarea
            id="embedHtml"
            name="embedHtml"
            defaultValue={ad.embedHtml}
            rows={8}
            spellCheck={false}
            className="font-mono text-sm"
            aria-describedby="embed-hint"
          />
          <p id="embed-hint" className="text-sm text-muted-foreground">
            Paste the code exactly as the network gives it, scripts included. For AdSense, use a responsive or 160 px
            wide display unit. It runs on every page the ad appears on, so only paste code from a network you trust.
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4 border-t pt-6">
          <Button type="submit" disabled={busy}>
            {busy ? "Saving…" : isNew ? "Create ad" : "Save changes"}
          </Button>
          {!isNew && <DeleteButton what="ad" title={ad.name} imagePath={ad.imagePath} />}
        </div>
      </Form>
    </div>
  );
}
