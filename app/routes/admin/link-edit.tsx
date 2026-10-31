import { ArrowLeft } from "lucide-react";
import { data, Form, Link, redirect, useLocation, useNavigation, useSearchParams } from "react-router";

import type { Route } from "./+types/link-edit";
import { DeleteButton } from "~/components/admin/DeleteButton";
import { ImageField, resolveImageField } from "~/components/admin/ImageField";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Separator } from "~/components/ui/separator";
import { Textarea } from "~/components/ui/textarea";
import { checkImage, deleteLink, getLink, removeImage, saveLink, uploadImage, type LinkRecord } from "~/lib/admin";

export async function clientLoader({ params }: Route.ClientLoaderArgs) {
  if (!params.id) {
    const link: LinkRecord = { id: null, title: "", url: "", description: "", position: 0, imagePath: null };
    return { link };
  }
  const link = await getLink(Number(params.id));
  if (!link) throw data(null, { status: 404 });
  return { link };
}
clientLoader.hydrate = true as const;

function friendly(message: string) {
  if (message.includes("image_path"))
    return "Links can’t store images yet. Run the migration supabase/migrations/20261031000000_admin_images.sql first.";
  if (message.includes("row-level security")) return "Your account doesn’t have permission to make this change.";
  return message;
}

export async function clientAction({ params, request }: Route.ClientActionArgs) {
  const id = params.id ? Number(params.id) : null;
  const form = await request.formData();

  if (form.get("intent") === "delete" && id) {
    try {
      await deleteLink(id, String(form.get("currentImage") ?? "") || null);
    } catch (error) {
      return { error: friendly((error as Error).message) };
    }
    throw redirect("/admin/links");
  }

  const title = String(form.get("title") ?? "").trim();
  const url = String(form.get("url") ?? "").trim();
  if (!title) return { error: "Enter a title." };
  try {
    const parsed = new URL(url);
    if (!["http:", "https:"].includes(parsed.protocol)) throw new Error();
  } catch {
    return { error: "Enter a full web address, starting with https://." };
  }

  const image = await resolveImageField(form, "links", uploadImage, checkImage);
  if (image.error) return { error: friendly(image.error) };

  let savedId: number;
  try {
    savedId = await saveLink({
      id,
      title,
      url,
      description: String(form.get("description") ?? ""),
      position: Number(form.get("position") ?? 0) || 0,
      imagePath: image.value,
    });
  } catch (error) {
    await removeImage(image.uploaded);
    return { error: friendly((error as Error).message) };
  }
  if (image.replaced) await removeImage(image.replaced);
  throw redirect(`/admin/links/${savedId}?saved=1`);
}

export default function LinkEdit({ loaderData, actionData }: Route.ComponentProps) {
  const { link } = loaderData;
  const [search] = useSearchParams();
  const location = useLocation();
  const busy = useNavigation().state === "submitting";
  const isNew = link.id === null;

  return (
    <div className="flex max-w-3xl flex-col gap-6">
      <div className="flex flex-col gap-2">
        <Link to="/admin/links" className="flex w-fit items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft aria-hidden="true" className="size-4" />
          Links
        </Link>
        <h1 className="text-2xl font-bold">{isNew ? "New link" : link.title}</h1>
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
        <div className="grid gap-2">
          <Label htmlFor="title">Title</Label>
          <Input id="title" name="title" defaultValue={link.title} required />
        </div>
        <div className="grid gap-4 sm:grid-cols-[1fr_8rem]">
          <div className="grid gap-2">
            <Label htmlFor="url">Web address</Label>
            <Input id="url" name="url" type="url" defaultValue={link.url} placeholder="https://" required />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="position">Order</Label>
            <Input id="position" name="position" type="number" defaultValue={link.position} />
          </div>
        </div>

        <Separator />
        <ImageField current={link.imagePath} />
        <Separator />

        <div className="grid gap-2">
          <Label htmlFor="description">Description</Label>
          <Textarea id="description" name="description" defaultValue={link.description} rows={5} aria-describedby="description-hint" />
          <p id="description-hint" className="text-sm text-muted-foreground">
            HTML is allowed.
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4 border-t pt-6">
          <Button type="submit" disabled={busy}>
            {busy ? "Saving…" : isNew ? "Create link" : "Save changes"}
          </Button>
          {!isNew && <DeleteButton what="link" title={link.title} imagePath={link.imagePath} />}
        </div>
      </Form>
    </div>
  );
}
