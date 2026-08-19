#!/usr/bin/env node

const appUrl = process.env.APP_URL?.trim() || "http://localhost:8080";
const setupToken = process.env.CHANCELLOR_SETUP_TOKEN?.trim();

if (!setupToken) {
  console.error("CHANCELLOR_SETUP_TOKEN is required.");
  process.exit(1);
}

const response = await fetch(new URL("/api/setup/chancellor", appUrl), {
  method: "POST",
  headers: { authorization: `Bearer ${setupToken}` },
});
const body = await response.json().catch(() => ({}));
if (!response.ok) {
  console.error(body.error || `Provisioning failed (${response.status}).`);
  process.exit(1);
}
console.log("Chancellor provisioned. The initial password must be changed at first sign-in.");
