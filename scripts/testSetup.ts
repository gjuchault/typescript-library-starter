import childProcess from "child_process";
import { promisify } from "util";
import { run } from "./setup";

const exec = promisify(childProcess.exec);

async function main() {
  try {
    const { stdout: gitEmail } = await exec(
      `git config --global --get user.email`
    );

    if (!gitEmail.trim().length) {
      await exec(`git config --global user.email actions@github.com`);
      await exec(`git config --global user.name GithubActions`);
    }
  } catch (err) {
    await exec(`git config --global user.email actions@github.com`);
    await exec(`git config --global user.name GithubActions`);
  }

  await run({
    githubUserName: "ghUserName",
    packageName: "packageName",
    userMail: "ghUserName@mail.com",
  });

  try {
    await test();
  } catch (err) {
    throw err;
  } finally {
    await restore();
  }
}

async function test() {
  await testNoGrep("gjuchault");
  await testNoGrep("typescript-library-starter");
  await testNoGrep("template");
}

async function restore() {
  await exec(`git reset HEAD~ && git checkout . && git clean -df`);

  await exec(
    `git remote add origin git@github.com:gjuchault/typescript-library-starter.git`
  );

  await exec(`npm install`);
}

async function testNoGrep(pattern: string) {
  try {
    await exec(
      `grep -r "${pattern}" --exclude-dir=node_modules --exclude-dir=.git --exclude=README.md .`
    );
  } catch (err) {
    if (err.stderr === "") {
      return;
    }

    throw err;
  }
}

if (require.main === module) {
  main();
}
