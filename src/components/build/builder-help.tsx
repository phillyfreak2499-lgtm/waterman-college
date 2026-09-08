import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { BookOpen, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LESSON_TAGS } from "@/lib/lesson-tags";

const SLIDE_KINDS = ["paragraph", "quote", "say-this", "list", "steps", "cards", "two-column pair", "image"];

/**
 * A slide-over Help drawer for the builder: the full "Using the Training
 * Builder" course, plus a quick reference (tags, slide kinds, the paragraph
 * rule). The trigger button lives in the builder headers.
 */
export function BuilderHelpButton() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button type="button" variant="outline" size="sm" onClick={() => setOpen(true)}>
        <BookOpen className="size-4" /> Help &amp; guide
      </Button>
      {open && <HelpDrawer onClose={() => setOpen(false)} />}
    </>
  );
}

function HelpDrawer({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-navy/40" role="dialog" aria-modal="true" aria-label="Builder help" onClick={onClose}>
      <div className="h-full w-full max-w-md overflow-auto bg-paper p-6 shadow-card" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h2 className="font-display text-2xl">Builder guide</h2>
          <button type="button" onClick={onClose} aria-label="Close help" className="grid h-9 w-9 place-items-center rounded-sm hover:bg-paper-2">
            <X className="size-5" />
          </button>
        </div>

        <div className="mt-5 rounded-md border border-line bg-surface p-4">
          <p className="kicker">Learn the builder</p>
          <p className="mt-2 text-sm text-muted">
            The full walk-through lives in a course you can take like any other.
          </p>
          <Link
            to="/training/$track"
            params={{ track: "using-the-training-builder" }}
            className="mt-3 inline-block text-navy underline"
          >
            Open “Using the Training Building Center” →
          </Link>
        </div>

        <section className="mt-6">
          <h3 className="font-display text-lg">Quick reference</h3>
          <p className="mt-3 text-sm font-medium">Body</p>
          <p className="text-sm text-muted">
            One idea per paragraph. The takeaway is its own field — the single sentence a learner carries onto the floor.
          </p>
          <p className="mt-3 text-sm font-medium">Tagged lines</p>
          <div className="mt-1 flex flex-wrap gap-1.5">
            {LESSON_TAGS.map((tag) => (
              <span key={tag} className="rounded-sm bg-paper-2 px-2 py-0.5 text-[0.65rem] font-medium uppercase tracking-[0.12em] text-brass">
                {tag}
              </span>
            ))}
          </div>
          <p className="mt-1 text-xs text-muted">Tag a line to make it a resource step, then attach its link in the Links panel (https:// only).</p>
          <p className="mt-3 text-sm font-medium">Slide blocks</p>
          <p className="text-sm text-muted">{SLIDE_KINDS.join(" · ")}. One idea per slide.</p>
          <p className="mt-3 text-sm font-medium">Before you publish</p>
          <p className="text-sm text-muted">
            Run the pre-flight check, fix what it flags, then Publish — publishing announces a finished course; ordinary
            edits are live the moment you save.
          </p>
        </section>
      </div>
    </div>
  );
}
