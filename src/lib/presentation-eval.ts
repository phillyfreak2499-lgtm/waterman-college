import { createServerFn } from "@tanstack/react-start";
import { authMiddleware } from "@/lib/auth/middleware";
import {
  assertCanViewPerson,
  ensureProfileTable,
  isLeader,
  readAccessRole,
} from "@/lib/access";
import { getSql } from "@/lib/db";

/** One checklist / scale / text field on the evaluation form. */
export type EvalField = {
  key: string;
  label: string;
  type: "yesno" | "dropdown" | "checkboxes" | "text" | "textarea" | "scale" | "time";
  options?: string[];
  required?: boolean;
  help?: string;
};

export type EvalSection = {
  id: string;
  title: string;
  kicker?: string;
  description?: string;
  fields: EvalField[];
};

/**
 * Presentation Evaluation 2026 — ported from the Google Form.
 * Keys are stable for trend queries; labels can be refined later.
 */
export const EVAL_SECTIONS: EvalSection[] = [
  {
    id: "context",
    title: "Context",
    kicker: "Who and when",
    fields: [
      {
        key: "party_size",
        label: "Total number of people (including main Client)",
        type: "dropdown",
        options: ["1", "2", "3+"],
        required: true,
      },
      {
        key: "client_name",
        label: "Client's name",
        type: "text",
        required: true,
      },
      {
        key: "floor_leader",
        label: "Sales Floor Leader at the time",
        type: "text",
      },
      {
        key: "start_time",
        label: "Start time",
        type: "time",
      },
    ],
  },
  {
    id: "welcome",
    title: "WELCOME Phase",
    kicker: "Establish instant rapport",
    description:
      'Starts with: “Thanks for coming in.” Greet every client within 30 seconds, make them feel valued, and get them seated.',
    fields: [
      {
        key: "welcome_greeted_30s",
        label: "Was the client greeted properly and seated within 30 seconds?",
        type: "yesno",
        required: true,
      },
      {
        key: "welcome_everyone_fit",
        label: "Was everyone fit?",
        type: "yesno",
      },
      {
        key: "welcome_fit_attempts",
        label: "If not everyone was fit, how many attempts were made?",
        type: "dropdown",
        options: ["1", "2", "3", "4+", "N/A"],
      },
      {
        key: "welcome_floor_leader_greet",
        label: "If available, did the Sales Floor leader greet the client?",
        type: "yesno",
      },
      {
        key: "score_welcome",
        label: "Manager grade — WELCOME (1–10)",
        type: "scale",
        required: true,
        help: "Manager / DM grade for this phase.",
      },
    ],
  },
  {
    id: "interview",
    title: "INTERVIEW Phase",
    kicker: "Uncover the real reason they’re here",
    description: 'Starts with: “What are your concerns today?”',
    fields: [
      {
        key: "interview_pain_current",
        label: "Tablet: Did they ask for current pain/discomfort level?",
        type: "yesno",
        required: true,
      },
      {
        key: "interview_pain_worst",
        label: "Tablet: Did they ask for pain/discomfort level at its worst?",
        type: "yesno",
      },
      {
        key: "interview_other_areas",
        label:
          "Tablet: Did they discuss what other areas of pain/discomfort the Client may be having?",
        type: "yesno",
      },
      {
        key: "interview_objections",
        label: "Did the Specialist interview for objections during discovery?",
        type: "yesno",
      },
      {
        key: "interview_bluetooth",
        label: 'What is the “Bluetooth” or Hot button of the customer?',
        type: "text",
      },
      {
        key: "interview_4th_support",
        label: "Did the Specialist interview for the 4th support?",
        type: "yesno",
      },
      {
        key: "interview_likely_objection",
        label:
          "What is the most likely objection we are going to have to work on during this presentation?",
        type: "text",
      },
      {
        key: "score_interview",
        label: "Manager grade — INTERVIEW (1–10)",
        type: "scale",
        required: true,
        help: "Manager / DM grade for this phase.",
      },
    ],
  },
  {
    id: "analysis",
    title: "ANALYSIS Phase",
    kicker: "Let the feet tell the story",
    description: 'Starts with: “Let’s see what your feet are saying.”',
    fields: [
      {
        key: "analysis_first_print",
        label: "After Interviewing, did they complete the first print?",
        type: "yesno",
        required: true,
      },
      {
        key: "analysis_measurements",
        label: "After Interviewing, were measurements taken?",
        type: "yesno",
      },
      {
        key: "analysis_digital_scan",
        label: "Did Specialist complete the digital foot scan right after the imprint?",
        type: "yesno",
      },
      {
        key: "analysis_scan_discussion",
        label: "Digital Foot Scan Results Discussion",
        type: "checkboxes",
        options: [
          "Did they discuss the arch heights for each foot?",
          "Did they show the 3D model and its pressure points?",
        ],
      },
      {
        key: "analysis_ideal_foot",
        label: "Ideal Foot Chart",
        type: "checkboxes",
        options: [
          "Common Foot Ailments",
          "Mentions the Ideal Foot",
          "Weight Evenly Distributed",
          "Shows all 5 Toes",
          "C-Shaped Arch",
          "Foot Aligned: Pinkie and Index to Heel",
          "Which Arch do you think represents yours",
          "Pressure",
          "Specialist drew on the paper or diagnosed",
        ],
      },
      {
        key: "score_analysis",
        label: "Manager grade — ANALYSIS (1–10)",
        type: "scale",
        required: true,
        help: "Manager / DM grade for this phase.",
      },
    ],
  },
  {
    id: "fitting",
    title: "FITTING Phase",
    kicker: "Balance the art and the science",
    description: "Heading to the back room. Build the cart, check the fit, present the three steps.",
    fields: [
      {
        key: "fitting_tablet_video",
        label:
          "Did Specialist give the Client the tablet for video while presenter goes to pull supports?",
        type: "yesno",
      },
      {
        key: "fitting_tablet_other",
        label: 'If “other,” please explain (video/tablet/Wi-Fi issues)',
        type: "text",
      },
      {
        key: "fitting_medmassager",
        label: "Did the Specialist place the Client on the MedMassager?",
        type: "yesno",
      },
      {
        key: "fitting_medmassager_benefits",
        label: "How did the Specialist do in sharing the benefits of the MedMassager?",
        type: "checkboxes",
        options: [
          "Oscillating Movement dilates vascular endings",
          "FDA endorsed",
          "Promotes blood flow / Deep healing",
          "15 min = Circulation of walking 4 miles",
          "Good for Neuropathy, Diabetes, etc.",
          "Presenter spent too long explaining features and benefits",
        ],
      },
      {
        key: "fitting_pull_time",
        label: "How long did it take the Specialist to pull supports?",
        type: "dropdown",
        options: [
          "Under 1 min - Cart was ready to go for them",
          "2 - 3 Minutes",
          "More than 3 Minutes",
        ],
      },
      {
        key: "fitting_cart_assist",
        label: "Did someone assist the Specialist in putting together their Presentation Cart?",
        type: "yesno",
      },
      {
        key: "fitting_room_coaching",
        label: "What coaching was given in the fitting room?",
        type: "textarea",
      },
      {
        key: "part1_excel",
        label: "Part 1 — What did the Specialist really excel at during the first part?",
        type: "textarea",
      },
      {
        key: "part1_improve",
        label:
          "Part 1 — What is an area that needs improvement during the first part, and how can they improve?",
        type: "textarea",
      },
      {
        key: "score_fitting",
        label: "Manager grade — FITTING (1–10)",
        type: "scale",
        required: true,
        help: "Manager / DM grade for this phase.",
      },
    ],
  },
  {
    id: "solution",
    title: "SOLUTION Phase",
    kicker: "Show how the supports solve what they told you",
    fields: [
      {
        key: "solution_brought_out",
        label: "What did the presenter bring out for the customer?",
        type: "checkboxes",
        options: [
          "1 Support",
          "2 Supports",
          "3 Supports",
          "4 Supports",
          "Cushions",
          "Arch Activators",
          "3+ Pairs of Socks",
          "1 Pair of Brooks",
          "1 Pair of Architek Slippers",
          "Support Sleeve per support",
          "Support Saver Bag",
          "Lock Laces / Caterpy",
          "Couples Package",
        ],
      },
      {
        key: "solution_flow",
        label: "During Presentation Flow did the Specialist…",
        type: "checkboxes",
        options: [
          "Give a Brief History of The Good Feet Store?",
          "Give a Brief Summary of the 3-Step System?",
          "Diagnose",
          "Explain the Benefits and Features of the Strengthener?",
          "Explain the Benefits and Features of the Maintainer?",
          "Explain the Benefits and Features of the Relaxer?",
          "Check sizes of all supports by holding up to both feet?",
          "Kept things professional and on task?",
          "Show confidence and conviction?",
          "Listen to the customer's needs and show empathy?",
        ],
      },
      {
        key: "solution_balance_demo",
        label: "Balance Demonstration",
        type: "checkboxes",
        options: [
          "Did they walk Client / explain what Client should be experiencing?",
          'Said: "did you see how your balance was affected?"',
        ],
      },
      {
        key: "solution_before_walks",
        label: "Before the Test Walks, did Presenter…?",
        type: "checkboxes",
        options: [
          "Explain the Benefit and Features of the Shoe?",
          "Explain the Benefit and Features of the Cushions?",
          "Explain the Benefit and Features of the Arch Activators?",
          "Did they walk Client / explain what Client should be experiencing?",
          "Said: You should be feeling pressure in the middle of foot, just behind ball.",
          "Said: Realign foot into the ideal position, strengthening muscles, tendons, ligaments",
          "Said: Supports all 4 arches",
          'Said: Toes floating / "Toe splay"',
          "Said: Deep Heel Cup, Less pressure on heels",
          "Said: No side to side movement",
          "Reminded about benefits and features",
          "Asked: Pain level after walking on supports?",
          "Made a REMARKABLE moment, if pain was better",
          "Made a REMARKABLE moment, if posture was better",
          "Had Client sit and point where Customer felt the pressure on their foot",
          "Client put back on their own shoes to see the difference, if needed",
          "Did they make it personal for the Client's lifestyle?",
        ],
      },
      {
        key: "score_solution",
        label: "Manager grade — SOLUTION (1–10)",
        type: "scale",
        required: true,
        help: "Manager / DM grade for this phase.",
      },
    ],
  },
  {
    id: "close",
    title: "CLOSE / ANSWER / EXPERIENCE",
    kicker: "Create momentum and ask for the business",
    fields: [
      {
        key: "close_wrap",
        label: "W.R.A.P. check",
        type: "checkboxes",
        options: [
          "W - Why",
          "R - Right Now",
          "A - All questions answered",
          "P - Pain is better or need is filled",
        ],
      },
      {
        key: "close_reprint",
        label: "Reprint: Were they reprinted with the support on the mat and the cushion over the top?",
        type: "yesno",
      },
      {
        key: "close_reprint_remarkable",
        label: "Reprint: Was this made into a REMARKABLE moment?",
        type: "yesno",
      },
      {
        key: "close_relaxer_slipper",
        label:
          "Did the Specialist place the Relaxer in an Architek Slipper and talk about the features and benefits?",
        type: "yesno",
      },
      {
        key: "close_socks_value",
        label: "Did the Specialist build value into the OS1st socks?",
        type: "yesno",
      },
      {
        key: "part2_excel",
        label: "Part 2 — What did the Specialist really excel at?",
        type: "textarea",
      },
      {
        key: "part2_close_advice",
        label: "Part 2 — What advice in closing would you give?",
        type: "textarea",
      },
      {
        key: "part2_flow_improve",
        label:
          "Part 2 — What are areas the Specialist should work on to improve their Presentation Flow?",
        type: "textarea",
      },
      {
        key: "score_close",
        label: "Manager grade — CLOSE / ANSWER / EXPERIENCE (1–10)",
        type: "scale",
        required: true,
        help: "Manager / DM grade for this phase.",
      },
    ],
  },
  {
    id: "coaching",
    title: "Proper Coaching",
    kicker: "Turn the eval into better performance",
    fields: [
      {
        key: "coaching_same_as_last",
        label: "Was the same coaching given on the last presentation evaluation?",
        type: "yesno",
      },
      {
        key: "coaching_next_steps",
        label: "If yes, what are the next steps?",
        type: "textarea",
      },
      {
        key: "coaching_practiced",
        label: "Did you practice or roleplay right after?",
        type: "yesno",
      },
      {
        key: "coaching_other_feedback",
        label: "What other feedback do you have for the Specialist?",
        type: "textarea",
      },
      {
        key: "coaching_reviewed_with_specialist",
        label: "Was the full Presentation Evaluation reviewed with the Specialist?",
        type: "yesno",
      },
    ],
  },
  {
    id: "reflection",
    title: "Specialist reflection",
    kicker: "Two-way coaching",
    fields: [
      {
        key: "reflection_did_well",
        label: "What is something you feel like you did very well during this presentation?",
        type: "textarea",
      },
      {
        key: "reflection_learned",
        label: "What is something that you learned from this Presentation Evaluation?",
        type: "textarea",
      },
      {
        key: "reflection_score",
        label: "On a scale of 1 to 10 how do you feel about this presentation?",
        type: "scale",
        required: true,
      },
      {
        key: "reflection_higher",
        label: "What could you have done to move your number higher?",
        type: "textarea",
      },
      {
        key: "reflection_future_coach",
        label: "What is something you would like to coach on in the future?",
        type: "textarea",
      },
      {
        key: "specialist_signature",
        label: "Specialist — please sign your name",
        type: "text",
      },
    ],
  },
];

export type EvalAnswers = Record<string, string | string[] | number | boolean | null>;


/** Phase keys that managers grade 1–10. */
export const GRADED_PHASES = [
  { key: "score_welcome", id: "welcome", label: "Welcome" },
  { key: "score_interview", id: "interview", label: "Interview" },
  { key: "score_analysis", id: "analysis", label: "Analysis" },
  { key: "score_fitting", id: "fitting", label: "Fitting" },
  { key: "score_solution", id: "solution", label: "Solution" },
  { key: "score_close", id: "close", label: "Close" },
] as const;

export type PhaseScoreKey = (typeof GRADED_PHASES)[number]["key"];

export type PhaseAverages = {
  /** Average per phase (null if no scores yet). */
  byPhase: { id: string; label: string; avg: number | null; count: number }[];
  /** Overall average across all graded phase scores. */
  overall: number | null;
  /** Number of evaluations included. */
  evalCount: number;
};

/**
 * Coerce a self-reflection score into what the column will accept: a whole
 * number from 1 to 10, or null. Out-of-range input is dropped rather than
 * squeezed to an endpoint, so a stray value never reads as a real 1 or 10.
 */
function clampScore(value: number | null): number | null {
  if (value == null || !Number.isFinite(value)) return null;
  const rounded = Math.round(value);
  if (rounded < 1 || rounded > 10) return null;
  return rounded;
}

function numScore(value: unknown): number | null {
  if (typeof value === "number" && value >= 1 && value <= 10) return value;
  if (typeof value === "string" && value.trim()) {
    const n = Number(value);
    if (Number.isFinite(n) && n >= 1 && n <= 10) return n;
  }
  return null;
}

/** Extract phase scores from one eval's answers. */
export function extractPhaseScores(answers: EvalAnswers): Record<string, number> {
  const out: Record<string, number> = {};
  for (const phase of GRADED_PHASES) {
    const n = numScore(answers[phase.key]);
    if (n != null) out[phase.key] = n;
  }
  return out;
}

/** Average phase scores across many evaluations (Specialist view). */
export function averagePhaseScores(
  evals: { answers: EvalAnswers }[],
): PhaseAverages {
  const sums: Record<string, { total: number; count: number }> = {};
  for (const phase of GRADED_PHASES) {
    sums[phase.key] = { total: 0, count: 0 };
  }
  let evalCount = 0;
  for (const ev of evals) {
    const scores = extractPhaseScores(ev.answers);
    if (Object.keys(scores).length === 0) continue;
    evalCount += 1;
    for (const [key, n] of Object.entries(scores)) {
      if (!sums[key]) sums[key] = { total: 0, count: 0 };
      sums[key].total += n;
      sums[key].count += 1;
    }
  }
  const byPhase = GRADED_PHASES.map((phase) => {
    const s = sums[phase.key];
    return {
      id: phase.id,
      label: phase.label,
      avg: s.count > 0 ? Math.round((s.total / s.count) * 10) / 10 : null,
      count: s.count,
    };
  });
  let overallTotal = 0;
  let overallCount = 0;
  for (const s of Object.values(sums)) {
    overallTotal += s.total;
    overallCount += s.count;
  }
  return {
    byPhase,
    overall:
      overallCount > 0 ? Math.round((overallTotal / overallCount) * 10) / 10 : null,
    evalCount,
  };
}

/** Lesson targets tied to presentation phases (real catalog track/slug). */
export type SuggestedLesson = {
  phaseId: string;
  phaseLabel: string;
  phaseAvg: number;
  trackId: string;
  lessonSlug: string;
  title: string;
  reason: string;
  href: string;
};

/**
 * Map weak presentation phases → concrete lessons in the campus catalog.
 * Keep this list small and high-signal; refine as Specialists give feedback.
 */
export const PHASE_LESSON_MAP: Record<
  string,
  { trackId: string; lessonSlug: string; title: string; reason: string }[]
> = {
  welcome: [
    {
      trackId: "client-experience",
      lessonSlug: "the-room",
      title: "How you change the room",
      reason: "Greeting, names, and the first ten seconds set the tone.",
    },
    {
      trackId: "flow",
      lessonSlug: "door-to-door",
      title: "Door to door: the Waterman flow",
      reason: "Own the full sequence starting at the door.",
    },
  ],
  interview: [
    {
      trackId: "client-experience",
      lessonSlug: "listen-first",
      title: "Listen first. Prescribe second.",
      reason: "Discovery and pain points before any product talk.",
    },
    {
      trackId: "client-experience",
      lessonSlug: "two-quiet-fears",
      title: "The two quiet fears",
      reason: "Name concerns and objections without pressure.",
    },
  ],
  analysis: [
    {
      trackId: "flow",
      lessonSlug: "digital-scanner",
      title: "The Digital Scanner and you",
      reason: "Print, measure, and scan as shared evidence with the Client.",
    },
    {
      trackId: "product",
      lessonSlug: "arch-supports",
      title: "Why the arch comes first",
      reason: "Explain what the feet are saying in plain language.",
    },
  ],
  fitting: [
    {
      trackId: "flow",
      lessonSlug: "door-to-door",
      title: "Door to door: the Waterman flow",
      reason: "Cart, fit, and three-step rhythm without rushing the chair.",
    },
    {
      trackId: "product",
      lessonSlug: "trusted-advisor",
      title: "From salesperson to trusted advisor",
      reason: "Balance technical precision with human expertise.",
    },
  ],
  solution: [
    {
      trackId: "product",
      lessonSlug: "trusted-advisor",
      title: "From salesperson to trusted advisor",
      reason: "Present the solution that matches what they told you.",
    },
    {
      trackId: "product",
      lessonSlug: "arch-supports",
      title: "Why the arch comes first",
      reason: "Connect supports to the life and pain they described.",
    },
  ],
  close: [
    {
      trackId: "flow",
      lessonSlug: "consistent-close",
      title: "A close that feels like care",
      reason: "Ask for the business with clarity and care — not pressure.",
    },
    {
      trackId: "client-experience",
      lessonSlug: "two-quiet-fears",
      title: "The two quiet fears",
      reason: "Turn objections into confidence the Client can stand in.",
    },
  ],
};

/** Default: suggest lessons for phases averaging under this score. */
export const SUGGESTION_THRESHOLD = 7;
/** Max lessons shown in Locker suggestions. */
export const SUGGESTION_LIMIT = 5;

/** A catalog lesson eligible for phase-based suggestions. */
export type CatalogLessonRef = {
  trackId: string;
  trackRole: string;
  lessonSlug: string;
  title: string;
  evalPhases: string[];
};

/**
 * From phase averages + live catalog tags, return deduped lesson suggestions.
 * Only lessons on allowed training doors (roles) are included — Specialist
 * suggestions stay in the Specialist path, Manager in Managers, etc.
 * Sorted weakest-first. Falls back to PHASE_LESSON_MAP if catalog has no tags yet.
 */
export function suggestLessonsFromScores(
  averages: PhaseAverages,
  options?: {
    threshold?: number;
    /** Lessons from the live catalog (with evalPhases + track role). */
    catalogLessons?: CatalogLessonRef[];
    /** Role doors the learner may train in (e.g. specialist, new-hires). */
    allowedRoles?: string[];
  },
): SuggestedLesson[] {
  const threshold = options?.threshold ?? SUGGESTION_THRESHOLD;
  const allowed = new Set(options?.allowedRoles || []);
  const weak = averages.byPhase
    .filter((p) => p.avg != null && p.avg < threshold && p.count > 0)
    .sort((a, b) => (a.avg ?? 10) - (b.avg ?? 10));

  const seen = new Set<string>();
  const out: SuggestedLesson[] = [];

  const catalog = options?.catalogLessons || [];
  const useCatalog = catalog.some((l) => l.evalPhases.length > 0);

  for (const phase of weak) {
    if (useCatalog) {
      const matches = catalog.filter(
        (l) =>
          l.evalPhases.includes(phase.id) &&
          (allowed.size === 0 || allowed.has(l.trackRole)),
      );
      for (const lesson of matches) {
        const key = `${lesson.trackId}/${lesson.lessonSlug}`;
        if (seen.has(key)) continue;
        seen.add(key);
        out.push({
          phaseId: phase.id,
          phaseLabel: phase.label,
          phaseAvg: phase.avg as number,
          trackId: lesson.trackId,
          lessonSlug: lesson.lessonSlug,
          title: lesson.title,
          reason: `Strengthens your ${phase.label} phase (${phase.avg}/10 avg).`,
          href: `/training/${lesson.trackId}/${lesson.lessonSlug}`,
        });
      }
    } else {
      // Fallback until Admin tags lessons
      const mapped = PHASE_LESSON_MAP[phase.id] || [];
      for (const lesson of mapped) {
        const key = `${lesson.trackId}/${lesson.lessonSlug}`;
        if (seen.has(key)) continue;
        seen.add(key);
        out.push({
          phaseId: phase.id,
          phaseLabel: phase.label,
          phaseAvg: phase.avg as number,
          trackId: lesson.trackId,
          lessonSlug: lesson.lessonSlug,
          title: lesson.title,
          reason: lesson.reason,
          href: `/training/${lesson.trackId}/${lesson.lessonSlug}`,
        });
      }
    }
  }
  return out.slice(0, SUGGESTION_LIMIT);
}


export type PresentationEval = {
  id: string;
  presenterId: string;
  presenterName: string;
  observerId: string;
  observerName: string;
  store: string | null;
  clientName: string | null;
  floorLeader: string | null;
  evalDate: string;
  startTime: string | null;
  partySize: string | null;
  answers: EvalAnswers;
  specialistScore: number | null;
  specialistSigned: string | null;
  sameCoachingAsLast: boolean | null;
  practicedAfter: boolean | null;
  createdAt: string;
};

function iso(value: unknown): string {
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "string" && value) return value;
  return new Date().toISOString();
}

export const listEvalsForPerson = createServerFn({ method: "GET" })
  .validator((input: { userId: string }) => {
    if (!input.userId || input.userId.length > 120) throw new Error("Invalid person.");
    return input;
  })
  .middleware([authMiddleware])
  .handler(async ({ context, data }) => {
    await assertCanViewPerson(context.userId, data.userId);
    const sql = await getSql();
    const rows = await sql<{
      id: string;
      presenter_id: string;
      observer_id: string;
      store: string | null;
      client_name: string | null;
      floor_leader: string | null;
      eval_date: string;
      start_time: string | null;
      party_size: string | null;
      answers: unknown;
      specialist_score: number | null;
      specialist_signed: string | null;
      same_coaching_as_last: boolean | null;
      practiced_after: boolean | null;
      created_at: unknown;
      presenter_name: string | null;
      observer_name: string | null;
    }>`
      select
        e.*,
        p.name as presenter_name,
        o.name as observer_name
      from presentation_evaluations e
      left join "user" p on p.id = e.presenter_id
      left join "user" o on o.id = e.observer_id
      where e.presenter_id = ${data.userId}
      order by e.eval_date desc, e.created_at desc
      limit 50
    `;
    return rows.map((r) => ({
      id: r.id,
      presenterId: r.presenter_id,
      presenterName: r.presenter_name || "Specialist",
      observerId: r.observer_id,
      observerName: r.observer_name || "Observer",
      store: r.store,
      clientName: r.client_name,
      floorLeader: r.floor_leader,
      evalDate: String(r.eval_date).slice(0, 10),
      startTime: r.start_time,
      partySize: r.party_size,
      answers: (typeof r.answers === "object" && r.answers ? r.answers : {}) as EvalAnswers,
      specialistScore: r.specialist_score,
      specialistSigned: r.specialist_signed,
      sameCoachingAsLast: r.same_coaching_as_last,
      practicedAfter: r.practiced_after,
      createdAt: iso(r.created_at),
    })) satisfies PresentationEval[];
  });

export const submitPresentationEval = createServerFn({ method: "POST" })
  .validator(
    (input: {
      presenterId: string;
      store?: string;
      clientName?: string;
      floorLeader?: string;
      evalDate: string;
      startTime?: string;
      partySize?: string;
      answers: EvalAnswers;
    }) => {
      if (!input.presenterId || input.presenterId.length > 120) {
        throw new Error("Choose a Specialist to evaluate.");
      }
      if (!input.evalDate || !/^\d{4}-\d{2}-\d{2}$/.test(input.evalDate)) {
        throw new Error("Date is required.");
      }
      return input;
    },
  )
  .middleware([authMiddleware])
  .handler(async ({ context, data }) => {
    const actor = await readAccessRole(context.userId);
    if (!isLeader(actor) && actor !== "admin") {
      throw new Error("Only managers and trainers can submit presentation evaluations.");
    }
    await assertCanViewPerson(context.userId, data.presenterId);
    await ensureProfileTable();

    const answers = data.answers || {};
    // `specialist_score` is an integer column with a `between 1 and 10` check
    // (migrations/0014). A fractional or out-of-range value would abort the
    // whole insert with an opaque database error and lose the manager's
    // write-up, so normalise it here instead of letting the constraint fire.
    const specialistScore = clampScore(
      typeof answers.reflection_score === "number"
        ? answers.reflection_score
        : typeof answers.reflection_score === "string" && answers.reflection_score
          ? Number(answers.reflection_score)
          : null,
    );
    const same =
      answers.coaching_same_as_last === "Yes"
        ? true
        : answers.coaching_same_as_last === "No"
          ? false
          : null;
    const practiced =
      answers.coaching_practiced === "Yes"
        ? true
        : answers.coaching_practiced === "No"
          ? false
          : null;

    const id = globalThis.crypto.randomUUID();
    const sql = await getSql();
    await sql`
      insert into presentation_evaluations (
        id, presenter_id, observer_id, store, client_name, floor_leader,
        eval_date, start_time, party_size, answers,
        specialist_score, specialist_signed,
        same_coaching_as_last, practiced_after, created_at
      ) values (
        ${id},
        ${data.presenterId},
        ${context.userId},
        ${data.store?.trim() || null},
        ${data.clientName?.trim() || (typeof answers.client_name === "string" ? answers.client_name : null)},
        ${data.floorLeader?.trim() || (typeof answers.floor_leader === "string" ? answers.floor_leader : null)},
        ${data.evalDate},
        ${data.startTime || (typeof answers.start_time === "string" ? answers.start_time : null)},
        ${data.partySize || (typeof answers.party_size === "string" ? answers.party_size : null)},
        ${JSON.stringify(answers)}::jsonb,
        ${specialistScore},
        ${typeof answers.specialist_signature === "string" ? answers.specialist_signature : null},
        ${same},
        ${practiced},
        now()
      )
    `;
    return { id };
  });

/** Weekly compliance helper: presenters under the viewer who still need an eval this week. */
export const listNeedsEvalThisWeek = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const actor = await readAccessRole(context.userId);
    if (!isLeader(actor) && actor !== "admin") return [] as string[];

    const { fetchPeople, visiblePeople } = await import("@/lib/access");
    await ensureProfileTable();
    const all = await fetchPeople();
    const visible = visiblePeople(context.userId, actor, all).filter(
      (p) => p.id !== context.userId && p.role !== "pending" && p.role !== "admin",
    );
    if (!visible.length) return [] as string[];

    // Start of current week (Monday)
    const now = new Date();
    const day = now.getDay();
    const mondayOffset = day === 0 ? -6 : 1 - day;
    const monday = new Date(now);
    monday.setDate(now.getDate() + mondayOffset);
    monday.setHours(0, 0, 0, 0);
    const weekStart = monday.toISOString().slice(0, 10);

    const sql = await getSql();
    const ids = visible.map((p) => p.id);
    const done = await sql<{ presenter_id: string }>`
      select distinct presenter_id
      from presentation_evaluations
      where presenter_id = any(${ids}::text[])
        and eval_date >= ${weekStart}
    `;
    const doneSet = new Set(done.map((r) => r.presenter_id));
    return ids.filter((id) => !doneSet.has(id));
  });


/** Specialist: own presentation phase averages (from manager grades) + door-aware suggestions. */
export const listMyEvalScores = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const sql = await getSql();
    const rows = await sql<{ answers: unknown; eval_date: string }>`
      select answers, eval_date
      from presentation_evaluations
      where presenter_id = ${context.userId}
      order by eval_date desc, created_at desc
      limit 40
    `;
    const evals = rows.map((r) => ({
      answers: (typeof r.answers === "object" && r.answers ? r.answers : {}) as EvalAnswers,
      evalDate: String(r.eval_date).slice(0, 10),
    }));
    const averages = averagePhaseScores(evals);

    // Live catalog + role doors so suggestions stay on the learner's path
    const { readCatalog } = await import("@/lib/cms");
    const { readAccessRole, allowedTabs } = await import("@/lib/access");
    const role = await readAccessRole(context.userId);
    const tabs = allowedTabs(role);
    const catalog = await readCatalog();
    const catalogLessons: CatalogLessonRef[] = catalog.tracks.flatMap((track) =>
      track.lessons.map((lesson) => ({
        trackId: track.id,
        trackRole: track.role,
        lessonSlug: lesson.slug,
        title: lesson.title,
        evalPhases: lesson.evalPhases || [],
      })),
    );

    const suggestions = suggestLessonsFromScores(averages, {
      catalogLessons,
      allowedRoles: tabs,
    });

    // Month vs prior-month phase averages for Locker trends
    const now = new Date();
    const thisMonth = now.toISOString().slice(0, 7);
    const prior = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const priorMonth = prior.toISOString().slice(0, 7);
    const thisEvals = evals.filter((e) => e.evalDate.startsWith(thisMonth));
    const priorEvals = evals.filter((e) => e.evalDate.startsWith(priorMonth));
    const thisAvg = averagePhaseScores(thisEvals);
    const priorAvg = averagePhaseScores(priorEvals);
    const trends = GRADED_PHASES.map((phase) => {
      const cur = thisAvg.byPhase.find((p) => p.id === phase.id)?.avg ?? null;
      const prev = priorAvg.byPhase.find((p) => p.id === phase.id)?.avg ?? null;
      let direction: "up" | "down" | "flat" | "new" = "new";
      if (cur != null && prev != null) {
        const d = cur - prev;
        direction = d >= 0.3 ? "up" : d <= -0.3 ? "down" : "flat";
      } else if (cur != null) direction = "new";
      return { id: phase.id, label: phase.label, current: cur, previous: prev, direction };
    });

    return {
      averages,
      suggestions,
      recentCount: evals.length,
      trends,
      thisMonthAvg: thisAvg.overall,
      priorMonthAvg: priorAvg.overall,
    };
  });


/** Single eval by id (for reopening coaching brief). */
export const getPresentationEval = createServerFn({ method: "GET" })
  .validator((input: { id: string }) => {
    if (!input.id || input.id.length > 80) throw new Error("Invalid evaluation.");
    return input;
  })
  .middleware([authMiddleware])
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    const rows = await sql<{
      id: string;
      presenter_id: string;
      observer_id: string;
      store: string | null;
      client_name: string | null;
      floor_leader: string | null;
      eval_date: string;
      start_time: string | null;
      party_size: string | null;
      answers: unknown;
      specialist_score: number | null;
      specialist_signed: string | null;
      same_coaching_as_last: boolean | null;
      practiced_after: boolean | null;
      created_at: unknown;
      presenter_name: string | null;
      observer_name: string | null;
    }>`
      select e.*, p.name as presenter_name, o.name as observer_name
      from presentation_evaluations e
      left join "user" p on p.id = e.presenter_id
      left join "user" o on o.id = e.observer_id
      where e.id = ${data.id}
      limit 1
    `;
    const r = rows[0];
    if (!r) throw new Error("Evaluation not found.");
    await assertCanViewPerson(context.userId, r.presenter_id);
    return {
      id: r.id,
      presenterId: r.presenter_id,
      presenterName: r.presenter_name || "Specialist",
      observerId: r.observer_id,
      observerName: r.observer_name || "Observer",
      store: r.store,
      clientName: r.client_name,
      floorLeader: r.floor_leader,
      evalDate: String(r.eval_date).slice(0, 10),
      startTime: r.start_time,
      partySize: r.party_size,
      answers: (typeof r.answers === "object" && r.answers ? r.answers : {}) as EvalAnswers,
      specialistScore: r.specialist_score,
      specialistSigned: r.specialist_signed,
      sameCoachingAsLast: r.same_coaching_as_last,
      practicedAfter: r.practiced_after,
      createdAt: iso(r.created_at),
    } satisfies PresentationEval;
  });

/** Compact eval status for Team cards: needs-this-week + recent scores. */
export const listTeamEvalStatus = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const actor = await readAccessRole(context.userId);
    if (!isLeader(actor) && actor !== "admin") {
      return { needsThisWeek: [] as string[], byPerson: {} as Record<string, {
        lastEvalDate: string | null;
        lastEvalId: string | null;
        overallAvg: number | null;
        phaseAvgs: { id: string; label: string; avg: number | null }[];
        evalCount: number;
      }> };
    }
    const { fetchPeople, visiblePeople } = await import("@/lib/access");
    await ensureProfileTable();
    const all = await fetchPeople();
    const visible = visiblePeople(context.userId, actor, all).filter(
      (p) => p.id !== context.userId && p.role !== "pending" && p.role !== "admin",
    );
    // Week start (Monday) — inline so we don't nest server fns
    const now = new Date();
    const day = now.getDay();
    const mondayOffset = day === 0 ? -6 : 1 - day;
    const monday = new Date(now);
    monday.setDate(now.getDate() + mondayOffset);
    monday.setHours(0, 0, 0, 0);
    const weekStart = monday.toISOString().slice(0, 10);

    const byPerson: Record<string, {
      lastEvalDate: string | null;
      lastEvalId: string | null;
      overallAvg: number | null;
      phaseAvgs: { id: string; label: string; avg: number | null }[];
      evalCount: number;
    }> = {};
    if (!visible.length) return { needsThisWeek: [] as string[], byPerson };

    const sql = await getSql();
    const ids = visible.map((p) => p.id);
    const rows = await sql<{
      id: string;
      presenter_id: string;
      eval_date: string;
      answers: unknown;
    }>`
      select id, presenter_id, eval_date, answers
      from presentation_evaluations
      where presenter_id = any(${ids}::text[])
      order by eval_date desc, created_at desc
      limit 2000
    `;
    const grouped = new Map<string, typeof rows>();
    for (const r of rows) {
      const list = grouped.get(r.presenter_id) || [];
      if (list.length < 8) list.push(r);
      grouped.set(r.presenter_id, list);
    }
    for (const person of visible) {
      const list = grouped.get(person.id) || [];
      const evals = list.map((r) => ({
        answers: (typeof r.answers === "object" && r.answers ? r.answers : {}) as EvalAnswers,
      }));
      const averages = averagePhaseScores(evals);
      byPerson[person.id] = {
        lastEvalDate: list[0] ? String(list[0].eval_date).slice(0, 10) : null,
        lastEvalId: list[0]?.id ?? null,
        overallAvg: averages.overall,
        phaseAvgs: averages.byPhase,
        evalCount: list.length,
      };
    }
    const needsThisWeek = visible
      .filter((p) => {
        const info = byPerson[p.id];
        if (!info?.lastEvalDate) return true;
        return info.lastEvalDate < weekStart;
      })
      .map((p) => p.id);

    return { needsThisWeek, byPerson };
  });

/** Observer calibration: average grades given by each observer. */
export const listObserverCalibration = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const actor = await readAccessRole(context.userId);
    if (!isLeader(actor) && actor !== "admin") return [] as {
      observerId: string;
      observerName: string;
      evalCount: number;
      overallAvg: number | null;
    }[];
    const sql = await getSql();
    const rows = await sql<{
      observer_id: string;
      observer_name: string | null;
      answers: unknown;
    }>`
      select e.observer_id, u.name as observer_name, e.answers
      from presentation_evaluations e
      left join "user" u on u.id = e.observer_id
      order by e.eval_date desc
      limit 3000
    `;
    const byObs = new Map<string, { name: string; evals: { answers: EvalAnswers }[] }>();
    for (const r of rows) {
      const cur = byObs.get(r.observer_id) || {
        name: r.observer_name || "Observer",
        evals: [],
      };
      cur.evals.push({
        answers: (typeof r.answers === "object" && r.answers ? r.answers : {}) as EvalAnswers,
      });
      byObs.set(r.observer_id, cur);
    }
    return [...byObs.entries()]
      .map(([observerId, v]) => {
        const avg = averagePhaseScores(v.evals);
        return {
          observerId,
          observerName: v.name,
          evalCount: v.evals.length,
          overallAvg: avg.overall,
        };
      })
      .filter((r) => r.evalCount > 0)
      .sort((a, b) => (a.overallAvg ?? 0) - (b.overallAvg ?? 0));
  });

/** Huddle pack: weakest phase across a store + talking points. */
export const getStoreHuddlePack = createServerFn({ method: "GET" })
  .validator((input: { store: string }) => {
    if (!input.store || input.store.length > 120) throw new Error("Store required.");
    return input;
  })
  .middleware([authMiddleware])
  .handler(async ({ context, data }) => {
    const actor = await readAccessRole(context.userId);
    if (!isLeader(actor) && actor !== "admin") {
      throw new Error("Leaders only.");
    }
    const { fetchPeople, visiblePeople } = await import("@/lib/access");
    await ensureProfileTable();
    const all = await fetchPeople();
    const visible = visiblePeople(context.userId, actor, all).filter(
      (p) => p.store?.trim() === data.store.trim() && p.role !== "pending",
    );
    if (!visible.length) {
      return {
        store: data.store,
        weakestPhase: null as string | null,
        weakestAvg: null as number | null,
        talkingPoints: [] as string[],
        practicePrompt: "",
        suggestedLessons: [] as SuggestedLesson[],
      };
    }
    const sql = await getSql();
    const ids = visible.map((p) => p.id);
    const rows = await sql<{ presenter_id: string; answers: unknown }>`
      select presenter_id, answers
      from presentation_evaluations
      where presenter_id = any(${ids}::text[])
      order by eval_date desc
      limit 500
    `;
    const evals = rows.map((r) => ({
      answers: (typeof r.answers === "object" && r.answers ? r.answers : {}) as EvalAnswers,
    }));
    const averages = averagePhaseScores(evals);
    const weakest = [...averages.byPhase]
      .filter((p) => p.avg != null)
      .sort((a, b) => (a.avg ?? 10) - (b.avg ?? 10))[0];

    const TALK: Record<string, string[]> = {
      welcome: [
        "Greet and seat within 30 seconds — name, eye contact, offer a chair.",
        "Protect the first ten seconds; the room sets the visit.",
        "If the floor is full, still own the greeting — then hand off cleanly.",
      ],
      interview: [
        "Ask current pain and worst pain on the tablet before prescribing.",
        "Find the hot button — what a good day feels like for them.",
        "Interview for objections early so the close is not a surprise.",
      ],
      analysis: [
        "Print, measure, scan — show the evidence, don't hide behind the screen.",
        "Narrate the Ideal Foot in plain language.",
        "Let them see left vs right before you talk product.",
      ],
      fitting: [
        "MedMassager and cart rhythm without rushing the chair.",
        "Explain Strengthener / Maintainer / Relaxer benefits clearly.",
        "Ask for help on the cart when the floor is busy.",
      ],
      solution: [
        "Connect supports to the life they described in the interview.",
        "Balance demo + test walks with the lines they should feel.",
        "Make it personal — lifestyle, not a script.",
      ],
      close: [
        "W.R.A.P. before you ask for the business.",
        "Recap findings, recommendation, and why it matches their day.",
        "A close that feels like care — clear next step, no pressure.",
      ],
    };

    const PRACTICE: Record<string, string> = {
      welcome: "Roleplay a 30-second greet-and-seat with a peer. Use their real name.",
      interview: "Roleplay tablet pain questions + one objection interview question.",
      analysis: "Practice narrating a scan in two sentences a Client can repeat at home.",
      fitting: "Practice the three-step benefit lines in under 90 seconds.",
      solution: "Roleplay balance demo + 'did you see how your balance was affected?'",
      close: "Roleplay W.R.A.P. and a calm ask for the business.",
    };

    const { readCatalog } = await import("@/lib/cms");
    const { allowedTabs } = await import("@/lib/access");
    const tabs = allowedTabs(actor);
    const catalog = await readCatalog();
    const catalogLessons: CatalogLessonRef[] = catalog.tracks.flatMap((track) =>
      track.lessons.map((lesson) => ({
        trackId: track.id,
        trackRole: track.role,
        lessonSlug: lesson.slug,
        title: lesson.title,
        evalPhases: lesson.evalPhases || [],
      })),
    );
    const suggestedLessons = weakest
      ? suggestLessonsFromScores(
          {
            byPhase: averages.byPhase.map((p) =>
              p.id === weakest.id ? p : { ...p, avg: 10 },
            ),
            overall: averages.overall,
            evalCount: averages.evalCount,
          },
          { catalogLessons, allowedRoles: tabs },
        )
      : [];

    return {
      store: data.store,
      weakestPhase: weakest?.label ?? null,
      weakestAvg: weakest?.avg ?? null,
      talkingPoints: weakest ? TALK[weakest.id] || [] : [],
      practicePrompt: weakest ? PRACTICE[weakest.id] || "" : "",
      suggestedLessons,
    };
  });
