import type { Track } from "@/lib/content";

/**
 * "Using the Training Building Center" — the course that teaches the builder.
 *
 * Seeded (and kept fresh) by `refreshBuilderTraining()` in cms.ts, keyed on the
 * `cms_settings` flag `builder_training_v1`, so it installs on both fresh and
 * already-seeded databases. Role `managers` means it shows in /training for the
 * builder/leader population (every leader's allowedTabs include "managers") and
 * stays hidden from Specialists/new hires. It is also linked from inside /build.
 *
 * Lesson bodies use the same `TAG · …` tagged-line format learners see, so the
 * course demonstrates the very syntax it teaches. Lesson 5 carries an authored
 * slide deck (persisted to cms_lessons.slides) to prove the DB slide path.
 */
export const BUILDER_TRACK: Track = {
  id: "using-the-training-builder",
  role: "managers",
  title: "Using the Training Building Center",
  nav: "Build Trainings",
  href: "/training/using-the-training-builder",
  image: "/media/teaching-vs-training.jpg",
  audience: "Professors, managers, and anyone who builds trainings",
  visibleToAll: false,
  summary:
    "Everything you need to build a training from a blank page to a published course — courses and lessons, the block palette, tagged resources, slides, quizzes, media, reorder, templates, import/export, and publishing. Build with the same care we ask Specialists to bring to the chair.",
  lessons: [
    {
      slug: "welcome-to-the-builder",
      title: "Welcome to the Training Building Center",
      minutes: 6,
      kicker: "Start here",
      body: [
        "This course teaches you to build training the way we teach Specialists to serve: prepared, present, and in service of the person on the other side. You do not need to write code or file a ticket. If you can write a good lesson on paper, you can build one here.",
        "Open the builder from the top navigation — the Build Trainings link — or from the Office. You will see it only if you have building access (Professors and managers do; the Chancellor can grant it to anyone).",
        "The builder has three levels, and this course walks each one: the course list, a single course, and the lesson editor where the real work happens.",
        "GFA · Open the builder in another tab and keep it beside this course as you go.",
        "Everything you build is saved to the college's database the moment you press Save. There is no separate publish-to-see step for edits — Publish is only for announcing a finished course (you will learn it last).",
      ],
      takeaway: "If you can write a lesson on paper, you can build it here. No code, no tickets.",
    },
    {
      slug: "anatomy-of-a-course",
      title: "Courses, lessons, and who can see them",
      minutes: 8,
      kicker: "The shape",
      body: [
        "A course (we also call it a track) is a titled path with an image, a short summary, an audience line, and a list of lessons. A lesson is one screen a learner reads and marks complete.",
        "When you create a course you choose Who can view: one of the four paths — New Hires, Specialist, MIT, Managers — or All (everyone). A path course appears only for people on that path; an All course appears for everyone signed in.",
        "A learner earns the course certificate when they complete every lesson in it. Keep a course focused: a handful of strong lessons beats twenty thin ones.",
        "The summary is the first thing a learner reads on the course card, so write it to a person, not to a syllabus. Say what they will be able to do, not what the course 'covers'.",
        "PRACTICE · Create a course called 'Sandbox', set Who can view to Managers, and give it a one-sentence summary you would be proud to show a new hire.",
      ],
      takeaway: "A course is a path with an audience. Keep it focused and write the summary to a person.",
    },
    {
      slug: "writing-a-lesson",
      title: "Writing a lesson with the block palette",
      minutes: 10,
      kicker: "The craft",
      body: [
        "Inside a course, add a lesson and give it a title, an estimated minute count, and an optional kicker (the small label above the title). Then write the body.",
        "The body is built from blocks. A paragraph block is ordinary prose — one idea per paragraph, a blank line between them. Most of a good lesson is well-written paragraphs.",
        "The Takeaway is its own field, not a body block. It is the one sentence a learner should carry onto the floor. Every lesson should have one, and it should be sayable out loud.",
        "Write the way we serve: listen first. Open with the situation the learner is actually in, then give them the move. If you leave them only knowing something, you failed; if you leave them able to do something tomorrow, you did the job.",
        "Use the live preview beside the editor. It renders exactly what the learner sees, so you never guess.",
      ],
      takeaway: "One idea per paragraph. Every lesson earns its single, sayable takeaway.",
    },
    {
      slug: "tagged-lines-and-links",
      title: "Tagged lines: videos, GFAs, roleplays, and links",
      minutes: 9,
      kicker: "Resources",
      body: [
        "Some lines are not prose — they point at a thing to do. Start such a line with a tag and the builder turns it into a labelled resource line for the learner.",
        "VIDEO · A film to watch — paste the link and it becomes clickable.",
        "GFA · A Guided Field Activity the learner does on the floor.",
        "ROLEPLAY · A scenario to run with a partner before moving on.",
        "SOLUTION · A worked answer you reveal after they try.",
        "A tagged line with no link attached still shows as a labelled step — it just is not clickable yet. Attach a destination in the Links panel; only https:// and http:// links are accepted, for safety.",
        "Links are matched to a line by the tag plus its first few words, not by position — so you can reorder and edit around a line without knocking its link loose.",
      ],
      takeaway: "Tag a line to make it a resource step. Attach the link in the Links panel; only real web links are allowed.",
    },
    {
      slug: "building-slides",
      title: "Building a slide deck",
      minutes: 10,
      kicker: "On screen",
      body: [
        "A lesson can carry a slide carousel that appears above the body. Slides are for the moments a picture, a contrast, or a numbered sequence beats a paragraph.",
        "Each slide has a title and one or more blocks: a paragraph, a quote, a 'say-this' line, a list (with a tone — do, never, or plain), numbered steps, lettered cards, a two-column pair, or an image from your uploads.",
        "Keep a slide to one idea. If you are writing a paragraph of six lines on a slide, it belongs in the body instead.",
        "The deck you see above this lesson was built with the very editor you are learning — nothing hard-coded. That is the standard: if the course can teach it, the course can be built with it.",
        "PRACTICE · Add a two-slide deck to your Sandbox lesson: a title slide and a slide with a three-item 'do' list.",
      ],
      takeaway: "Slides are for pictures, contrasts, and sequences. One idea per slide.",
      slides: [
        {
          n: 1,
          kicker: "Slide editor",
          title: "Slides carry the moments prose can't",
          subtitle: "One idea per slide",
          blocks: [
            { kind: "p", text: "A slide earns its place when a picture, a contrast, or a sequence lands harder than a paragraph." },
            { kind: "say", label: "Say", text: "\"Watch what changes when the arch is supported.\"" },
          ],
        },
        {
          n: 2,
          kicker: "Blocks",
          title: "What a slide can hold",
          blocks: [
            {
              kind: "list",
              title: "Build with",
              tone: "do",
              items: [
                "Paragraph, quote, and say-this lines",
                "Lists, numbered steps, and lettered cards",
                "Two-column pairs and uploaded images",
              ],
            },
            {
              kind: "list",
              title: "Avoid",
              tone: "never",
              items: ["Six lines of prose on one slide", "A slide with no single point"],
            },
          ],
        },
      ],
    },
    {
      slug: "quizzes-and-checkins",
      title: "Quizzes and check-ins",
      minutes: 7,
      kicker: "Understanding",
      body: [
        "A quiz here is a check-in, not a test with a score. It is how a learner shows they can put the lesson into their own words, and how the office sees who is ready.",
        "Build a quiz from the lesson editor: give it a short intro and a few questions. A question can be short answer, long answer, or multiple choice.",
        "Quizzes attach to a lesson by the lesson's slug, so keep slugs distinct and meaningful. Ask questions that need judgement, not recall — 'What would you say to a Client who…' beats 'List the four steps.'",
        "Responses land in the Office inbox for a manager to read and reply to. Nobody is graded; people are coached.",
      ],
      takeaway: "Quizzes are coaching check-ins, not scored tests. Ask for judgement, not recall.",
    },
    {
      slug: "media-images-uploads",
      title: "Images and uploads",
      minutes: 6,
      kicker: "Assets",
      body: [
        "Course cards, slide images, and lesson art come from the media library. Upload a PNG, JPEG, GIF, or WebP (under 1.5 MB) and the builder stores it and hands you back a path you can use anywhere images are accepted.",
        "Reuse what is already there before uploading a near-duplicate — the picker shows the whole library. Fewer, better images keep the campus feeling like one place.",
        "Every image needs alt text that says what the image shows. A learner using a screen reader is still a learner in the chair.",
      ],
      takeaway: "Upload once, reuse often, and always write real alt text.",
    },
    {
      slug: "organize-reorder-archive",
      title: "Reorder, duplicate, archive — and delete carefully",
      minutes: 7,
      kicker: "Housekeeping",
      body: [
        "Drag or use the move controls to reorder courses in the list and lessons within a course. Order is the order learners walk it, so put the ground floor first.",
        "Duplicate a course or a lesson when the next one is a variation on the last — it copies the body, slides, and resource links so you start from something real. A duplicated course starts archived, as a safe draft.",
        "Archive hides a course from learners without destroying it; restore brings it back exactly as it was. Reach for archive, not delete, whenever you might want it again.",
        "Delete is permanent and removes a course and all its lessons. Use it only for true mistakes, never to 'clean up' something you might miss.",
      ],
      takeaway: "Reorder for the learner's walk. Archive to hide, delete only for real mistakes.",
    },
    {
      slug: "templates-import-export",
      title: "Templates, import, and export",
      minutes: 6,
      kicker: "Speed",
      body: [
        "Starting from a blank page is the hardest part, so the builder offers starter templates — a proven shape like Concept → Practice → Roleplay you can fill in and make your own.",
        "Export a course to a file to back it up, hand it to another Professor, or move it between environments. The file carries the course, its lessons, slides, and links.",
        "Import a course file to bring it in as a new archived draft. Review it, then publish when it is ready. Importing never overwrites an existing course — it always creates a new one.",
      ],
      takeaway: "Templates beat a blank page. Export to share or back up; import lands as a safe draft.",
    },
    {
      slug: "lint-publish-notify",
      title: "The pre-flight check, then publish",
      minutes: 8,
      kicker: "Ship it",
      body: [
        "Before you announce a course, run the builder's pre-flight check. It flags the small misses that make a course feel unfinished: an empty lesson, a missing takeaway, a tagged line with no link attached, a slide with an empty block, or two lessons sharing a slug.",
        "Fix what it finds. A course that teaches care should model it.",
        "When the course is ready, Publish it. Publishing makes an archived course live and sends a notice to the team that a new training is available, honoring each person's notification settings.",
        "Publish is for a finished course, not for every edit — ordinary edits are live the moment you save. Announce once, when it is genuinely ready for the floor.",
        "PRACTICE · Run the pre-flight check on your Sandbox course, clear every item, then delete the Sandbox course when you are done exploring.",
      ],
      takeaway: "Pre-flight, fix, then publish once — publishing announces a finished course, not each edit.",
    },
    {
      slug: "build-like-we-serve",
      title: "Build the way we serve",
      minutes: 5,
      kicker: "The standard",
      body: [
        "Teaching is what we do to others; training is what we do with others. A course that only tells is a lecture hall. Build practice, observation, and a real next action into every path.",
        "Write to the person who will read it at the end of a long shift. Short paragraphs. One takeaway. A resource they can actually reach. A quiz that makes them think, not recite.",
        "You are not filling a catalog. You are shaping how a Specialist shows up for the next Client who sits down across from them. Build like it matters, because it does.",
      ],
      takeaway: "Train with people, not at them. Build every course like the next Client is counting on it.",
    },
    {
      slug: "rich-pages-video-graded-quizzes",
      title: "Rich pages, video, and graded quizzes",
      minutes: 8,
      kicker: "The full kit",
      body: [
        "Lesson pages take simple formatting. In a paragraph, wrap words in **double stars** for bold, *single stars* for italic, start a line with # for a heading or - for a bullet, and write [link text](https://example.com) for a link.",
        "Add a picture inside the page with ![a short caption](/media/your-image.png) — upload it first from the image picker, then paste the path.",
        "VIDEO · Add a VIDEO line, attach a YouTube or Vimeo link, and it plays right on the page — no leaving the lesson.",
        "Quizzes can be simple check-ins (the office reads the answers) or graded. Turn on 'Graded quiz' to set a pass mark and mark the correct answer on each multiple-choice and short-answer question.",
        "Tick 'Must pass to complete the lesson' when a learner should not move on until they pass. Long-answer questions stay for the office to read and don't count toward the score.",
        "PRACTICE · Add a graded 3-question quiz to a lesson, set the pass mark to 80%, and take it yourself as a test.",
      ],
      takeaway: "Format the page, drop in a video, and grade what matters — all without leaving the builder.",
    },
  ],
};
