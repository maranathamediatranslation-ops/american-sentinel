import { ArrowLeft, ExternalLink } from "lucide-react";
import { data, Form, Link, redirect, useLocation, useNavigation, useSearchParams } from "react-router";

import type { Route } from "./+types/content-edit";
import { DeleteButton } from "~/components/admin/DeleteButton";
import { ImageField, resolveImageField } from "~/components/admin/ImageField";
import { statusLabel } from "~/components/admin/StatusBadge";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/components/ui/select";
import { Separator } from "~/components/ui/separator";
import { Textarea } from "~/components/ui/textarea";
import {
  checkImage,
  contentOptions,
  deleteContent,
  emptyContent,
  getContent,
  isSection,
  removeImage,
  saveContent,
  SECTIONS,
  SLUG_PATTERN,
  slugify,
  STATUSES,
  uploadImage,
  youtubeId,
  type ContentRecord,
  type ContentStatus,
  type Option,
} from "~/lib/admin";
import { paths } from "~/lib/content";

const NONE = "none";

function sectionOf(params: { section?: string }) {
  if (!isSection(params.section)) throw data(null, { status: 404 });
  return { key: params.section, ...SECTIONS[params.section] };
}

export async function clientLoader({ params }: Route.ClientLoaderArgs) {
  const section = sectionOf(params);
  const id = params.id ? Number(params.id) : null;
  const [record, options] = await Promise.all([
    id ? getContent(section.type, id) : Promise.resolve(emptyContent(section.type)),
    contentOptions(section.type),
  ]);
  if (!record) throw data(null, { status: 404 });
  return { section, record, options };
}
clientLoader.hydrate = true as const;

const optionalNumber = (value: FormDataEntryValue | null) => {
  const text = String(value ?? "").trim();
  if (!text || text === NONE) return null;
  const number = Number(text);
  return Number.isFinite(number) ? number : null;
};

function friendly(message: string) {
  if (message.includes("content_items_type_slug_key")) return "Another item of this type already uses that URL slug.";
  if (message.includes("presentations_series_id_series_position_key"))
    return "Another presentation already has that part number in this series.";
  if (message.includes("row-level security")) return "Your account doesn’t have permission to make this change.";
  return message;
}

export async function clientAction({ params, request }: Route.ClientActionArgs) {
  const section = sectionOf(params);
  const id = params.id ? Number(params.id) : null;
  const form = await request.formData();

  if (form.get("intent") === "delete" && id) {
    try {
      await deleteContent(id, String(form.get("currentImage") ?? "") || null);
    } catch (error) {
      return { error: friendly((error as Error).message) };
    }
    throw redirect(`/admin/${section.key}`);
  }

  const title = String(form.get("title") ?? "").trim();
  const slug = String(form.get("slug") ?? "").trim() || slugify(title);
  const status = String(form.get("status") ?? "draft") as ContentStatus;
  let publishedAt = String(form.get("publishedAt") ?? "").trim();

  if (!title) return { error: "Enter a title." };
  if (!SLUG_PATTERN.test(slug))
    return { error: "The URL slug can only use lowercase letters, numbers and hyphens, and must start with a letter or number." };
  if (status === "published" && !publishedAt) publishedAt = new Date().toISOString().slice(0, 10);

  const image = await resolveImageField(form, section.type, uploadImage, checkImage);
  if (image.error) return { error: friendly(image.error) };

  const record: ContentRecord = {
    id,
    type: section.type,
    title,
    slug,
    summary: String(form.get("summary") ?? ""),
    body: String(form.get("body") ?? ""),
    status,
    // Dates are stored as midnight UTC, as the existing content is.
    publishedAt: publishedAt ? `${publishedAt}T00:00:00Z` : null,
    taxonomyId: optionalNumber(form.get("taxonomyId")),
    coverPath: image.value,
    personId: optionalNumber(form.get("personId")),
    formatId: optionalNumber(form.get("formatId")),
    pageCount: optionalNumber(form.get("pageCount")),
    seriesId: optionalNumber(form.get("seriesId")),
    seriesPosition: optionalNumber(form.get("seriesPosition")),
    videoRef: youtubeId(String(form.get("videoRef") ?? "")),
  };

  let savedId: number;
  try {
    savedId = await saveContent(record);
  } catch (error) {
    // Don't leave an orphaned upload behind.
    await removeImage(image.uploaded);
    return { error: friendly((error as Error).message) };
  }
  if (image.replaced) await removeImage(image.replaced);
  throw redirect(`/admin/${section.key}/${savedId}?saved=1`);
}

function OptionSelect({
  id,
  name,
  label,
  value,
  options,
  noneLabel,
}: {
  id: string;
  name: string;
  label: string;
  value: number | null;
  options: Option[];
  noneLabel: string;
}) {
  return (
    <div className="grid gap-2">
      <Label htmlFor={id}>{label}</Label>
      <Select name={name} defaultValue={value ? String(value) : NONE}>
        <SelectTrigger id={id} className="w-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={NONE}>{noneLabel}</SelectItem>
          {options.map((option) => (
            <SelectItem key={option.id} value={String(option.id)}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

export default function ContentEdit({ loaderData, actionData }: Route.ComponentProps) {
  const { section, record, options } = loaderData;
  const [search] = useSearchParams();
  const location = useLocation();
  const busy = useNavigation().state === "submitting";
  const isNew = record.id === null;
  const publicPath =
    record.status === "published" && record.slug
      ? { article: paths.article, book: paths.book, presentation: paths.presentation }[record.type](record.slug)
      : null;
  const taxonomyLabel = record.type === "article" ? "Category" : "Theme";
  const personLabel = record.type === "presentation" ? "Presenter" : "Author";

  return (
    <div className="flex max-w-4xl flex-col gap-6">
      <div className="flex flex-col gap-2">
        <Link
          to={`/admin/${section.key}`}
          className="flex w-fit items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft aria-hidden="true" className="size-4" />
          {section.label}
        </Link>
        <h1 className="text-2xl font-bold">{isNew ? `New ${section.singular}` : record.title}</h1>
      </div>

      {search.get("saved") && !actionData?.error && (
        <p role="status" className="flex flex-wrap items-center gap-3 rounded-lg border border-primary/40 bg-primary/10 px-4 py-3 text-sm">
          Saved.
          {publicPath && (
            <a href={publicPath} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 font-semibold text-primary underline">
              View on site
              <ExternalLink aria-hidden="true" className="size-3.5" />
            </a>
          )}
        </p>
      )}
      {actionData?.error && (
        <p role="alert" className="rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {actionData.error}
        </p>
      )}

      {/* Keyed by location so the form resets to fresh data after each save. */}
      <Form key={location.key} method="post" encType="multipart/form-data" className="flex flex-col gap-6">
        <div className="grid gap-2">
          <Label htmlFor="title">Title</Label>
          <Input id="title" name="title" defaultValue={record.title} required />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="grid gap-2">
            <Label htmlFor="slug">URL slug</Label>
            <Input id="slug" name="slug" defaultValue={record.slug} pattern="[a-z0-9][a-z0-9\-]*" aria-describedby="slug-hint" />
            <p id="slug-hint" className="text-sm text-muted-foreground">
              Leave empty to make one from the title.
            </p>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="status">Status</Label>
            <Select name="status" defaultValue={record.status}>
              <SelectTrigger id="status" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUSES.map((status) => (
                  <SelectItem key={status} value={status}>
                    {statusLabel[status]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="publishedAt">Publish date</Label>
            <Input
              id="publishedAt"
              name="publishedAt"
              type="date"
              defaultValue={record.publishedAt?.slice(0, 10) ?? ""}
              aria-describedby="date-hint"
            />
            <p id="date-hint" className="text-sm text-muted-foreground">
              Published items without a date get today’s.
            </p>
          </div>
          <OptionSelect
            id="personId"
            name="personId"
            label={personLabel}
            value={record.personId}
            options={options.people}
            noneLabel={`No ${personLabel.toLowerCase()}`}
          />
          <OptionSelect
            id="taxonomyId"
            name="taxonomyId"
            label={taxonomyLabel}
            value={record.taxonomyId}
            options={options.taxonomies}
            noneLabel={`No ${taxonomyLabel.toLowerCase()}`}
          />
          {record.type === "book" && (
            <>
              <OptionSelect
                id="formatId"
                name="formatId"
                label="Format"
                value={record.formatId}
                options={options.formats}
                noneLabel="No format"
              />
              <div className="grid gap-2">
                <Label htmlFor="pageCount">Pages</Label>
                <Input id="pageCount" name="pageCount" type="number" min={1} defaultValue={record.pageCount ?? ""} />
              </div>
            </>
          )}
          {record.type === "presentation" && (
            <>
              <OptionSelect
                id="seriesId"
                name="seriesId"
                label="Series"
                value={record.seriesId}
                options={options.series}
                noneLabel="No series"
              />
              <div className="grid gap-2">
                <Label htmlFor="seriesPosition">Part number in series</Label>
                <Input id="seriesPosition" name="seriesPosition" type="number" min={1} defaultValue={record.seriesPosition ?? ""} />
              </div>
              <div className="grid gap-2 sm:col-span-2">
                <Label htmlFor="videoRef">YouTube video</Label>
                <Input
                  id="videoRef"
                  name="videoRef"
                  defaultValue={record.videoRef}
                  placeholder="https://www.youtube.com/watch?v=…"
                  aria-describedby="video-hint"
                />
                <p id="video-hint" className="text-sm text-muted-foreground">
                  Paste the video’s address or its ID. Without an image, the site shows the video’s YouTube thumbnail.
                </p>
              </div>
            </>
          )}
        </div>

        <Separator />

        <ImageField
          current={record.coverPath}
          label={record.type === "book" ? "Cover image" : "Image"}
          aspect={record.type === "book" ? "cover" : "video"}
        />

        <Separator />

        <div className="grid gap-2">
          <Label htmlFor="summary">Summary</Label>
          <Textarea id="summary" name="summary" defaultValue={record.summary} rows={4} aria-describedby="summary-hint" />
          <p id="summary-hint" className="text-sm text-muted-foreground">
            Shown on cards and in search results. HTML is allowed.
          </p>
        </div>
        <div className="grid gap-2">
          <Label htmlFor="body">{record.type === "presentation" ? "Description" : "Text"}</Label>
          <Textarea
            id="body"
            name="body"
            defaultValue={record.body}
            rows={20}
            className="font-mono text-sm"
            aria-describedby="body-hint"
          />
          <p id="body-hint" className="text-sm text-muted-foreground">
            HTML, saved exactly as entered.
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4 border-t pt-6">
          <Button type="submit" disabled={busy}>
            {busy ? "Saving…" : isNew ? `Create ${section.singular}` : "Save changes"}
          </Button>
          {!isNew && <DeleteButton what={section.singular} title={record.title} imagePath={record.coverPath} />}
        </div>
      </Form>
    </div>
  );
}
