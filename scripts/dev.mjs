import fs from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";

const cwd = process.cwd();
const nextCacheDir = path.join(cwd, ".next");

try {
  fs.rmSync(nextCacheDir, { recursive: true, force: true });
} catch (error) {
  console.warn("Failed to clear .next cache:", error);
}

const npxCommand = process.platform === "win32" ? "npx.cmd" : "npx";
const child = spawn(npxCommand, ["next", "dev"], {
  cwd,
  stdio: "inherit"
});

child.on("exit", (code) => {
  process.exit(code ?? 0);
});
