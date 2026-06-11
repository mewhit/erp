import { spawnSync } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import "./load-dotenv";

const e2eDir = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(e2eDir, "..");
const tsxCli = resolve(repoRoot, "node_modules", "tsx", "dist", "cli.mjs");
const httpServerDir = resolve(repoRoot, "http-server");

const runSetupCommand = (label: string, args: ReadonlyArray<string>) => {
  console.log(label);

  const result = spawnSync(process.execPath, [tsxCli, ...args], {
    cwd: httpServerDir,
    env: process.env,
    stdio: "inherit"
  });

  if (result.status !== 0) {
    throw new Error(`${label} failed with exit code ${result.status ?? "unknown"}`);
  }
};

export default async function globalSetup() {
  runSetupCommand("Applying database migrations...", ["src/db/migrate.ts"]);
  runSetupCommand("Applying database seed...", ["src/db/seed.ts"]);
}
