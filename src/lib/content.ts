export type TrackId =
  | "client-experience"
  | "flow"
  | "product"
  | "culture"
  | "onboarding"
  | "management"
  | "mit";

export type Lesson = {
  slug: string;
  title: string;
  minutes: number;
  kicker?: string;
  body: string[];
  takeaway?: string;
};

export type Track = {
  id: TrackId;
  title: string;
  nav: string;
  href: string;
  image: string;
  audience: string;
  summary: string;
  lessons: Lesson[];
};

export const SITE = {
  name: "Waterman College",
  short: "WCOGS",
  tagline: "Pain Free Learning for Pain Free Living",
  company: "Waterman Arch Supports",
  stores: 11,
  adminEmail: "mhudson@goodfeetdfw.com",
} as const;

export const tracks: Track[] = [
  {
    id: "client-experience",
    title: "Client Experience",
    nav: "Client Experience",
    href: "/training/client-experience",
    image: "/media/campus-front.jpg",
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
          "Before any product changes hands, a Specialist changes the room. The way you greet, listen, guide, and serve determines whether a Client leaves with the right solution — or leaves at all.",
          "We don't train Specialists to fill a role. We train them to own a relationship.",
          "Every Client who sits down across from you deserves someone who is prepared, present, and genuinely invested in their wellbeing. That is the standard we hold — and the standard this training is built to help you reach.",
        ],
        takeaway: "Own the relationship. The product comes second.",
      },
      {
        slug: "two-quiet-fears",
        title: "The two quiet fears",
        minutes: 10,
        body: [
          "Every Client who walks in carries two quiet fears: the fear of making the wrong decision, and the fear of looking foolish in the process.",
          "A well-trained Specialist dissolves both — not through pressure, but through genuine trust built on expertise and care.",
          "Name the fear without embarrassing them. Explain the process before you start it. Give them language they can repeat to a spouse or a friend. When a Client can explain why this is the right solution, they stop being a shopper and start being an owner.",
        ],
        takeaway: "Expertise plus care dissolves fear. Pressure never does.",
      },
      {
        slug: "listen-first",
        title: "Listen first. Prescribe second.",
        minutes: 12,
        body: [
          "Every person who walks into one of our stores is trusting us with something real — their comfort, their mobility, their daily life. That kind of trust is not earned by a product on a shelf.",
          "Ask what a good day feels like before you ask about shoe size. Watch how they walk to the chair. Let them finish the story about the last pair that failed them.",
          "When you prescribe from what you heard, the Client feels seen. When you prescribe from a script, they feel sold.",
        ],
        takeaway: "Diagnosis is a conversation, not a pitch.",
      },
      {
        slug: "the-room",
        title: "How you change the room",
        minutes: 8,
        body: [
          "Greeting is not 'Can I help you?' It is standing, making eye contact, and giving the Client the next ten seconds of your undivided attention.",
          "Names matter. Repeat theirs. Introduce yourself. Offer a seat before you offer a product.",
          "The room should feel like a clinic that happens to have a retail floor — calm, unhurried, competent. If you are rushed, they will be.",
        ],
      },
    ],
  },
  {
    id: "flow",
    title: "Flow Training",
    nav: "Flow",
    href: "/training/flow",
    image: "/media/campus-lawn.jpg",
    audience: "Every Specialist",
    summary:
      "Process and rhythm from the moment a Client walks in to the moment they walk out completely satisfied. Great intentions become consistent, repeatable actions.",
    lessons: [
      {
        slug: "door-to-door",
        title: "Door to door: the Waterman flow",
        minutes: 12,
        body: [
          "Flow is the difference between a memorable visit and a messy one. Every Specialist should be able to walk a Client through the same confident sequence — greeting, history, scan, try-on, education, close, and follow-up.",
          "The sequence is not a cage. It is a rhythm. When you know the next step, you can stay present in this one.",
          "If you skip a step because you are busy, the Client pays for it. Protect the flow even when the floor is full. Ask for help. Don't rush the chair.",
        ],
        takeaway: "Rhythm creates confidence. Confidence creates Clients.",
      },
      {
        slug: "digital-scanner",
        title: "The Digital Scanner and you",
        minutes: 10,
        kicker: "Library",
        body: [
          "The digital scanner takes the role of the Brannock — and then goes further. It is not a gadget to impress. It is a diagnostic tool that lets you and the Client look at the same truth together.",
          "Show the scan. Narrate what you see in plain language. Invite them to notice the difference between the left and the right. When they can see the problem, they can believe the solution.",
          "Never hide behind the screen. The scanner supports the conversation. It does not replace it.",
        ],
        takeaway: "The scan is evidence. You are still the advisor.",
      },
      {
        slug: "consistent-close",
        title: "A close that feels like care",
        minutes: 9,
        body: [
          "A good close is a decision the Client can stand in. Recap what you found, what you recommend, and why it matches the life they described at the start of the visit.",
          "Offer the next appointment or the next pair of shoes before they ask. Make the follow-up specific: a date, a reason, a name.",
          "If they need to think, give them something real to think with — a card, a photo of the scan, a sentence they can say at home.",
        ],
      },
    ],
  },
  {
    id: "product",
    title: "Product Training",
    nav: "Product",
    href: "/training/product",
    image: "/media/classroom-table.jpg",
    audience: "Every Specialist",
    summary:
      "Knowledge and confidence to match the right solution to the right Client, without hesitation or guesswork. Understand what you recommend and why — then you stop being a salesperson and start being a trusted advisor.",
    lessons: [
      {
        slug: "trusted-advisor",
        title: "From salesperson to trusted advisor",
        minutes: 8,
        body: [
          "When you truly understand what you are recommending and why, you stop being a salesperson and start being a trusted advisor.",
          "Advisors can say no. Advisors can wait. Advisors can recommend the simpler option when it is the honest one.",
          "Product knowledge is not a catalog recitation. It is the ability to connect a feature to a life: standing a full shift, walking a dog, getting through a wedding weekend.",
        ],
      },
      {
        slug: "arch-supports",
        title: "Why the arch comes first",
        minutes: 12,
        body: [
          "Waterman Arch Supports exist because the foot is a structure, not a cushion. When the arch is supported, the rest of the kinetic chain can do its job.",
          "You do not need to lecture anatomy. You do need to be able to explain, in one honest sentence, why this is different from a gel insole from a drugstore.",
          "Fit is personal. The same support can feel wrong in the wrong shoe, at the wrong volume, with the wrong sock. Check all three before you decide the product failed.",
        ],
        takeaway: "Support first. Everything else is a detail.",
      },
      {
        slug: "os1st-hosiery",
        title: "OS1st hosiery",
        minutes: 8,
        kicker: "Course 2",
        body: [
          "Hosiery is not an add-on. It is part of the system. The right sock changes how a support sits, how a shoe fits, and how a Client feels at hour eight of the day.",
          "Know the OS1st line well enough to recommend by activity, not by color. Plantar, circulation, crew, no-show — each has a job.",
          "If you skip the sock conversation, you are sending a Client home with half a solution.",
        ],
      },
    ],
  },
  {
    id: "culture",
    title: "Culture",
    nav: "Culture",
    href: "/training/culture",
    image: "/media/classroom-circle.jpg",
    audience: "Every team member",
    summary:
      "Who we are as a team is just as important as what we sell. Values, standards, and the why behind the way we serve — so every Client interaction reflects a unified, people-first organization.",
    lessons: [
      {
        slug: "teaching-vs-training",
        title: "Teaching vs. training",
        minutes: 7,
        body: [
          "Teaching is what we do to others. Training is what we do with others.",
          "Waterman College is a training ground, not a lecture hall. You will be asked to practice, to be observed, and to try again. That is the point.",
          "If you leave a session only knowing something, we failed. If you leave able to do something with a Client tomorrow, we did our job.",
        ],
        takeaway: "We train with you. We do not lecture at you.",
      },
      {
        slug: "people-first",
        title: "People are how we win",
        minutes: 8,
        body: [
          "Great products get Clients through the door. Great people keep them coming back.",
          "At Waterman Arch Supports, the quality of our team determines the quality of our Clients' experience. That is not a poster. It is an operating principle.",
          "How you treat a part-timer on a Saturday is the culture. How you talk about a Client after they leave is the culture. How you ask for help is the culture.",
        ],
      },
      {
        slug: "what-gets-rewarded",
        title: "What gets rewarded gets repeated",
        minutes: 8,
        body: [
          "The behaviors we reinforce shape our culture. If we want trust, service, and excellence, someone has to model it, teach it, recognize it, and track it.",
          "Catch people doing the standard. Say it out loud. Be specific: not 'good job' but 'you let her finish the story before you touched a shoe.'",
          "We do not train because we doubt you. We train because we believe in you.",
        ],
      },
    ],
  },
  {
    id: "onboarding",
    title: "Onboarding Program",
    nav: "Onboarding",
    href: "/training/onboarding",
    image: "/media/classroom.jpg",
    audience: "New Specialists · first 6 weeks",
    summary:
      "Courses designed for Specialists joining Waterman as their new career. This program lasts for your first six weeks with us.",
    lessons: [
      {
        slug: "week-1-belong",
        title: "Weeks 1–2: Belong here",
        minutes: 15,
        body: [
          "Your first two weeks are about the room, the people, and the standard — not about being fast.",
          "Shadow the full flow. Learn names. Learn the chair. Complete Client Experience lessons 1–3 and Culture: Teaching vs. training.",
          "You are not behind. You are being built on purpose.",
        ],
      },
      {
        slug: "week-3-flow",
        title: "Weeks 3–4: Own the flow",
        minutes: 15,
        body: [
          "Run the greeting and history yourself. Operate the scanner with a trainer beside you. Close with a recap even if a senior Specialist handles the product decision.",
          "Complete Flow Training and Product: Why the arch comes first.",
          "Ask for one observed visit per shift. Notes beat vibes.",
        ],
      },
      {
        slug: "week-5-advise",
        title: "Weeks 5–6: Advise with confidence",
        minutes: 15,
        body: [
          "By week six you should be able to take a Client from the door to a recommendation with a trainer in earshot, not in the chair.",
          "Finish Product: OS1st hosiery and Culture: People are how we win.",
          "Your District Manager will review progress with your store manager. Come with questions, not a performance.",
        ],
        takeaway: "Six weeks to confident. Not six weeks to perfect.",
      },
    ],
  },
  {
    id: "management",
    title: "Management Development",
    nav: "Management",
    href: "/training/management",
    image: "/media/campus-front.jpg",
    audience: "Managers",
    summary:
      "We invest in you because people are how we win. Great products get Clients through the door. Great managers keep them coming back.",
    lessons: [
      {
        slug: "more-than-a-transaction",
        title: "Clients deserve more than a transaction",
        minutes: 10,
        kicker: "01",
        body: [
          `Every person who walks into one of our ${SITE.stores} stores is trusting us with something real — their comfort, their mobility, their daily life.`,
          "That kind of trust isn't earned by a product on a shelf. It's earned by a trained, confident manager who knows how to listen first and prescribe second.",
        ],
      },
      {
        slug: "lead-mare",
        title: "Your team follows where you lead",
        minutes: 10,
        kicker: "02",
        body: [
          "In every herd, the behavior of the lead mare sets the tone for everyone behind her. Your sales associates, your part-timers, your newest hire — they are watching how you show up, how you handle pressure, and how you treat people.",
          "Management training gives you the tools to lead with both compassion and confidence.",
        ],
      },
      {
        slug: "rewarded-repeated",
        title: "What gets rewarded gets repeated",
        minutes: 8,
        kicker: "03",
        body: [
          "We train managers because we know that the behaviors we reinforce shape our culture. If we want a culture of trust, service, and excellence — someone has to model it, teach it, recognize it, and track it.",
          "That someone is you.",
        ],
      },
      {
        slug: "confidence-is-a-skill",
        title: "Confidence is not a personality — it's a skill",
        minutes: 10,
        kicker: "04",
        body: [
          "We don't train managers because we doubt them. We train because we believe in them.",
          "The best managers in retail aren't born — they're developed through repetition, coaching, honest feedback, and a framework they can actually use in the moment.",
        ],
      },
      {
        slug: "address-the-fears",
        title: "Our Clients have real fears — and you can address them",
        minutes: 10,
        kicker: "05",
        body: [
          "Every Client who walks in carries two quiet fears: the fear of making the wrong decision, and the fear of looking foolish in the process.",
          "A well-trained manager knows how to dissolve both — not through pressure, but through genuine trust built on expertise and care.",
          "Management training at Waterman isn't a checkbox or a compliance requirement. It's an investment in the people who carry our brand every single day.",
          "We grow our managers so our managers can grow their teams. And when our teams grow — our Clients feel it, our communities feel it, and our business reflects it.",
        ],
      },
    ],
  },
  {
    id: "mit",
    title: "MIT Program",
    nav: "MIT",
    href: "/training/mit",
    image: "/media/classroom-circle.jpg",
    audience: "By District Manager approval",
    summary:
      "Courses designed for Specialists who want to serve as a Manager for Waterman. You must seek approval to enter this program from your District Manager.",
    lessons: [
      {
        slug: "lead-yourself",
        title: "Lead yourself before you lead others",
        minutes: 12,
        body: [
          "MIT is not a title track. It is a proving ground. Before you hold a team, you hold your own standard on a busy Saturday.",
          "Your District Manager approved you because they have seen you own a relationship, not because you asked first.",
          "This program asks you to finish Management Development and then practice floor leadership: huddles, coaching notes, and one observed close per week.",
        ],
      },
      {
        slug: "the-huddle",
        title: "The huddle is the job",
        minutes: 10,
        body: [
          "A two-minute huddle sets the day. Name the standard. Name the person who modeled it yesterday. Name the one thing we will protect when it gets busy.",
          "If the huddle is a list of tasks, you have already lost the culture. Tasks go on the board. Standards go in the room.",
        ],
      },
      {
        slug: "coach-in-the-moment",
        title: "Coach in the moment",
        minutes: 12,
        body: [
          "Feedback that waits for a formal review is feedback that never happens. Pull someone aside after a visit. Be kind. Be specific. Ask what they noticed first.",
          "Write it down. Your future managers will need a record of how they grew — and so will you.",
        ],
        takeaway: "Ask your District Manager before you start this track.",
      },
    ],
  },
];

export const tips = [
  {
    slug: "names-in-the-first-ten",
    title: "Say their name in the first ten seconds",
    date: "August 11, 2026",
    body: "A Client who hears their name relaxes. Repeat it when you seat them. Repeat it when you recommend. It is the cheapest remarkable thing you will do all day.",
  },
  {
    slug: "one-sentence-why",
    title: "Give them one sentence to take home",
    date: "August 4, 2026",
    body: "If they cannot explain the recommendation to a spouse, they will not keep it. Close with a sentence they can repeat: 'Your arch is collapsing on the inside, and this holds it up so your knee doesn't have to.'",
  },
  {
    slug: "protect-the-chair",
    title: "Protect the chair when the floor is full",
    date: "July 28, 2026",
    body: "Busy is not an excuse to skip the scan or rush the history. Ask for a teammate. A Client who feels hurried will not come back, no matter how good the product is.",
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
