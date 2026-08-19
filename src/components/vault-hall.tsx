import { useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { playVaultSound, preloadVaultSounds, stopVaultSounds } from "@/lib/vault-sound";
import type { RoleId } from "@/lib/content";
import { cn } from "@/lib/utils";

type Door = {
  id: string;
  label: string;
  role?: RoleId;
  kind: "heavy" | "light";
  left: number;
  top: number;
  width: number;
  height: number;
  glow: string;
};

const DOORS: Door[] = [
  { id: "new-hires", label: "New Hires", role: "new-hires", kind: "heavy", left: 0.208, top: 0.372, width: 0.134, height: 0.443, glow: "rgba(184,137,74,0.42)" },
  { id: "specialist", label: "Specialists", role: "specialist", kind: "heavy", left: 0.348, top: 0.36, width: 0.14, height: 0.455, glow: "rgba(74,126,184,0.45)" },
  { id: "mit", label: "MIT", role: "mit", kind: "heavy", left: 0.493, top: 0.36, width: 0.137, height: 0.455, glow: "rgba(201,162,39,0.48)" },
  { id: "managers", label: "Managers", role: "managers", kind: "heavy", left: 0.635, top: 0.368, width: 0.123, height: 0.447, glow: "rgba(140,40,56,0.48)" },
  { id: "exit", label: "Exit training", kind: "light", left: 0.828, top: 0.4, width: 0.124, height: 0.415, glow: "rgba(196,163,106,0.28)" },
];

const DOOR_TONE: Record<string, string> = {
  "new-hires": "border-bronze/70 text-bronze",
  specialist: "border-hall-blue/70 text-hall-blue",
  mit: "border-hall-gold/70 text-hall-gold",
  managers: "border-hall-burgundy/70 text-hall-burgundy",
};

const MOTES = [
  { left: "8%", delay: "0s", dur: "9s", size: 2 },
  { left: "18%", delay: "1.2s", dur: "11s", size: 1 },
  { left: "27%", delay: "0.4s", dur: "8s", size: 2 },
  { left: "39%", delay: "2.1s", dur: "12s", size: 1 },
  { left: "48%", delay: "0.8s", dur: "10s", size: 3 },
  { left: "57%", delay: "1.7s", dur: "9s", size: 1 },
  { left: "66%", delay: "0.2s", dur: "13s", size: 2 },
  { left: "74%", delay: "2.6s", dur: "8s", size: 1 },
  { left: "83%", delay: "1.1s", dur: "11s", size: 2 },
  { left: "91%", delay: "0.6s", dur: "10s", size: 1 },
];

const ASPECT = 1728 / 1152;

function stageSize(vw: number, vh: number) {
  if (vw / Math.max(vh, 1) > ASPECT) return { width: vh * ASPECT, height: vh };
  return { width: vw, height: vw / ASPECT };
}

function prefersReducedMotion() {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function VaultHall({ armed = true }: { armed?: boolean }) {
  const navigate = useNavigate();
  const lock = useRef(false);
  const navigationTimer = useRef<number | null>(null);
  const [view, setView] = useState<{ w: number; h: number } | null>(null);
  const [arrived, setArrived] = useState(false);
  const [quiet, setQuiet] = useState(true);

  useEffect(() => {
    const releasePreloads = preloadVaultSounds();
    const update = () => setView({ w: window.innerWidth, h: window.innerHeight });
    update();
    const html = document.documentElement;
    const body = document.body;
    const prevHtml = html.style.overflow;
    const prevBody = body.style.overflow;
    html.style.overflow = "hidden";
    body.style.overflow = "hidden";
    window.addEventListener("resize", update);
    window.addEventListener("orientationchange", update);
    const skip = prefersReducedMotion();
    setQuiet(skip);
    const timer = window.setTimeout(() => setArrived(true), skip ? 0 : 1650);
    return () => {
      html.style.overflow = prevHtml;
      body.style.overflow = prevBody;
      window.removeEventListener("resize", update);
      window.removeEventListener("orientationchange", update);
      window.clearTimeout(timer);
      if (navigationTimer.current !== null) window.clearTimeout(navigationTimer.current);
      releasePreloads();
      stopVaultSounds();
    };
  }, []);

  function openDoor(door: Door) {
    if (!armed || !arrived || lock.current) return;
    lock.current = true;
    playVaultSound(door.kind);
    navigationTimer.current = window.setTimeout(() => {
      if (door.role) {
        void navigate({ to: "/training", search: { role: door.role } });
      } else {
        void navigate({ to: "/" });
      }
      lock.current = false;
      navigationTimer.current = null;
    }, 620);
  }

  const picker = Boolean(view && view.w < 760 && view.h > view.w);
  const stage = view
    ? stageSize(view.w, view.h - (picker ? 150 : 0))
    : null;
  const portrait = picker;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-vault">
      <h1 className="sr-only">Training hall — choose a door</h1>
      {portrait && arrived && (
        <p className="pointer-events-none absolute inset-x-0 top-4 z-10 text-center text-[0.68rem] font-medium uppercase tracking-[0.2em] text-brass-soft">
          Choose a door
        </p>
      )}
      <div
        className={cn("absolute left-1/2 top-1/2", arrived && "vault-reveal")}
        style={
          stage
            ? {
                width: stage.width,
                height: stage.height,
                marginLeft: -stage.width / 2,
                marginTop: portrait ? -stage.height / 2 - 75 : -stage.height / 2,
                opacity: arrived ? undefined : 0,
              }
            : { inset: 0, margin: 0, transform: "none" }
        }
      >
        <img
          src="/media/vault-hall.jpg"
          alt=""
          draggable={false}
          className="pointer-events-none h-full w-full select-none object-fill"
        />
        {stage && arrived && (
          <div
            aria-hidden="true"
            className="absolute hidden flex-col justify-center overflow-hidden border border-[#8a674c] bg-[#121011] px-[0.7%] text-[#c7a37f] shadow-inner lg:flex"
            style={{ left: "5.4%", top: "15.4%", width: "11.2%", height: "28.2%" }}
          >
            <p className="font-display text-[clamp(0.45rem,0.8vw,0.85rem)] leading-tight">
              A Message from the Chancellor
            </p>
            <p className="mt-[6%] text-[clamp(0.32rem,0.52vw,0.58rem)] leading-snug text-[#b59578]">
              People first. Every lesson should make tomorrow’s Client experience better.
            </p>
          </div>
        )}
        {stage &&
          arrived &&
          DOORS.map((door) => (
            <button
              key={door.id}
              type="button"
              disabled={!armed}
              aria-label={door.role ? `Open ${door.label} training` : door.label}
              onClick={() => openDoor(door)}
              className="group absolute rounded-sm border border-transparent bg-transparent transition duration-200 focus-visible:outline-none disabled:cursor-wait"
              style={{
                left: `${door.left * 100}%`,
                top: `${door.top * 100}%`,
                width: `${door.width * 100}%`,
                height: `${door.height * 100}%`,
              }}
            >
              <span
                className="pointer-events-none absolute inset-0 rounded-sm opacity-40 transition duration-200 group-hover:opacity-100 group-focus-visible:opacity-100"
                style={{ boxShadow: `inset 0 0 36px 4px ${door.glow}` }}
              />
              <span className="sr-only">{door.label}</span>
            </button>
          ))}
      </div>

      {!quiet && (
        <div className="pointer-events-none absolute inset-0 z-20 overflow-hidden">
          {MOTES.map((mote, i) => (
            <span
              key={i}
              className="vault-mote absolute bottom-0 rounded-full bg-brass-soft/70"
              style={{
                left: mote.left,
                width: mote.size,
                height: mote.size,
                animationDelay: mote.delay,
                animationDuration: mote.dur,
              }}
            />
          ))}
        </div>
      )}

      {!arrived && (
        <div className="vault-flicker pointer-events-none absolute inset-0 z-30 bg-black" />
      )}

      {portrait && arrived && (
        <div className="absolute inset-x-0 bottom-0 z-10 border-t border-paper/10 bg-navy-deep/95 px-3 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          <div className="grid grid-cols-2 gap-2">
            {DOORS.filter((d) => d.role).map((door) => (
              <button
                key={door.id}
                type="button"
                disabled={!armed}
                onClick={() => openDoor(door)}
                className={cn(
                  "flex min-h-11 items-center justify-center rounded-sm border bg-navy px-3 text-sm font-medium",
                  DOOR_TONE[door.id] ?? "border-paper/20 text-paper",
                )}
              >
                {door.label}
              </button>
            ))}
            <button
              type="button"
              disabled={!armed}
              onClick={() => openDoor(DOORS.find((d) => d.id === "exit")!)}
              className="col-span-2 flex min-h-11 items-center justify-center rounded-sm border border-brass/40 bg-transparent px-3 text-sm font-medium text-brass-soft"
            >
              Exit
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
