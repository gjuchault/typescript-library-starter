import { execFile as execFileSync } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";
import { promisify } from "node:util";
import { build as esbuild } from "esbuild";
import { isMain } from "is-main";
import { rimraf } from "rimraf";
import packageJson from "../package.json" with { type: "json" };

const esbuildTarget = `node${packageJson.volta.node.slice(0, 2)}`;

const execFile = promisify(execFileSync);

const srcPath = path.join(process.cwd(), "src");
const buildPath = path.join(process.cwd(), "build");

async function clear(): Promise<void> {
	const time = Date.now();

	await fs.rm(buildPath, { recursive: true, force: true });

	console.log(`🗑️ cleared in ${Date.now() - time}ms`);
}

async function buildDts(): Promise<void> {
	const time = Date.now();

	const { stderr } = await execFile("tsc", [
		"--emitDeclarationOnly",
		"--project",
		"tsconfig.build.json",
	]);

	if (stderr) {
		console.error(stderr);
	}

	console.log(`📘 built definitions files in ${Date.now() - time} ms`);
}

async function extractDts(): Promise<void> {
	const time = Date.now();

	const { stderr } = await execFile("api-extractor", ["run"]);

	if (stderr) {
		console.error(stderr);
	}

	await rimraf("./build/**/*.d.ts", { glob: true });
	await fs.rename("trimmed.d.ts", "build/index.d.ts");

	console.log(`📘 extracted definitions files in ${Date.now() - time} ms`);
}

async function build(): Promise<void> {
	const time = Date.now();

	await esbuild({
		platform: "node",
		target: esbuildTarget,
		format: "esm",
		nodePaths: [srcPath],
		sourcemap: true,
		external: [],
		bundle: true,
		entryPoints: [path.join(srcPath, "index.ts")],
		outdir: buildPath,
	});

	console.log(`📦 bundled in ${Date.now() - time}ms`);
}

if (isMain(import.meta)) {
	const time = Date.now();

	await clear();
	await buildDts();
	await extractDts();
	await build();

	console.log("🚀 built in", Date.now() - time, "ms");
}
