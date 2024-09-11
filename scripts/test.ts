import { spawn } from "node:child_process";

async function runTests(
	nodeOptions: string[] = [],
	program = "node",
	programOptions: string[] = [],
	env: Record<string, string> = {},
): Promise<void> {
	const time = Date.now();

	return new Promise((resolve, reject) => {
		const nodeProcess = spawn(
			program,
			[
				...programOptions,
				"--disable-warning=ExperimentalWarning",
				"--experimental-strip-types",
				"--test",
				...nodeOptions,
				"src/**/*.test.ts",
			],
			{ stdio: "inherit", env: { ...process.env, ...env } },
		);

		nodeProcess.on("close", (code) => {
			if (code === 0) {
				// biome-ignore lint/suspicious/noConsoleLog: script file
				console.log(`🚀 ran tests in ${Date.now() - time}ms`);

				resolve();
			}

			reject(`🚨 tests failed with code ${code} in ${Date.now() - time}ms`);
		});
	});
}

if (process.argv[1] === import.meta.filename) {
	if (process.argv[2] === "test") {
		await runTests();
	}

	if (process.argv[2] === "test:watch") {
		await runTests(["--watch"]);
	}

	if (process.argv[2] === "test:coverage") {
		await runTests(
			["--experimental-test-coverage"],
			"c8",
			["-r", "html", "node"],
			{
				// biome-ignore lint/style/useNamingConvention: node options
				NODE_V8_COVERAGE: "./coverage",
			},
		);
	}
}
