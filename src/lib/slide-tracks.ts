import type { Lesson, Track } from "@/lib/content";
import { type DeckSlide, registerDeck } from "@/lib/decks";

function lesson(
  slug: string,
  title: string,
  minutes: number,
  kicker: string,
  body: string[],
  takeaway: string | undefined,
  slides: DeckSlide[],
  trackId: string,
): Lesson {
  registerDeck(trackId, slug, slides);
  return { slug, title, minutes, kicker, body, takeaway, slides };
}

const CARE_ID = "care";
const INTERVIEW_ID = "interview";
const FLOOR_ID = "floor-leader";
const SOLUTION_ID = "complete-solution";
const NTV_ID = "non-tangible";

const careLessons: Lesson[] = [
  lesson(
    "the-care-way",
    "The CARE way to lead the floor",
    12,
    "Burgundy · 01",
    [
      "If you are here, you are either stepping into a Floor Leader role for the first time or you want to lead the sales floor with more purpose and consistency.",
      "This is not a theory course. It is a practical system that helps you create a Remarkable experience for every Client — every time. That system is called CARE.",
      "Start with the real question most stores avoid: does every Client currently get a Remarkable experience… or is it still a lottery based on who they drew and how the day was going?",
      "Our mission is simple: provide an amazingly fun, educational, Remarkable experience that improves our Clients’ lives so completely they become our biggest advocates.",
      "CARE is how we make that mission consistent instead of accidental. You do not pick one letter and ignore the others. You run the full loop with every Client.",
    ],
    "CARE is one continuous loop. Run the full loop with every Client.",
    [
      {
        n: 1,
        kicker: "Leadership Development Series",
        title: "The Complete CARE Field Guide",
        subtitle: "Effective Sales Floor Leadership · Managers · Burgundy Track",
        blocks: [
          { kind: "quote", text: "A Remarkable Experience. Every Client. Every time." },
          {
            kind: "p",
            text: "A practical system for what to do on the floor, why it matters, and how to do it without taking over the sale or leaving your team unsupported.",
          },
        ],
      },
      {
        n: 2,
        title: "The CARE way to lead the floor",
        subtitle:
          "Provide an amazingly fun, educational, Remarkable experience that improves our Clients’ lives so completely they become our biggest advocates.",
        blocks: [
          {
            kind: "cards",
            items: [
              { letter: "C", title: "Connect", body: "Greet every Client, keep them warm, and hand them to their Specialist with confidence." },
              { letter: "A", title: "Assess", body: "Read every demo without stopping. Protect the green flags, answer the red flags." },
              { letter: "R", title: "Respond", body: "Step in to save a red flag or amplify a WOW, then step back. Never take over." },
              { letter: "E", title: "Elevate", body: "Coach what you saw — in the moment, in the backroom, and in the weekly 1:1." },
            ],
          },
        ],
      },
    ],
    CARE_ID,
  ),
  lesson(
    "own-the-floor",
    "The floor is never unowned",
    10,
    "Burgundy · 02",
    [
      "The first non-negotiable truth of this entire system: the floor is never unowned.",
      "At all times there must be one clear Sales Floor Leader. Ideally the Store Manager. When they are unavailable, an experienced Assistant Manager or senior Specialist steps in.",
      "Assign out loud in the daily opening huddle. Write the name on the whiteboard. Hand off cleanly — even for a few minutes — so the role never goes dark. A clean hand-off sounds like: “I’m stepping off the floor. John has the floor.”",
      "When you are the Floor Leader you wear four hats at once: visible presence, connector, tone setter, and problem solver. You cannot lead from the backroom.",
      "Active floor leadership produces four results: stronger Client service, effective coaching, targeted development, and team support. Consistency is the difference between a good store and a great one.",
    ],
    "Name the Floor Leader out loud. If no one knows who owns the floor, the floor is unowned.",
    [
      {
        n: 3,
        title: "First, assign the day’s Floor Leader",
        subtitle: "The floor is never unowned. At all times there must be one designated Sales Floor Leader.",
        blocks: [
          {
            kind: "steps",
            items: [
              { n: "01", title: "Assign out loud", body: "Name the Floor Leader in the daily opening huddle so the whole team hears it." },
              { n: "02", title: "Make it visible", body: "Write the name on the whiteboard or posting. Everyone should know who owns the floor." },
              { n: "03", title: "Hand off cleanly", body: "If the leader leaves the floor, transfer the role out loud so it never goes dark." },
            ],
          },
          { kind: "say", label: "Clean hand-off", text: "I’m stepping off the floor. John has the floor." },
        ],
      },
      {
        n: 4,
        title: "The role of the Sales Floor Leader",
        subtitle: "Present, approachable, and sets the tone. You wear four hats at once.",
        blocks: [
          {
            kind: "steps",
            items: [
              { n: "01", title: "Visible presence", body: "Out on the floor, greeting Clients and connecting with your team." },
              { n: "02", title: "Connector", body: "Like a mayor — you build bridges between Clients, Specialists, and solutions." },
              { n: "03", title: "Tone setter", body: "Your energy sets the store’s climate. Cheerful and confident signals safety." },
              { n: "04", title: "Problem solver", body: "Step in diplomatically to smooth the process without derailing the flow." },
            ],
          },
        ],
      },
      {
        n: 5,
        title: "Why active leadership pays off",
        blocks: [
          {
            kind: "steps",
            items: [
              { title: "Stronger Client service", body: "Every Client gets a consistent, Remarkable experience — not a lottery based on who they drew." },
              { title: "Effective coaching", body: "You observe demos in real time, so feedback is fresh and specific." },
              { title: "Targeted development", body: "Patterns across many demos become the real coaching themes." },
              { title: "Team support", body: "Specialists who feel guided and protected sell with more confidence." },
            ],
          },
        ],
      },
    ],
    CARE_ID,
  ),
  lesson(
    "connect",
    "C — Connect",
    10,
    "Burgundy · 03",
    [
      "Connect is where the Remarkable experience begins. The Client takes their emotional cue from the first people who interact with them.",
      "Your job is to make them feel chosen and cared for from the first moment — and then carry that feeling all the way to their Specialist.",
      "Greet every Client at least twice. The second greeting from the Floor Leader is especially powerful. It tells them the entire store is glad they came.",
      "In the in-between moments, stay warm. Smile. Offer water. Validate their excitement. Confirm the next Specialist is prepared before you hand off. Sit Clients down quickly with a clear, confident introduction.",
      "Watch your body language: upright, open, lean in, smile. Weak hand-offs sound transactional. Strong hand-offs transfer confidence.",
    ],
    "A strong hand-off transfers trust. Name the Specialist as someone worth trusting.",
    [
      {
        n: 6,
        title: "C — Connect",
        subtitle: "Make the Client feel chosen and cared for from the first moment — and carry that feeling to their Specialist.",
        blocks: [
          {
            kind: "list",
            title: "Do it",
            tone: "do",
            items: [
              "Greet every Client at least twice — and again whenever you pass them.",
              "In the in-between moments: smile, offer water, validate their excitement.",
              "Confirm the next Specialist is prepared and available before you hand off.",
              "Sit Clients down quickly with a warm introduction.",
              "Watch your body language: upright, open gestures, lean in, smile.",
            ],
          },
          {
            kind: "say",
            label: "Say it",
            text: "Hey, my name is Jane, I’m the manager here. John is an excellent Specialist and they are going to take great care of you. Thank you for coming in.",
          },
        ],
      },
    ],
    CARE_ID,
  ),
  lesson(
    "assess",
    "A — Assess",
    12,
    "Burgundy · 04",
    [
      "Assess is the core skill of floor leadership. Reading the floor is diagnosis. Acting without diagnosis is guessing — and guessing is expensive.",
      "Your job is to watch every demo without stopping. You are looking for two things only: green flags and red flags.",
      "Green flags — protect them. Let the demo breathe. Smiles, surprise, leaning forward, referencing why they came, balance technique landing, 5+ laps, silence on test walks, supports going into their own shoes.",
      "Red flags — these are the only times you step in. Too much talking, neutral language, shoes back on early, sitting before full walks, one-word answers, Specialist oversharing, distraction.",
      "Clients usually tell you the truth with their body language and word choice long before they say it directly.",
    ],
    "Protect green flags. Answer red flags. Never guess.",
    [
      {
        n: 7,
        title: "A — Assess",
        subtitle: "Reading the floor is the core skill. Green flags you protect. Red flags you answer.",
        blocks: [
          {
            kind: "list",
            title: "Green flags · keep going",
            tone: "green",
            items: [
              "Smiles, surprise, or enthusiasm (a WOW moment)",
              "Leaning forward, walking confidently, trying multiple steps",
              "References their reason for visiting (pain, comfort, performance)",
              "Balance technique lands as an aha moment",
              "Walks the supports 5+ laps; Strengthener re-tested",
              "Silence is respected on test walks and at the register",
              "Puts the supports in their own shoes (ownership)",
            ],
          },
          {
            kind: "list",
            title: "Red flags · step in",
            tone: "red",
            items: [
              "Too much talking during test walks or at the register",
              "Neutral language: “fine,” “maybe,” “hard to tell if it helps”",
              "Puts their shoes back on early or avoids the supports",
              "Repeatedly sits before completing full test walks",
              "One-word answers, awkward giggles, or disengagement",
              "Specialist oversharing personal history instead of focusing",
              "Distracted: phone use, no eye contact",
            ],
          },
        ],
      },
    ],
    CARE_ID,
  ),
  lesson(
    "respond",
    "R — Respond with AAH",
    14,
    "Burgundy · 05",
    [
      "Respond is the moment you choose to act. The golden rule is simple and non-negotiable: you elevate the demo. You never take it over.",
      "Think of yourself as an assistant coach on the sideline. You only enter the field for three reasons: a red flag appears, a WOW is building, or the Client is closing.",
      "If none of those three is present, stay out. Unnecessary interruptions teach the Client the Specialist was not enough — and teach the Specialist you will always finish for them.",
      "Step in through AAH. Acknowledge the Specialist. Add value or validate. Hand it back so they finish the sale and keep the relationship.",
      "Common red-flag plays: one more short walk, reinforce the Client’s own result then go silent, re-engage with movement, add energy and earn another lap, redirect oversharing to the Client’s goals.",
    ],
    "Elevate the demo. Never take it over. AAH, then get off the field.",
    [
      {
        n: 8,
        title: "R — Respond",
        subtitle: "You elevate the demo — you never take it over. Only three moments are worth stepping in for.",
        blocks: [
          {
            kind: "steps",
            items: [
              { n: "01", title: "A red flag appears", body: "The Client is disengaging, the Specialist is struggling, or the demo is off track." },
              { n: "02", title: "A WOW is building", body: "A balance-technique moment, visible excitement, or strong body language to amplify." },
              { n: "03", title: "The Client is closing", body: "Connect why they came in to how the supports just helped — right at the register." },
            ],
          },
        ],
      },
      {
        n: 9,
        title: "AAH in action",
        subtitle: "Act quickly but subtly. Never cut in mid-sentence or mid-walk. Add one play, then get off the field.",
        blocks: [
          {
            kind: "cards",
            items: [
              { letter: "A", title: "Acknowledge", body: "“I want to add to what [Name] is showing you.” Step in through the Specialist so the Client reads teamwork, not a rescue." },
              { letter: "A", title: "Add value", body: "“I can see you are walking straighter, faster, without a limp.” Name the change you see." },
              { letter: "H", title: "Hand it back", body: "“[Name] will walk you through the next step.” Return control on purpose." },
            ],
          },
        ],
      },
      {
        n: 10,
        title: "Saving the sale — common red-flag plays",
        blocks: [
          {
            kind: "steps",
            items: [
              { title: "Shoes back on early", body: "“Let’s try one more short walk… I want you to really feel the difference.”" },
              { title: "Specialist struggling to close", body: "“You are in your Strengthener now. This took you from a pain level of 8 to a 3.” Then go silent." },
              { title: "Client on their phone", body: "“Take a quick walk with me while [Name] gets your next pair ready.”" },
              { title: "Neutral language", body: "“I remember my first time… Let’s give it one more lap.”" },
              { title: "Specialist oversharing", body: "“What do you aspire to do once you are fully broken in with your system?”" },
            ],
          },
        ],
      },
      {
        n: 11,
        title: "Amplify the WOW",
        blocks: [
          {
            kind: "steps",
            items: [
              { title: "Name the win", body: "Join the moment. Say what you see: the posture change, the smile, the aha. Then stop talking and let the Client feel it." },
              { title: "Create ownership", body: "Help them put the supports into their own shoes. Ownership starts the moment the supports enter their life." },
            ],
          },
        ],
      },
    ],
    CARE_ID,
  ),
  lesson(
    "elevate",
    "E — Elevate",
    14,
    "Burgundy · 06",
    [
      "Elevate is what turns today’s demos into better performance tomorrow. Every demo you watch is coaching material — but only if you do something with it.",
      "In the moment: your AAH step-in is live coaching. When you model a clean close or a strong test walk, the Specialist learns by watching with no risk to the sale.",
      "In the backroom: right after the demo, while it is still fresh. Lead with what went well, then name one opportunity. Just one. Overloading kills the coaching.",
      "In the weekly 1:1: patterns across multiple demos become coaching themes. A single short walk is a moment. A Specialist who rushes every test walk is a theme worth a real conversation.",
      "The standard is simple: if you watched it, you own the coaching on it.",
    ],
    "If you watched it, you own the coaching on it. One opportunity, not five.",
    [
      {
        n: 12,
        title: "E — Elevate",
        subtitle: "Elevate turns every sale into development.",
        blocks: [
          {
            kind: "steps",
            items: [
              { n: "01", title: "In the moment", body: "Your AAH step-in is live coaching. The Specialist learns by watching — with no risk to the sale." },
              { n: "02", title: "In the backroom", body: "Right after the demo. Lead with what went well, then name one opportunity. One, not five." },
              { n: "03", title: "In the weekly 1:1", body: "Patterns across many demos become the coaching theme." },
            ],
          },
        ],
      },
      {
        n: 13,
        title: "Backroom coaching",
        subtitle: "The richest coaching window is often in the middle of a demo — when a Specialist steps back to pull product or ask for help.",
        blocks: [
          {
            kind: "list",
            title: "Before they go back out",
            tone: "do",
            items: [
              "Coach the plan with sharp questions matched to the Client type.",
              "Read the Specialist’s energy first — too nervous, too hyper, or too low?",
              "Steady them: “Breathe. Relax. Have fun. Talk to them like a human.”",
            ],
          },
          {
            kind: "list",
            title: "While they are out",
            tone: "do",
            items: [
              "Assist with pulling product to protect demo flow.",
              "Cover a quick personal need when the store is busy.",
              "Stay available — encourage, but never demand, that they come to you.",
            ],
          },
          {
            kind: "list",
            title: "After the demo",
            tone: "do",
            items: [
              "Debrief while it’s still fresh.",
              "Lead with wins, keep it specific.",
              "Add a quick role-play when it helps.",
            ],
          },
        ],
      },
      {
        n: 14,
        title: "Coach the plan — key questions",
        blocks: [
          {
            kind: "steps",
            items: [
              { title: "New Client", body: "What brought them in? Pain level today? What do they want to get back to? Which system will you present?" },
              { title: "Return with an issue", body: "What stands out about the complaint? Full 3-Step System? Where are they in break-in? Shoe condition?" },
              { title: "Successful return", body: "When was their last visit? Did they leave a review? How many steps? Any new activities for lifestyle?" },
            ],
          },
        ],
      },
    ],
    CARE_ID,
  ),
  lesson(
    "cheat-card",
    "The Floor Leader cheat card",
    8,
    "Burgundy · 07",
    [
      "This is the entire system on one page. Keep it visible until the process becomes automatic.",
      "CARE — the whole job. Connect: greet every Client twice, keep them warm, hand off with confidence. Assess: read every demo, protect green flags, answer red flags. Respond: step in to save a red flag or amplify a WOW, then step back. Elevate: coach what you saw.",
      "AAH — how to step in. Acknowledge. Add value. Hand back.",
      "After every demo, run a short debrief: How did the fitting feel? What system did you present? Key wins? When did the Client click? One opportunity? Did you close? Did you ask for the review?",
      "Ownership is not a one-time action. It is a standard you practice throughout the day.",
    ],
    "Keep the cheat card on the floor until CARE is automatic.",
    [
      {
        n: 15,
        title: "After the demo · quick reference",
        blocks: [
          {
            kind: "list",
            title: "After-demo debrief",
            tone: "plain",
            items: [
              "How did the fitting feel to you?",
              "What system did you present?",
              "What were the key wins and WOW moments?",
              "When did the Client show conviction — the click?",
              "What is the one opportunity to improve next time?",
              "Did you close? If not, where did you lose them?",
              "Did you ask for the review?",
            ],
          },
          {
            kind: "list",
            title: "Every shift checklist",
            tone: "do",
            items: [
              "Assign the Sales Floor Leader at opening and make it visible",
              "Greet every Client, at least twice",
              "Check the body language of Clients and team",
              "Monitor green and red flags actively, demo by demo",
              "Step in for balance-technique WOW moments",
              "Support closings by prepping POS early",
              "Coach in the moment; reinforce in the backroom",
            ],
          },
        ],
      },
      {
        n: 16,
        title: "Floor Leader cheat card",
        subtitle: "Tear this page out and keep it on the floor.",
        blocks: [
          {
            kind: "cards",
            items: [
              { letter: "C", title: "Connect", body: "Greet every Client twice. Keep them warm. Hand off with confidence." },
              { letter: "A", title: "Assess", body: "Read every demo. Protect green flags, answer red flags." },
              { letter: "R", title: "Respond", body: "Step in to save a red flag or amplify a WOW, then step back." },
              { letter: "E", title: "Elevate", body: "Coach what you saw: in the moment, backroom, and 1:1." },
            ],
          },
          {
            kind: "say",
            label: "AAH",
            text: "Acknowledge → Add value → Hand it back. Only three reasons to step in: a red flag, a building WOW, or the close.",
          },
        ],
      },
    ],
    CARE_ID,
  ),
  lesson(
    "practice-scenarios",
    "Practice scenarios",
    12,
    "Burgundy · 08",
    [
      "These four scenarios come from real floors. Use them in your own development and when you coach others.",
      "For each one, ask three questions: What went right? Where were the opportunities? Through the CARE lens, what should the Floor Leader have noticed and done?",
      "1. The Walk — rushed test walks, short discovery of lifestyle, Client left saying “I’ll think about it.”",
      "2. Talking Through the Demo — too much personal storytelling; incomplete lifestyle solution; Client left in sandals.",
      "3. Ideal Foot — over-explained anatomy; lost the Client in technical detail after a strong start.",
      "4. Discovery — thin follow-up questions; shifted to personal stories; Client never fully engaged.",
      "You do not need to master all four at once. Start with the pattern you see most often. Then use CARE on your next shift: assign the Floor Leader out loud, watch for flags, step in with AAH, coach what you observe.",
    ],
    "You now have the system. The next step is to use it.",
    [
      {
        n: 17,
        title: "Practice scenarios",
        subtitle: "Use these in team training and 1:1s. Read the scene, then discuss through the CARE lens.",
        blocks: [
          {
            kind: "steps",
            items: [
              { n: "01", title: "The Walk", body: "Rushed test walks, short discovery of lifestyle, Client left saying “I’ll think about it.”" },
              { n: "02", title: "Talking through the demo", body: "Too much personal storytelling; incomplete lifestyle solution; Client left in sandals." },
              { n: "03", title: "Ideal foot", body: "Over-explained anatomy; lost the Client in technical detail after a strong start." },
              { n: "04", title: "Discovery", body: "Thin follow-up questions; shifted to personal stories; Client never fully engaged." },
            ],
          },
        ],
      },
      {
        n: 18,
        title: "The final word",
        blocks: [
          {
            kind: "quote",
            text: "As Sales Floor Leader, you are the energy, the coach, and the connector on the floor.",
          },
          {
            kind: "p",
            text: "When you lead with purpose, Clients feel it, your team thrives, and Remarkable results follow. Client service equals happy Clients. Happy Clients equal high sales.",
          },
        ],
      },
    ],
    CARE_ID,
  ),
];

const interviewLessons: Lesson[] = [
  lesson(
    "cost-of-blind-closes",
    "The cost of blind closes",
    8,
    "Blue · 01",
    [
      "Interview for Reality is how we draw out the real objections — especially the spouse — before the supports ever hit the cart.",
      "The pattern we keep seeing: the interview stays surface-level, the spouse never surfaces, price or “I need to talk to…” hits at the register, the Specialist freezes or steps down, and the Client leaves with an incomplete solution or no solution.",
      "What we own instead: the interview digs for the real barriers. The spouse is invited into the conversation early. Objections surface while value is still being built. The Specialist answers with ownership, not escape.",
    ],
    "Surface the real objection while value is still being built — not at the register.",
    [
      {
        n: 1,
        kicker: "Specialists · Blue Track",
        title: "Interview for Reality",
        subtitle: "Drawing out the real objections, especially the spouse, before the supports ever hit the cart.",
        blocks: [{ kind: "quote", text: "A Remarkable Experience. Every Client. Every time." }],
      },
      {
        n: 2,
        title: "In this module",
        blocks: [
          {
            kind: "steps",
            items: [
              { n: "01", title: "The cost of blind closes", body: "Why missing the real objection early destroys value and closes." },
              { n: "02", title: "The mindset shift", body: "From friendly chat to diagnostic discovery." },
              { n: "03", title: "The Reality Questions", body: "Language that surfaces spouse, money, and decision-makers." },
              { n: "04", title: "Role-plays + self-audit", body: "Practice until it feels natural and caring." },
              { n: "05", title: "7-Day Reality Challenge", body: "Turn insight into a daily habit that lifts closes." },
            ],
          },
        ],
      },
      {
        n: 3,
        title: "The pattern we keep seeing",
        blocks: [
          {
            kind: "pair",
            left: {
              title: "What happens now",
              body: "Interview stays surface-level. Spouse never surfaces. Price hits at the register. Specialist freezes or steps down. Client leaves incomplete.",
            },
            right: {
              title: "What we own instead",
              body: "Interview digs for the real barriers. Spouse is invited in early. Objections surface while value is built. Specialist answers with ownership.",
            },
          },
        ],
      },
    ],
    INTERVIEW_ID,
  ),
  lesson(
    "mindset-shift",
    "The mindset shift",
    8,
    "Blue · 02",
    [
      "Avoiding the hard question early is the real confrontation later.",
      "Old thinking: “I don’t want to make them uncomfortable.” Result: the uncomfortable conversation happens at home — without you — and the sale dies.",
      "New thinking: “I protect the Client by bringing reality into the room.” Result: the Client never has to defend a $2,000 decision alone. You become the guide.",
      "If the spouse is going to decide, the spouse is already in the room. Your job is to invite them in early.",
      "Mining early protects the close: objections arrive while value is still high, you control the framing, the spouse never becomes a surprise, and incomplete solutions stop happening.",
    ],
    "If the spouse is going to decide, invite them in early.",
    [
      {
        n: 4,
        title: "The mindset shift",
        subtitle: "Avoiding the hard question early is the real confrontation later.",
        blocks: [
          {
            kind: "pair",
            left: {
              title: "Old thinking",
              body: "“I don’t want to make them uncomfortable.” The uncomfortable conversation happens at home — without you — and the sale dies.",
            },
            right: {
              title: "New thinking",
              body: "“I protect the Client by bringing reality into the room.” They never have to defend a $2,000 decision alone.",
            },
          },
          {
            kind: "quote",
            text: "If the spouse is going to decide, the spouse is already in the room.",
          },
        ],
      },
      {
        n: 5,
        title: "Why mining early protects the close",
        blocks: [
          {
            kind: "steps",
            items: [
              { n: "01", title: "Objections arrive while value is high", body: "Easier to answer with ownership instead of a step-down." },
              { n: "02", title: "You control the framing", body: "Caring and collaborative — not defensive at the register." },
              { n: "03", title: "Spouse never becomes a surprise", body: "The #1 silent closer is “I need to talk to my spouse.”" },
              { n: "04", title: "Incomplete solutions stop", body: "When the real barrier is known, you keep the core strong." },
            ],
          },
        ],
      },
    ],
    INTERVIEW_ID,
  ),
  lesson(
    "reality-questions",
    "The Reality Questions",
    12,
    "Blue · 03",
    [
      "These are not interrogation questions. They are ownership questions. Practice until they feel natural.",
      "Who else feels the impact of this pain day-to-day? Opens the door to spouse and family without pressure.",
      "When you’ve made a decision this important for your body before, how have you and [spouse] usually decided together? Normalizes joint decisions.",
      "Is this something you want to run by anyone else before we lock in the system that actually solves it? Direct, respectful, and gives permission to be honest.",
      "What would make this a no-brainer for both of you? Surfaces the real criteria so you can address them.",
      "Would it help if we recorded a quick 60-second video of your test walk so they can see the difference you just felt?",
      "Ask with genuine curiosity. Use their words back. Pause. Acknowledge. Treat the answer as useful information, not a threat. Never apologize for asking.",
    ],
    "Ask with care. Pause. Treat the answer as useful information, not a threat.",
    [
      {
        n: 6,
        title: "The Reality Questions",
        subtitle: "Ownership questions. Practice until they feel natural.",
        blocks: [
          {
            kind: "list",
            tone: "plain",
            items: [
              "Who else feels the impact of this pain day-to-day?",
              "When you’ve made a decision this important for your body before, how have you and [spouse] usually decided together?",
              "Is this something you want to run by anyone else before we lock in the system that actually solves it?",
              "What would make this a no-brainer for both of you?",
            ],
          },
        ],
      },
      {
        n: 7,
        title: "How to ask so it feels caring",
        blocks: [
          {
            kind: "list",
            title: "Do this",
            tone: "do",
            items: [
              "Ask with genuine curiosity and care",
              "Use their words back to them",
              "Pause and let them answer fully",
              "Acknowledge whatever they say",
              "Treat the answer as useful information, not a threat",
              "Smile and stay warm",
            ],
          },
          {
            kind: "list",
            title: "Never",
            tone: "never",
            items: [
              "Sound like you’re checking a box",
              "Ask as if you’re already braced for no",
              "Rush past the answer to get back to the pitch",
              "Make the Client feel interrogated",
              "Apologize for asking",
              "Treat a spouse mention as the end of the sale",
            ],
          },
        ],
      },
      {
        n: 8,
        title: "Language bank — spouse and decision-maker",
        blocks: [
          { kind: "say", label: "Soft open", text: "Who else feels the impact of this day-to-day?" },
          { kind: "say", label: "Process", text: "When you’ve decided on something this important for your body, how have you and [spouse] usually done that together?" },
          { kind: "say", label: "Direct", text: "Is this something you want to run by anyone else before we lock in the system that actually solves it?" },
          { kind: "say", label: "Support", text: "Would it help if we recorded a quick 60-second video of your test walk so they can see the difference you just felt?" },
        ],
      },
    ],
    INTERVIEW_ID,
  ),
  lesson(
    "good-vs-weak",
    "Good mining vs. weak mining",
    8,
    "Blue · 04",
    [
      "Weak mining skips any decision-maker questions, hears “I’ll talk to my spouse” and freezes, treats the answer as a threat, rushes past it, and ends up stepping down at the register.",
      "Strong mining asks at least one reality question every interview, already knows the spouse is part of the process, treats the answer as useful information, pauses and explores criteria, and keeps the core strong.",
    ],
    "Ask at least one reality question in every interview.",
    [
      {
        n: 9,
        title: "Good mining vs. weak mining",
        blocks: [
          {
            kind: "pair",
            left: {
              title: "Weak",
              body: "Skips decision-maker questions. Hears “I’ll talk to my spouse” and freezes. Treats the answer as a threat. Rushes past it. Steps down at the register.",
            },
            right: {
              title: "Strong",
              body: "Asks at least one reality question every interview. Already knows the spouse is part of the process. Treats the answer as useful. Pauses. Keeps the core strong.",
            },
          },
        ],
      },
    ],
    INTERVIEW_ID,
  ),
  lesson(
    "roleplays-audit",
    "Role-plays and self-audit",
    12,
    "Blue · 05",
    [
      "Scenario 1 — The Silent Spouse. The Client has a strong spouse objection but will not volunteer it. Surface it cleanly and keep the conversation warm.",
      "Scenario 2 — The Joint Decision. The Client says “We always decide together.” Explore the process and offer tools — video, summary, guarantee language — that help the conversation at home.",
      "Scenario 3 — Price + Spouse Combined. The Client raises both investment and “I need to talk to my wife.” Answer the value first, then address the decision process without stepping down.",
      "Rate yourself 1–5 after every shift: Did I ask a decision-maker question? Was the tone warm? Did I explore the answer? Did I offer a tool for the home conversation? Did I protect the Client’s outcome, not just my comfort?",
    ],
    "Protect the Client’s outcome, not just your comfort.",
    [
      {
        n: 10,
        title: "Role-play scenarios",
        blocks: [
          {
            kind: "steps",
            items: [
              { n: "01", title: "The Silent Spouse", body: "Strong spouse objection they will not volunteer. Surface it cleanly and keep the conversation warm." },
              { n: "02", title: "The Joint Decision", body: "“We always decide together.” Explore the process. Offer video, summary, or guarantee language." },
              { n: "03", title: "Price + spouse", body: "Answer the value first, then the decision process — without stepping down." },
            ],
          },
        ],
      },
      {
        n: 11,
        title: "Specialist self-audit",
        subtitle: "Rate yourself 1–5 after every shift. Managers: pair the average with that week’s close rate.",
        blocks: [
          {
            kind: "list",
            tone: "plain",
            items: [
              "Decision-maker question asked — at least one reality question in every interview",
              "Tone of the question — warm, curious, caring, never interrogative",
              "Response to the answer — acknowledged and explored, never rushed past",
              "Spouse / joint decision handled — tools or language offered for the conversation at home",
              "Overall ownership — I protected the Client’s outcome, not just my comfort",
            ],
          },
        ],
      },
    ],
    INTERVIEW_ID,
  ),
  lesson(
    "seven-day-challenge",
    "7-Day Reality Challenge",
    8,
    "Blue · 06",
    [
      "Pick your biggest gap. Make the questions a habit this week. Share wins in the next huddle.",
      "Days 1–2: Ask one reality question in every interview. Log what surfaces. Notice how often the spouse or money conversation was waiting.",
      "Days 3–4: Focus on warmth and silence after the question. Practice acknowledging whatever answer you get.",
      "Days 5–6: When a spouse is mentioned, offer one concrete tool — video, summary, or guarantee language.",
      "Day 7: Bring one win and one miss to the huddle. Celebrate the win. Own the miss as learning.",
      "We already know how to fit and how to present value. Interview for Reality is how we stop leaving the hardest conversation for the Client to have alone at home.",
    ],
    "Invite reality into the room early. Protect the Client. Own the outcome.",
    [
      {
        n: 12,
        title: "7-Day Reality Challenge",
        subtitle: "Pick your biggest gap. Make the questions a habit this week.",
        blocks: [
          {
            kind: "steps",
            items: [
              { title: "Day 1–2 · Ask one", body: "Every interview. Log what surfaces." },
              { title: "Day 3–4 · Tone & pause", body: "Warmth and silence after the question. Acknowledge whatever you get." },
              { title: "Day 5–6 · Support home", body: "When a spouse is mentioned, offer one concrete tool." },
              { title: "Day 7 · Full review", body: "One win and one miss to the huddle." },
            ],
          },
        ],
      },
      {
        n: 13,
        title: "The bottom line",
        blocks: [
          {
            kind: "quote",
            text: "Interview for Reality is how we stop leaving the hardest conversation for the Client to have alone at home.",
          },
          {
            kind: "p",
            text: "When we surface the real objection early, we protect the Client, protect the complete solution, and protect the close.",
          },
        ],
      },
    ],
    INTERVIEW_ID,
  ),
];

const floorLessons: Lesson[] = [
  lesson(
    "why-it-matters",
    "Why this partnership matters",
    8,
    "Blue · 01",
    [
      "This course is not written for managers. It is written for you — the Specialist who is on the floor with the Client every day.",
      "When CARE is active, you are no longer operating alone. There is a designated Floor Leader whose job is to support the experience so you can stay fully present.",
      "You are never alone. Coaching happens while the moment is still alive. When a red flag appears or a WOW is building, the Floor Leader steps in only long enough to help — then hands the Client back to you.",
      "This is not about being managed more closely. It is about being supported more effectively so you can do your best work.",
    ],
    "You are never alone on a CARE floor. The relationship stays yours.",
    [
      {
        n: 1,
        kicker: "Leadership Development Series",
        title: "Working with your Sales Floor Leader",
        subtitle: "What every Specialist can expect when CARE is active on the floor.",
        blocks: [{ kind: "quote", text: "A Remarkable Experience. Every Client. Every time." }],
      },
      {
        n: 2,
        title: "Why active floor leadership matters to you",
        blocks: [
          {
            kind: "steps",
            items: [
              { title: "You are never alone", body: "There is always a designated Floor Leader watching the floor so you can stay fully present." },
              { title: "Coaching in real time", body: "Feedback comes while the demo is still fresh — not days later." },
              { title: "Stronger closes", body: "They step in only long enough to help, then hand it back to you." },
              { title: "Clients feel the difference", body: "Consistent Remarkable experiences create advocates, reviews, and referrals." },
            ],
          },
        ],
      },
    ],
    FLOOR_ID,
  ),
  lesson(
    "care-promise",
    "The CARE promise to every Specialist",
    8,
    "Blue · 02",
    [
      "CARE is the system your Floor Leader runs on your behalf.",
      "Connect: they greet every Client and hand them to you with a warm, confident introduction so you start from strength.",
      "Assess: they read every demo without interrupting a working one. Green flags stay protected. Red flags get answered before they cost the sale.",
      "Respond: they step in only when it actually helps — using AAH — then immediately return control so you finish the sale.",
      "Elevate: every observation becomes coaching. In the moment. In the backroom. And in your weekly 1:1. Always beginning with what went well.",
    ],
    "You will not be left alone with a drifting demo.",
    [
      {
        n: 3,
        title: "The CARE promise to every Specialist",
        blocks: [
          {
            kind: "cards",
            items: [
              { letter: "C", title: "Connect", body: "They greet every Client and hand them to you with a warm, confident introduction so you start strong." },
              { letter: "A", title: "Assess", body: "They read every demo without interrupting. Green flags stay protected. Red flags get answered." },
              { letter: "R", title: "Respond", body: "They step in only when it helps — using AAH — then immediately hand control back." },
              { letter: "E", title: "Elevate", body: "Every observation becomes coaching. Always starting with wins." },
            ],
          },
        ],
      },
    ],
    FLOOR_ID,
  ),
  lesson(
    "connect-and-assess",
    "Connect and Assess",
    10,
    "Blue · 03",
    [
      "When Connect is done well you receive a Client who already feels the whole store is glad they came, a warm introduction that positions you as the expert, and a Floor Leader who has already confirmed you are ready.",
      "That introduction is designed to transfer trust to you instantly. When you hear it, own it. Smile. Step forward. Take the lead.",
      "Assess is support, not surveillance. They are reading the room so you can stay locked in with the Client.",
      "They only interrupt when the interruption helps the sale and protects the experience. When things are working, they stay out of the way on purpose.",
    ],
    "A strong hand-off lets you start warm. Own it.",
    [
      {
        n: 4,
        title: "C — Connect: how they help you build value",
        blocks: [
          {
            kind: "list",
            title: "What you receive",
            tone: "do",
            items: [
              "A Client who feels they have a full team behind them",
              "A warm, specific introduction that positions you as the expert",
              "Clients seated quickly so momentum never dies",
              "A Floor Leader who has already confirmed you are ready",
            ],
          },
          {
            kind: "say",
            label: "The greeting you will hear",
            text: "Hey, my name is [Name], I’m the manager here. [Your Name] is an excellent Specialist and they are going to take great care of you.",
          },
        ],
      },
      {
        n: 5,
        title: "A — Assess: support, not surveillance",
        blocks: [
          {
            kind: "list",
            title: "Green flags they protect",
            tone: "green",
            items: [
              "Smiles, surprise, or visible WOW moments",
              "Client leaning in and trying multiple steps",
              "Balance technique landing as an aha",
              "Client putting supports into their own shoes",
              "Silence respected on test walks",
            ],
          },
          {
            kind: "list",
            title: "Red flags they answer",
            tone: "red",
            items: [
              "Too much talking during test walks",
              "Neutral language: “fine,” “maybe”",
              "Client putting shoes back on early",
              "One-word answers or disengagement",
              "Specialist oversharing personal stories",
            ],
          },
        ],
      },
    ],
    FLOOR_ID,
  ),
  lesson(
    "respond-aah",
    "Respond: they elevate, never take over",
    10,
    "Blue · 04",
    [
      "When the Floor Leader steps in, there is a clear method and a clear boundary. The method is AAH.",
      "Acknowledge: “I want to add to what [Your Name] is showing you.” This protects your credibility. The Client sees teamwork instead of a rescue.",
      "Add Value: they name something the Client can feel or see right now.",
      "Hand It Back: “[Your Name] will walk you through the next step.” Control returns to you on purpose. You finish the sale. The relationship stays yours.",
      "If they never hand it back, they have quietly taken the demo. That is the one thing the system is designed to prevent. When a clean AAH happens, do not freeze. Take the Client back and finish strong.",
    ],
    "When they hand the Client back, take the lead immediately.",
    [
      {
        n: 6,
        title: "R — Respond: they elevate, never take over",
        subtitle: "When they step in, it is always through AAH — and the final move is always handing the Client back to you.",
        blocks: [
          {
            kind: "cards",
            items: [
              { letter: "A", title: "Acknowledge", body: "“I want to add to what [Your Name] is showing you.” Protects your credibility." },
              { letter: "A", title: "Add value", body: "They name the change the Client can feel right now." },
              { letter: "H", title: "Hand it back", body: "“[Your Name] will walk you through the next step.” You finish the sale." },
            ],
          },
        ],
      },
    ],
    FLOOR_ID,
  ),
  lesson(
    "elevate-every-shift",
    "Elevate, and what to expect every shift",
    10,
    "Blue · 05",
    [
      "Elevate is where the long-term growth lives. Coaching happens in three places: in the moment, in the backroom, and in the weekly 1:1.",
      "In the moment they model a clean close or amplify a WOW. Watch closely. Notice what they chose to say and what they chose not to say.",
      "In the backroom they lead with what went well, then name one opportunity — not five. One clear point creates change.",
      "A normal CARE shift: a named Floor Leader, double greetings, active observation, clean AAH step-ins, backroom coaching on demand, and fresh debriefs after demos.",
    ],
    "If they watched it, they own the coaching on it — and it begins with wins.",
    [
      {
        n: 7,
        title: "E — Elevate: coaching that builds you",
        blocks: [
          {
            kind: "steps",
            items: [
              { title: "In the moment", body: "Live coaching with zero risk to the sale. Learn by seeing it done right." },
              { title: "In the backroom", body: "Wins first, then one opportunity — not five. Short, specific, useful." },
              { title: "In the weekly 1:1", body: "Patterns across many demos become the coaching theme." },
            ],
          },
        ],
      },
      {
        n: 8,
        title: "What you can expect every shift",
        blocks: [
          {
            kind: "steps",
            items: [
              { n: "01", title: "A named Floor Leader", body: "Assigned out loud in the huddle and written on the board." },
              { n: "02", title: "Double greetings", body: "Every Client feels the whole store is glad they came." },
              { n: "03", title: "Active observation", body: "Green and red flags, without stopping a working demo." },
              { n: "04", title: "Clean AAH step-ins", body: "They acknowledge you, add value, and hand it back." },
              { n: "05", title: "Backroom coaching", body: "Plan help, energy reset, or product pull support." },
              { n: "06", title: "Fresh debriefs", body: "Wins first, then one clear opportunity." },
            ],
          },
        ],
      },
    ],
    FLOOR_ID,
  ),
  lesson(
    "your-part",
    "Your part of the partnership",
    10,
    "Blue · 06",
    [
      "The partnership works best when both sides play their part.",
      "Before you go back out: share the Client type, ask for the plan questions, let them read your energy, leave with a clear next move.",
      "On the floor: trust them to watch for red flags, stay present, accept a clean AAH as help, finish the sale the moment they hand the Client back.",
      "After the demo: be ready for a short debrief, own the wins, take the one opportunity seriously, ask for a quick role-play if it will help.",
      "Stay open. Signal early. Own the hand-back. Protect the culture. Celebrate the wins. Ask for the 1:1.",
      "You are not meant to do this work alone. Use the support. Grow from it. Keep the standard high.",
    ],
    "You and your Floor Leader are a team. Stay open.",
    [
      {
        n: 9,
        title: "How to use your Floor Leader well",
        blocks: [
          {
            kind: "steps",
            items: [
              { title: "Before you go back out", body: "Share the Client type. Ask for the plan questions. Leave with a clear next move." },
              { title: "While you are on the floor", body: "Stay present. Accept a clean AAH as help. Finish the sale after they hand back." },
              { title: "After the demo", body: "Own the wins. Take the one opportunity. Ask for a quick role-play if helpful." },
            ],
          },
        ],
      },
      {
        n: 10,
        title: "Key questions your Floor Leader will ask",
        blocks: [
          {
            kind: "steps",
            items: [
              { title: "New Client", body: "What brought them in? Pain level? What do they want to get back to? Which system will you present?" },
              { title: "Return with issue", body: "What stands out? Full 3-Step System? Where are they in break-in? Shoe condition?" },
              { title: "Successful return", body: "Last visit? Review? How many steps? Any new activities for lifestyle?" },
            ],
          },
        ],
      },
      {
        n: 11,
        title: "Your part of the partnership",
        blocks: [
          {
            kind: "steps",
            items: [
              { n: "01", title: "Stay open", body: "Coaching is not criticism. Treat every observation as fuel." },
              { n: "02", title: "Signal early", body: "A quick look or a step to the backroom is enough." },
              { n: "03", title: "Own the hand-back", body: "Take the lead immediately. The relationship stays yours." },
              { n: "04", title: "Protect the culture", body: "Never talk down a Client or a teammate on the floor." },
              { n: "05", title: "Celebrate the wins", body: "High floors stay high because people feed each other." },
              { n: "06", title: "Ask for the 1:1", body: "Bring patterns you notice. Arrive with something specific to grow." },
            ],
          },
        ],
      },
    ],
    FLOOR_ID,
  ),
];

const solutionLessons: Lesson[] = [
  lesson(
    "language-creates-hierarchy",
    "Language creates hierarchy",
    10,
    "Blue · 01",
    [
      "Every component has a job. A partial Solution is an incomplete Solution. We present one complete system, not a product with extras.",
      "Old language — add-on, accessory, extra, upsell — tells the Client there is a real product… and then some optional stuff hanging off it. The hierarchy is baked into the word before we ever make the case.",
      "New language — Solution Component, part of the System — means everything belongs to one complete Solution. Nothing was ever separate.",
      "Nobody takes half a prescription. If a Client has support in one pair of shoes and is unsupported the other sixteen hours of the day, they haven’t solved the problem — they’ve solved part of it.",
      "That’s not an “extra” conversation. That’s a “here’s what completing your pain resolution actually requires” conversation.",
    ],
    "A partial Solution is an incomplete Solution. Nobody takes half a prescription.",
    [
      {
        n: 1,
        kicker: "Specialists · Blue Track",
        title: "Building a Complete Solution",
        subtitle: "Every component has a job. We present one complete system, not a product with extras.",
        blocks: [{ kind: "quote", text: "A partial Solution is an incomplete Solution." }],
      },
      {
        n: 2,
        title: "The language creates the hierarchy",
        blocks: [
          {
            kind: "pair",
            left: {
              title: "Old language",
              body: "“Add-on.” “Accessory.” “Extra.” “Upsell.” These words tell the Client there is a real product… and then some optional stuff hanging off it.",
            },
            right: {
              title: "New language",
              body: "“Solution Component.” “Part of the System.” Everything belongs to one complete Solution. Nothing was ever separate.",
            },
          },
        ],
      },
      {
        n: 3,
        title: "The frame underneath everything",
        blocks: [
          { kind: "quote", text: "Nobody takes half a prescription." },
          {
            kind: "p",
            text: "If a Client has support in one pair of shoes and is unsupported the other sixteen hours of the day, they haven’t solved the problem — they’ve solved part of it.",
          },
        ],
      },
    ],
    SOLUTION_ID,
  ),
  lesson(
    "four-components",
    "Four Solution Components",
    10,
    "Blue · 02",
    [
      "Name what each component does for the Client, not where it sits in the transaction.",
      "Brooks shoes carry the correction into the shoes they wear most. The supports do their job only when the footwear works with them.",
      "OS1st wellness socks protect comfort and consistency every hour. They reduce friction, manage moisture, and help the supports feel right from the first step to the last.",
      "MedMassager extends recovery beyond the fitting. It supports circulation and comfort at home so the work done in the store keeps paying off after they leave.",
      "Architek by Good Feet completes the system with the right shoe — designed to work with the supports instead of fighting regular footwear.",
    ],
    "Explain each component’s job in the Client’s outcome.",
    [
      {
        n: 4,
        title: "Four Solution Components — each has a job",
        blocks: [
          {
            kind: "steps",
            items: [
              { n: "01", title: "Brooks shoes", body: "Carry the correction into the shoes they wear most. That’s how the Solution stays with them all day." },
              { n: "02", title: "OS1st wellness socks", body: "Protect comfort and consistency every hour. Help the supports feel right from the first step to the last." },
              { n: "03", title: "MedMassager", body: "Extends recovery beyond the fitting so the work done in the store keeps paying off at home." },
              { n: "04", title: "Architek by Good Feet", body: "The shoe designed to work with the supports. Completes the system." },
            ],
          },
        ],
      },
      {
        n: 5,
        title: "How we talk about each component",
        blocks: [
          { kind: "say", label: "Brooks", text: "These shoes carry the correction we just created into the footwear you wear most. That’s how the Solution stays with you all day, not just in the store." },
          { kind: "say", label: "OS1st", text: "These protect the comfort and consistency of the supports every hour you’re on your feet." },
          { kind: "say", label: "MedMassager", text: "This extends the recovery work beyond the fitting so what we did today keeps working after you leave." },
          { kind: "say", label: "Architek", text: "This is the shoe designed to work with the supports. It completes the system so you’re not fighting against regular footwear." },
        ],
      },
    ],
    SOLUTION_ID,
  ),
  lesson(
    "specialist-mindset",
    "The Specialist mindset",
    6,
    "Blue · 03",
    [
      "We don’t present a product and then upsell. We present one complete Solution and explain each component’s job.",
      "The language that belongs in every presentation: “Everything I’m showing you is part of the same Solution. It’s what it takes to keep you out of pain all day, not just some of the day.”",
    ],
    "We present one complete Solution — not a product with extras.",
    [
      {
        n: 6,
        title: "The Specialist mindset",
        blocks: [
          { kind: "quote", text: "We don’t present a product and then upsell. We present one complete Solution and explain each component’s job." },
          {
            kind: "say",
            label: "The language that belongs in every presentation",
            text: "Everything I’m showing you is part of the same Solution. It’s what it takes to keep you out of pain all day, not just some of the day.",
          },
        ],
      },
    ],
    SOLUTION_ID,
  ),
  lesson(
    "match-dont-step-down",
    "Match the right Solution — never step down",
    12,
    "Blue · 04",
    [
      "When the Client pushes back on investment, we match the right Solution. We never “step down.”",
      "First, reconnect to the goal. Bring them back to why they came in before you change anything.",
      "Second, explain the component’s job. Protect credibility. Tell them why that component was part of the original Solution for them.",
      "Third, keep the core strong. If the Solution needs to be adjusted, make sure they still feel the foundation will deliver what they need most.",
      "Example: “I hear you. Before we look at any changes, can I make sure I’m still focused on what brought you in? You said the aching after work has been going on for months…” Then explain the job of the component. Then protect the supports as the core.",
    ],
    "Reconnect. Explain the job. Keep the core strong.",
    [
      {
        n: 7,
        title: "When the Client pushes back",
        subtitle: "We match the right Solution — we never step down.",
        blocks: [
          {
            kind: "steps",
            items: [
              { n: "01", title: "Reconnect to the goal", body: "Bring them back to why they came in before you change anything in the Solution." },
              { n: "02", title: "Explain the component’s job", body: "Protect credibility. Tell them why that component was part of the original Solution." },
              { n: "03", title: "Keep the core strong", body: "If the Solution needs to be adjusted, the foundation still delivers what they need most." },
            ],
          },
        ],
      },
      {
        n: 8,
        title: "Example: matching the right Solution",
        subtitle: "When the Client says the investment is higher than expected.",
        blocks: [
          { kind: "say", label: "Reconnect", text: "I hear you. Before we look at any changes, can I make sure I’m still focused on what brought you in? You said the aching after work has been going on for months and it’s starting to limit time with the family." },
          { kind: "say", label: "Explain the job", text: "I included the MedMassager because it extends the recovery work beyond the fitting. It supports circulation at home so the correction we created keeps working after you leave." },
          { kind: "say", label: "Keep the core", text: "The custom supports themselves are doing the majority of the work for the issue you described. With this focused Solution you’ll still get the stability and relief you need." },
        ],
      },
    ],
    SOLUTION_ID,
  ),
  lesson(
    "incomplete-solution",
    "A partial Solution is incomplete",
    6,
    "Blue · 05",
    [
      "We don’t sell a product and then add things to it. We present one complete Solution and explain each component’s job in the Client’s outcome.",
      "A partial Solution is an incomplete Solution. Nobody takes half a prescription.",
    ],
    "Present one complete Solution. Explain each component’s job.",
    [
      {
        n: 9,
        title: "The bottom line",
        blocks: [
          { kind: "quote", text: "A partial Solution is an incomplete Solution. Nobody takes half a prescription." },
          {
            kind: "p",
            text: "We don’t sell a product and then add things to it. We present one complete Solution and explain each component’s job in the Client’s outcome.",
          },
        ],
      },
    ],
    SOLUTION_ID,
  ),
];

const ntvLessons: Lesson[] = [
  lesson(
    "price-vs-value",
    "Price vs. value",
    10,
    "Blue · 01",
    [
      "A Client will only move forward if the value outweighs the price in their mind. This training helps you create non-tangible value that reinforces the tangible value of our supports, shoes, socks, and Med Massager.",
      "A Walmart watch is $20–$40. A common steel Rolex is $8,000–$11,000. A Walmart purse is $15–$35. A typical Louis Vuitton handbag is $2,000–$3,000+. A drugstore insole is $10–$20. A Good Feet system is $525 a support and $2,000+ complete.",
      "Ask yourself: what do the insides of those stores look like? How do the staff dress, stand, speak, and act? If you walked in without hearing a word, would you expect a higher price? What creates permission for a Client to invest $2,000+ instead of $20?",
    ],
    "Non-tangible value is what creates permission for a $2,000 decision.",
    [
      {
        n: 1,
        kicker: "Specialists · Blue Track",
        title: "Building Non-Tangible Value",
        subtitle: "A Client will only move forward if the value outweighs the price in their mind.",
        blocks: [{ kind: "quote", text: "A Remarkable Experience. Every Client. Every time." }],
      },
      {
        n: 2,
        title: "Price vs. value refresher",
        blocks: [
          {
            kind: "image",
            src: "/media/value-watches.jpg",
            alt: "Walmart watch versus Rolex price comparison",
            caption: "Same category. Wildly different permission to invest.",
          },
          {
            kind: "image",
            src: "/media/value-supports.jpg",
            alt: "Drugstore insole versus Good Feet system",
            caption: "Walmart $10–$20. The Good Feet Store $525 a support, $2,000+ full system.",
          },
        ],
      },
      {
        n: 3,
        title: "Why does this information matter?",
        blocks: [
          {
            kind: "list",
            tone: "plain",
            items: [
              "What do the insides of a Walmart vs. a Rolex boutique, Louis Vuitton store, or The Good Feet Store look like?",
              "How do the staff members dress, stand, speak, and act in each environment?",
              "If you walked in without saying or hearing a word, would you expect a higher-quality item?",
              "What creates the permission for a Client to invest $2,000+ instead of $20?",
            ],
          },
        ],
      },
    ],
    NTV_ID,
  ),
  lesson(
    "what-is-ntv",
    "What is non-tangible value?",
    10,
    "Blue · 02",
    [
      "Non-tangible value is everything the Client sees, feels, experiences, and remembers that is NOT the physical product itself — yet dramatically increases or destroys the perceived value of that product.",
      "It reinforces the tangible. It is 100% controllable — no budget or inventory required. It is the multiplier that delivers a Remarkable experience every Client, every time.",
      "The six controllable pillars: cart and product handling, Specialist appearance and presence, store environment, assessment and flow, language and ownership, follow-up quality.",
    ],
    "Non-tangible value is free leverage on every metric that matters.",
    [
      {
        n: 4,
        title: "What is non-tangible value?",
        subtitle:
          "Everything the Client sees, feels, experiences, and remembers that is not the physical product — yet dramatically increases or destroys perceived value.",
        blocks: [
          {
            kind: "steps",
            items: [
              { title: "Reinforces the tangible", body: "Makes our supports, shoes, socks, and Med Massager feel worth every dollar." },
              { title: "100% controllable", body: "We own it every single day — no budget or inventory required." },
              { title: "The multiplier", body: "It is how we deliver a Remarkable experience, every Client, every time." },
            ],
          },
        ],
      },
      {
        n: 5,
        title: "The controllable non-tangible pillars",
        blocks: [
          {
            kind: "steps",
            items: [
              { n: "01", title: "Cart & product handling", body: "Highest leverage on perceived value." },
              { n: "02", title: "Appearance & presence", body: "First 30–60 seconds decide premium vs. cheap." },
              { n: "03", title: "Store environment", body: "Sets price expectation before you speak." },
              { n: "04", title: "Assessment, test walk & flow", body: "Smooth = consultative and expert." },
              { n: "05", title: "Language & ownership", body: "Confidence protects the price." },
              { n: "06", title: "Follow-up quality", body: "Turns a sale into a relationship and referrals." },
            ],
          },
        ],
      },
    ],
    NTV_ID,
  ),
  lesson(
    "cart-handling",
    "Cart and product handling",
    10,
    "Blue · 03",
    [
      "Treat the cart like a Rolex. Careless handling instantly makes a $525 support feel like a $20 insole. Deliberate, respectful presentation multiplies perceived value.",
      "Keep the cart and fitting station pristine. Present every support, shoe, sock, and Med Massager deliberately. Clean hands, trays, tablets. Stage items with visual respect.",
      "Never toss or casually drop supports. Never leave a messy station. Never let the cart look like a discount bin.",
    ],
    "A messy cart kills premium perception instantly.",
    [
      {
        n: 6,
        title: "Cart & product handling · treat it like a Rolex",
        subtitle: "Careless handling instantly makes a $525 support feel like a $20 insole.",
        blocks: [
          {
            kind: "list",
            title: "Do this",
            tone: "do",
            items: [
              "Keep cart and fitting station pristine and organized at all times",
              "Present every support, shoe, sock, and Med Massager deliberately",
              "Clean hands / trays / tablets / Med Massager",
              "Stage items with care and visual respect",
              "Treat the system like the high-value solution it is",
            ],
          },
          {
            kind: "list",
            title: "Never",
            tone: "never",
            items: [
              "Toss or casually drop supports onto the cart or floor",
              "Leave a messy, cluttered, or dust-covered station",
              "Stack items carelessly or leave packaging open",
              "Allow the cart to look like a discount bin",
              "Handle products in a way that says “this is ordinary”",
            ],
          },
        ],
      },
      {
        n: 7,
        title: "Cart presentation: clean vs. messy",
        blocks: [
          {
            kind: "image",
            src: "/media/cart-messy.jpg",
            alt: "Messy fitting cart",
            caption: "Messy cart — discount-bin energy. Kills premium perception instantly.",
          },
          {
            kind: "image",
            src: "/media/cart-clean.jpg",
            alt: "Clean Rolex-level fitting cart",
            caption: "Clean cart — organized, deliberate, premium. Supports the $2,000+ value story.",
          },
        ],
      },
    ],
    NTV_ID,
  ),
  lesson(
    "appearance",
    "Appearance and presence",
    8,
    "Blue · 04",
    [
      "Clients decide in the first 30–60 seconds whether this feels like a $2,000 solution or a $20 one. Your presence either supports or undermines the price.",
      "Sharp, clean, every single shift. Strong posture, open body language, genuine energy. Professional yet warm. Confident, consultative, never rushed.",
      "Never wrinkled or casual. Never low energy or slumped. Never transactional language. Never looking at the phone during the experience. Never anything that says “this is just another job.”",
    ],
    "The first minute decides premium vs. cheap.",
    [
      {
        n: 8,
        title: "Specialist appearance & presence",
        subtitle: "Clients decide in the first 30–60 seconds whether this feels like a $2,000 solution or a $20 one.",
        blocks: [
          {
            kind: "list",
            title: "Do this",
            tone: "do",
            items: [
              "Sharp, clean, every single shift",
              "Strong posture, open body language, genuine energy",
              "Professional yet warm language and tone",
              "Confident, consultative presence, never rushed",
              "Grooming and presentation that matches a premium brand",
            ],
          },
          {
            kind: "list",
            title: "Never",
            tone: "never",
            items: [
              "Wrinkled, incomplete, or casual appearance",
              "Low energy, slumped posture, or distracted vibe",
              "Transactional or uncertain language",
              "Looking at the phone or multitasking during the experience",
              "Anything that says “this is just another job”",
            ],
          },
        ],
      },
    ],
    NTV_ID,
  ),
  lesson(
    "store-environment",
    "Store environment — the first 10 seconds",
    8,
    "Blue · 05",
    [
      "The environment sets the price expectation before a single word is spoken. A Walmart-level first impression makes the $2,000+ system feel mismatched.",
      "Spotless floors, mirrors, glass, and fitting area. Clean bathrooms and entryway — every Client notices. Organized visual merchandising and lighting. Calm, premium atmosphere. Fitting chairs ready and inviting.",
      "Never clutter, dust, overflowing trash, dim lighting, or letting high-traffic days become an excuse for lower standards.",
    ],
    "The first ten seconds set the price expectation.",
    [
      {
        n: 9,
        title: "Store environment · the first 10 seconds",
        subtitle: "The environment sets the price expectation before a single word is spoken.",
        blocks: [
          {
            kind: "list",
            title: "Do this",
            tone: "do",
            items: [
              "Spotless floors, mirrors, glass, and fitting area",
              "Clean bathrooms and entryway — every Client notices",
              "Organized visual merchandising and lighting",
              "Calm, premium atmosphere",
              "Fitting chairs and stations ready and inviting",
            ],
          },
          {
            kind: "list",
            title: "Never",
            tone: "never",
            items: [
              "Clutter, dust, or dirty surfaces anywhere a Client sees",
              "Messy fitting area or overflowing trash",
              "Dim, harsh, or poorly maintained lighting",
              "Anything that sets a discount or ordinary expectation",
              "Letting high-traffic days become an excuse for lower standards",
            ],
          },
        ],
      },
    ],
    NTV_ID,
  ),
  lesson(
    "flow-language-followup",
    "Flow, language, and follow-up",
    10,
    "Blue · 06",
    [
      "Assessment and flow: care and respect during footprint mapping, patient coaching on the test walk, smooth transitions, never rush or make it feel retail.",
      "Language and ownership: speak as the expert who owns the outcome. Protect the value of the Lifetime Guarantee. Never use discounting or uncertain language.",
      "Follow-up quality: personal, timely check-ins that feel caring, not scripted. Turns one sale into referrals and retention.",
      "Also own packaging, privacy, team atmosphere, post-sale touches, guarantee language, and high-traffic days. Standards do not drop when the floor is full.",
    ],
    "Confidence protects the price. Follow-up turns a sale into a relationship.",
    [
      {
        n: 10,
        title: "Flow, language & follow-up",
        blocks: [
          {
            kind: "steps",
            items: [
              { n: "04", title: "Assessment & flow", body: "Care during mapping. Patient test-walk coaching. Smooth transitions. Never rush." },
              { n: "05", title: "Language & ownership", body: "Speak as the expert who owns the outcome. Never discount. Protect the guarantee." },
              { n: "06", title: "Follow-up quality", body: "Personal, timely, caring. Turns one sale into referrals and retention." },
            ],
          },
        ],
      },
      {
        n: 11,
        title: "Additional Good Feet non-tangibles",
        blocks: [
          {
            kind: "steps",
            items: [
              { title: "Packaging & take-home", body: "Beautiful, organized packaging. A premium hand-off that feels special." },
              { title: "Privacy & respect", body: "Protect Client privacy during fitting. Never make the process feel exposed." },
              { title: "Team atmosphere", body: "Zero tolerance for negativity. The whole store acts as one premium brand." },
              { title: "Post-sale touches", body: "Thank-you notes and thoughtful check-ins beyond the sale." },
              { title: "Guarantee ownership", body: "Talk about and live the Satisfaction Guarantee with full confidence." },
              { title: "High-traffic days", body: "Standards do not drop on busy or short-staffed days." },
            ],
          },
        ],
      },
    ],
    NTV_ID,
  ),
  lesson(
    "audit-and-roleplay",
    "Self-audit and role-plays",
    12,
    "Blue · 07",
    [
      "Rate yourself 1–5 daily or weekly. Managers: pair the average score with that week’s close rate, AOV, and ranking.",
      "Elements: cart handling, personal appearance and energy, store environment contribution, assessment and demo flow, language confidence, follow-up quality, and the overall Rolex test — would a walk-in expect $2,000+ or $20?",
      "Role-play 1: messy cart vs. Rolex-level care. How does the Client’s reaction to price change?",
      "Role-play 2: low-energy greeting vs. sharp, confident, warm presence.",
      "Role-play 3: “That’s a lot of money.” Lean on the experience just delivered — environment, handling, expertise, follow-up — to reinforce value without discounting.",
    ],
    "Would a walk-in expect $2,000+ or $20?",
    [
      {
        n: 12,
        title: "Specialist self-audit & manager scorecard",
        subtitle: "Rate 1–5. Managers: pair the average with that week’s close rate / AOV / ranking.",
        blocks: [
          {
            kind: "list",
            tone: "plain",
            items: [
              "Cart & product handling — pristine, deliberate, Rolex-level",
              "Personal appearance & energy — sharp uniform, posture, presence",
              "Store environment contribution — floors, stations, bathrooms, feel",
              "Assessment / demo flow — patient, expert, smooth transitions",
              "Language confidence & ownership — no discounting, full ownership",
              "Follow-up quality — timely, personal, caring",
              "Overall Rolex test — would a walk-in expect $2,000+ or $20?",
            ],
          },
        ],
      },
      {
        n: 13,
        title: "Role-play scenarios",
        blocks: [
          {
            kind: "steps",
            items: [
              { n: "01", title: "Cart & handling", body: "Messy cart vs. Rolex-level care. Debrief: how did the Client’s reaction to price change?" },
              { n: "02", title: "Presence", body: "Low-energy, distracted greeting vs. sharp, confident, warm presence." },
              { n: "03", title: "Price objection + non-tangibles", body: "“That’s a lot of money.” Lean on the experience just delivered. Do not discount." },
            ],
          },
        ],
      },
    ],
    NTV_ID,
  ),
  lesson(
    "seven-day-action",
    "7-Day Action Challenge",
    8,
    "Blue · 08",
    [
      "Pick your top one or two gaps. Make them habits this week. Share wins in the next huddle.",
      "Days 1–2: reset every cart and station to pristine. Practice deliberate product handling on every demo.",
      "Days 3–4: self-check plus peer feedback. Own energy, posture, and language for every Client.",
      "Days 5–6: master one smooth transition. Use ownership language on the system and the guarantee.",
      "Day 7: deliver one perfect personal follow-up call. Report the Client’s response and any referral or review.",
      "We already crush the tangible product knowledge and fitting process. Non-tangible value is how we make every Client feel the difference so the value is undeniable and the price conversation becomes easier.",
    ],
    "Let’s own it — together.",
    [
      {
        n: 14,
        title: "7-Day Action Challenge",
        subtitle: "Pick your top 1–2 gaps. Make them habits this week.",
        blocks: [
          {
            kind: "steps",
            items: [
              { title: "Day 1–2 · Cart standards", body: "Reset every cart and station to pristine. Practice deliberate handling on every demo." },
              { title: "Day 3–4 · Appearance & presence", body: "Self-check + peer feedback. Own energy, posture, and language." },
              { title: "Day 5–6 · Flow & language", body: "Master one smooth transition. Use ownership language on the system and guarantee." },
              { title: "Day 7 · Follow-up excellence", body: "One perfect personal follow-up call. Report the response." },
            ],
          },
        ],
      },
      {
        n: 15,
        title: "Let’s own it — together",
        blocks: [
          {
            kind: "quote",
            text: "Non-tangible value is how we make every Client feel the difference so the value is undeniable and the price conversation becomes easier.",
          },
          { kind: "p", text: "A Remarkable Experience. Every Client. Every time. Waterman COGS · Blue Track · Specialists." },
        ],
      },
    ],
    NTV_ID,
  ),
];

export const SLIDE_TRACKS: Track[] = [
  {
    id: CARE_ID,
    role: "managers",
    title: "CARE Field Guide",
    nav: "CARE",
    href: "/training/care",
    image: "/media/classroom-wide.jpg",
    audience: "Managers · Burgundy Track",
    summary:
      "The Complete CARE Field Guide. Connect, Assess, Respond, Elevate — a practical system for leading the sales floor without taking over the sale.",
    lessons: careLessons,
  },
  {
    id: INTERVIEW_ID,
    role: "specialist",
    title: "Interview for Reality",
    nav: "Interview",
    href: "/training/interview",
    image: "/media/classroom-table.jpg",
    audience: "Specialists · Blue Track",
    summary:
      "Draw out the real objections — especially the spouse — before the supports ever hit the cart. Protect the Client, the complete solution, and the close.",
    lessons: interviewLessons,
  },
  {
    id: FLOOR_ID,
    role: "specialist",
    title: "Working with Your Floor Leader",
    nav: "Floor Leader",
    href: "/training/floor-leader",
    image: "/media/classroom-circle.jpg",
    audience: "Specialists · Blue Track",
    summary:
      "What every Specialist can expect when CARE is active on the floor — and how to use the partnership so you keep the Client and grow faster.",
    lessons: floorLessons,
  },
  {
    id: SOLUTION_ID,
    role: "specialist",
    title: "Building a Complete Solution",
    nav: "Complete Solution",
    href: "/training/complete-solution",
    image: "/media/classroom.jpg",
    audience: "Specialists · Blue Track",
    summary:
      "Every component has a job. We present one complete system — Brooks, OS1st, MedMassager, Architek — not a product with extras.",
    lessons: solutionLessons,
  },
  {
    id: NTV_ID,
    role: "specialist",
    title: "Building Non-Tangible Value",
    nav: "Non-Tangible Value",
    href: "/training/non-tangible",
    image: "/media/cart-clean.jpg",
    audience: "Specialists · Blue Track",
    summary:
      "Everything the Client sees, feels, and remembers that is not the product — cart, presence, store, language, follow-up. The 7-Day Action Challenge is built in.",
    lessons: ntvLessons,
  },
];
