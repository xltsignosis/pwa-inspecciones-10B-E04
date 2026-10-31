import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync, copyFileSync } from "node:fs";
import { resolve } from "node:path";
import { spawnSync } from "node:child_process";

const root = resolve(import.meta.dirname, "..");
const file = resolve(root, "src/lib/security/validation.ts");
const original = readFileSync(file, "utf8");
const guard = "keys.length === fields.length";
if (original.split(guard).length !== 2) throw new Error("El control cambió; revisar el experimento antes de mutar.");
const output = resolve(root, "reports/week09/regression");
mkdirSync(output, { recursive: true });
const git = (...args) => spawnSync("git", args, { cwd: root, encoding: "utf8" }).stdout?.trim();
const hash = source => createHash("sha256").update(source).digest("hex");
const commitSha = git("rev-parse", "HEAD");
function run(name) {
  const result = spawnSync(process.execPath, ["scripts/test-layer.mjs", "security"], {
    cwd: root, encoding: "utf8", maxBuffer: 10 * 1024 * 1024,
  });
  writeFileSync(resolve(output, `${name}-output.txt`), `${result.stdout ?? ""}${result.stderr ?? ""}${result.error?.message ?? ""}`);
  copyFileSync(resolve(root, "reports/week09/security/result.json"), resolve(output, `${name}-result.json`));
  return result.status;
}
let failure;
try {
  writeFileSync(file, original.replace(guard, "keys.length >= fields.length"));
  writeFileSync(resolve(output, "defect.patch"), spawnSync("git", ["diff", "--", "src/lib/security/validation.ts"], { cwd: root, encoding: "utf8" }).stdout);
  failure = run("failure");
} finally {
  writeFileSync(file, original);
}
const recovery = run("recovery");
const restored = hash(readFileSync(file, "utf8")) === hash(original);
const passed = typeof failure === "number" && failure !== 0 && recovery === 0 && restored;
writeFileSync(resolve(output, "experiment.json"), JSON.stringify({
  commitSha, checkedAt: new Date().toISOString(), originalSha256: hash(original),
  mutation: "Permitir campos adicionales al cambiar igualdad de cantidad de campos por >=.",
  failureExitCode: failure, recoveryExitCode: recovery, sourceRestored: restored, status: passed ? "pass" : "fail",
}, null, 2) + "\n");
console.log(`Regresión: fallo=${failure}; recuperación=${recovery}; fuente restaurada=${restored}. Reportes: reports/week09/regression/`);
process.exitCode = passed ? 0 : 1;
