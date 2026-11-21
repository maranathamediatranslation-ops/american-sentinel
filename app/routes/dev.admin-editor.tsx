// Dev-only preview of the admin form fields (image focal point picker and rich
// text editor) with placeholder data, so they can be tried without signing in.
// Not registered in production builds.
import "~/admin.css";

import { useState } from "react";

import { ImageField } from "~/components/admin/ImageField";
import { RichTextEditor } from "~/components/admin/RichTextEditor";
import { Label } from "~/components/ui/label";
import { sampleArticle } from "~/dev/fixtures";

export function meta() {
  return [{ title: "Preview: admin editor" }, { name: "robots", content: "noindex" }];
}

export default function DevAdminEditor() {
  const [submitted, setSubmitted] = useState<Record<string, string> | null>(null);
  return (
    <main className="mx-auto flex max-w-4xl flex-col gap-6 p-6">
      <h1 className="text-2xl font-bold">Admin editor preview</h1>
      <form
        className="flex flex-col gap-6"
        onSubmit={(event) => {
          event.preventDefault();
          const form = new FormData(event.currentTarget);
          setSubmitted(Object.fromEntries([...form.entries()].map(([k, v]) => [k, String(v)])));
        }}
      >
        <ImageField current={`${sampleArticle.imageUrl ?? "https://i.ytimg.com/vi/cP4SboyMZVk/hqdefault.jpg"}#focus=30,40`} />
        <div className="grid gap-2">
          <Label htmlFor="summary">Summary</Label>
          <RichTextEditor id="summary" name="summary" label="Summary" defaultValue={sampleArticle.summary ?? ""} toolbar="basic" minHeight="6rem" />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="body">Text</Label>
          <RichTextEditor id="body" name="body" label="Text" defaultValue={sampleArticle.body} />
        </div>
        <button type="submit" className="w-fit rounded-lg bg-primary px-4 py-2 text-primary-foreground">
          Show submitted values
        </button>
      </form>
      {submitted && (
        <pre id="submitted" className="overflow-x-auto rounded-lg bg-muted p-4 text-xs">
          {JSON.stringify(submitted, null, 2)}
        </pre>
      )}
    </main>
  );
}
