import { spawn, spawnSync } from "node:child_process";
import process from "node:process";

const apiUrl = "http://127.0.0.1:3060";
const npmCommand = process.platform === "win32" ? "npm.cmd" : "npm";

const processes = [
  {
    name: "api",
    cwd: "http-server",
    args: ["run", "dev"],
    env: {
      PORT: "3060"
    }
  },
  {
    name: "admin",
    cwd: "admin-web-app",
    args: ["run", "dev", "--", "--host", "127.0.0.1", "--port", "3061", "--strictPort"],
    env: {
      VITE_API_BASE_URL: apiUrl
    }
  },
  {
    name: "portal",
    cwd: "user-portal-webapp",
    args: ["run", "dev", "--", "--host", "127.0.0.1", "--port", "3062", "--strictPort"],
    env: {
      VITE_API_BASE_URL: apiUrl
    }
  }
];

const children = processes.map((config) => {
  const child = spawn(npmCommand, config.args, {
    cwd: config.cwd,
    env: {
      ...process.env,
      ...config.env
    },
    stdio: ["inherit", "pipe", "pipe"]
  });

  const prefix = `[${config.name}]`;
  child.stdout.on("data", (chunk) => {
    process.stdout.write(`${prefix} ${chunk}`);
  });
  child.stderr.on("data", (chunk) => {
    process.stderr.write(`${prefix} ${chunk}`);
  });
  child.on("exit", (code, signal) => {
    if (code !== 0 && signal === null) {
      console.error(`${prefix} exited with code ${code}`);
      shutdown(code ?? 1);
    }
  });

  return child;
});

console.log("ERP dev servers:");
console.log("  API:         http://127.0.0.1:3060");
console.log("  Admin:       http://127.0.0.1:3061");
console.log("  User portal: http://127.0.0.1:3062");

let shuttingDown = false;

function shutdown(code = 0) {
  if (shuttingDown) {
    return;
  }

  shuttingDown = true;

  for (const child of children) {
    if (process.platform === "win32" && child.pid !== undefined) {
      spawnSync("taskkill", ["/pid", String(child.pid), "/T", "/F"], {
        stdio: "ignore"
      });
    } else if (!child.killed) {
      child.kill();
    }
  }

  process.exit(code);
}

process.on("SIGINT", () => shutdown(0));
process.on("SIGTERM", () => shutdown(0));
