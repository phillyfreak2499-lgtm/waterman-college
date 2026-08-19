#!/usr/bin/env node
import { mkdirSync, writeFileSync } from "node:fs";
import { chromium } from "playwright";

const BASE = "http://127.0.0.1:8080";
const OUT = "/workspace/screenshots";
mkdirSync(OUT, { recursive: true });

const stamp = Date.now();
const HIRE = { name: "Riley Hire", email: `riley.${stamp}@waterman.test`, password: "College30!Secure" };
const OFFICE = { name: "Office Admin", email: `office.${stamp}@waterman.test`, password: "College30!Secure" };
const officePassword = process.env.ADMIN_UNLOCK_PASSWORD;
if (!officePassword || officePassword.length < 12) {
  throw new Error("ADMIN_UNLOCK_PASSWORD must be set for this verification script.");
}

const notes = [];
function log(msg) {
  notes.push(msg);
  console.log(msg);
}

async function go(page, path) {
  await page.goto(`${BASE}${path}`, { waitUntil: "domcontentloaded", timeout: 30000 });
  await page.waitForTimeout(600);
}

async function signup(page, { name, email, password }) {
  await go(page, "/login");
  await page.getByRole("button", { name: /create an account/i }).click();
  await page.getByLabel("Full name").fill(name);
  await page.getByLabel("Work email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: /create account/i }).click();
  await page.waitForURL(/\/(training|$)/, { timeout: 20000 });
  await page.waitForTimeout(800);
}

async function noOverflow(page, label) {
  const overflow = await page.evaluate(() => {
    const doc = document.documentElement;
    return {
      scrollWidth: doc.scrollWidth,
      clientWidth: doc.clientWidth,
    };
  });
  if (overflow.scrollWidth > overflow.clientWidth + 2) {
    log(`OVERFLOW ${label}: ${overflow.scrollWidth} > ${overflow.clientWidth}`);
    return false;
  }
  log(`no-overflow ${label}: ${overflow.clientWidth}`);
  return true;
}

const browser = await chromium.launch({
  headless: true,
  args: ["--no-sandbox", "--disable-dev-shm-usage"],
});

const officeCtx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
const hireCtx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
const office = await officeCtx.newPage();
const hire = await hireCtx.newPage();

try {
  office.on("console", (msg) => {
    if (msg.type() === "error") log("office console: " + msg.text());
  });
  hire.on("console", (msg) => {
    if (msg.type() === "error") log("hire console: " + msg.text());
  });

  log("signup office");
  await signup(office, OFFICE);
  await go(office, "/admin");
  await office.getByLabel("Office password").fill(officePassword);
  await office.getByRole("button", { name: /unlock/i }).click();
  await office.getByRole("heading", { name: "Admin" }).waitFor({ timeout: 15000 });
  await office.screenshot({ path: `${OUT}/admin-inbox.png`, fullPage: true });
  log("office unlocked, inbox visible: " + (await office.getByRole("heading", { name: "Inbox" }).count()));

  log("signup hire");
  await signup(hire, HIRE);
  await hire.screenshot({ path: `${OUT}/hire-pending.png`, fullPage: true });

  await office.getByRole("button", { name: /^People$/ }).click();
  await office.getByText(HIRE.email).waitFor({ timeout: 15000 });
  const row = office.locator("li").filter({ hasText: HIRE.email });
  await row.locator("select").first().selectOption("new-hires");
  await row.getByRole("button", { name: "Save" }).click();
  await office.getByText(/is now New Hire/i).waitFor({ timeout: 10000 });
  log("assigned hire as new-hires");

  await go(hire, "/training/onboarding");
  await hire.getByRole("heading", { name: "30-Day Onboarding" }).waitFor({ timeout: 15000 });
  const week1 = await hire.getByRole("heading", { name: "Learning Center" }).count();
  const week2 = await hire.getByRole("heading", { name: "In-store development" }).count();
  const week4 = await hire.getByRole("heading", { name: "Independently" }).count();
  const day1 = await hire.getByText("Intro and product knowledge").count();
  const day20 = await hire.getByText("Saturday — close the 30 days").count();
  const badges = await hire.locator("a span.font-display, a span.grid").allInnerTexts();
  log(`weeks: ${week1}/${week2}/${week4} day1=${day1} day20=${day20} badges=${badges.filter((t) => /^\d{2}$/.test(t)).join(",")}`);
  await hire.screenshot({ path: `${OUT}/onboarding-weeks.png`, fullPage: true });
  await noOverflow(hire, "onboarding-1280");

  await hire.setViewportSize({ width: 390, height: 844 });
  await hire.screenshot({ path: `${OUT}/onboarding-mobile.png`, fullPage: true });
  await noOverflow(hire, "onboarding-390");
  await hire.setViewportSize({ width: 1280, height: 900 });

  await hire.getByRole("link", { name: /Intro and product knowledge/i }).click();
  await hire.getByRole("heading", { name: "Day 1 check-in" }).waitFor({ timeout: 15000 });
  const prompts = await hire.locator("label span").allInnerTexts();
  log("quiz prompts: " + prompts.filter(Boolean).slice(0, 6).join(" | "));
  const fields = hire.locator("textarea");
  await fields.nth(0).fill("The Waterman story and the three arches.");
  await fields.nth(1).fill("More time on the scanner.");
  await hire.locator("select").selectOption("Three");
  await fields.nth(2).fill("Strengthener, Maintainer, Relaxer");
  await hire.getByRole("button", { name: /send to the office/i }).click();
  await hire.getByText(/submitted/i).waitFor({ timeout: 10000 });
  await hire.screenshot({ path: `${OUT}/day-01-quiz.png`, fullPage: true });
  log("quiz submitted");

  await go(hire, "/quad");
  await hire.getByRole("heading", { name: "The Quad" }).waitFor({ timeout: 10000 });
  const games = await hire.getByRole("heading", { level: 2 }).allInnerTexts();
  log("quad games: " + games.join(", "));
  await hire.screenshot({ path: `${OUT}/quad.png`, fullPage: true });
  await go(hire, "/quad/fit-clue");
  await hire.getByRole("heading", { name: "Fit Clue", level: 1 }).waitFor({ timeout: 10000 });
  const frame = hire.locator('iframe[title="Fit Clue"]');
  await frame.waitFor({ state: "attached", timeout: 10000 });
  const frameSrc = await frame.getAttribute("src");
  log("fit-clue iframe: " + frameSrc);
  await hire.waitForTimeout(1500);
  await hire.screenshot({ path: `${OUT}/quad-fit-clue.png` });

  await office.getByRole("button", { name: /^Inbox$/ }).click();
  await office.getByRole("heading", { name: "Inbox" }).waitFor({ timeout: 10000 });
  await office.waitForTimeout(2000);
  const officeText = await office.locator("body").innerText();
  log("inbox page snippet: " + officeText.replace(/\s+/g, " ").slice(0, 800));
  await office.screenshot({ path: `${OUT}/admin-inbox-filled.png`, fullPage: true });
  const inboxItem = office.locator("ul li").filter({ hasText: /Day 1 check-in/i });
  await inboxItem.first().waitFor({ timeout: 10000 });
  await inboxItem.first().getByRole("button").first().click();
  await office.waitForTimeout(500);
  const expanded = await inboxItem.first().innerText();
  log("expanded item: " + expanded.replace(/\s+/g, " "));
  const body = (await office.locator("body").innerText()).toLowerCase();
  const hasPrompt = body.includes("how many arches are in the foot");
  const hasAnswer = body.includes("strengthener, maintainer, relaxer");
  const slugLeak = body.includes("how-many-arches-are-in-the-foot");
  log(`inbox prompt=${hasPrompt} answer=${hasAnswer} slugLeak=${slugLeak}`);
  await office.screenshot({ path: `${OUT}/admin-inbox-filled.png`, fullPage: true });

  const gameRes = await office.request.get(`${BASE}/games/fit-clue.html`);
  log("game http " + gameRes.status());

  writeFileSync(`${OUT}/verify-onboarding.json`, JSON.stringify({ notes, ok: hasPrompt && hasAnswer && !slugLeak && week1 && week4 && day20 }, null, 2));
  if (!hasPrompt || !hasAnswer || slugLeak || !week1 || !week4 || !day20) {
    process.exit(1);
  }
} catch (err) {
  console.error(err);
  await office.screenshot({ path: `${OUT}/office-error.png`, fullPage: true }).catch(() => {});
  await hire.screenshot({ path: `${OUT}/hire-error.png`, fullPage: true }).catch(() => {});
  writeFileSync(`${OUT}/verify-onboarding.json`, JSON.stringify({ notes, error: String(err?.stack || err) }, null, 2));
  process.exit(1);
} finally {
  await browser.close();
}
