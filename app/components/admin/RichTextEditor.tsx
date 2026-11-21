import {
  Bold,
  Code,
  Eraser,
  Heading2,
  Heading3,
  Italic,
  Link2,
  List,
  ListOrdered,
  Pilcrow,
  Quote,
  Redo2,
  Strikethrough,
  Superscript,
  Underline,
  Undo2,
  Unlink,
  type LucideIcon,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";

// A writing surface for the HTML stored in `summary` and `body`.
//
// It edits the stored HTML in place (contentEditable) rather than converting
// it to an editor's own document model, because the stored articles are Word
// exports with footnote anchors, inline styles and tables that a model-based
// editor would silently drop on save. Here markup the editor doesn't touch
// stays exactly as stored, and a field nobody edited is submitted unchanged,
// byte for byte. "HTML" switches to the raw source for anything the toolbar
// doesn't cover.

type Props = {
  id: string;
  name: string;
  // Accessible name (a <label for> doesn't name a contentEditable element).
  label: string;
  defaultValue: string;
  // "full" for article text, "basic" for short fields like the summary.
  toolbar?: "full" | "basic";
  minHeight?: string;
  describedBy?: string;
};

type Mode = "visual" | "html";
type Block = "p" | "h2" | "h3" | "blockquote" | "";

type State = {
  bold: boolean;
  italic: boolean;
  underline: boolean;
  strikeThrough: boolean;
  superscript: boolean;
  insertUnorderedList: boolean;
  insertOrderedList: boolean;
  link: boolean;
  block: Block;
};

const EMPTY_STATE: State = {
  bold: false,
  italic: false,
  underline: false,
  strikeThrough: false,
  superscript: false,
  insertUnorderedList: false,
  insertOrderedList: false,
  link: false,
  block: "",
};

export function RichTextEditor({ id, name, label, defaultValue, toolbar = "full", minHeight = "24rem", describedBy }: Props) {
  const editorRef = useRef<HTMLDivElement>(null);
  const savedRange = useRef<Range | null>(null);
  const [mode, setMode] = useState<Mode>("visual");
  // `html` is what gets submitted. Until someone edits, it is the stored value.
  const [html, setHtml] = useState(defaultValue);
  const [state, setState] = useState<State>(EMPTY_STATE);
  const [linkUrl, setLinkUrl] = useState<string | null>(null);
  const [words, setWords] = useState(0);

  const countWords = useCallback(() => {
    const text = editorRef.current?.innerText ?? "";
    setWords(text.trim() ? text.trim().split(/\s+/).length : 0);
  }, []);

  // Load the HTML into the editable surface on mount and when leaving HTML mode.
  useEffect(() => {
    if (mode !== "visual" || !editorRef.current) return;
    editorRef.current.innerHTML = html;
    countWords();
    // Only when the mode changes; typing must not reset the surface.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  // Set once the visual surface has really been edited; until then the stored
  // HTML is submitted as is (the browser's re-serialisation can differ).
  const edited = useRef(false);

  const sync = useCallback(() => {
    if (!editorRef.current) return;
    countWords();
    if (edited.current) setHtml(editorRef.current.innerHTML);
  }, [countWords]);

  const onInput = useCallback(() => {
    edited.current = true;
    sync();
  }, [sync]);

  const refreshState = useCallback(() => {
    const editor = editorRef.current;
    const selection = document.getSelection();
    if (!editor || !selection?.anchorNode || !editor.contains(selection.anchorNode)) return;
    const query = (command: string) => {
      try {
        return document.queryCommandState(command);
      } catch {
        return false;
      }
    };
    const anchor =
      selection.anchorNode.nodeType === Node.ELEMENT_NODE
        ? (selection.anchorNode as Element)
        : selection.anchorNode.parentElement;
    const blockEl = anchor?.closest("p, h2, h3, h4, blockquote, li, div");
    const tag = blockEl && editor.contains(blockEl) && blockEl !== editor ? blockEl.tagName.toLowerCase() : "";
    const inQuote = !!anchor?.closest("blockquote") && editor.contains(anchor.closest("blockquote"));
    setState({
      bold: query("bold"),
      italic: query("italic"),
      underline: query("underline"),
      strikeThrough: query("strikeThrough"),
      superscript: query("superscript"),
      insertUnorderedList: query("insertUnorderedList"),
      insertOrderedList: query("insertOrderedList"),
      link: !!anchor?.closest("a[href]") && editor.contains(anchor.closest("a[href]")),
      block: inQuote ? "blockquote" : tag === "h2" || tag === "h3" ? tag : tag === "p" ? "p" : "",
    });
  }, []);

  useEffect(() => {
    document.addEventListener("selectionchange", refreshState);
    return () => document.removeEventListener("selectionchange", refreshState);
  }, [refreshState]);

  function run(command: string, value?: string) {
    editorRef.current?.focus();
    document.execCommand("styleWithCSS", false, "false");
    document.execCommand(command, false, value);
    edited.current = true;
    sync();
    refreshState();
  }

  function setBlock(block: Exclude<Block, "">) {
    // Toggling the current block style off returns to a paragraph.
    run("formatBlock", state.block === block && block !== "p" ? "<p>" : `<${block}>`);
  }

  // Link: remember the selection, ask for the address inline, then apply.
  function openLink() {
    const selection = document.getSelection();
    if (selection && selection.rangeCount > 0 && editorRef.current?.contains(selection.anchorNode)) {
      savedRange.current = selection.getRangeAt(0).cloneRange();
      const anchor = (
        selection.anchorNode?.nodeType === Node.ELEMENT_NODE
          ? (selection.anchorNode as Element)
          : selection.anchorNode?.parentElement
      )?.closest("a[href]");
      setLinkUrl(anchor?.getAttribute("href") ?? "https://");
    } else {
      savedRange.current = null;
      setLinkUrl("https://");
    }
  }

  function restoreSelection() {
    editorRef.current?.focus();
    const range = savedRange.current;
    if (!range) return;
    const selection = document.getSelection();
    selection?.removeAllRanges();
    selection?.addRange(range);
  }

  function applyLink() {
    const url = (linkUrl ?? "").trim();
    restoreSelection();
    setLinkUrl(null);
    if (!url || url === "https://") return;
    const selection = document.getSelection();
    if (selection && selection.isCollapsed) {
      // Nothing selected: insert the address itself as the link text.
      run("insertHTML", `<a href="${escapeAttr(url)}">${escapeText(url)}</a>`);
    } else {
      run("createLink", url);
    }
  }

  function onPaste(event: React.ClipboardEvent<HTMLDivElement>) {
    const data = event.clipboardData;
    const pastedHtml = data.getData("text/html");
    const text = data.getData("text/plain");
    event.preventDefault();
    const clean = pastedHtml ? cleanPastedHtml(pastedHtml) : textToHtml(text);
    run("insertHTML", clean);
  }

  function onKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    const mod = event.ctrlKey || event.metaKey;
    if (mod && event.key.toLowerCase() === "k") {
      event.preventDefault();
      openLink();
    }
  }

  function switchMode(next: Mode) {
    if (next === mode) return;
    if (mode === "visual") sync();
    setLinkUrl(null);
    setMode(next);
  }

  const tool = (
    label: string,
    Icon: LucideIcon,
    onClick: () => void,
    pressed?: boolean,
    shortcut?: string,
  ) => (
    <ToolButton key={label} label={label} Icon={Icon} onClick={onClick} pressed={pressed} shortcut={shortcut} />
  );

  const visual = mode === "visual";

  return (
    <div className="rounded-lg border border-input focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50">
      <div
        role="toolbar"
        aria-label="Formatting"
        aria-controls={id}
        className="sticky top-0 z-10 flex flex-wrap items-center gap-0.5 rounded-t-lg border-b bg-background p-1"
      >
        {visual && (
          <>
            {toolbar === "full" && (
              <>
                {tool("Paragraph", Pilcrow, () => setBlock("p"), state.block === "p")}
                {tool("Heading", Heading2, () => setBlock("h2"), state.block === "h2")}
                {tool("Subheading", Heading3, () => setBlock("h3"), state.block === "h3")}
                <Divider />
              </>
            )}
            {tool("Bold", Bold, () => run("bold"), state.bold, "Ctrl+B")}
            {tool("Italic", Italic, () => run("italic"), state.italic, "Ctrl+I")}
            {tool("Underline", Underline, () => run("underline"), state.underline, "Ctrl+U")}
            {toolbar === "full" && (
              <>
                {tool("Strikethrough", Strikethrough, () => run("strikeThrough"), state.strikeThrough)}
                {tool("Superscript (footnote numbers)", Superscript, () => run("superscript"), state.superscript)}
              </>
            )}
            <Divider />
            {tool("Link", Link2, openLink, state.link, "Ctrl+K")}
            {state.link && tool("Remove link", Unlink, () => run("unlink"))}
            {toolbar === "full" && (
              <>
                <Divider />
                {tool("Bulleted list", List, () => run("insertUnorderedList"), state.insertUnorderedList)}
                {tool("Numbered list", ListOrdered, () => run("insertOrderedList"), state.insertOrderedList)}
                {tool("Block quote", Quote, () => setBlock("blockquote"), state.block === "blockquote")}
              </>
            )}
            <Divider />
            {tool("Clear formatting", Eraser, () => run("removeFormat"))}
            {tool("Undo", Undo2, () => run("undo"), undefined, "Ctrl+Z")}
            {tool("Redo", Redo2, () => run("redo"), undefined, "Ctrl+Shift+Z")}
          </>
        )}
        <div className="ml-auto flex items-center rounded-md border p-0.5 text-sm" role="group" aria-label="Editing mode">
          <button
            type="button"
            aria-pressed={visual}
            onClick={() => switchMode("visual")}
            className={`rounded px-2.5 py-1 font-medium transition-colors ${visual ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
          >
            Visual
          </button>
          <button
            type="button"
            aria-pressed={!visual}
            onClick={() => switchMode("html")}
            className={`flex items-center gap-1 rounded px-2.5 py-1 font-medium transition-colors ${!visual ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
          >
            <Code aria-hidden="true" className="size-3.5" />
            HTML
          </button>
        </div>
      </div>

      {linkUrl !== null && (
        <div className="flex flex-wrap items-center gap-2 border-b bg-muted/50 p-2">
          <label htmlFor={`${id}-link`} className="text-sm font-medium">
            Link address
          </label>
          <Input
            id={`${id}-link`}
            type="url"
            value={linkUrl}
            autoFocus
            onChange={(event) => setLinkUrl(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                applyLink();
              }
              if (event.key === "Escape") {
                event.preventDefault();
                setLinkUrl(null);
                restoreSelection();
              }
            }}
            className="h-8 min-w-0 flex-1 sm:max-w-sm"
          />
          <Button type="button" size="sm" onClick={applyLink}>
            Apply
          </Button>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={() => {
              setLinkUrl(null);
              restoreSelection();
            }}
          >
            Cancel
          </Button>
        </div>
      )}

      {visual ? (
        <div
          ref={editorRef}
          id={id}
          role="textbox"
          aria-multiline="true"
          aria-label={label}
          aria-describedby={describedBy}
          contentEditable
          suppressContentEditableWarning
          spellCheck
          onInput={onInput}
          onPaste={onPaste}
          onKeyDown={onKeyDown}
          onFocus={() => document.execCommand("defaultParagraphSeparator", false, "p")}
          className="rich-text overflow-y-auto px-5 py-4 outline-none sm:px-8 sm:py-6"
          style={{ minHeight }}
        />
      ) : (
        <textarea
          id={id}
          aria-label={`${label} (HTML)`}
          aria-describedby={describedBy}
          value={html}
          onChange={(event) => {
            // The source is now the truth; the visual surface reloads from it.
            edited.current = false;
            setHtml(event.target.value);
          }}
          spellCheck={false}
          className="block w-full resize-y rounded-b-lg bg-transparent px-4 py-3 font-mono text-sm leading-relaxed outline-none"
          style={{ minHeight }}
        />
      )}

      <div className="flex items-center justify-between gap-2 border-t px-3 py-1.5 text-xs text-muted-foreground">
        <span>{visual ? "Paste from Word or the web keeps bold, italics, links and headings." : "Editing the raw HTML."}</span>
        {visual && toolbar === "full" && <span className="tabular-nums">{words.toLocaleString()} words</span>}
      </div>

      <input type="hidden" name={name} value={html} />
    </div>
  );
}

function ToolButton({
  label,
  Icon,
  onClick,
  pressed,
  shortcut,
}: {
  label: string;
  Icon: LucideIcon;
  onClick: () => void;
  pressed?: boolean;
  shortcut?: string;
}) {
  return (
    <button
      type="button"
      title={shortcut ? `${label} (${shortcut})` : label}
      aria-label={label}
      aria-pressed={pressed}
      // Keep the text selection in the editor when the button is clicked.
      onMouseDown={(event) => event.preventDefault()}
      onClick={onClick}
      className={`flex size-8 items-center justify-center rounded-md transition-colors hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none ${
        pressed ? "bg-primary/15 text-primary" : "text-foreground"
      }`}
    >
      <Icon aria-hidden="true" className="size-4" />
    </button>
  );
}

function Divider() {
  return <span aria-hidden="true" className="mx-1 h-5 w-px bg-border" />;
}

const escapeText = (text: string) =>
  text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const escapeAttr = (text: string) => escapeText(text).replace(/"/g, "&quot;");

function textToHtml(text: string) {
  const paragraphs = text.replace(/\r\n?/g, "\n").split(/\n{2,}/);
  if (paragraphs.length === 1) return escapeText(text).replace(/\n/g, "<br>");
  return paragraphs
    .filter((p) => p.trim())
    .map((p) => `<p>${escapeText(p).replace(/\n/g, "<br>")}</p>`)
    .join("");
}

// Pasted HTML (Word, Google Docs, web pages) keeps its structure and basic
// formatting; fonts, colours, classes and scripts are dropped.
const KEEP = new Set([
  "p", "br", "b", "strong", "i", "em", "u", "s", "sup", "sub", "a",
  "h2", "h3", "h4", "blockquote", "ul", "ol", "li",
  "table", "thead", "tbody", "tr", "th", "td", "hr",
]);
const RENAME: Record<string, string> = { h1: "h2", h5: "h4", h6: "h4", div: "p" };
const DROP = new Set(["script", "style", "meta", "link", "title", "head", "noscript", "iframe", "object", "svg", "img"]);

function cleanPastedHtml(source: string) {
  const doc = new DOMParser().parseFromString(source, "text/html");
  const out = document.createElement("div");

  function walk(node: Node, parent: HTMLElement) {
    if (node.nodeType === Node.TEXT_NODE) {
      parent.append(document.createTextNode(node.textContent ?? ""));
      return;
    }
    if (node.nodeType !== Node.ELEMENT_NODE) return;
    const el = node as HTMLElement;
    let tag = el.tagName.toLowerCase();
    if (DROP.has(tag)) return;
    // Google Docs wraps everything in <b style="font-weight:normal">.
    if (tag === "b" && /font-weight:\s*normal/i.test(el.getAttribute("style") ?? "")) tag = "span";
    // Inline styles that mean bold/italic in Docs and Word.
    const style = el.getAttribute("style") ?? "";
    tag = RENAME[tag] ?? tag;
    if (KEEP.has(tag)) {
      const copy = document.createElement(tag);
      if (tag === "a") {
        const href = el.getAttribute("href");
        if (href && !/^\s*javascript:/i.test(href)) copy.setAttribute("href", href);
      }
      el.childNodes.forEach((child) => walk(child, copy));
      parent.append(copy);
      return;
    }
    // Unknown wrapper (span, font, section…): keep its children, plus any
    // bold or italic it carried as a style.
    let target = parent;
    if (/font-weight:\s*(bold|[6-9]00)/i.test(style)) {
      const strong = document.createElement("strong");
      target.append(strong);
      target = strong;
    }
    if (/font-style:\s*italic/i.test(style)) {
      const em = document.createElement("em");
      target.append(em);
      target = em;
    }
    el.childNodes.forEach((child) => walk(child, target));
  }

  doc.body.childNodes.forEach((child) => walk(child, out));
  // Remove empty paragraphs Word leaves between blocks.
  out.querySelectorAll("p").forEach((p) => {
    if (!p.textContent?.trim() && !p.querySelector("br")) p.remove();
  });
  return out.innerHTML;
}
