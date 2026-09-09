-- Peace of Mind 3 — visible to every signed-in position.
insert into cms_tracks (
  id, role, title, nav, image, audience, summary, sort_order, updated_at, visible_to_all, archived
) values (
  'peace-of-mind-3',
  'specialist',
  'Peace of Mind 3',
  'Peace of Mind 3',
  '/media/classroom-table.jpg',
  'Every position',
  'After the Maintainer walk. Before the Relaxer. Lifetime, Guided, and Guaranteed — a conversation the client can use. Official wearing guide in the hand. A nod is not understanding.',
  80,
  now(),
  true,
  false
)
on conflict (id) do update set
  title = excluded.title,
  nav = excluded.nav,
  audience = excluded.audience,
  summary = excluded.summary,
  visible_to_all = true,
  archived = false,
  updated_at = now();

insert into cms_lessons (id, track_id, slug, title, minutes, kicker, body, takeaway, sort_order) values
('peace-of-mind-3:start-here', 'peace-of-mind-3', 'start-here', 'Start here', 5, 'The standard',
'When: After the Maintainer walk. Before the Relaxer. Every client — not only when they look unsure.

The performance goal: explain the three points accurately, help the client use the wearing guide, check what they understood, and agree on the next step. A nod alone does not show understanding.

Lifetime is product coverage. Guided is the official wearing guide in their hand. Guaranteed is the written 90-day policy. Do not improvise.',
'A nod is not understanding. The client shows the starting plan and the stop line.', 0),
('peace-of-mind-3:what-do-you-know', 'peace-of-mind-3', 'what-do-you-know', 'What do you do next?', 5, 'Mental Aerobics',
'Choose the best next response. Then write the question or action.

L Lifetime. G Guided. Q Guaranteed. A Ask first. S Safety. R Sequence.

Ask first when the cue is ambiguous. Then respond to the concern they actually named.',
'Ask first when the cue is ambiguous.', 1),
('peace-of-mind-3:the-map', 'peace-of-mind-3', 'the-map', 'Put the guide to work', 12, 'The talk',
'Do not recite the paragraph. Do hit all three points. Then check what they understood.

Open: Before we try the Relaxer, let me explain the support you have behind you — Lifetime, Guided, and Guaranteed.

Official trifold in the hand before Guided words. Walk three columns. The chart is an example, not a deadline. Hand it. Then: Show me where you would look for your starting plan, and what would make you stop.

Pause. Let them answer. Do not pile on. Then — and only then — talk about the Relaxers.',
'Official trifold. Three columns. Hand it. Then check that they can show start and stop.', 2),
('peace-of-mind-3:practice-the-unexpected', 'peace-of-mind-3', 'practice-the-unexpected', 'Practice the unexpected', 14, 'Roleplays',
'Pairs. Two attempts each. 90 seconds for the core explanation, then handle the concern, check understanding, and agree on a next step.

Coach the missing point only. Card F is required — stop-use has to stick.

Critical errors: a guaranteed health outcome, materially wrong policy terms, or advice to continue through stop-use symptoms.',
'Coach the missing point only. Card F is required.', 3),
('peace-of-mind-3:settled-game', 'peace-of-mind-3', 'settled-game', 'SETTLED — Do not touch the Relaxer', 8, 'Game',
'Play the course game before you take this onto the floor. Fear Call first. Then build the talk in order.

Open SETTLED from The Quad or /games/settled-dont-touch-the-relaxer.html.

Paper before Guided words. Pointing at the Relaxer column on the card is allowed. Picking up the physical Relaxer is the trap.',
'Do not touch the Relaxer until they are settled.', 4),
('peace-of-mind-3:next-3-fittings', 'peace-of-mind-3', 'next-3-fittings', 'Next three fittings', 8, 'The habit',
'Classroom does not make this stick. The next three Maintainer walks do.

After every Maintainer walk, run the talk. Before Relaxer.

Pass: three live reflections + one recording + manager heard one client. A client choosing not to purchase is not a skill failure.',
'Pass the course on the floor. Not by opening the reading.', 5),
('peace-of-mind-3:manager-policy', 'peace-of-mind-3', 'manager-policy', 'Keep the promises precise', 8, 'Manager + policy',
'Show the written terms. Do not improvise an exception.

Satisfaction policy and limited lifetime warranty are different help processes. Refunds return to the original purchase store by day 90. Warranty is breaking, cracking, or splitting — the product — at a Good Feet store with the receipt.

Safety: discontinue use if pain, numbness, or irritation occurs. Specialists are not licensed healthcare providers.',
'Refundn,
 refund path and warranty path are not the same store trip.', 6)
on conflict (id) do update set
  title = excluded.title,
  minutes = excluded.minutes,
  kicker = excluded.kicker,
  body = excluded.body,
  takeaway = excluded.takeaway,
  sort_order = excluded.sort_order;

insert into cms_settings (key, value) values ('pom3_v1', '1')
on conflict (key) do nothing;
