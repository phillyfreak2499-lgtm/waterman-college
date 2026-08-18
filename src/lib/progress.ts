import { createServerFn } from "@tanstack/react-start";
import { getSql } from "@/lib/db";
import { authMiddleware } from "@/lib/auth/middleware";

export const listProgress = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const sql = await getSql();
    const rows = await sql<{ lesson_key: string }>`
      select lesson_key from lesson_progress where user_id = ${context.userId}
    `;
    return rows.map((r) => r.lesson_key);
  });

export const markComplete = createServerFn({ method: "POST" })
  .validator((lessonKey: string) => lessonKey.trim())
  .middleware([authMiddleware])
  .handler(async ({ context, data: lessonKey }) => {
    if (!lessonKey) return;
    const sql = await getSql();
    await sql`
      insert into lesson_progress (user_id, lesson_key)
      values (${context.userId}, ${lessonKey})
      on conflict (user_id, lesson_key) do nothing
    `;
  });
