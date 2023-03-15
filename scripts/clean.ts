import fs from "node:fs/promises";
import url from "node:url";
import path from "node:path";

const __dirname = url.fileURLToPath(new URL(".", import.meta.url));

async function main() {
  await Promise.all([rmrf("build"), rmrf("coverage"), rmrf(".nyc_output")]);
}

async function rmrf(pathFromRoot: string): Promise<void> {
  await fs.rm(path.join(__dirname, "../", pathFromRoot), {
    recursive: true,
    force: true,
  });
}

await main();
