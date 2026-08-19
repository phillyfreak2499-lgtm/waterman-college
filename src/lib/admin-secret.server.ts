import { createHash, timingSafeEqual } from "node:crypto";

function adminPassword() {
  const value = process.env.ADMIN_UNLOCK_PASSWORD?.trim();
  if (!value || value.length < 12) {
    throw new Error("ADMIN_UNLOCK_PASSWORD must be configured with at least 12 characters.");
  }
  return value;
}

export function verifyAdminPassword(password: string) {
  const given = createHash("sha256").update(password ?? "").digest();
  const expected = createHash("sha256").update(adminPassword()).digest();
  return given.length === expected.length && timingSafeEqual(given, expected);
}
