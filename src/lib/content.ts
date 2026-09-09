import type { DeckSlide } from "@/lib/decks";
import { ONBOARDING_LESSONS } from "./onboarding";
import { SLIDE_TRACKS } from "./slide-tracks";
import { POM3_TRACK } from "./peace-of-mind-3";

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
  /** Presentation-eval phases this lesson strengthens (welcome, interview, …). */
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
  /** When true the course is visible to everyone, in every path (the "All" audience). */
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
