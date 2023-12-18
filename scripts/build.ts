import path from "node:path";
import url from "node:url";
import { build as esbuild } from "esbuild";

const srcPath = path.join(process.cwd(), "src");
const buildPath = path.join(process.cwd(), "build");

async function build() {
  return esbuild({
    platform: "node",
    target: "node21",
    format: "esm",
    nodePaths: [srcPath],
    sourcemap: true,
    external: [],
    bundle: true,
    entryPoints: [path.join(srcPath, "index.ts")],
    outdir: buildPath,
  });
}

if (import.meta.url.startsWith("file:")) {
  if (process.argv[1] === url.fileURLToPath(import.meta.url)) {
    await build();
  }
}
