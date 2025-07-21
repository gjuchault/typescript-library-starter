import childProcess from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";
import url from "node:url";
import { promisify } from "node:util";
import prompts from "prompts";
import slugify from "slugify";

const exec = promisify(childProcess.exec);
const __dirname = url.fileURLToPath(new URL(".", import.meta.url));

const rootPath = path.join(__dirname, "..");
const releaseRcPath = path.join(rootPath, ".releaserc.json");
const cspellPath = path.join(rootPath, ".cspell.json");
const packageJsonPath = path.join(rootPath, "package.json");
const contributingPath = path.join(rootPath, "CONTRIBUTING.md");
const scriptsPath = path.join(rootPath, "scripts/");
const workflowPath = path.join(
	rootPath,
	".github/workflows/typescript-library-starter.yml",
);
const issueConfigPath = path.join(
	rootPath,
	".github/ISSUE_TEMPLATE/config.yml",
);
const codeOfConductPath = path.join(rootPath, "CODE_OF_CONDUCT.md");

interface Input {
	packageName: string;
	githubUserName: string;
	userMail: string;
}

async function setup() {
	const initialProjectName = path.basename(rootPath);

	const input: Input = await prompts([
		{
			type: "text",
			name: "packageName",
			message: "What is your project name?",
			initial: initialProjectName,
		},
		{
			type: "text",
			name: "githubUserName",
			message: "What is your github username (package.json)?",
		},
		{
			type: "text",
			name: "userMail",
			message: "What is your mail (CODE_OF_CONDUCT.md)?",
		},
	]);

	// \u0015 may be inserted by clearing the pre-filled value by doing
	// cmd+backspace
	const packageName = input.packageName?.trim().replace("\u0015", "");
	const githubUserName = input.githubUserName?.trim();
	const userMail = input.userMail?.trim();

	if (!(packageName && githubUserName)) {
		process.exit(1);
	}

	return run({ packageName, githubUserName, userMail });
}

export async function run({
	packageName,
	githubUserName,
	userMail,
}: {
	packageName: string;
	githubUserName: string;
	userMail: string;
}) {
	await applyPackageName({ packageName, githubUserName, userMail });

	await cleanup({ packageName });

	await commitAll("chore: typescript-library-startup");
}

const packageNameRegexp = /Typescript Library Starter/;
const packageSlugRegexp = /typescript-library-starter/;
const testSetupRegexp = /, test-setup/i;
const packageDescriptionRegexp = /[^\n]+"description[^\n]+\n/;
const packageKeywordsRegexp = /[^\n]+"keywords[^\]]+\],\n/;
const packageHomepageRegexp = /[^\n]+"homepage[^\n]+\n/;
const packageBugsRegexp = /[^\n]+"bugs[^\n]+\n/;
const packageAuthorRegexp = /[^\n]+"author[^\n]+\n/;
const packageRepositoryRegexp = /[^\n]+"repository[^\n]+\n/;
const packageSetupRegexp = /[^\n]+"setup[^\n]+\n/;
const packageTestSetupRegexp = /[^\n]+"test:setup[^\n]+\n/;

async function applyPackageName({
	packageName,
	githubUserName,
	userMail,
}: {
	packageName: string;
	githubUserName: string;
	userMail: string;
}) {
	const packageSlug = slugify(packageName);

	const setupAction = `  test-setup:
    name: ⚡ Setup tests
    runs-on: ubuntu-latest
    needs: [dependencies]
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version-file: package.json
          cache: "npm"
      - run: npm ci
      - name: ⚡ Tests
        run: node --run test:setup\n\n`;

	await logAsyncTask(
		"Changing GitHub workflow file",
		replaceInFile(
			workflowPath,
			new Map<string | RegExp, string>([
				[packageNameRegexp, packageName],
				[packageSlugRegexp, packageSlug],
				[setupAction, ""],
				[testSetupRegexp, ""],
			]),
		),
	);

	await logAsyncTask(
		"Changing GitHub Discussions file",
		replaceInFile(
			issueConfigPath,
			new Map([
				[
					"gjuchault/typescript-library-starter",
					`${githubUserName}/${packageName}`,
				],
			]),
		),
	);

	await logAsyncTask(
		"Changing CONTRIBUTING.md file",
		replaceInFile(
			contributingPath,
			new Map([
				[
					/gjuchault\/typescript-library-starter/g,
					`${githubUserName}/${packageName}`,
				],
			]),
		),
	);

	await logAsyncTask(
		"Renaming GitHub workflow file",
		fs.rename(
			workflowPath,
			path.join(rootPath, `.github/workflows/${packageName}.yml`),
		),
	);

	await logAsyncTask(
		"Editing .releaserc.json",
		replaceInFile(
			releaseRcPath,
			new Map([
				[
					"gjuchault/typescript-library-starter",
					`${githubUserName}/${packageName}`,
				],
			]),
		),
	);

	await logAsyncTask(
		"Editing CODE_OF_CONDUCT.md",
		replaceInFile(
			codeOfConductPath,
			new Map([["gabriel.juchault@gmail.com", userMail]]),
		),
	);

	await logAsyncTask(
		"Editing package.json",

		replaceInFile(
			packageJsonPath,
			new Map<string | RegExp, string>([
				["@gjuchault/typescript-library-starter", packageName],
				[packageDescriptionRegexp, ""],
				[packageKeywordsRegexp, ""],
				[packageHomepageRegexp, ""],
				[packageBugsRegexp, ""],
				[packageAuthorRegexp, ""],
				[packageRepositoryRegexp, ""],
				[packageSetupRegexp, ""],
				[packageTestSetupRegexp, ""],
			]),
		),
	);
}

async function cleanup({ packageName }: { packageName: string }) {
	await logAsyncTask(
		"Removing dependencies",
		exec("npm uninstall slugify prompts"),
	);
	await logAsyncTask(
		"Cleaning cspell",
		replaceInFile(cspellPath, new Map([["gjuchault", packageName]])),
	);
	await logAsyncTask(
		"Removing setup script",
		fs.rm(path.join(scriptsPath, "setup.ts")),
	);
	await logAsyncTask(
		"Removing test-setup script",
		fs.rm(path.join(scriptsPath, "test-setup.ts")),
	);
}

async function replaceInFile(
	filePath: string,
	replacers: Map<string | RegExp, string>,
) {
	const fileContent = await fs.readFile(filePath, "utf8");

	let replacedContent = fileContent;
	for (const [searchFor, replaceBy] of replacers) {
		replacedContent = replacedContent.replace(searchFor, replaceBy);
	}

	await fs.writeFile(filePath, replacedContent);
}

async function commitAll(message: string) {
	await exec("git add .");
	await logAsyncTask(
		`Committing changes: ${message}`,
		exec(`git commit -m "${message}"`),
	);
}

async function logAsyncTask<Resolve>(
	message: string,
	promise: Promise<Resolve>,
) {
	process.stdout.write(message);

	const output = await promise;

	process.stdout.write(" ✅\n");

	return output;
}

// TODO: remove once released in @types/node
const isMain = (import.meta as unknown as { main: boolean }).main;
if (isMain) {
	await setup();
}
