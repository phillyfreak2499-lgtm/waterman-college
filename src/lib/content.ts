import type { DeckSlide } from "@/lib/decks";
import { ONBOARDING_LESSONS } from "./onboarding";
import { POM3_TRACK } from "./peace-of-mind-3";
import { SLIDE_TRACKS } from "./slide-tracks";

export type RoleId = "new-hires" | "specialist" | "mit" | "managers";

export type TrackId = string;

export type Lesson = {
  slug: string;
  title: string;
  minutes: number;
  kicker?: string;
  body: string[];
  takeaway?: string;
  slides?: DeckSlide[];
  evalPhases?: string[];
};

export type Track = {
  id: TrackId;
  role: RoleId;
  title: string;
  nav: string;
  href: string;
  image: string;
  audience: string;
  summary: string;
  lessons: Lesson[];
  visibleToAll?: boolean;
};

export const SITE = {
  name: "COGS",
  short: "COGS",
  tagline: "Pain Free Learning for Pain Free Living",
  company: "Waterman Arch Supports",
  stores: 11,
  adminEmail: "mhudson@goodfeetdfw.com",
} as const;

export const roles: {
  id: RoleId;
  label: string;
  kicker: string;
  title: string;
  summary: string;
}[] = [
  {
    id: "new-hires",
    label: "New Hires",
    kicker: "First 30 days",
    title: "Your first thirty days, on purpose.",
    summary:
      "Week 1 at the Learning Center. Weeks 2-4 in your store. Check-ins replace the old Google folders.",
  },
  {
    id: "specialist",
    label: "Specialist",
    kicker: "Specialist Training",
    title: "You are the first thing our Clients experience.",
    summary:
      "Before any product changes hands, a Specialist changes the room. Client Experience, Flow, Product, and Culture.",
  },
  {
    id: "mit",
    label: "MIT",
    kicker: "By approval",
    title: "Lead yourself before you lead others.",
    summary:
      "For Specialists preparing to serve as a Manager. Seek approval from your District Manager before you begin.",
  },
  {
    id: "managers",
    label: "Managers",
    kicker: "Management Development",
    title: "People are how we win.",
    summary:
      "Great products get Clients through the door. Great managers keep them coming back. Lead with compassion and confidence.",
  },
];

const ROLE_IDS: RoleId[] = ["new-hires", "specialist", "mit", "managers"];

export function isRoleId(value: unknown): value is RoleId {
  return typeof value === "string" && (ROLE_IDS as string[]).includes(value);
}

export function getRole(id: RoleId) {
  return roles.find((r) => r.id === id) ?? roles[0];
}

export const tracks: Track[] = [
  {
    id: "client-experience",
    role: "specialist",
    title: "Client Experience",
    nav: "Client Experience",
    href: "/training/client-experience",
    image: "/media/store-greeting.jpg",
    audience: "Every Specialist",
    summary:
      "The way a Client feels when they leave our store matters just as much as the product they walk out with. Listen deeply, respond with care, and turn a first visit into a lifelong relationship.",
    lessons: [
      {
        slug: "first-thing-they-experience",
        title: "You are the first thing our Clients experience",
        minutes: 8,
        kicker: "The standard",
        body: [
          "Before any product changes hands, a Specialist changes the room.",
          "We don't train Specialists to fill a role. We train them to own a relationship.",
        ],
        takeaway: "Own the relationship. The product comes second.",
      },
    ],
  },
  POM3_TRACK,
  ...SLIDE_TRACKS,
];

export const tips = [
  {
    slug: "names-in-the-first-ten",
    title: "Say their name in the first ten seconds",
    date: "August 11, 2026",
    body: "A Client who hears their name relaxes. Repeat it when you seat them.",
  },
];

export function getTrack(id: string | undefined) {
  return tracks.find((t) => t.id === id);
}

export function getLesson(trackId: string | undefined, lessonSlug: string | undefined) {
  const track = getTrack(trackId);
  if (!track || !lessonSlug) return undefined;
  return track.lessons.find((l) => l.slug === lessonSlug);
}

export function allLessonKeys() {
  return tracks.flatMap((t) => t.lessons.map((l) => `${t.id}/${l.slug}`));
}
