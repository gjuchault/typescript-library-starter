import fs from "fs/promises";
import path from "path";

async function main() {
  await fs.rm(path.join(__dirname, "../build"), {
    recursive: true,
  });
}

if (require.main === module) {
  main();
}
