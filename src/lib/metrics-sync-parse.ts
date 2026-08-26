import type { MetricKey, MetricValues } from "@/lib/metrics";

export type ParsedMetricRow = {
  label: string;
  values: MetricValues;
  present: MetricKey[];
};

export type SyncMatch = {
  label: string;
  subjectType: "store" | "person" | "skip";
  subjectId: string | null;
  subjectName: string | null;
  reason: string;
  values: MetricValues;
  present: MetricKey[];
};

const EMPTY: MetricValues = {
  nsnu: null,
  conversion: null,
  demoRate: null,
  demoClose: null,
  archSupports: null,
  demoTicket: null,
};

const SKIP_LABELS = /^(totals?:?|period\s*summary|week\s*\d|goal|sales|difference|should have made|over or under)/i;

export function parseNumberCell(raw: string): number | null {
  const s = String(raw ?? "")
    .replace(/\u00a0/g, " ")
    .trim();
  if (!s || s === "—" || s === "-" || s === "#N/A") return null;
  const m = s.replace(/[$,\s]/g, "").match(/-?\d+(?:\.\d+)?/);
  if (!m) return null;
  const n = Number(m[0]);
  return Number.isFinite(n) ? Math.round(n * 100) / 100 : null;
}

export function classifyHeader(raw: string): MetricKey | "name" | "ignore" {
  const h = String(raw ?? "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
  if (!h) return "ignore";
  if (/^(store|location|specialist|employee|name|associate)$/.test(h) || h === "period summary") return "name";
  if (h.includes("nsnu")) return "nsnu";
  if (h.includes("demo close") || h.includes("demo-close") || (h.includes("close %") && h.includes("demo"))) return "demoClose";
  if (/(^|\s)demo(\s|%|$)/.test(h) && !h.includes("ticket") && !h.includes("close")) return "demoRate";
  if (h.includes("conversion") || h === "conv %" || h === "conv%") return "conversion";
  if (h.includes("arch support") || h === "spt" || h.includes("pairs / demo") || h.includes("supports per")) return "archSupports";
  if (h.includes("ticket")) return "demoTicket";
  return "ignore";
}

function splitDelimitedLine(line: string, delim: string): string[] {
  if (delim === "\t") return line.split("\t").map((c) => c.trim());
  const out: string[] = [];
  let cur = "";
  let q = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]!;
    if (ch === '"') {
      if (q && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else q = !q;
      continue;
    }
    if (ch === delim && !q) {
      out.push(cur.trim());
      cur = "";
      continue;
    }
    cur += ch;
  }
  out.push(cur.trim());
  return out;
}

function detectDelim(text: string): string {
  const sample = text.slice(0, 800);
  const tabs = (sample.match(/\t/g) || []).length;
  const commas = (sample.match(/,/g) || []).length;
  return tabs >= 3 && tabs >= commas / 4 ? "\t" : ",";
}

export function parseMetricsPaste(text: string): {
  rows: ParsedMetricRow[];
  warnings: string[];
  guessedPeriod: number | null;
} {
  const warnings: string[] = [];
  const raw = String(text ?? "").replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  const periodMatch = raw.match(/period\s+(\d{1,2})\b/i);
  const guessedPeriod = periodMatch ? Number(periodMatch[1]) : null;
  const delim = detectDelim(raw);
  const lines = raw.split("\n").map((l) => l.trimEnd());
  let headers: Array<MetricKey | "name" | "ignore"> = [];
  let nameCol = 0;
  const rows: ParsedMetricRow[] = [];
  const seen = new Set<string>();

  for (const line of lines) {
    if (!line.trim()) continue;
    const cells = splitDelimitedLine(line, delim);
    if (cells.every((c) => !c)) continue;
    const classified = cells.map(classifyHeader);
    const metricHits = classified.filter((c) => c !== "ignore" && c !== "name").length;
    if (metricHits >= 2) {
      headers = classified;
      const ni = classified.indexOf("name");
      nameCol = ni >= 0 ? ni : 0;
      continue;
    }
    if (!headers.length) continue;
    const label = (cells[nameCol] || cells[0] || "").replace(/\s+/g, " ").trim();
    if (!label || SKIP_LABELS.test(label)) continue;
    const key = normName(label);
    if (key && seen.has(key)) continue;
    if (key) seen.add(key);
    const values = { ...EMPTY };
    const present: MetricKey[] = [];
    headers.forEach((kind, i) => {
      if (kind === "ignore" || kind === "name") return;
      const n = parseNumberCell(cells[i] ?? "");
      if (n == null) return;
      values[kind] = n;
      if (!present.includes(kind)) present.push(kind);
    });
    if (!present.length) continue;
    rows.push({ label, values, present });
  }

  if (!headers.length) warnings.push("Could not find a header row with NSNU / Demo / Close.");
  if (!rows.length) warnings.push("No store or specialist rows found.");
  return {
    rows,
    warnings,
    guessedPeriod: guessedPeriod && guessedPeriod >= 1 && guessedPeriod <= 13 ? guessedPeriod : null,
  };
}

export function normName(s: string): string {
  return s
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\b(the|store|good feet|goodfeet|tx|texas)\b/g, "")
    .replace(/\bfw\b/g, "fort worth")
    .replace(/\bc station\b/g, "college station")
    .replace(/\bcstation\b/g, "college station")
    .replace(/\balliance fw\b/g, "alliance")
    .replace(/\balliance fort worth\b/g, "alliance")
    .replace(/\s+/g, " ")
    .trim();
}

function namesClose(a: string, b: string): boolean {
  if (!a || !b) return false;
  if (a === b) return true;
  if (a.includes(b) || b.includes(a)) return a.length >= 4 && b.length >= 4;
  return false;
}

export function matchSyncRows(
  rows: ParsedMetricRow[],
  stores: { id: string; name: string }[],
  people: { id: string; name: string; email: string | null }[],
): SyncMatch[] {
  const storeNorm = stores.map((s) => ({ ...s, n: normName(s.name) }));
  const peopleNorm = people.map((p) => ({
    ...p,
    n: normName(p.name),
    e: (p.email || "").trim().toLowerCase(),
  }));

  return rows.map((row) => {
    const n = normName(row.label);
    const email = row.label.includes("@") ? row.label.trim().toLowerCase() : "";
    const storeHits = storeNorm.filter((s) => namesClose(s.n, n));
    if (storeHits.length === 1) {
      return {
        label: row.label,
        subjectType: "store" as const,
        subjectId: storeHits[0]!.id,
        subjectName: storeHits[0]!.name,
        reason: `Store · ${storeHits[0]!.name}`,
        values: row.values,
        present: row.present,
      };
    }
    const personHits = peopleNorm.filter((p) => (email && p.e === email) || namesClose(p.n, n));
    if (personHits.length === 1) {
      return {
        label: row.label,
        subjectType: "person" as const,
        subjectId: personHits[0]!.id,
        subjectName: personHits[0]!.name,
        reason: `Locker · ${personHits[0]!.name}`,
        values: row.values,
        present: row.present,
      };
    }
    return {
      label: row.label,
      subjectType: "skip" as const,
      subjectId: null,
      subjectName: null,
      reason: storeHits.length > 1 || personHits.length > 1 ? "Name matched more than one record" : "No matching store or locker",
      values: row.values,
      present: row.present,
    };
  });
}
