import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Human-readable message from an unknown thrown value.
 *
 * Server functions here throw plain `Error`s carrying operator-facing text
 * ("Forbidden", "Links must start with https://"), so surfacing `.message` is
 * the useful behaviour. Falls back to a caller-supplied default.
 */
export function errorMessage(
  err: unknown,
  fallback = "Something went wrong. Please try again.",
): string {
  if (err instanceof Error && err.message) return err.message;
  if (typeof err === "string" && err) return err;
  return fallback;
}
