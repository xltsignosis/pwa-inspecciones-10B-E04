import { readdirSync, readFileSync, existsSync } from "node:fs";
import { resolve, relative } from "node:path";
import { pathToFileURL } from "node:url";

// Indicadores concretos; los mensajes nunca incluyen el valor encontrado.
export function credentialRules() {
  return [
    ["private-key", /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/],
    ["github-credential", /\b(?:gh[pousr]_[A-Za-z0-9]{36,}|github_pat_[A-Za-z0-9_]{40,})\b/],
    ["aws-access-key", /\b(?:AKIA|ASIA)[A-Z0-9]{16}\b/],
    ["literal-credential", /\b(?:api[_-]?key|client[_-]?secret|password|access[_-]?token)\s*["']?\s*[:=]\s*["'][^"'\r\n]{16,}["']/i],
  ];
}

export function credentialIndicators(source) {
  return credentialRules().filter(([, pattern]) => pattern.test(source)).map(([name]) => name);
}

export function scanClientFiles(root, directories) {
  const findings = [];
  function visit(directory) {
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
      const file = resolve(directory, entry.name);
      if (entry.isDirectory()) visit(file);
      else if (entry.isFile() && /\.(?:[cm]?js|jsx|tsx?|json|html|txt|pem|key)$/i.test(entry.name)) {
        for (const rule of credentialIndicators(readFileSync(file, "utf8"))) {
          findings.push({ file: relative(root, file).replaceAll("\\", "/"), rule });
        }
      }
    }
  }
  for (const directory of directories) {
    const target = resolve(root, directory);
    if (!existsSync(target)) throw new Error(`Falta el directorio requerido: ${directory}`);
    visit(target);
  }
  return findings;
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const findings = scanClientFiles(process.cwd(), ["src", "public", ".next/static"]);
  console.log(JSON.stringify({ check: "client-credential-indicators", findings }, null, 2));
  process.exitCode = findings.length ? 1 : 0;
}
