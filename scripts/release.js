#!/usr/bin/env node
/**
 * Automated release helper.
 *
 * Usage: npm run release -- --version 1.2.3
 *
 * Steps:
 * 1. Verifies that the git worktree is clean.
 * 2. Bumps package.json / package-lock.json without creating a commit or tag.
 * 3. Mirrors the version into version.txt and version.json.
 * 4. Commits all release artefacts with a standard message.
 * 5. Creates or updates the annotated git tag for the version.
 *
 * The script prints out the next commands (git push & docker compose).
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();
const VERSION_TXT = path.join(ROOT, 'version.txt');
const VERSION_JSON = path.join(ROOT, 'version.json');

function run(command, options = {}) {
  execSync(command, { stdio: 'inherit', ...options });
}

function runCapture(command, options = {}) {
  return execSync(command, { stdio: ['ignore', 'pipe', 'inherit'], ...options }).toString().trim();
}

function ensureCleanWorktree() {
  const status = runCapture('git status --porcelain');
  if (status) {
    console.error('Git worktree is not clean. Commit or stash your changes first.');
    console.error(status);
    process.exit(1);
  }
}

function parseArgs() {
  const args = process.argv.slice(2);
  const versionFlagIndex = args.indexOf('--version');
  if (versionFlagIndex === -1 || !args[versionFlagIndex + 1]) {
    console.error('Usage: npm run release -- --version <x.y.z>');
    process.exit(1);
  }
  return args[versionFlagIndex + 1];
}

function updateVersionFiles(version) {
  fs.writeFileSync(VERSION_TXT, `${version}
`);
  fs.writeFileSync(
    VERSION_JSON,
    JSON.stringify({ version }, null, 2) + ''
  );
}

function addReleaseFilesToGit() {
  const files = [
    'package.json',
    'package-lock.json',
    'version.json',
    'version.txt'
  ];
  run(`git add ${files.join(' ')}`);
}

function createTag(version) {
  const existing = runCapture(`git tag -l v${version}`);
  if (existing) {
    // Overwrite tag if it already exists (e.g., rerun).
    run(`git tag -d v${version}`);
  }
  run(`git tag -a v${version} -m "Release ${version}"`);
}

(function main() {
  const nextVersion = parseArgs();
  ensureCleanWorktree();

  run(`npm version ${nextVersion} --no-git-tag-version`);
  updateVersionFiles(nextVersion);

  addReleaseFilesToGit();
  run(`git commit -m "chore(release): ${nextVersion}"`);
  createTag(nextVersion);

  const fullCommit = runCapture('git rev-parse HEAD');
  const shortCommit = runCapture('git rev-parse --short HEAD');

  console.log('Release ready!');
  console.log(`  version : ${nextVersion}`);
  console.log(`  commit  : ${fullCommit} (${shortCommit})`);
  console.log(`  tag     : v${nextVersion}`);

  console.log('Next steps:');
  console.log('  git push origin HEAD --tags');
  console.log('  docker compose up -d --build');
})();
