import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/setup/chancellor")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { assertRateLimit } = await import("@/lib/rate-limit.server");
        const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
          request.headers.get("x-real-ip")?.trim() || "unknown";
        assertRateLimit("chancellor-setup", ip, { max: 5, windowMs: 15 * 60_000 });
        const authorization = request.headers.get("authorization") ?? "";
        const token = authorization.startsWith("Bearer ") ? authorization.slice(7).trim() : "";
        if (!token) return Response.json({ error: "Setup token required." }, { status: 401 });
        try {
          const { provisionChancellor } = await import("@/lib/rbac-provision.server");
          await provisionChancellor(token);
          return Response.json({ ok: true });
        } catch (error) {
          const message = error instanceof Error ? error.message : "Provisioning failed.";
          const status = /already provisioned/i.test(message) ? 409 : 403;
          return Response.json({ error: message }, { status });
        }
      },
    },
  },
});
