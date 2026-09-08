import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ImageField } from "@/components/image-field";
import { arrayMove, buildInputClass, buildAreaClass, MoveButtons } from "@/components/build/common";
import type { DeckSlide, SlideBlock, SlideListTone } from "@/lib/decks";

/**
 * Author a slide carousel. State is DeckSlide[]; the lesson editor serializes it
 * to JSON on save (validated server-side by decks-schema). Supports every block
 * kind the renderer understands: p, quote, say, list, steps, cards, pair, image.
 */
export function SlideEditor({
  slides,
  onChange,
}: {
  slides: DeckSlide[];
  onChange: (next: DeckSlide[]) => void;
}) {
  function updateSlide(i: number, patch: Partial<DeckSlide>) {
    onChange(slides.map((s, idx) => (idx === i ? { ...s, ...patch } : s)));
  }
  function moveSlide(from: number, to: number) {
    onChange(arrayMove(slides, from, to));
  }
  function addSlide() {
    onChange([...slides, { n: slides.length + 1, title: "New slide", blocks: [{ kind: "p", text: "" }] }]);
  }
  function removeSlide(i: number) {
    onChange(slides.filter((_, idx) => idx !== i));
  }

  return (
    <div className="space-y-4">
      {slides.length === 0 && (
        <p className="rounded-md border border-dashed border-line bg-paper-2 px-4 py-6 text-center text-sm text-muted">
          No slides. A lesson does not need them — add one only when a picture, contrast, or sequence beats a paragraph.
        </p>
      )}
      {slides.map((slide, i) => (
        <div key={i} className="rounded-lg border border-line bg-paper-2 p-4">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium uppercase tracking-[0.14em] text-brass">Slide {i + 1}</span>
            <div className="ml-auto flex items-center gap-2">
              <MoveButtons index={i} count={slides.length} onMove={moveSlide} label="slide" />
              <button
                type="button"
                className="grid h-8 w-8 place-items-center rounded-sm border border-line text-danger hover:bg-paper"
                onClick={() => removeSlide(i)}
                aria-label="Delete slide"
              >
                <Trash2 className="size-4" />
              </button>
            </div>
          </div>
          <div className="mt-3 grid gap-2 sm:grid-cols-3">
            <input
              className={buildInputClass}
              placeholder="Kicker (optional)"
              value={slide.kicker ?? ""}
              onChange={(e) => updateSlide(i, { kicker: e.target.value })}
            />
            <input
              className={`${buildInputClass} sm:col-span-2`}
              placeholder="Slide title"
              value={slide.title}
              onChange={(e) => updateSlide(i, { title: e.target.value })}
            />
          </div>
          <input
            className={`${buildInputClass} mt-2`}
            placeholder="Subtitle (optional)"
            value={slide.subtitle ?? ""}
            onChange={(e) => updateSlide(i, { subtitle: e.target.value })}
          />
          <BlockList
            blocks={slide.blocks}
            onChange={(blocks) => updateSlide(i, { blocks })}
          />
        </div>
      ))}
      <Button type="button" variant="outline" size="sm" onClick={addSlide}>
        <Plus className="size-4" /> Add slide
      </Button>
    </div>
  );
}

const BLOCK_KINDS: { kind: SlideBlock["kind"]; label: string }[] = [
  { kind: "p", label: "Paragraph" },
  { kind: "quote", label: "Quote" },
  { kind: "say", label: "Say this" },
  { kind: "list", label: "List" },
  { kind: "steps", label: "Steps" },
  { kind: "cards", label: "Cards" },
  { kind: "pair", label: "Two columns" },
  { kind: "image", label: "Image" },
];

function newBlock(kind: SlideBlock["kind"]): SlideBlock {
  switch (kind) {
    case "p":
      return { kind: "p", text: "" };
    case "quote":
      return { kind: "quote", text: "" };
    case "say":
      return { kind: "say", label: "Say", text: "" };
    case "list":
      return { kind: "list", title: "", items: [""], tone: "plain" };
    case "steps":
      return { kind: "steps", items: [{ title: "", body: "" }] };
    case "cards":
      return { kind: "cards", items: [{ letter: "", title: "", body: "" }] };
    case "pair":
      return { kind: "pair", left: { title: "", body: "" }, right: { title: "", body: "" } };
    case "image":
      return { kind: "image", src: "", alt: "" };
  }
}

function BlockList({ blocks, onChange }: { blocks: SlideBlock[]; onChange: (b: SlideBlock[]) => void }) {
  function update(i: number, next: SlideBlock) {
    onChange(blocks.map((b, idx) => (idx === i ? next : b)));
  }
  return (
    <div className="mt-3 space-y-2">
      {blocks.map((block, i) => (
        <div key={i} className="rounded-md border border-line bg-paper p-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-muted">{block.kind}</span>
            <div className="ml-auto flex items-center gap-2">
              <MoveButtons index={i} count={blocks.length} onMove={(f, t) => onChange(arrayMove(blocks, f, t))} label="block" />
              <button
                type="button"
                className="grid h-8 w-8 place-items-center rounded-sm border border-line text-danger hover:bg-paper-2"
                onClick={() => onChange(blocks.filter((_, idx) => idx !== i))}
                aria-label="Delete block"
              >
                <Trash2 className="size-4" />
              </button>
            </div>
          </div>
          <div className="mt-2">
            <SlideBlockFields block={block} onChange={(next) => update(i, next)} />
          </div>
        </div>
      ))}
      <div className="flex flex-wrap gap-1.5">
        {BLOCK_KINDS.map((option) => (
          <button
            key={option.kind}
            type="button"
            className="rounded-sm border border-line bg-surface px-2.5 py-1 text-xs text-navy hover:border-navy/40"
            onClick={() => onChange([...blocks, newBlock(option.kind)])}
          >
            + {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}

const TONES: SlideListTone[] = ["plain", "do", "never", "green", "red"];

function SlideBlockFields({ block, onChange }: { block: SlideBlock; onChange: (b: SlideBlock) => void }) {
  switch (block.kind) {
    case "p":
    case "quote":
      return (
        <textarea
          className={buildAreaClass}
          rows={2}
          value={block.text}
          placeholder={block.kind === "quote" ? "A quote" : "A paragraph"}
          onChange={(e) => onChange({ ...block, text: e.target.value })}
        />
      );
    case "say":
      return (
        <div className="grid gap-2 sm:grid-cols-[8rem_1fr]">
          <input
            className={buildInputClass}
            placeholder="Label"
            value={block.label ?? ""}
            onChange={(e) => onChange({ ...block, label: e.target.value })}
          />
          <textarea
            className={buildAreaClass}
            rows={2}
            placeholder="What to say"
            value={block.text}
            onChange={(e) => onChange({ ...block, text: e.target.value })}
          />
        </div>
      );
    case "list":
      return (
        <div className="space-y-2">
          <div className="flex flex-wrap gap-2">
            <input
              className={`${buildInputClass} flex-1`}
              placeholder="List title (optional)"
              value={block.title ?? ""}
              onChange={(e) => onChange({ ...block, title: e.target.value })}
            />
            <select
              className={buildInputClass}
              value={block.tone ?? "plain"}
              onChange={(e) => onChange({ ...block, tone: e.target.value as SlideListTone })}
            >
              {TONES.map((tone) => (
                <option key={tone} value={tone}>
                  {tone}
                </option>
              ))}
            </select>
          </div>
          <textarea
            className={buildAreaClass}
            rows={3}
            placeholder="One item per line"
            value={block.items.join("\n")}
            onChange={(e) => onChange({ ...block, items: e.target.value.split("\n").map((s) => s.trim()).filter(Boolean) })}
          />
        </div>
      );
    case "steps":
      return (
        <RepeatingRows
          rows={block.items}
          onChange={(items) => onChange({ ...block, items })}
          blank={{ title: "", body: "" }}
          render={(row, set) => (
            <div className="grid gap-2 sm:grid-cols-[5rem_1fr]">
              <input className={buildInputClass} placeholder="No." value={row.n ?? ""} onChange={(e) => set({ ...row, n: e.target.value })} />
              <div className="space-y-2">
                <input className={buildInputClass} placeholder="Step title" value={row.title} onChange={(e) => set({ ...row, title: e.target.value })} />
                <textarea className={buildAreaClass} rows={2} placeholder="Step body" value={row.body} onChange={(e) => set({ ...row, body: e.target.value })} />
              </div>
            </div>
          )}
        />
      );
    case "cards":
      return (
        <RepeatingRows
          rows={block.items}
          onChange={(items) => onChange({ ...block, items })}
          blank={{ letter: "", title: "", body: "" }}
          render={(row, set) => (
            <div className="grid gap-2 sm:grid-cols-[4rem_1fr]">
              <input className={buildInputClass} placeholder="A" value={row.letter} onChange={(e) => set({ ...row, letter: e.target.value })} />
              <div className="space-y-2">
                <input className={buildInputClass} placeholder="Card title" value={row.title} onChange={(e) => set({ ...row, title: e.target.value })} />
                <textarea className={buildAreaClass} rows={2} placeholder="Card body" value={row.body} onChange={(e) => set({ ...row, body: e.target.value })} />
              </div>
            </div>
          )}
        />
      );
    case "pair":
      return (
        <div className="grid gap-3 sm:grid-cols-2">
          {(["left", "right"] as const).map((side) => (
            <div key={side} className="space-y-2 rounded-sm border border-line p-2">
              <p className="text-xs uppercase tracking-[0.14em] text-muted">{side}</p>
              <input
                className={buildInputClass}
                placeholder="Title"
                value={block[side].title}
                onChange={(e) => onChange({ ...block, [side]: { ...block[side], title: e.target.value } })}
              />
              <textarea
                className={buildAreaClass}
                rows={2}
                placeholder="Body"
                value={block[side].body}
                onChange={(e) => onChange({ ...block, [side]: { ...block[side], body: e.target.value } })}
              />
            </div>
          ))}
        </div>
      );
    case "image":
      return (
        <div className="space-y-2">
          <ImageField
            label="Slide image"
            value={block.src}
            withLibrary
            onChange={(url) => onChange({ ...block, src: url })}
          />
          <input
            className={buildInputClass}
            placeholder="Alt text — what the image shows"
            value={block.alt}
            onChange={(e) => onChange({ ...block, alt: e.target.value })}
          />
          <input
            className={buildInputClass}
            placeholder="Caption (optional)"
            value={block.caption ?? ""}
            onChange={(e) => onChange({ ...block, caption: e.target.value })}
          />
        </div>
      );
  }
}

function RepeatingRows<T>({
  rows,
  onChange,
  blank,
  render,
}: {
  rows: T[];
  onChange: (rows: T[]) => void;
  blank: T;
  render: (row: T, set: (next: T) => void) => React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      {rows.map((row, i) => (
        <div key={i} className="flex items-start gap-2">
          <div className="flex-1">{render(row, (next) => onChange(rows.map((r, idx) => (idx === i ? next : r))))}</div>
          <div className="flex flex-col gap-1">
            <MoveButtons index={i} count={rows.length} onMove={(f, t) => onChange(arrayMove(rows, f, t))} label="row" />
            <button
              type="button"
              className="grid h-8 w-full place-items-center rounded-sm border border-line text-danger"
              onClick={() => onChange(rows.filter((_, idx) => idx !== i))}
              aria-label="Delete row"
            >
              <Trash2 className="size-4" />
            </button>
          </div>
        </div>
      ))}
      <Button type="button" variant="ghost" size="sm" onClick={() => onChange([...rows, { ...blank }])}>
        <Plus className="size-4" /> Add row
      </Button>
    </div>
  );
}
