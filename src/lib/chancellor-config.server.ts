import { createHash, timingSafeEqual } from "node:crypto";

function requiredEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} must be configured before provisioning the Chancellor.`);
  return value;
}

export function chancellorProvisioningConfig() {
  const username = requiredEnv("CHANCELLOR_USERNAME").toLowerCase();
  const password = requiredEnv("CHANCELLOR_INITIAL_PASSWORD");
  if (password.length < 12) {
    throw new Error("CHANCELLOR_INITIAL_PASSWORD must be at least 12 characters.");
  }
  return { username, password };
}

export function assertChancellorSetupToken(token: string) {
  const expected = createHash("sha256")
    .update(requiredEnv("CHANCELLOR_SETUP_TOKEN"))
    .digest();
  const received = createHash("sha256").update(token).digest();
  if (received.length !== expected.length || !timingSafeEqual(received, expected)) {
    throw new Error("Invalid setup token.");
  }
}

export function configuredChancellorUsername(): string | null {
  return process.env.CHANCELLOR_USERNAME?.trim().toLowerCase() || null;
}

