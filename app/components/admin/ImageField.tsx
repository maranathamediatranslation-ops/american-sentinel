import { ImageIcon, Trash2, Undo2 } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";

import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { imageUrl } from "~/lib/images";

type Props = {
  // Current stored value: a storage path or a full URL.
  current: string | null;
  label?: string;
  hint?: string;
  aspect?: "video" | "cover";
};

// Submits three fields: `image` (the new file, if any), `currentImage` and
// `removeImage` ("1" when the reader removed the current image).
export function ImageField({ current, label = "Image", hint, aspect = "video" }: Props) {
  const id = useId();
  const fileRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [removed, setRemoved] = useState(false);

  useEffect(() => () => {
    if (preview) URL.revokeObjectURL(preview);
  }, [preview]);

  const shown = preview ?? (removed ? null : imageUrl(current));

  function onFile(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    setPreview(file ? URL.createObjectURL(file) : null);
    if (file) setRemoved(false);
  }

  function clearNew() {
    if (fileRef.current) fileRef.current.value = "";
    setPreview(null);
  }

  return (
    <div className="grid gap-2">
      <Label htmlFor={id}>{label}</Label>
      <div
        className={`relative overflow-hidden rounded-lg border bg-muted ${
          aspect === "cover" ? "aspect-[2/3] max-w-48" : "aspect-video max-w-md"
        }`}
      >
        {shown ? (
          <img src={shown} alt="" className="absolute inset-0 h-full w-full object-cover" />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-sm text-muted-foreground">
            <ImageIcon aria-hidden="true" className="size-6" />
            {removed ? "Image will be removed when you save" : "No image"}
          </div>
        )}
      </div>
      <Input
        ref={fileRef}
        id={id}
        name="image"
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
        onChange={onFile}
        className="max-w-md"
        aria-describedby={`${id}-hint`}
      />
      <p id={`${id}-hint`} className="text-sm text-muted-foreground">
        {hint ?? "JPEG, PNG, WebP, GIF or AVIF, up to 5 MB."}
      </p>
      <input type="hidden" name="currentImage" value={current ?? ""} />
      <input type="hidden" name="removeImage" value={removed ? "1" : ""} />
      <div className="flex flex-wrap gap-2">
        {preview && (
          <Button type="button" variant="outline" size="sm" onClick={clearNew}>
            <Undo2 aria-hidden="true" />
            Keep current image
          </Button>
        )}
        {!preview && current && !removed && (
          <Button type="button" variant="outline" size="sm" onClick={() => setRemoved(true)}>
            <Trash2 aria-hidden="true" />
            Remove image
          </Button>
        )}
        {!preview && removed && (
          <Button type="button" variant="outline" size="sm" onClick={() => setRemoved(false)}>
            <Undo2 aria-hidden="true" />
            Keep image
          </Button>
        )}
      </div>
    </div>
  );
}

type ImageResult = {
  // Value to store on the record.
  value: string | null;
  // A file uploaded by this submission (remove it if saving fails).
  uploaded: string | null;
  // The previous value, to remove once the record has saved.
  replaced: string | null;
  error?: string;
};

// Applies an ImageField submission: uploads a new file, removes on request,
// otherwise keeps the current value.
export async function resolveImageField(
  form: FormData,
  folder: string,
  upload: (file: File, folder: string) => Promise<string>,
  check: (file: File) => string | null,
): Promise<ImageResult> {
  const current = String(form.get("currentImage") ?? "") || null;
  const file = form.get("image");
  if (file instanceof File && file.size > 0) {
    const problem = check(file);
    if (problem) return { value: current, uploaded: null, replaced: null, error: problem };
    try {
      const path = await upload(file, folder);
      return { value: path, uploaded: path, replaced: current };
    } catch (error) {
      return { value: current, uploaded: null, replaced: null, error: (error as Error).message };
    }
  }
  if (form.get("removeImage") === "1") return { value: null, uploaded: null, replaced: current };
  return { value: current, uploaded: null, replaced: null };
}
