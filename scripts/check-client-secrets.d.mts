export function credentialRules(): [string, RegExp][];
export function credentialIndicators(source: string): string[];
export function scanClientFiles(root: string, directories: string[]): { file: string; rule: string }[];
