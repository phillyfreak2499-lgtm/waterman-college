import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LESSON_TAG_HINTS } from "@/lib/lesson-tags";
import { arrayMove, buildAreaClass, MoveButtons } from "@/components/build/common";
import { BODY_TAG_OPTIONS, emptyBlock, type BodyBlock } from "@/components/build/model";

/**
 * The lesson-body composer. Each block is a paragraph or a tagged line; the
 * palette reads and writes the SAME block list the editor serializes back to
 * the `\n\n` body string, so nothing about the stored format changes.
 */
export function BlockPalette({
  blocks,
  onChange,
}: {
  blocks: BodyBlock[];
  onChange: (next: BodyBlock[]) => void;
}) {
  function update(id: string, patch: Partial<BodyBlock>) {
    onChange(blocks.map((b) => (b.id === id ? { ...b, ...patch } : b)));
  }
  function remove(id: string) {
    onChange(blocks.filter((b) => b.id !== id));
  }
  function move(from: number, to: number) {
    onChange(arrayMove(blocks, from, to));
  }

  return (
    <div className="space-y-3">
      <p className="text-xs text-muted">
        Paragraphs accept simple formatting: <code>**bold**</code>, <code>*italic*</code>,{" "}
        <code># Heading</code>, <code>- bullet</code>, <code>[link](https://…)</code>, and{" "}
        <code>![caption](/media/…)</code> for an image. A <strong>VIDEO</strong> line with a
        YouTube or Vimeo link plays in-page. The live preview shows exactly what learners see.
      </p>
      {blocks.length === 0 && (
        <p className="rounded-md border border-dashed border-line bg-paper-2 px-4 py-6 text-center text-sm text-muted">
          No content yet. Add a paragraph to begin.
        </p>
      )}
      {blocks.map((block, index) => (
        <div key={block.id} className="rounded-md border border-line bg-surface p-3">
          <div className="flex flex-wrap items-center gap-2">
            <select
              className="rounded-sm border border-line bg-paper px-2 py-1.5 text-xs font-medium"
              value={block.tag ?? ""}
              onChange={(e) => update(block.id, { tag: (e.target.value || null) as BodyBlock["tag"] })}
              aria-label="Block type"
            >
              <option value="">Paragraph</option>
              {BODY_TAG_OPTIONS.map((tag) => (
                <option key={tag} value={tag}>
                  {tag} line
                </option>
              ))}
            </select>
            <div className="ml-auto flex items-center gap-2">
              <MoveButtons index={index} count={blocks.length} onMove={move} label="block" />
              <button
                type="button"
                className="grid h-8 w-8 place-items-center rounded-sm border border-line text-danger hover:bg-paper-2"
                onClick={() => remove(block.id)}
                aria-label="Delete block"
              >
                <Trash2 className="size-4" />
              </button>
            </div>
          </div>
          <textarea
            className={`${buildAreaClass} mt-2`}
            rows={block.tag ? 2 : 3}
            value={block.text}
            placeholder={block.tag ? `${block.tag} line — what to do` : "Write a paragraph…"}
            onChange={(e) => update(block.id, { text: e.target.value })}
          />
          {block.tag && (
            <p className="mt-1 text-xs text-muted">{LESSON_TAG_HINTS[block.tag]}</p>
          )}
        </div>
      ))}
      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="outline" size="sm" onClick={() => onChange([...blocks, emptyBlock(null)])}>
          <Plus className="size-4" /> Paragraph
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => onChange([...blocks, emptyBlock("GFA")])}
        >
          <Plus className="size-4" /> Tagged line
        </Button>
      </div>
    </div>
  );
}
