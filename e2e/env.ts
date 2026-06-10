import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const appDir = dirname(fileURLToPath(import.meta.url));

const parseEnvLine = (line: string): [string, string] | undefined => {
  const trimmed = line.trim();

  if (trimmed.length === 0 || trimmed.startsWith("#")) {
    return undefined;
  }

  const separatorIndex = trimmed.indexOf("=");

  if (separatorIndex <= 0) {
    return undefined;
  }

  const key = trimmed.slice(0, separatorIndex).trim();
  let value = trimmed.slice(separatorIndex + 1).trim();

  if (
    (value.startsWith("\"") && value.endsWith("\"")) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    value = value.slice(1, -1);
  }

  return [key, value];
};

const envPaths = [
  resolve(process.cwd(), ".env"),
  resolve(appDir, ".env")
];

for (const envPath of envPaths) {
  if (!existsSync(envPath)) {
    continue;
  }

  const envFile = readFileSync(envPath, "utf8");

  for (const line of envFile.split(/\r?\n/)) {
    const entry = parseEnvLine(line);

    if (entry) {
      const [key, value] = entry;
      process.env[key] ??= value;
    }
  }
}

export const getRequiredEnv = (key: string): string => {
  const value = process.env[key]?.trim();

  if (value) {
    return value;
  }

  throw new Error(`${key} must be set in the environment or .env`);
};
