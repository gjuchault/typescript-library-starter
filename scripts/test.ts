import { spawn } from "node:child_process";

async function runTests({
	nodeOptions = [],
	filesFilter = "",
	program = "node",
	programOptions = [],
	env = {},
}: {
	nodeOptions?: string[];
	filesFilter?: string;
	program?: string;
	programOptions?: string[];
	env?: Record<string, string>;
}): Promise<void> {
	const time = Date.now();

	return new Promise((resolve, reject) => {
		const options = [
			...programOptions,
			"--test",
			...nodeOptions,
			filesFilter !== "" ? filesFilter : "src/**/*.test.ts",
		];

		console.log(`${program} ${options.join(" ")}`);

		const nodeProcess = spawn(program, options, {
			stdio: "inherit",
			env: { ...process.env, ...env },
		});

		nodeProcess.on("close", (code) => {
			if (code === 0) {
				console.log(`🚀 ran tests in ${Date.now() - time}ms`);

				resolve();
			}

			reject(`🚨 tests failed with code ${code} in ${Date.now() - time}ms`);
		});
	});
}

// TODO: remove once released in @types/node
const isMain = (import.meta as unknown as { main: boolean }).main;
if (isMain) {
	const filesFilter = process.argv.slice(3).join(" ").trim();

	if (process.argv[2] === "test") {
		await runTests({ filesFilter });
	}

	if (process.argv[2] === "test:inspect") {
		await runTests({ nodeOptions: ["--inspect"], filesFilter });
	}

	if (process.argv[2] === "test:watch") {
		await runTests({ nodeOptions: ["--watch"], filesFilter });
	}

	if (process.argv[2] === "test:coverage") {
		await runTests({
			nodeOptions: ["--experimental-test-coverage"],
			program: "c8",
			programOptions: ["-r", "html", "node"],
			env: {
				NODE_V8_COVERAGE: "./coverage",
			},
		});
	}
}
