import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ArrowLeft, Maximize2, Minimize2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { AuthGate } from "@/components/auth-gate";
import { SiteHeader } from "@/components/site-header";
import { QUAD_GAMES } from "@/lib/quad";
import { reportGameResult } from "@/lib/quad-scores";
import { pageHead } from "@/lib/page-title";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/quad_/$game")({
  component: GamePage,
  head: ({ params }) => {
    const game = QUAD_GAMES.find((g) => g.slug === params.game);
    return pageHead(game?.title ?? "The Quad");
  },
});

/**
 * Immersive game view. The games are built as full-viewport pages (100vh, often
 * with their own overflow handling), so instead of embedding them in a small
 * fixed-height frame inside a scrolling page — where wheel/touch scroll chains
 * to the outer page and the game gets cut off — this route locks the outer page
 * to exactly one viewport (h-dvh + overflow-hidden, no footer) and gives the
 * iframe everything below the header. With nothing to scroll outside, scrolling
 * happens inside the game.
 */
function GamePage() {
  return (
    <div className="flex h-dvh flex-col overflow-hidden overscroll-none bg-paper text-ink">
      <SiteHeader />
      <AuthGate>
        <GameFrame />
      </AuthGate>
    </div>
  );
}

function GameFrame() {
  const { game: slug } = Route.useParams();
  const game = QUAD_GAMES.find((g) => g.slug === slug);

  // The game's real content height, reported by quad-bridge.js. Mobile browsers
  // often refuse to scroll INSIDE an iframe (the gesture chains to the parent
  // instead), so the parent owns the scrollbar: the wrapper below scrolls, and
  // the iframe is sized to the game's content so nothing inside is ever
  // unreachable. Games that fit the viewport report ~viewport height and the
  // wrapper simply never scrolls.
  const [gameHeight, setGameHeight] = useState<number | null>(null);

  // Relay same-origin activity messages from the game (quad-bridge.js) to the
  // Locker ledger. Best-effort — a failed write never disrupts play.
  useEffect(() => {
    if (!game) return;
    function onMessage(event: MessageEvent) {
      if (event.origin !== window.location.origin) return;
      const data = event.data as {
        type?: string;
        slug?: string;
        opened?: boolean;
        score?: number;
        height?: number;
      };
      if (!data || data.type !== "cogs:quad" || data.slug !== game!.slug) return;
      if (typeof data.height === "number" && isFinite(data.height)) {
        setGameHeight(Math.min(Math.max(Math.ceil(data.height), 0), 20000) || null);
      }
      const payload: { slug: string; opened?: boolean; score?: number } = { slug: game!.slug };
      if (data.opened === true) payload.opened = true;
      if (typeof data.score === "number") payload.score = data.score;
      if (payload.opened || payload.score != null) {
        void reportGameResult({ data: payload }).catch(() => undefined);
      }
    }
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [game]);

  // Reset the reported height when switching games.
  useEffect(() => {
    setGameHeight(null);
  }, [slug]);

  // Fullscreen: native Fullscreen API where available (with the webkit-prefixed
  // variant for Safari); on iPhone — which has no element fullscreen at all —
  // fall back to a CSS takeover that pins the game over the whole app viewport.
  const shellRef = useRef<HTMLDivElement>(null);
  const [nativeFull, setNativeFull] = useState(false);
  const [cssFull, setCssFull] = useState(false);
  const isFull = nativeFull || cssFull;

  useEffect(() => {
    function onChange() {
      const d = document as Document & { webkitFullscreenElement?: Element | null };
      setNativeFull(Boolean(d.fullscreenElement ?? d.webkitFullscreenElement));
    }
    document.addEventListener("fullscreenchange", onChange);
    document.addEventListener("webkitfullscreenchange", onChange);
    return () => {
      document.removeEventListener("fullscreenchange", onChange);
      document.removeEventListener("webkitfullscreenchange", onChange);
    };
  }, []);

  // Leaving the page while in CSS-takeover mode shouldn't strand state.
  useEffect(() => {
    setCssFull(false);
  }, [slug]);

  async function toggleFullscreen() {
    const d = document as Document & {
      webkitFullscreenElement?: Element | null;
      webkitExitFullscreen?: () => void;
    };
    if (isFull) {
      setCssFull(false);
      try {
        if (d.fullscreenElement ?? d.webkitFullscreenElement) {
          if (d.exitFullscreen) await d.exitFullscreen();
          else d.webkitExitFullscreen?.();
        }
      } catch {
        /* already out */
      }
      return;
    }
    const el = shellRef.current as
      | (HTMLDivElement & { webkitRequestFullscreen?: () => void })
      | null;
    try {
      if (el?.requestFullscreen) {
        await el.requestFullscreen();
        return;
      }
      if (el?.webkitRequestFullscreen) {
        el.webkitRequestFullscreen();
        return;
      }
    } catch {
      /* fall through to CSS takeover */
    }
    setCssFull(true);
  }

  if (!game) throw notFound();
  return (
    <div
      ref={shellRef}
      className={cn(
        "flex min-h-0 flex-1 flex-col bg-paper",
        cssFull && "fixed inset-0 z-50 h-dvh",
      )}
    >
      {/* Slim game bar — back link + title on one line so the game keeps the room */}
      <div className="flex items-center gap-3 border-b border-line bg-paper-2 px-4 py-2 sm:px-6">
        <Link
          to="/quad"
          className="inline-flex shrink-0 items-center gap-1.5 text-[0.68rem] font-medium uppercase tracking-[0.14em] text-brass hover:text-navy"
        >
          <ArrowLeft className="size-3.5" /> The Quad
        </Link>
        <span className="h-4 w-px shrink-0 bg-line" aria-hidden />
        <h1 className="min-w-0 truncate font-display text-lg leading-none" title={game.blurb}>
          {game.title}
        </h1>
        <button
          type="button"
          onClick={() => void toggleFullscreen()}
          className="ml-auto inline-flex h-9 shrink-0 items-center gap-1.5 rounded-sm border border-line bg-surface px-2.5 text-[0.68rem] font-medium uppercase tracking-[0.12em] text-navy transition-colors hover:border-navy/25 hover:bg-paper"
          title={isFull ? "Exit full screen" : "Full screen"}
        >
          {isFull ? (
            <Minimize2 className="size-3.5" aria-hidden />
          ) : (
            <Maximize2 className="size-3.5" aria-hidden />
          )}
          <span className="hidden sm:inline">{isFull ? "Exit" : "Full screen"}</span>
        </button>
      </div>
      {/* The wrapper scrolls (works everywhere, including mobile); the iframe
          grows to the game's content height so its own scrolling is never needed. */}
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain [-webkit-overflow-scrolling:touch]">
        <iframe
          title={game.title}
          src={game.file}
          className="block min-h-full w-full bg-paper"
          style={gameHeight ? { height: `${gameHeight}px` } : undefined}
        />
      </div>
    </div>
  );
}
