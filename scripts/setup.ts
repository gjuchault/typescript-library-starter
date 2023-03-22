import path from "node:path";
import fs from "node:fs/promises";
import childProcess from "node:child_process";
import { promisify } from "node:util";
import url from "node:url";
import slugify from "slugify";
import prompts from "prompts";

const exec = promisify(childProcess.exec);
const __filename = url.fileURLToPath(import.meta.url);
const __dirname = url.fileURLToPath(new URL(".", import.meta.url));

const rootPath = path.join(__dirname, "..");
const releaseRcPath = path.join(rootPath, ".releaserc.json");
const cspellPath = path.join(rootPath, ".cspell.json");
const packageJsonPath = path.join(rootPath, "package.json");
const contributingPath = path.join(rootPath, "CONTRIBUTING.md");
const scriptsPath = path.join(rootPath, "scripts/");
const workflowPath = path.join(
  rootPath,
  ".github/workflows/typescript-library-starter.yml"
);
const issueConfigPath = path.join(
  rootPath,
  ".github/ISSUE_TEMPLATE/config.yml"
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

  if (!packageName || !githubUserName) {
    console.log("User input missing. Exiting");
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

  console.log("Ready to go 🚀");
}

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

  await logAsyncTask(
    "Changing GitHub workflow file",
    replaceInFile(
      workflowPath,
      new Map([
        [/Typescript Library Starter/, packageName],
        [/typescript-library-starter/, packageSlug],
        [/\s+- name: Setup test\s+run:[\w :]+/i, ""],
      ])
    )
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
      ])
    )
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
      ])
    )
  );

  await logAsyncTask(
    "Renaming GitHub workflow file",
    fs.rename(
      workflowPath,
      path.join(rootPath, `.github/workflows/${packageName}.yml`)
    )
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
      ])
    )
  );

  await logAsyncTask(
    "Editing CODE_OF_CONDUCT.md",
    replaceInFile(
      codeOfConductPath,
      new Map([["gabriel.juchault@gmail.com", userMail]])
    )
  );

  await logAsyncTask(
    "Editing package.json",

    replaceInFile(
      packageJsonPath,
      new Map<string | RegExp, string>([
        ["@gjuchault/typescript-library-starter", packageName],
        [/[^\n]+"description[^\n]+\n/, ""],
        [/[^\n]+"keywords[^\]]+\],\n/, ""],
        [/[^\n]+"homepage[^\n]+\n/, ""],
        [/[^\n]+"bugs[^\n]+\n/, ""],
        [/[^\n]+"author[^\n]+\n/, ""],
        [/[^\n]+"repository[^\n]+\n/, ""],
        [/[^\n]+"setup[^\n]+\n/, ""],
        [/[^\n]+"test:setup[^\n]+\n/, ""],
      ])
    )
  );
}

async function cleanup({ packageName }: { packageName: string }) {
  await logAsyncTask(
    "Removing dependencies",
    exec("npm uninstall slugify prompts tsx")
  );

  await logAsyncTask(
    "Cleaning cspell",
    replaceInFile(cspellPath, new Map([["gjuchault", packageName]]))
  );

  await logAsyncTask(
    "Removing scripts folder",
    fs.rm(scriptsPath, { recursive: true })
  );
}

async function replaceInFile(
  filePath: string,
  replacers: Map<string | RegExp, string>
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
    exec(`git commit -m "${message}"`)
  );
}

async function logAsyncTask<TResolve>(
  message: string,
  promise: Promise<TResolve>
) {
  process.stdout.write(message);

  const output = await promise;

  console.log(" ✅");

  return output;
}

if (import.meta.url.startsWith("file:")) {
  if (process.argv[1] === url.fileURLToPath(import.meta.url)) {
    await setup();
  }
}
