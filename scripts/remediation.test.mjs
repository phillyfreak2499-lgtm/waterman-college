import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path) => readFileSync(new URL("../" + path, import.meta.url), "utf8");

test("providers depend on stable primitive user ids", () => {
  const access = read("src/components/access-provider.tsx");
  const progress = read("src/components/progress-provider.tsx");
  assert.match(access, /const userId = user\?\.id \?\? null/);
  assert.match(access, /\[userId\]/);
  assert.match(progress, /const userId = user\?\.id \?\? null/);
  assert.match(progress, /\[userId, isPending, refresh\]/);
});

test("request-path modules contain no schema DDL", () => {
  for (const path of [
    "src/lib/access.ts",
    "src/lib/rbac.ts",
    "src/lib/cms.ts",
    "src/lib/quizzes.ts",
    "src/lib/directory.ts",
    "src/lib/ask-trainer.ts",
  ]) {
    assert.doesNotMatch(read(path), /create table|alter table/i, path);
  }
});

test("published credentials and automatic bootstrap are absent", () => {
  for (const path of ["src/lib/rbac.ts", "src/lib/admin-secret.server.ts", "README.md"]) {
    const source = read(path);
    assert.doesNotMatch(source, /Pain Free|WWMHD/);
  }
  assert.doesNotMatch(read("src/routes/login.tsx"), /bootstrapChancellor/);
});

test("catalog has separate public and authenticated endpoints", () => {
  const source = read("src/lib/cms.ts");
  assert.match(source, /getPublicCatalog/);
  assert.match(source, /getCatalog[\s\S]+authMiddleware/);
  assert.match(source, /tracks: catalog\.tracks\.map\(\(track\) => \(\{ \.\.\.track, lessons: \[\] \}\)\)/);
  assert.match(source, /profile\.allowedTabs\.includes\(track\.role\)/);
});
