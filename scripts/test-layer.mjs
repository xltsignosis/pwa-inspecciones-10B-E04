import { mkdirSync, readdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { spawnSync } from "node:child_process";

const layer = process.argv[2];
if (!["unit", "integration"].includes(layer)) {
  throw new Error("Uso: node scripts/test-layer.mjs unit|integration");
}
const root = resolve(import.meta.dirname, "..");
const reports = resolve(root, "reports/week08", layer);
const coverage = resolve(root, "coverage/week08", layer);
mkdirSync(reports, { recursive: true });
mkdirSync(coverage, { recursive: true });
const files = readdirSync(resolve(root, "tests", layer))
  .filter((file) => file.endsWith(".test.ts")).sort()
  .map((file) => `tests/${layer}/${file}`);
if (!files.length) throw new Error(`No hay pruebas para ${layer}`);
// Node 20 del CI anterior todavía no admite filtros de cobertura por ruta.
const coverageFilters = Number(process.versions.node.split(".")[0]) >= 22
  ? ["--test-coverage-include=src/**/*.ts"] : [];
const run = spawnSync(process.execPath, [
  "--import", "tsx", "--test", "--test-concurrency=1", "--test-timeout=15000",
  "--experimental-test-coverage", ...coverageFilters,
  "--test-reporter=spec", "--test-reporter-destination=stdout",
  "--test-reporter=lcov", `--test-reporter-destination=${resolve(coverage, "lcov.info")}`,
  ...files,
], { cwd: root, encoding: "utf8", maxBuffer: 10 * 1024 * 1024 });
const output = `${run.stdout ?? ""}${run.stderr ?? ""}${run.error ? `${run.error.message}\n` : ""}`;
process.stdout.write(output);
writeFileSync(resolve(reports, "output.txt"), output);
const revision = spawnSync("git", ["rev-parse", "HEAD"], { cwd: root, encoding: "utf8" });
const status = spawnSync("git", ["status", "--porcelain"], { cwd: root, encoding: "utf8" });
writeFileSync(resolve(reports, "result.json"), JSON.stringify({
  layer, checkedAt: new Date().toISOString(), node: process.version,
  commitSha: revision.status === 0 ? revision.stdout.trim() : null,
  workingTreeClean: status.status === 0 ? status.stdout.trim() === "" : null,
  exitCode: run.status, status: run.status === 0 && !run.error ? "pass" : "fail", files,
}, null, 2) + "\n");
process.exitCode = run.status === 0 && !run.error ? 0 : 1;
