# Waterman College

Private employee training campus for **Waterman Arch Supports** (wcogs.com).

This is a rebuild of the WordPress site that had become locked behind Jetpack SSO. The original All-in-One WP Migration backup is **not** in this repo — GitHub rejects files over 100 MB, and the 638 MB `.wpress` archive is mostly WordPress.com plugin code, not course content.

## What this app is

- Public home, how-it-works, and sign-in
- Signed-in campus: Client Experience, Flow, Product, Culture, 6-week Onboarding, Management Development, MIT
- Lesson progress saved per user
- Be Remarkable weekly tips
- Email/password plus Google / X sign-in

## Run locally

```bash
npm install
npm run dev
```

App listens on port 8080.

## Content source

Copy and photography were recovered from the April 2026 Waterman College WordPress export (pages, uploads, and theme). Course lessons expand the original outlines so the campus is usable on day one.
