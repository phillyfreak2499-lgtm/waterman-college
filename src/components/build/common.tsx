import { ChevronDown, ChevronUp } from "lucide-react";

/** Move an item within a copy of the array; returns a new array. */
export function arrayMove<T>(list: T[], from: number, to: number): T[] {
  if (to < 0 || to >= list.length) return list;
  const next = list.slice();
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}

/** Up/down reorder controls used across the builder (keyboard-accessible). */
export function MoveButtons({
  index,
  count,
  onMove,
  label = "item",
}: {
  index: number;
  count: number;
  onMove: (from: number, to: number) => void;
  label?: string;
}) {
  return (
    <span className="inline-flex overflow-hidden rounded-sm border border-line">
      <button
        type="button"
        className="grid h-8 w-8 place-items-center text-navy disabled:opacity-30"
        onClick={() => onMove(index, index - 1)}
        disabled={index === 0}
        aria-label={`Move ${label} up`}
      >
        <ChevronUp className="size-4" />
      </button>
      <button
        type="button"
        className="grid h-8 w-8 place-items-center border-l border-line text-navy disabled:opacity-30"
        onClick={() => onMove(index, index + 1)}
        disabled={index === count - 1}
        aria-label={`Move ${label} down`}
      >
        <ChevronDown className="size-4" />
      </button>
    </span>
  );
}

export const buildInputClass =
  "field-input w-full rounded-sm border border-line bg-paper px-3 py-2 text-sm";
export const buildAreaClass = `${buildInputClass} min-h-24 leading-relaxed`;
