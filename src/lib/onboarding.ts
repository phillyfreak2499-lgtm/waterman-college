import type { Lesson, Track } from "@/lib/content";

export const ONBOARDING_WEEKS = [
  {
    week: 1,
    title: "Learning Center",
    summary: "Week 1 follows the Waterman Presentation — Welcome through Closing — and ends with an evaluated final.",
    days: [1, 2, 3, 4, 5],
  },
  {
    week: 2,
    title: "In-store development",
    summary: "No sales goal this week. Shadow open to close. Commissions go to the manager you are with.",
    days: [6, 7, 8, 9, 10],
  },
  {
    week: 3,
    title: "On the floor",
    summary: "You take ups this week. Always team-sell. Day 12 is with your District Manager.",
    days: [11, 12, 13, 14, 15],
  },
  {
    week: 4,
    title: "Independently",
    summary: "Work the floor on your own. Professor and Sales Manager pull you for half-day sessions.",
    days: [16, 17, 18, 19, 20],
  },
] as const;

export function weekOfDay(day: number) {
  if (day <= 5) return 1;
  if (day <= 10) return 2;
  if (day <= 15) return 3;
  return 4;
}

export function dayFromSlug(slug: string) {
  const match = /^day-(\d+)$/.exec(slug);
  return match ? Number(match[1]) : null;
}

function day(
  n: number,
  title: string,
  minutes: number,
  body: string[],
  takeaway?: string,
): Lesson {
  const week = weekOfDay(n);
  return {
    slug: `day-${String(n).padStart(2, "0")}`,
    title,
    minutes,
    kicker: `Week ${week} · Day ${n}`,
    body,
    takeaway,
  };
}

export const ONBOARDING_LESSONS: Lesson[] = [
  day(1, "Intro and product knowledge", 90, [
    "Week 1 is at the Learning Center. Today is people, the story, and the product — not the floor.",
    "NEW HIRE ONBOARDING · Clock into Gusto. Complete I-9 verification. Tour the facilities. Read policies in Gusto. Easy Llama is assigned today.",
    "VIDEO · The Waterman Story with Cathy Waterman.",
    "History of Good Feet — George Alzner.",
    "VIDEO · A Remarkable Experience — Every Client, Every Time.",
    "VIDEO · Corporate Testimony. Read real store reviews. What Clients are saying about us.",
    "VIDEO · Waterman Specialists share testimonials and remarkable moments.",
    "VIDEO · The Waterman Presentation.",
    "GFA · Introduction to Good Feet. Basic Foot Anatomy.",
    "GFA · Arch Support Product Knowledge. Play Name That Support.",
    "GFA · Good Feet Accessories.",
    "FORM · Complete the Day 1 30-Day Onboarding Report in the check-in below.",
  ], "Know the story and the supports before you touch a Client."),
  day(2, "Presentation — Welcome, Interview, Analysis", 90, [
    "Review Day 1. Take the Product & Arch Support quiz in the check-in below.",
    "GFA · Sales Presentation. Proper Fitting and Sales Techniques. Then walk The Waterman Presentation.",
    "WELCOME · VIDEO · Zach Greets, Seats, and Discovers.",
    "ROLEPLAY · How to properly Greet and Seat. Welcome: “Thanks for coming in.”",
    "INTERVIEW · Begin naturally without the tablet, then create the Client account. What are your concerns today? Questions to Ask Every Client.",
    "GFA · The Good Feet Store App.",
    "ROLEPLAY · Entering information into the App.",
    "ANALYSIS · Printing the foot: Harris Mat. Measuring: Brannock Device.",
    "PRACTICE · Printing and measuring.",
    "VIDEO · The Digital Scanner and You. The Digital Scanner and the Flow.",
    "The Ideal Foot — how many arches are in the foot?",
    "ROLEPLAY · “Let’s see what your feet are saying.”",
    "FITTING · Hold supports to prints and check size. You are fitted with your own 3-Step System. Fitting best practices. How to build a cart.",
    "ROLEPLAY · Welcome, Interview, and Analysis together.",
    "FORM · Complete the Day 2 30-Day Onboarding Report.",
  ], "Greet, sit, and listen before you ever pick up a support."),
  day(3, "Fitting and Solution", 120, [
    "Recap Welcome through Fitting. Review: hold supports to prints, hold supports to feet, discuss what you are looking for.",
    "When it is time to build supports, use team selling. The team starts the cart.",
    "GFA · MedMassager Products. VIDEO · Dr. Mehta on the tablet. Review the Med Massager flow.",
    "Why Good Feet Store — history. Introduce Solution. Fitting: “Based on what we learned together.”",
    "Review Strengthener, Maintainer, and Relaxer — features and benefits. Fit all supports to both feet.",
    "GFA · Good Feet Balance Demonstration. The 1st WOW moment.",
    "ROLEPLAY · Balance Demonstration.",
    "SOLUTION · Restate why all three supports are needed for muscle memory, gait, and alignment.",
    "Why Brooks? Cushions and Arch Activators — why and how to input.",
    "STRENGTHENER WALK · Lap 1 you lead (pressure mid-forward of the arch, less on the heels, toes floating). Lap 2 you analyze gait. Lap 3 you lead — pain meter 1–10, the 2nd WOW, can they wear it 30 minutes?",
    "ROLEPLAY · Strengthener Walk. PRACTICE · Reprint and compare before and after.",
    "MAINTAINER WALK · Pressure toward the back half of the inner arch. Wear it when (X). Minimum of an hour.",
    "ROLEPLAY · Maintainer Walk. Introduce Wear and Care.",
    "RELAXER WALK · Placed in Architek shoes. Why Architek? Pressure toward the back half of the inner arch.",
    "ROLEPLAY · Relaxer Walk. GFA · The Fundamental Five. Review the 5 Non-Negotiables.",
    "ROLEPLAY · The whole Solution. FORM · Day 3 report.",
  ], "Three walks. Two WOW moments. One solution you can explain."),
  day(4, "Closing the sale", 90, [
    "Review Day 3: discovery and walks. Take the Discovery & Walks quiz below.",
    "GFA · Solution Sets. Review the pricing sheet for new and loyal Clients.",
    "GFA · Closing the Sale.",
    "VIDEO · Closing Flow — Setting the Stage. ROLEPLAY it.",
    "GFA · Pay Tomorrow Financing. Guidelines for Using FSA or HSA Funds. Review CareCredit.",
    "VIDEO · Closing Flow — Asking to Buy. ROLEPLAY it.",
    "VIDEO · Closing Flow — Answering the Price Question. ROLEPLAY it.",
    "GFA · Closing Flow — Answering Objections. ROLEPLAY it.",
    "Closing: “Based on the solution we created together.”",
    "Review the presentation outline and your gaps.",
    "ROLEPLAY · The entire presentation for the rest of the day.",
    "FORM · Day 4 report.",
  ], "Ask for the sale the same way you built the solution — together."),
  day(5, "Experience and finals", 120, [
    "Review Day 4 and the Closing Flow, financing, FSA and HSA.",
    "GFA · Wear and Care Instructions. PRACTICE them.",
    "Satisfaction Policy. GFA · Managing Client Returns with Confidence.",
    "Follow-up calls: 3, 10, and 21 days. Notes. Answering the phone.",
    "After lunch, solo: presentation evaluation. ROLEPLAY the presentation step-by-step without stopping.",
    "Final presentation with evaluation. Debrief. Redo missed steps.",
    "GFA · Good Feet Arch Supports Specialist Certification.",
    "Go over how the rest of the 30-day plan works, and where to find this site.",
    "FORM · Day 5 report. Clean the Training Center the way we leave a store.",
  ], "The final is practice under lights — not a trap."),

  day(6, "Your store — open to close", 60, [
    "No sales goal this week. Any commissions go to the manager you shadow. Priority is the full day and one full presentation.",
    "Clock in and out in Gusto, including lunch as Take a Break.",
    "Meet the team. Tour your store. Walk opening and closing checklists with your manager and take notes.",
    "GFA · Learner Experience Training. ERPLY Point-of-Sale Basics.",
    "Salesforce daily tasks with your manager. The Waterman Dashboard: NSNU, Conversion %, Demo Rate, Demo Close %, ASPS, Demo Ticket Average.",
    "Shadow presentations. GFA · The Digital Scanner and You. The Digital Scanner and the Flow.",
    "ROLEPLAY · The entire presentation so your manager can see where you are.",
    "With a tablet, shadow a full Client using a Presentation Evaluation Form. Introduce yourself. You are in training.",
    "ROLEPLAY · Build a cart with four supports — features, benefits, and why the fourth. Then build it in ERPLY with the savings promotion.",
    "GFA · Architek Comfort Slip-on. ROLEPLAY · Med Massager features and the flow.",
    "Email your professor two takeaways and where you want more help. FORM · Day 6 report.",
  ], "Shadow the whole day. Notes beat memory."),
  day(7, "Closing, shoes, and the till", 60, [
    "PRACTICE · Make an appointment in Appointed.",
    "Review Closing Flow. ROLEPLAY closing flows.",
    "ROLEPLAY · Balance Demonstration, test walk, wearing instructions, and closing with your manager.",
    "Shadow another full presentation with the evaluation form.",
    "With your manager, ring a Client in ERPLY for someone on your team. The Specialist being rung up is the one in Salesforce.",
    "Review return-Client solutions.",
    "GFA · Shoe 101. Adrenaline, Ghost, Beast, Ariel — who each shoe is for. Shoes hit list. Install Caterpy laces.",
    "GFA · OS1st Training Center.",
    "FORM · Manager completes the Day 6–7 form. Email your professor two takeaways. Day 7 report.",
  ]),
  day(8, "WRAP back at the Learning Center", 60, [
    "Cracking the Code — personalize the sale. Painting the Picture.",
    "WRAP: Why, Ready, Answer, and Pain. Why, why, why?",
    "Confidence: tonality, body language, rapport.",
    "ROLEPLAY · Walks using WRAP. The 4th support and how to build value. The entire closing flow. Matching the right solutions.",
    "Upset Clients — the hows and the whys.",
    "FORM · Day 8 report.",
  ], "WRAP is how a walk becomes a reason to buy."),
  day(9, "You and your manager, as one", 60, [
    "Your manager shadows you all day. You are in rotation together as one.",
    "PRACTICE · Follow-up calls at 3, 10, and 21 days.",
    "GFA · ERPLY Advanced Scenarios. Follow-Up Calls with Clients. Shadow calls and notes.",
    "Review Wear and Care. PRACTICE · Review the receipt line by line at POS.",
    "PRACTICE · Lifestyle support or 4th support. ROLEPLAY · Asking for reviews and referrals.",
    "Shadow a full presentation. ROLEPLAY · Greeting and seating with different foot ailments. How It Helps slides.",
    "GFA · Overcoming Objections. ROLEPLAY answering them.",
    "Ring a new or former Client from start to finish with your manager.",
    "PRACTICE · Strengthener / Maintainer / Relaxer product-knowledge slides. Take both product quizzes in the check-in below.",
    "Review Youth Supports, TSS, and Hug.",
    "Email two takeaways. FORM · Day 9 report.",
  ]),
  day(10, "Saturday workshop", 45, [
    "Participate in the Saturday workshop. Role-play and product knowledge in downtime. Recap the week.",
    "FORM · Week 2 Day 10 form and your check-in below.",
  ], "A week of shadowing should leave you tired and clearer."),

  day(11, "You take ups", 50, [
    "You are on the floor on your own this week. Always team-sell.",
    "Five-minute huddle: dashboard and how you will contribute this week.",
    "Opening and closing checklist with the team. Follow-up calls — notes after every call.",
    "GFA · SMS Messaging on The Good Feet App. COGS: SMS TWW.",
    "GFA · From Shoe Shopper to Loyal Client. ROLEPLAY · Welcome phase: converting a shoe shopper.",
    "Your manager runs a Presentation Evaluation and coaches what you missed.",
    "GFA · Ground Force Golf Support. ROLEPLAY · Golf as a lifestyle support.",
    "Review Brooks shoes with your manager.",
    "FORM · Day 11 report.",
  ]),
  day(12, "District Manager day", 60, [
    "Your District Manager works advanced training with you today.",
    "GFA · Effective Handling of Returned Products. Talk through a return request.",
    "GFA · Medical Referral Program: Specialists Training.",
    "Review the Fundamental Five. ROLEPLAY · Welcome phase: converting a curious shopper.",
    "ROLEPLAY · Objections and closes. Review presentation gaps from Weeks 1 and 2.",
    "Review Architek Comfort Shoes with your manager.",
    "FORM · Day 12 report.",
  ]),
  day(13, "Operations with the office", 70, [
    "Policies: schedule, attendance, requesting time off.",
    "Salesforce Desktop: daily tasks and how to write notes. Answering the phone. Appointed. Follow-up calls. SMS and reviews.",
    "Pay Tomorrow. CareCredit. Opening and closing checklists. Supply order. Presentation evaluations. Banking sheets. End of Day form.",
    "Inventory habits: filling, SACU bags, Arch Activators on cushions, Velcro bags.",
    "Tablets: log off Mon–Thu and Saturday; leave them on overnight for updates. Power off Friday. Power on the next day.",
    "ERPLY: returns, warranty, gift cards, coupons, checks, counting the till, cash drop, refunds. Back office (managers): POs, inventory, discrepancy form.",
    "Sizing and fitting best practices. Name the gaps on the operations form.",
    "FORM · Week 3 Operations form and Day 13 report.",
  ], "The floor is only half the job. The store has to run."),
  day(14, "Huddle, tasks, service", 45, [
    "Huddle: sales goal, how you contribute, metrics, duties.",
    "Opening and closing with the team. Manager checks your work.",
    "Salesforce tasks: complete calls and notes with the team.",
    "GFA · Providing Exceptional Client Service. The Hidden Killer of Client Loyalty.",
    "Presentation Evaluation and coaching.",
    "FORM · Day 14 report.",
  ]),
  day(15, "Saturday workshop", 45, [
    "Saturday workshop. Role-play and product knowledge in downtime. Recap the week.",
    "FORM · Week 3 Day 15 form and check-in.",
  ]),

  day(16, "Referrals and your growth plan", 50, [
    "This week you work independently. Professor and Sales Manager will pull you for sessions.",
    "Manager Presentation Evaluation, one-on-one on the gaps.",
    "GFA · The Power of Referrals. Requesting Client Reviews at POS. ROLEPLAY asking for a review.",
    "Set personal performance goals in your Growth Plan with your manager.",
    "GFA · Return Client Process.",
    "PRACTICE · Installing heel lifts in shoes with arch supports.",
    "FORM · Day 16 report.",
  ]),
  day(17, "Sales Manager day", 70, [
    "You perform opening and closing from your notes.",
    "You are first in the up rotation. Sales Manager runs a Presentation Evaluation.",
    "ROLEPLAY · Welcome phase: converting a no-pain shopper.",
    "GFA · Managing Multiple Fittings. ROLEPLAY · Breaking away to help other Clients.",
    "Couples Package. Double Platinum. Review gaps from Weeks 1–3.",
    "Product refresher as needed. OS1st socks, sleeves, and the Plantar Fasciitis Kit.",
    "FORM · Week 4 Sales Manager form and Day 17 report.",
  ]),
  day(18, "KPIs and the week’s review", 50, [
    "GFA · Key Performance Indicators.",
    "Presentation Evaluation. Debrief. Strengths of your flow. Emphasis on efficiency, confidence, and Client experience.",
    "End-of-week review: strengths, gaps, next steps in the Growth Plan.",
    "GFA · Converting OneSpaWorld Cruise Clients. ROLEPLAY cruise Clients.",
    "GFA · The Good Feet Store FAQs. Phishing Awareness and Prevention.",
    "Email your professor and District Manager the week’s results by end of day.",
    "FORM · Day 18 report.",
  ]),
  day(19, "Professor day — basic training", 70, [
    "GFA · Converting Calls Into Client Visits. ROLEPLAY converting a call into an appointment.",
    "Product knowledge. Fitting and sizing correctly — troubleshooting the fit.",
    "Presentation components. Closing phase. Answer phase.",
    "ROLEPLAY · Complex Clients: plantar fasciitis, standing-all-day jobs, athletes.",
    "ROLEPLAY objections: too expensive, talk to my spouse, I need to think, I’ll be back, talk to my doctor, shop around.",
    "Conduct a full presentation with minimal assistance.",
    "FORM · Day 19 report.",
  ]),
  day(20, "Saturday — close the 30 days", 45, [
    "Saturday workshop. Role-play and product knowledge in downtime. Recap the month.",
    "FORM · Week 4 Day 20 form and your final check-in.",
  ], "Thirty days to ready. Not thirty days to perfect."),
];

export const ONBOARDING_TRACK: Track = {
  id: "onboarding",
  role: "new-hires",
  title: "30-Day Onboarding",
  nav: "Onboarding",
  href: "/training/onboarding",
  image: "/media/classroom.jpg",
  audience: "New Specialists · first 30 days",
  summary:
    "Week 1 at the Learning Center. Weeks 2–4 in your store. Each day lists the videos, GFA courses, roleplays, and the check-in that replaces the old Google folders.",
  lessons: ONBOARDING_LESSONS,
};
