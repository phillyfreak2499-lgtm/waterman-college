let current: HTMLAudioElement | null = null;
let preloaders: HTMLAudioElement[] = [];
let sharedContext: AudioContext | null = null;

const SRC = {
  heavy: "/sfx/vault-open.mp3",
  light: "/sfx/vault-exit.mp3",
} as const;

export function preloadVaultSounds() {
  for (const audio of preloaders) {
    audio.pause();
    audio.removeAttribute("src");
  }
  preloaders = Object.values(SRC).map((src) => {
    const audio = new Audio();
    audio.preload = "auto";
    audio.src = src;
    return audio;
  });
  return () => {
    for (const audio of preloaders) {
      audio.pause();
      audio.removeAttribute("src");
      audio.load();
    }
    preloaders = [];
  };
}

export function stopVaultSounds() {
  if (current) {
    current.pause();
    current.removeAttribute("src");
    current.load();
    current = null;
  }
  if (sharedContext) {
    void sharedContext.close();
    sharedContext = null;
  }
}

export function playVaultSound(kind: "heavy" | "light" = "heavy") {
  try {
    if (current) {
      current.pause();
      current.currentTime = 0;
    }
    const audio = new Audio(SRC[kind]);
    audio.volume = kind === "light" ? 0.72 : 0.88;
    audio.addEventListener(
      "ended",
      () => {
        if (current === audio) current = null;
        audio.removeAttribute("src");
        audio.load();
      },
      { once: true },
    );
    current = audio;
    void audio.play().catch(() => {
      if (current === audio) current = null;
      audio.removeAttribute("src");
      audio.load();
      synthVault(kind);
    });
  } catch {
    synthVault(kind);
  }
}

function synthVault(kind: "heavy" | "light") {
  const AudioCtx =
    window.AudioContext ||
    (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioCtx) return;
  sharedContext ??= new AudioCtx();
  const ctx = sharedContext;
  if (ctx.state === "suspended") void ctx.resume();
  const now = ctx.currentTime;
  const duration = kind === "light" ? 1.4 : 2.1;
  const master = ctx.createGain();
  master.gain.value = 0.7;
  master.connect(ctx.destination);

  const tone = (
    type: OscillatorType,
    start: number,
    from: number,
    to: number,
    length: number,
    volume: number,
  ) => {
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(from, start);
    oscillator.frequency.exponentialRampToValueAtTime(to, start + length);
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(volume, start + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + length);
    oscillator.connect(gain);
    gain.connect(master);
    oscillator.start(start);
    oscillator.stop(start + length + 0.02);
  };

  tone("sine", now, kind === "light" ? 90 : 62, 36, 0.55, 0.9);
  tone("sawtooth", now + 0.05, kind === "light" ? 240 : 190, 70, duration * 0.85, 0.12);
  tone("triangle", now + (kind === "light" ? 0.95 : 1.5), 140, 40, 0.4, 0.8);
}
