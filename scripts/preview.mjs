// Local production preview only. Real deployments must provide DATABASE_URL.
process.env.ALLOW_PGLITE_PREVIEW = "true";
await import("../.output/server/index.mjs");
