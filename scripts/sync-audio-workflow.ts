import path from "node:path";
import { spawnSync } from "node:child_process";

const root = process.cwd();
const args = process.argv.slice(2);

function getArgValue(flag: string, fallback: string) {
  const index = args.findIndex((item) => item === flag);
  return index >= 0 ? args[index + 1] : fallback;
}

const sourceDir = getArgValue("--source-dir", "audio-import");
const output = getArgValue("--output", "scripts/audio-manifest.generated.json");

function runScript(script: string, extraArgs: string[]) {
  const result = spawnSync(
    process.execPath,
    [path.join(root, "node_modules", "tsx", "dist", "cli.mjs"), path.join(root, "scripts", script), ...extraArgs],
    {
      cwd: root,
      stdio: "inherit"
    }
  );

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

runScript("generate-audio-manifest.ts", ["--source-dir", sourceDir, "--output", output]);
runScript("import-audio-manifest.ts", ["--manifest", output]);

console.log(`Audio sync workflow completed using source directory: ${sourceDir}`);
