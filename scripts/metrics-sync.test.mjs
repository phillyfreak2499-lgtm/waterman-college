import assert from "node:assert/strict";
import test from "node:test";
import {
  classifyHeader,
  matchSyncRows,
  normName,
  parseMetricsPaste,
  parseNumberCell,
} from "../src/lib/metrics-sync-parse.ts";

test("parses Tableau weekly check-in headers", () => {
  assert.equal(classifyHeader("NSNU\n$805+"), "nsnu");
  assert.equal(classifyHeader("Demo %\n75+"), "demoRate");
  assert.equal(classifyHeader("Demo Close %\n70+"), "demoClose");
  assert.equal(classifyHeader("3-Step %\n75+"), "ignore");
  assert.equal(parseNumberCell("$1,006.75"), 1006.75);
  assert.equal(parseNumberCell("70%"), 70);
});

test("period summary wins over weekly repeats", () => {
  const paste = `Period 11
Period Summary,Goal,Sales,NSNU $805+,Demo % 75+,Demo Close % 70+,3-Step %
Allen,$112000,$95340,$696.25,70%,59%,72%
Plano,$168000,$170171,$905.00,87%,61%,71%
Totals: ,$1214000,$1085380,$8207,783%,626%,720%
Week 1:,Goal,Sales,NSNU $805+,Demo % 75+,Demo Close % 70+
Allen,$28000,$26259,$796.00,84%,57%
Plano,$42000,$54603,$1011.00,90%,59%
`;
  const parsed = parseMetricsPaste(paste);
  assert.equal(parsed.guessedPeriod, 11);
  assert.equal(parsed.rows.length, 2);
  const allen = parsed.rows.find((r) => r.label === "Allen");
  assert.ok(allen);
  assert.equal(allen.values.nsnu, 696.25);
  assert.equal(allen.values.demoRate, 70);
  assert.equal(allen.values.demoClose, 59);
  assert.equal(allen.values.archSupports, null);
});

test("matches store aliases onto campus stores", () => {
  const parsed = parseMetricsPaste(`Store,NSNU,Demo %,Demo Close %
Alliance- FW,643,82,64
C Station,1092.25,77,68
Southlake,1006.75,84,74
`);
  const matches = matchSyncRows(parsed.rows, [
    { id: "alliance", name: "Alliance" },
    { id: "cstat", name: "College Station" },
    { id: "southlake", name: "Southlake" },
  ], []);
  assert.equal(matches.filter((m) => m.subjectType === "store").length, 3);
  assert.equal(matches.find((m) => m.label.startsWith("Alliance"))?.subjectId, "alliance");
  assert.equal(matches.find((m) => m.label.startsWith("C Station"))?.subjectId, "cstat");
});

test("normName folds Tableau store labels", () => {
  assert.equal(normName("Alliance- FW"), normName("Alliance"));
  assert.equal(normName("C Station"), "college station");
});
