import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { useCatalog } from "@/components/catalog-provider";
import { Button } from "@/components/ui/button";
import { deleteCategory, mergeCategory, saveCategory } from "@/lib/cms";

const darkInput =
  "h-11 w-full rounded-sm border border-paper/15 bg-navy-deep px-3 text-paper placeholder:text-paper/35 focus:outline-2 focus:outline-offset-1 focus:outline-brass";

/**
 * The managed category list. Renaming updates every course that carries the
 * category; a category in use can't be deleted, so merging is the way out.
 * The server enforces both — this panel only explains them.
 */
export function CategoriesPanel() {
  const { catalog, replace } = useCatalog();
  const [label, setLabel] = useState("");
  const [busy, setBusy] = useState(false);
  const [mergeFrom, setMergeFrom] = useState<string | null>(null);
  const [mergeInto, setMergeInto] = useState("");

  const counts = new Map<string, number>();
  for (const track of catalog.tracks) {
    for (const id of track.categoryIds ?? []) counts.set(id, (counts.get(id) ?? 0) + 1);
  }

  async function run(work: () => Promise<Awaited<ReturnType<typeof saveCategory>>>, done: string) {
    setBusy(true);
    try {
      replace(await work());
      toast.success(done);
      return true;
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not update categories");
      return false;
    } finally {
      setBusy(false);
    }
  }

  async function add(e: FormEvent) {
    e.preventDefault();
    if (!label.trim()) return;
    if (await run(() => saveCategory({ data: { label: label.trim() } }), "Category added.")) setLabel("");
  }

  return (
    <section>
      <h2 className="font-display text-3xl">Categories</h2>
      <p className="mt-2 max-w-2xl text-sm text-paper/60">
        One list for every course, so a topic never splits into three spellings. Renaming a category updates every
        course that uses it. A category still on a course can’t be deleted — merge it into another instead.
      </p>
      <form onSubmit={(e) => void add(e)} className="mt-4 flex flex-wrap gap-2">
        <input
          className={`${darkInput} max-w-xs`}
          value={label}
          maxLength={60}
          placeholder="New category"
          onChange={(e) => setLabel(e.target.value)}
        />
        <Button type="submit" variant="invert" disabled={busy || !label.trim()}>
          Add
        </Button>
      </form>
      <ul className="mt-4 divide-y divide-paper/10 border-t border-paper/10">
        {catalog.categories.map((category) => {
          const used = counts.get(category.id) ?? 0;
          return (
            <li key={category.id} className="py-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-medium">{category.label}</p>
                  <p className="text-xs text-paper/55">
                    {used} live course{used === 1 ? "" : "s"}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    variant="invert"
                    disabled={busy}
                    onClick={() => {
                      const next = window.prompt("Rename category", category.label);
                      if (!next || next.trim() === category.label) return;
                      void run(
                        () => saveCategory({ data: { id: category.id, label: next.trim() } }),
                        "Renamed on every course.",
                      );
                    }}
                  >
                    Rename
                  </Button>
                  <Button
                    size="sm"
                    variant="brass"
                    disabled={busy || catalog.categories.length < 2}
                    onClick={() => {
                      setMergeFrom(mergeFrom === category.id ? null : category.id);
                      setMergeInto("");
                    }}
                  >
                    Merge…
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-paper"
                    disabled={busy}
                    onClick={() => {
                      if (!confirm(`Delete “${category.label}”?`)) return;
                      void run(() => deleteCategory({ data: category.id }), "Category deleted.");
                    }}
                  >
                    Delete
                  </Button>
                </div>
              </div>
              {mergeFrom === category.id && (
                <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
                  <span className="text-paper/70">Move its courses into</span>
                  <select
                    className={`${darkInput} max-w-xs`}
                    value={mergeInto}
                    onChange={(e) => setMergeInto(e.target.value)}
                  >
                    <option value="">Choose a category</option>
                    {catalog.categories
                      .filter((other) => other.id !== category.id)
                      .map((other) => (
                        <option key={other.id} value={other.id}>
                          {other.label}
                        </option>
                      ))}
                  </select>
                  <Button
                    size="sm"
                    variant="invert"
                    disabled={busy || !mergeInto}
                    onClick={() => {
                      const into = catalog.categories.find((c) => c.id === mergeInto);
                      if (!into || !confirm(`Merge “${category.label}” into “${into.label}”? This removes “${category.label}”.`)) return;
                      void run(
                        () => mergeCategory({ data: { fromId: category.id, intoId: into.id } }),
                        `Merged into ${into.label}.`,
                      ).then((ok) => ok && setMergeFrom(null));
                    }}
                  >
                    Merge
                  </Button>
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
