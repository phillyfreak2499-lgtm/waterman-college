import { Star } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { listFavorites, toggleFavorite } from "@/lib/locker";
import { cn } from "@/lib/utils";

type Props = {
  targetType: "track" | "lesson";
  targetId: string;
  className?: string;
  /** Visual density — "icon" for title bars, "button" for larger controls */
  size?: "icon" | "button";
  label?: string;
  /** Use light colors for placement on navy / inverted heroes */
  invert?: boolean;
};

/**
 * One-tap star that adds/removes a track or lesson from the learner's Locker Favorites.
 * Reuses the existing toggleFavorite / listFavorites server functions.
 */
export function FavoriteButton({
  targetType,
  targetId,
  className,
  size = "icon",
  label,
  invert = false,
}: Props) {
  const [favorited, setFavorited] = useState(false);
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setReady(false);
    listFavorites()
      .then((favs) => {
        if (cancelled) return;
        setFavorited(
          favs.some((f) => f.targetType === targetType && f.targetId === targetId),
        );
      })
      .catch(() => {
        /* favorites are an enhancement — never block the page */
      })
      .finally(() => {
        if (!cancelled) setReady(true);
      });
    return () => {
      cancelled = true;
    };
  }, [targetType, targetId]);

  async function onToggle() {
    if (busy) return;
    setBusy(true);
    const next = !favorited;
    setFavorited(next);
    try {
      const result = await toggleFavorite({ data: { targetType, targetId } });
      setFavorited(result.favorited);
      toast.success(
        result.favorited ? "Saved to your Locker favorites" : "Removed from favorites",
      );
    } catch (error) {
      setFavorited(!next);
      toast.error(error instanceof Error ? error.message : "Could not update favorite");
    } finally {
      setBusy(false);
    }
  }

  if (size === "button") {
    return (
      <button
        type="button"
        onClick={() => void onToggle()}
        disabled={!ready || busy}
        aria-pressed={favorited}
        aria-label={favorited ? "Remove from favorites" : "Add to favorites"}
        className={cn(
          "inline-flex h-10 items-center gap-2 rounded-sm border px-4 text-sm font-medium transition-colors",
          invert
            ? favorited
              ? "border-brass/60 bg-brass/15 text-paper"
              : "border-paper/30 bg-transparent text-paper hover:border-paper/50 hover:bg-paper/10"
            : favorited
              ? "border-brass/50 bg-brass/10 text-navy"
              : "border-navy/20 bg-transparent text-navy hover:border-navy/40 hover:bg-navy/5",
          className,
        )}
      >
        <Star
          className={cn(
            "size-4",
            favorited ? "fill-brass text-brass" : invert ? "text-paper/70" : "text-navy/60",
          )}
          aria-hidden
        />
        {label ?? (favorited ? "Favorited" : "Favorite")}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={() => void onToggle()}
      disabled={!ready || busy}
      aria-pressed={favorited}
      aria-label={favorited ? "Remove from favorites" : "Add to favorites"}
      title={favorited ? "Remove from favorites" : "Save to Locker favorites"}
      className={cn(
        "inline-flex size-10 items-center justify-center rounded-sm transition-colors",
        "focus-visible:outline-2 focus-visible:outline-offset-2 disabled:opacity-50",
        invert
          ? "hover:bg-paper/10 focus-visible:outline-paper"
          : "hover:bg-navy/5 focus-visible:outline-navy",
        className,
      )}
    >
      <Star
        className={cn(
          "size-5 transition-colors",
          favorited
            ? "fill-brass text-brass"
            : invert
              ? "text-paper/50 hover:text-paper/80"
              : "text-navy/45 hover:text-navy/70",
        )}
        aria-hidden
      />
    </button>
  );
}
