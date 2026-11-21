import { Crosshair, ImageIcon, Trash2, Undo2 } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";

import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { imageUrl, splitImage, withFocus, type Focus } from "~/lib/images";

type Props = {
  // Current stored value: a storage path or a full URL, optionally with a
  // `#focus=x,y` focal point (see images.ts).
  current: string | null;
  label?: string;
  hint?: string;
  aspect?: "video" | "cover";
  // Prefix for the submitted field names, when a form has several images.
  prefix?: string;
  // false for images shown uncropped (ads): no focal point picker.
  focus?: boolean;
};

const CENTRE: Focus = { x: 50, y: 50 };

// Submits four fields (each name starts with `prefix`): `image` (the new
// file, if any), `currentImage`, `removeImage` ("1" when the reader removed
// the current image) and `imageFocus` ("x,y" in percent: the part of the image
// to keep in crops; left out when `focus` is false).
export function ImageField({ current, label = "Image", hint, aspect = "video", prefix = "", focus: pickFocus = true }: Props) {
  const id = useId();
  const fileRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [removed, setRemoved] = useState(false);
  const [focus, setFocus] = useState<Focus>(splitImage(current).focus ?? CENTRE);

  useEffect(() => () => {
    if (preview) URL.revokeObjectURL(preview);
  }, [preview]);

  const shown = preview ?? (removed ? null : imageUrl(splitImage(current).path));

  function onFile(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    setPreview(file ? URL.createObjectURL(file) : null);
    if (file) {
      setRemoved(false);
      setFocus(CENTRE);
    }
  }

  function clearNew() {
    if (fileRef.current) fileRef.current.value = "";
    setPreview(null);
    setFocus(splitImage(current).focus ?? CENTRE);
  }

  return (
    <div className="grid gap-2">
      <Label htmlFor={id}>{label}</Label>
      {shown && pickFocus ? (
        <FocusPicker src={shown} focus={focus} onChange={setFocus} aspect={aspect} />
      ) : shown ? (
        <img src={shown} alt="" className="block max-h-72 w-auto max-w-full rounded-lg border bg-muted" />
      ) : (
        <div
          // avoid-ai-design-ignore: IM4 (the field's real empty state: no image yet, or removal pending)
          className={`relative flex flex-col items-center justify-center gap-2 overflow-hidden rounded-lg border bg-muted text-sm text-muted-foreground ${
            aspect === "cover" ? "aspect-[2/3] max-w-48" : "aspect-video max-w-md"
          }`}
        >
          <ImageIcon aria-hidden="true" className="size-6" />
          {removed ? "Image will be removed when you save" : "No image"}
        </div>
      )}
      <Input
        ref={fileRef}
        id={id}
        name={`${prefix}image`}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
        onChange={onFile}
        className="max-w-md"
        aria-describedby={`${id}-hint`}
      />
      <p id={`${id}-hint`} className="text-sm text-muted-foreground">
        {hint ?? "JPEG, PNG, WebP, GIF or AVIF, up to 5 MB."}
      </p>
      <input type="hidden" name={`${prefix}currentImage`} value={current ?? ""} />
      <input type="hidden" name={`${prefix}removeImage`} value={removed ? "1" : ""} />
      {pickFocus && <input type="hidden" name={`${prefix}imageFocus`} value={`${focus.x},${focus.y}`} />}
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

const clamp = (n: number) => Math.min(100, Math.max(0, Math.round(n)));

// The whole image with a draggable focal point, beside the crops the site
// makes from it, so the editor sees what each place will show.
function FocusPicker({
  src,
  focus,
  onChange,
  aspect,
}: {
  src: string;
  focus: Focus;
  onChange: (focus: Focus) => void;
  aspect: "video" | "cover";
}) {
  const frameRef = useRef<HTMLDivElement>(null);
  const handleRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState(false);
  const position = `${focus.x}% ${focus.y}%`;

  function moveTo(event: React.PointerEvent) {
    const box = frameRef.current?.getBoundingClientRect();
    if (!box || box.width === 0 || box.height === 0) return;
    onChange({
      x: clamp(((event.clientX - box.left) / box.width) * 100),
      y: clamp(((event.clientY - box.top) / box.height) * 100),
    });
  }

  function onPointerDown(event: React.PointerEvent<HTMLDivElement>) {
    if (event.button !== 0) return;
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    setDragging(true);
    handleRef.current?.focus({ preventScroll: true });
    moveTo(event);
  }

  function onKeyDown(event: React.KeyboardEvent) {
    const step = event.shiftKey ? 10 : 1;
    const moves: Record<string, [number, number]> = {
      ArrowLeft: [-step, 0],
      ArrowRight: [step, 0],
      ArrowUp: [0, -step],
      ArrowDown: [0, step],
    };
    const move = moves[event.key];
    if (!move) return;
    event.preventDefault();
    onChange({ x: clamp(focus.x + move[0]), y: clamp(focus.y + move[1]) });
  }

  const crops =
    aspect === "cover"
      ? [
          { label: "Cover", className: "aspect-[2/3] w-20" },
          { label: "Square", className: "aspect-square w-20" },
        ]
      : [
          { label: "Wide", className: "aspect-video w-36" },
          { label: "Square", className: "aspect-square w-20" },
          { label: "Tall", className: "aspect-[3/4] w-[3.75rem]" },
        ];

  return (
    <div className="flex flex-col gap-4 rounded-lg border p-3 sm:flex-row sm:items-start">
      <div className="flex min-w-0 flex-col gap-2">
        <div
          ref={frameRef}
          onPointerDown={onPointerDown}
          onPointerMove={(event) => dragging && moveTo(event)}
          onPointerUp={() => setDragging(false)}
          onPointerCancel={() => setDragging(false)}
          className={`relative w-fit touch-none select-none overflow-hidden rounded-md bg-muted ${
            dragging ? "cursor-grabbing" : "cursor-crosshair"
          }`}
        >
          <img
            src={src}
            alt=""
            draggable={false}
            className={`block w-auto max-w-full ${aspect === "cover" ? "max-h-72" : "max-h-64"}`}
          />
          {/* Shade everything but a ring around the focal point. */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0"
            style={{
              background: `radial-gradient(circle at ${position}, transparent 0 2.5rem, rgb(0 0 0 / 0.35) 2.6rem)`,
            }}
          />
          <div
            ref={handleRef}
            role="slider"
            tabIndex={0}
            aria-label="Focal point"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={focus.x}
            aria-valuetext={`${focus.x}% from the left, ${focus.y}% from the top`}
            onKeyDown={onKeyDown}
            className="absolute size-6 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-primary/70 shadow-[0_0_0_1px_rgb(0_0_0/0.5)] outline-none focus-visible:ring-3 focus-visible:ring-ring"
            style={{ left: `${focus.x}%`, top: `${focus.y}%` }}
          />
        </div>
        <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <Crosshair aria-hidden="true" className="size-4 shrink-0" />
          Drag the point onto the part of the image that must stay in view. Arrow keys move it too.
        </p>
      </div>

      <div className="flex shrink-0 flex-col gap-2">
        <p className="text-sm font-medium">How it’s cropped</p>
        <div className="flex flex-wrap items-end gap-3">
          {crops.map((crop) => (
            <figure key={crop.label} className="flex flex-col gap-1">
              <img
                src={src}
                alt=""
                draggable={false}
                className={`${crop.className} rounded-sm bg-muted object-cover`}
                style={{ objectPosition: position }}
              />
              <figcaption className="text-xs text-muted-foreground">{crop.label}</figcaption>
            </figure>
          ))}
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="w-fit"
          disabled={focus.x === 50 && focus.y === 50}
          onClick={() => onChange(CENTRE)}
        >
          Reset to centre
        </Button>
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
  prefix = "",
): Promise<ImageResult> {
  const current = String(form.get(`${prefix}currentImage`) ?? "") || null;
  const { path: currentPath, focus: currentFocus } = splitImage(current);
  // Without an `imageFocus` field, keep the focal point already stored.
  const [x, y] = String(form.get(`${prefix}imageFocus`) ?? "").split(",").map(Number);
  const focus = form.has(`${prefix}imageFocus`) && Number.isFinite(x) && Number.isFinite(y) ? { x, y } : currentFocus;
  const file = form.get(`${prefix}image`);
  if (file instanceof File && file.size > 0) {
    const problem = check(file);
    if (problem) return { value: current, uploaded: null, replaced: null, error: problem };
    try {
      const path = await upload(file, folder);
      return { value: withFocus(path, focus), uploaded: path, replaced: current };
    } catch (error) {
      return { value: current, uploaded: null, replaced: null, error: (error as Error).message };
    }
  }
  if (form.get(`${prefix}removeImage`) === "1") return { value: null, uploaded: null, replaced: current };
  return { value: withFocus(currentPath, focus), uploaded: null, replaced: null };
}
