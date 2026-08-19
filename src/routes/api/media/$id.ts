import { createFileRoute } from "@tanstack/react-router";
import { getSql } from "@/lib/db";

export const Route = createFileRoute("/api/media/$id")({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const id = params.id;
        if (!/^[0-9a-f-]{36}$/i.test(id)) return new Response("Not found", { status: 404 });
        const sql = await getSql();
        const rows = await sql<{ mime: string; data: string }>`
          select mime, data from cms_media where id = ${id} limit 1
        `;
        if (!rows[0]) return new Response("Not found", { status: 404 });
        if (!["image/png", "image/jpeg", "image/gif", "image/webp"].includes(rows[0].mime)) {
          return new Response("Not found", { status: 404 });
        }
        const { Buffer } = await import("node:buffer");
        const payload = rows[0].data.includes(",") ? rows[0].data.slice(rows[0].data.indexOf(",") + 1) : rows[0].data;
        return new Response(Buffer.from(payload, "base64"), {
          headers: {
            "content-type": rows[0].mime,
            "cache-control": "public, max-age=31536000, immutable",
            "x-content-type-options": "nosniff",
          },
        });
      },
    },
  },
});
