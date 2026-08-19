# Waterman College remediation record

This package addresses the launch blockers and engineering defects identified in
`Waterman-College-Final-Report.md`. It does not invent missing training media or
make business-policy decisions that require Waterman leadership.

## Launch blockers resolved

- The Vercel production build and the local Node production preview both build
  and serve successfully.
- Provider dependencies use stable primitive user ids, eliminating the
  signed-in request/render loop.
- No Chancellor or office password is embedded in source, scripts, or docs.
  Chancellor provisioning is one-time, bearer-token protected, rate-limited,
  and forces a password change on first sign-in.
- Built-in RBAC roles seed in migration `0010_production_hardening.sql` and are
  no longer overwritten on reads.
- Public catalog reads contain marketing copy and course metadata only. Lesson
  bodies require an approved account and are filtered on the server by RBAC
  permissions and explicit assignments.

## Security and data integrity

- Directory role changes validate the requested role and the actor's assignable
  role ceiling. Pending accounts cannot read staff PII, and ordinary approved
  users receive a restricted directory projection.
- Runtime schema DDL was removed from access, RBAC, CMS, quizzes, directory, and
  trainer-note request paths. The schema, constraints, and query indexes now
  live in migrations.
- Usernames and quiz submissions have database uniqueness constraints; quiz
  submissions use an upsert.
- Locked RBAC roles are checked before changes, and reassignment/deletion is
  transactional.
- Permission JSON is parsed defensively. Audit entries resolve the actual actor
  from the authenticated user id.
- User removal is transactional and cleans sessions, profiles, progress,
  quizzes, notes, assignments, unlocks, and password-reset requests.
- Weekly digest membership, role scoping, no-progress users, query errors, and
  America/Chicago date comparisons were corrected.
- List queries are bounded, organisation queries are scoped to visible ids, and
  progress statistics avoid repeatedly rebuilding completion sets.
- Production migrations fail closed when required, use timeouts and an advisory
  lock, and run as an explicit release step after a successful build.
- Executable platform extensions are disabled by default. External Google Fonts
  were removed.
- The server emits CSP, frame, MIME-sniffing, referrer, permissions, and HTTPS
  transport headers. The preview host bridge is development-only.
- Protocol-relative install links no longer produce an open redirect. Production
  error pages do not expose raw internal exceptions.
- Uploaded images are size-limited, base64-validated, verified by magic bytes,
  restricted to PNG/JPEG/GIF/WebP, assigned UUIDs, served from a dedicated
  endpoint, capped in list responses, and deletable.
- Production refuses the transient PGLite fallback without the explicit local
  preview wrapper. Shared and deployed environments require `DATABASE_URL`.

## Reliability and operator workflows

- Directory, team, accounts, catalog, quizzes, and office actions now surface
  failures instead of showing an endless skeleton or a false empty state.
  Critical list screens include retry controls.
- Promise rejection handling and user-facing toasts were added to destructive
  and mutating actions in both office experiences.
- Password-reset requests are non-enumerating and rate-limited. The training
  office can issue a temporary password, all sessions are revoked, and the user
  must choose a new 12+ character password after sign-in.
- Account-creation forms retain entered values when creation fails.
- The manager office-unlock expression, Chancellor user-role preservation, and
  directory placement precedence bugs were fixed.
- CMS onboarding replacement is transactional. Store deletion and renaming,
  course deletion, RBAC deletion, and account deletion now preserve related-data
  integrity.
- Role, lesson, track, page, site, quiz, media, account, directory, and trainer
  note inputs are validated and length-bounded.

## UI and correctness

- Slide decks, trainer questions, directory cards, team course selection, and
  other prop-derived state now reset or resynchronise at the correct boundary.
- Empty courses no longer display as complete; completion counts use live,
  validated lessons and quizzes.
- Lesson progress keys are checked against an accessible live lesson before a
  write. Onboarding totals come from the catalog rather than hardcoded values.
- Training list markup, table-row interaction, question ids, and React keys were
  corrected for accessibility and rendering stability.
- Vault audio/timers release resources on unmount and reuse/resume audio
  contexts correctly.
- All editable home and How-it-works fields now render publicly.
- Desktop navigation uses a wider shell, compact non-wrapping labels, and a
  breakpoint that avoids the reported 1440px collision. The illegible footer
  bitmap is replaced with readable text.
- A branded, readable plaque covers the malformed copy baked into the vault
  raster without changing the door hit targets.
- Lesson duration is labelled as a lesson rather than a read when it includes
  external activities.

## Maintainability and operations

- Added `.env.example`, deployment/provisioning documentation, an explicit
  content-model explanation, GitHub Actions CI, and production run instructions.
- Removed the unused multiplayer client for the nonexistent `/api/rtc` route.
- Removed unused direct production dependencies and pruned unreachable lockfile
  entries.
- Added regression checks for stable providers, request-path DDL, credential
  removal, and public/authenticated catalog separation.
- `sideEffects` now names the database bootstrap module instead of declaring the
  entire package side-effect free.

## Verification performed

| Check | Result |
|---|---|
| `tsc --noEmit` | Pass |
| ESLint | Pass, zero warnings |
| Node test suite | 47/47 pass |
| Vercel/Nitro production build | Pass |
| Node-server production build | Pass |
| Built preview `GET /` | HTTP 200 |
| Built preview `/forgot-password` | HTTP 200 |
| Protocol-relative install URL | HTTP 200 with no external redirect |
| Security headers on built preview | Present |
| PGLite preview bootstrap | Pass with copied runtime assets |

## Deliberate product decisions still open

These items cannot be completed safely from the report alone:

1. The onboarding plan names external `VIDEO`, `GFA`, and `FORM` activities but
   provides no licensed files or destination URLs. The UI now presents them as
   activities; the training owner must supply the actual media and access rules.
2. Practice games intentionally retain results in the browser. Sending game
   scores to the LMS ledger needs a scoring, privacy, and retention policy.
3. `/admin` remains the day-to-day training office while `/chancellor` remains a
   separately branded, super-admin-only governance surface. Consolidation is a
   workflow/design decision, not a safe mechanical refactor.
4. Database-backed media is now safe and bounded for a pilot. A large rollout
   should put original uploads in managed object storage with lifecycle and CDN
   policies.
5. Nitro is still a pre-release runtime version inherited by the project.
   Promote a stable version only after its deployment target and TanStack Start
   compatibility are verified together.

Do not provision real employees until production environment variables are set,
migrations have succeeded, the initial Chancellor password has been rotated,
and the training owner has reviewed every external activity.
