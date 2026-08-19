# COGS — College of Getting Smarter

Private employee training campus for **Waterman Arch Supports** / The Good Feet Store.

The app includes account approval, role-based course access, progress, quizzes,
the directory, and the Chancellor’s Office. Authentication is local to the
college; there is no third-party sign-in.

## Requirements

- Node.js 20 or newer
- PostgreSQL for shared or production use

Without `DATABASE_URL`, local development uses an in-memory PGLite database.
That data is intentionally temporary and disappears when the process restarts.

## Local development

```bash
cp .env.example .env
npm ci
npm run dev
```

Open [http://localhost:8080](http://localhost:8080).

## Verification

```bash
npm run typecheck
npm run lint
npm test
npm run build
```

CI runs all four checks on every push and pull request.

To exercise the built server locally:

```bash
npm run build:preview
npm run preview
```

## Production configuration

Copy `.env.example` into the deployment platform and set strong, unique values.
Production requires at least:

- `DATABASE_URL` — PostgreSQL connection string
- `ADMIN_UNLOCK_PASSWORD` — training-office unlock, at least 12 characters
- `CHANCELLOR_USERNAME` — initial Chancellor username
- `CHANCELLOR_INITIAL_PASSWORD` — initial password, at least 12 characters
- `CHANCELLOR_SETUP_TOKEN` — one-time provisioning bearer token

Executable preview extensions are off by default. Leave
`ENABLE_GROK_EXTENSIONS=false` unless the deployment explicitly needs and trusts
that integration.

Run migrations as an explicit release step:

```bash
MIGRATIONS_REQUIRED=true npm run release
```

The release command builds successfully before it changes the database. The
migrator serializes concurrent deploys with a PostgreSQL advisory lock.

## Provision the Chancellor

There are no built-in credentials. After the app and database are running, set
`APP_URL` and the provisioning variables, then run:

```bash
npm run provision:chancellor
```

The setup endpoint is rate-limited and token-protected, allows only one
Chancellor, and forces the initial password to be changed at first sign-in.
Rotate or remove the setup token and initial password after provisioning.

Regular staff use **Create an account**, wait for approval, and then sign in.
Forgotten passwords create a non-enumerating request for the training office,
which issues a temporary password that must be changed at the next sign-in.

## Typography

The brand faces — **Cormorant Garamond** (display) and **Source Sans 3** (body) —
load from Google Fonts via `<link rel="preconnect">` + `<link rel="stylesheet">`
in `src/routes/__root.tsx`. This replaces the original render-blocking `@import`
inside `styles.css`, which serialised the CSS and font requests.

Both families declare a real system fallback in `src/styles.css`
(`Georgia`/`Segoe UI`), so if the font CDN is blocked or unreachable the site
still renders correctly in a compatible serif/sans — it only loses the brand
voice. The Content-Security-Policy in `server/middleware/grok-pwa.ts` allows
exactly two extra origins for this (`fonts.googleapis.com`,
`fonts.gstatic.com`) and nothing else.

**Recommended follow-up — self-host the fonts.** That removes the last
third-party request, lets the CSP return to `font-src 'self'`, and eliminates a
render dependency on an external host:

1. Download the two families (woff2) from a source you trust.
2. Put them in `public/fonts/`.
3. Add `@font-face` rules to `src/styles.css` with `font-display: swap`.
4. Delete the three font `<link>` entries from `src/routes/__root.tsx`.
5. Revert the CSP to `font-src 'self'` and
   `style-src 'self' 'unsafe-inline'`.

## Installable app and notifications

The campus ships as an installable PWA and can notify staff about approvals,
assignments and professor replies.

- `public/manifest.webmanifest`, `public/sw.js` and the `icon-*.png` set provide
  the install metadata and offline shell.
- `/install` explains adding the app to a phone home screen.
- `/notifications` is the in-app inbox and the place to turn browser push on.
- `src/lib/push.server.ts` signs Web Push messages. **VAPID keys are generated
  automatically on first use and stored in the `vapid_keys` table** (migration
  `0011_notifications.sql`) — there is no key material to configure or rotate by
  hand, and nothing to put in `.env`.

Push requires HTTPS, so it is inactive on plain-http local dev. Everything else
(the inbox, the install page, the offline shell) works locally.

## Lesson links

Lesson bodies contain tagged lines — `GFA · …`, `ROLEPLAY · …`, `SOLUTION · …`,
`VIDEO · …` — that name a resource. They used to render as inert brass labels,
so a Specialist had no way to reach the thing the line named.

**Office → Admin → Lesson links** lists every tagged line in the catalog (87 in
the current content) and lets you attach a destination three ways:

1. **Drag a link onto the row** from another browser tab or the address bar.
2. **Paste** a URL onto a focused row.
3. **Type** it into the field and press Save.

Dragging is the fast path but is an *enhancement only* — the text field is
always present and fully sufficient, so the feature works for keyboard and touch
users (WCAG 2.2 SC 2.5.7, Dragging Movements).

Once a link is attached, the lesson line becomes a real link for staff, opening
in a new tab with an external-link icon. Untagged and unlinked lines are
unchanged.

**Only `http:` and `https:` destinations are accepted.** `normalizeResourceUrl()`
in `src/lib/lesson-links.ts` parses and re-serialises the URL server-side, so
`javascript:`, `data:` and protocol-relative `//host` values are rejected — these
are written into an `href` staff will click, and would otherwise be a stored-XSS
and off-site-redirect vector.

Links are keyed by `lessonLineKey()` — the tag plus the first few normalised
words of the line — **not** by line position, so editing surrounding paragraphs
in the CMS cannot silently move a link onto the wrong line.

## Security headers

`server/middleware/security-headers.ts` sets the Content-Security-Policy plus
`referrer-policy`, `x-content-type-options`, `x-frame-options`,
`permissions-policy` and (over HTTPS) `strict-transport-security`.

It is a **separate** middleware from `grok-pwa.ts` on purpose. An earlier
revision folded these headers into the PWA middleware and they were silently
lost the next time that file was replaced. Keeping transport security in its own
file means a PWA change cannot take the headers with it.

The policy allows exactly two external origins, both for the brand fonts. Self-
hosting the fonts (see Typography) lets `style-src` and `font-src` drop back to
`'self'`.

## Project layout

```text
src/routes/          Pages and API handlers
src/components/      Campus, training, and office UI
src/lib/             Accounts, RBAC, progress, quizzes, CMS
migrations/          The only database schema source
public/media/        Bundled imagery and sound
public/slides/       Source slide decks
public/games/        Self-contained practice games
scripts/             Migration, provisioning, and regression checks
```

## Content and operational notes

- Static TypeScript content seeds the `cms_*` tables once. After that, the
  database copy is authoritative and office edits are preserved.
- Public catalog responses contain course metadata only; lesson bodies require
  an approved authenticated account and are filtered server-side by role and
  assignment.
- Uploaded images are verified as PNG, JPEG, GIF, or WebP and served through a
  dedicated media endpoint. For large-scale use, moving them to object storage
  remains advisable.
- The onboarding source still contains external `VIDEO`, `GFA`, and `FORM`
  references. Those need licensed destination URLs or embedded media supplied by
  the training team; the code cannot infer that source material.
- The two office experiences and whether browser-only game scores should enter
  the LMS ledger are product decisions, not safe automated changes.

See `REMEDIATION.md` for the completed fixes, verification commands, and the
remaining product decisions.
