export type SlideListTone = "do" | "never" | "green" | "red" | "plain";

export type SlideBlock =
  | { kind: "p"; text: string }
  | { kind: "quote"; text: string }
  | { kind: "say"; label?: string; text: string }
  | { kind: "list"; title?: string; items: string[]; tone?: SlideListTone }
  | { kind: "steps"; items: { n?: string; title: string; body: string }[] }
  | { kind: "cards"; items: { letter: string; title: string; body: string }[] }
  | { kind: "pair"; left: { title: string; body: string }; right: { title: string; body: string } }
  | { kind: "image"; src: string; alt: string; caption?: string };

export type DeckSlide = {
  n: number;
  kicker?: string;
  title: string;
  subtitle?: string;
  blocks: SlideBlock[];
};

export type TrackSeries = "burgundy" | "blue";

export type DeckMeta = {
  series: TrackSeries;
  label: string;
  deckUrl: string;
  deckName: string;
};

export const DECK_META: Record<string, DeckMeta> = {
  care: {
    series: "burgundy",
    label: "Burgundy Track",
    deckUrl: "/slides/care-burgundy.pptx",
    deckName: "CARE Field Guide.pptx",
  },
  interview: {
    series: "blue",
    label: "Blue Track",
    deckUrl: "/slides/interview-for-reality.pptx",
    deckName: "Interview for Reality.pptx",
  },
  "floor-leader": {
    series: "blue",
    label: "Blue Track",
    deckUrl: "/slides/working-with-floor-leader.pptx",
    deckName: "Working with Your Floor Leader.pptx",
  },
  "complete-solution": {
    series: "blue",
    label: "Blue Track",
    deckUrl: "/slides/complete-solution.pptx",
    deckName: "Building a Complete Solution.pptx",
  },
  "non-tangible": {
    series: "blue",
    label: "Blue Track",
    deckUrl: "/slides/non-tangible-value.pptx",
    deckName: "Building Non-Tangible Value.pptx",
  },
};

const DECKS: Record<string, DeckSlide[]> = {};

export function registerDeck(trackId: string, slug: string, slides: DeckSlide[]) {
  DECKS[`${trackId}:${slug}`] = slides;
}

export function getDeckSlides(trackId: string, slug: string): DeckSlide[] | undefined {
  return DECKS[`${trackId}:${slug}`];
}

export function trackDeck(trackId: string): DeckMeta | undefined {
  return DECK_META[trackId];
}
