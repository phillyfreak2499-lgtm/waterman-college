import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { isMyBirthdayToday } from "@/lib/locker-daily";

/**
 * On a user's birthday, the locker and the Training Hall close for the day.
 * BirthdayGate checks the server once and, on the big day, swaps the page
 * for the full BirthdayTakeover: nonstop confetti, balloons, fireworks, a
 * sung Happy Birthday, and an Okay button that never, ever lets them train.
 * The rest of the site (directory, Quad, inbox) stays reachable via the
 * header — only training is off-limits.
 */

const NEON = [
  "#ff3ea5",
  "#00e5ff",
  "#ffe600",
  "#7cff00",
  "#ff6b00",
  "#b026ff",
  "#ff2450",
  "#00ffa3",
];

/** Spec-fixed first three replies, in order. */
const FIRST_REPLIES = [
  "No, seriously, you don't need to train today. It's your birthday.",
  "Seriously? I said you don't need to train.",
];

/** After that: the infinite sass loop. */
const LOOP_REPLIES = [
  "The locker is closed for birthday celebrations.",
  "Go eat cake.",
  "I'm not letting you in.",
  "Clicking Okay does not open the locker. It never will. Not today.",
  "Your arch-support knowledge will survive one day off. Promise.",
  "This is a birthday zone. Training is strictly prohibited.",
  "The lessons are throwing you a party in there. You can come back tomorrow.",
  "Persistence is a great quality. Save it for the sales floor. Tomorrow.",
  "Still here? The cake is getting cold.",
  "I locked the locker and swallowed the key. It tasted like frosting.",
  "New policy, effective today only: no training on birthdays. Yours, specifically.",
  "You click, I say no. This is our little dance now.",
  "Every click adds another balloon. Look what you've done.",
  "Imagine all the training you could do tomorrow. Beautiful. Now go celebrate.",
  "The Chancellor personally approved your day off. Don't make it weird.",
  "Okay is just a word. The locker stays shut.",
  "I've seen your streak. One day off will not hurt it. Go.",
  "If you refresh the page, I will still be here. With more confetti.",
];

type Piece = {
  left: number;
  size: number;
  color: string;
  delay: number;
  duration: number;
  round: boolean;
};

function rand(min: number, max: number) {
  return min + Math.random() * (max - min);
}

function makeConfetti(count: number): Piece[] {
  return Array.from({ length: count }, () => ({
    left: rand(0, 100),
    size: rand(6, 14),
    color: NEON[Math.floor(rand(0, NEON.length))],
    delay: rand(-6, 0),
    duration: rand(2.6, 6.5),
    round: Math.random() < 0.35,
  }));
}

// One check per calendar day per tab: navigating between the five gated
// routes should not re-blank the page on a fresh round-trip every time.
let birthdayCache: { day: string; birthday: boolean } | null = null;

export function BirthdayGate({ children }: { children: ReactNode }) {
  const { user } = useCurrentUserState();
  const today = new Date().toDateString();
  const [state, setState] = useState<"checking" | "party" | "normal">(() =>
    birthdayCache?.day === today ? (birthdayCache.birthday ? "party" : "normal") : "checking",
  );

  useEffect(() => {
    if (birthdayCache?.day === today) return;
    let cancelled = false;
    isMyBirthdayToday()
      .then((r) => {
        birthdayCache = { day: today, birthday: r.birthday };
        if (!cancelled) setState(r.birthday ? "party" : "normal");
      })
      .catch(() => {
        // Never lock anyone out because a check failed.
        if (!cancelled) setState("normal");
      });
    return () => {
      cancelled = true;
    };
  }, [today]);

  if (state === "checking") {
    return <div className="min-h-[50vh]" aria-hidden="true" />;
  }
  if (state === "party") {
    return <BirthdayTakeover firstName={user?.displayName?.split(" ")[0] || "you"} />;
  }
  return <>{children}</>;
}

export function BirthdayTakeover({ firstName }: { firstName: string }) {
  const [stage, setStage] = useState<"sing" | "gate">("sing");
  const [clicks, setClicks] = useState(0);

  useEffect(() => {
    const t = setTimeout(() => setStage("gate"), 5200);
    return () => clearTimeout(t);
  }, []);

  // The party never calms down — and every Okay click makes it worse.
  const extra = Math.min(clicks, 40);
  const confetti = useMemo(() => makeConfetti(140 + extra * 3), [extra]);
  const balloons = useMemo(
    () =>
      Array.from({ length: 10 + Math.min(clicks, 20) }, () => ({
        left: rand(2, 94),
        delay: rand(-14, 0),
        duration: rand(9, 16),
        size: rand(2, 3.4),
      })),
    [clicks],
  );
  const bursts = useMemo(
    () =>
      Array.from({ length: 9 }, () => ({
        left: rand(8, 92),
        top: rand(6, 60),
        delay: rand(0, 4),
        color: NEON[Math.floor(rand(0, NEON.length))],
      })),
    [],
  );

  const message =
    clicks === 0
      ? "You don't need to train on your birthday. Go out there and enjoy the day."
      : clicks <= FIRST_REPLIES.length
        ? FIRST_REPLIES[clicks - 1]
        : LOOP_REPLIES[(clicks - FIRST_REPLIES.length - 1) % LOOP_REPLIES.length];

  const title = `Happy Birthday ${firstName}!`;

  return (
    <section
      className="bday-zone relative min-h-[88vh] w-full select-none overflow-hidden"
      style={{ background: "#0b0518" }}
      onClick={stage === "sing" ? () => setStage("gate") : undefined}
    >
      <style>{`
        .bday-rainbow {
          position: absolute; inset: -20%;
          background:
            radial-gradient(circle at 20% 30%, rgba(255,62,165,.5), transparent 45%),
            radial-gradient(circle at 80% 20%, rgba(0,229,255,.5), transparent 45%),
            radial-gradient(circle at 50% 80%, rgba(255,230,0,.4), transparent 50%),
            radial-gradient(circle at 85% 70%, rgba(124,255,0,.4), transparent 45%),
            conic-gradient(from 0deg, #ff3ea5, #ff6b00, #ffe600, #7cff00, #00e5ff, #b026ff, #ff3ea5);
          opacity: .35; filter: saturate(1.8);
          animation: bday-hue 6s linear infinite;
        }
        .bday-confetti { position: absolute; top: -12vh; animation: bday-fall linear infinite; }
        .bday-balloon { position: absolute; bottom: -18vh; animation: bday-float ease-in infinite; }
        .bday-streamer {
          position: absolute; top: -2rem; width: .6rem; height: 34vh; border-radius: 999px;
          transform-origin: top center; animation: bday-swing 2.6s ease-in-out infinite alternate;
          opacity: .85;
        }
        .bday-burst { position: absolute; width: 0; height: 0; animation: bday-boom 2.8s ease-out infinite; }
        .bday-burst span {
          position: absolute; left: -2px; top: -28px; width: 4px; height: 26px; border-radius: 999px;
          transform-origin: 50% 30px;
        }
        .bday-letter { display: inline-block; animation: bday-bounce 1s ease-in-out infinite; text-shadow: 0 0 18px currentColor; }
        .bday-card { animation: bday-pop .45s cubic-bezier(.2,1.6,.4,1) both; }
        .bday-note { position: absolute; font-size: 2rem; animation: bday-float ease-in infinite; }
        @keyframes bday-hue { to { filter: saturate(1.8) hue-rotate(360deg); } }
        @keyframes bday-fall {
          from { transform: translateY(0) rotate(0deg); }
          to { transform: translateY(125vh) rotate(720deg); }
        }
        @keyframes bday-float {
          from { transform: translateY(0) rotate(-4deg); }
          50% { transform: translateY(-60vh) rotate(6deg); }
          to { transform: translateY(-125vh) rotate(-6deg); }
        }
        @keyframes bday-swing { from { transform: rotate(-10deg); } to { transform: rotate(10deg); } }
        @keyframes bday-bounce { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-1.1rem); } }
        @keyframes bday-boom {
          0% { transform: scale(0); opacity: 0; }
          12% { opacity: 1; }
          45% { transform: scale(1.6); opacity: 0; }
          100% { transform: scale(1.6); opacity: 0; }
        }
        @keyframes bday-pop { from { transform: scale(.7); opacity: 0; } to { transform: scale(1); opacity: 1; } }
        @media (prefers-reduced-motion: reduce) {
          .bday-zone * { animation: none !important; }
          .bday-confetti, .bday-balloon, .bday-burst, .bday-note { display: none; }
        }
      `}</style>

      <div className="bday-rainbow" aria-hidden="true" />

      {/* Streamers */}
      {[8, 22, 38, 60, 76, 90].map((left, i) => (
        <div
          key={`s${i}`}
          className="bday-streamer"
          aria-hidden="true"
          style={{
            left: `${left}%`,
            background: `linear-gradient(${NEON[i % NEON.length]}, transparent)`,
            animationDelay: `${i * 0.35}s`,
          }}
        />
      ))}

      {/* Confetti rain */}
      {confetti.map((p, i) => (
        <span
          key={`c${i}`}
          className="bday-confetti"
          aria-hidden="true"
          style={{
            left: `${p.left}%`,
            width: p.size,
            height: p.round ? p.size : p.size * 2.2,
            background: p.color,
            borderRadius: p.round ? "999px" : "2px",
            boxShadow: `0 0 8px ${p.color}`,
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`,
          }}
        />
      ))}

      {/* Balloons */}
      {balloons.map((b, i) => (
        <span
          key={`b${i}`}
          className="bday-balloon"
          aria-hidden="true"
          style={{
            left: `${b.left}%`,
            fontSize: `${b.size}rem`,
            animationDelay: `${b.delay}s`,
            animationDuration: `${b.duration}s`,
            filter: `hue-rotate(${(i * 47) % 360}deg) drop-shadow(0 0 6px rgba(255,255,255,.4))`,
          }}
        >
          🎈
        </span>
      ))}

      {/* Firework bursts */}
      {bursts.map((f, i) => (
        <span
          key={`f${i}`}
          className="bday-burst"
          aria-hidden="true"
          style={{ left: `${f.left}%`, top: `${f.top}%`, animationDelay: `${f.delay}s` }}
        >
          {Array.from({ length: 12 }, (_, r) => (
            <span
              key={r}
              style={{
                background: f.color,
                boxShadow: `0 0 10px ${f.color}`,
                transform: `rotate(${r * 30}deg)`,
              }}
            />
          ))}
        </span>
      ))}

      {/* The song, then the door that never opens */}
      <div className="relative z-10 mx-auto flex min-h-[88vh] max-w-3xl flex-col items-center justify-center px-6 py-16 text-center">
        <p
          className={
            stage === "sing"
              ? "font-display text-5xl leading-tight sm:text-7xl"
              : "font-display text-3xl leading-tight sm:text-4xl"
          }
        >
          {title.split("").map((ch, i) => (
            <span
              key={i}
              className="bday-letter"
              style={{
                color: NEON[i % NEON.length],
                animationDelay: `${i * 0.07}s`,
              }}
            >
              {ch === " " ? " " : ch}
            </span>
          ))}
        </p>

        {stage === "sing" ? (
          <>
            {["🎵", "🎶", "🎵", "🎂", "🎶"].map((n, i) => (
              <span
                key={`n${i}`}
                className="bday-note"
                aria-hidden="true"
                style={{
                  left: `${12 + i * 18}%`,
                  bottom: "-4rem",
                  animationDelay: `${i * 0.9}s`,
                  animationDuration: "7s",
                }}
              >
                {n}
              </span>
            ))}
            <p className="mt-8 text-sm uppercase tracking-[0.3em] text-white/50">
              🎤 now singing… (tap to skip the song)
            </p>
          </>
        ) : (
          <div key={clicks} className="bday-card mt-10 w-full max-w-xl">
            <div
              className="rounded-2xl border-2 px-7 py-9 backdrop-blur-sm"
              style={{
                borderColor: NEON[clicks % NEON.length],
                background: "rgba(11,5,24,.75)",
                boxShadow: `0 0 40px ${NEON[clicks % NEON.length]}55`,
              }}
            >
              <p
                aria-live="polite"
                className="font-display text-2xl leading-snug text-white sm:text-3xl"
              >
                {message}
              </p>
              <button
                type="button"
                onClick={() => setClicks((c) => c + 1)}
                className="mt-8 inline-flex h-12 items-center rounded-full px-10 text-base font-bold text-[#0b0518] transition-transform hover:scale-105 active:scale-95"
                style={{
                  background: `linear-gradient(90deg, ${NEON[(clicks + 1) % NEON.length]}, ${NEON[(clicks + 4) % NEON.length]})`,
                  boxShadow: `0 0 24px ${NEON[(clicks + 1) % NEON.length]}88`,
                }}
              >
                Okay
              </button>
              {clicks > 4 && (
                <p className="mt-4 text-xs uppercase tracking-[0.2em] text-white/40">
                  clicks so far: {clicks} · lockers opened: 0
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
