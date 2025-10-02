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
 * 5. Creates or updates the annotated git tag for the version with a compare link.
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
    JSON.stringify({ version }, null, 2) + '
'
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

function getPreviousTag() {
  try {
    return runCapture('git describe --tags --abbrev=0 HEAD^');
  } catch (err) {
    try {
      return runCapture('git describe --tags --abbrev=0');
    } catch (_) {
      return null;
    }
  }
}

function getRemoteHttpUrl() {
  try {
    let remote = runCapture('git config --get remote.origin.url');
    if (!remote) return null;
    if (remote.startsWith('git@')) {
      const match = remote.match(/git@([^:]+):(.+)(\.git)?$/);
      if (match) {
        return `https://${match[1]}/${match[2].replace(/\.git$/, '')}`;
      }
    }
    if (remote.startsWith('http://') || remote.startsWith('https://')) {
      return remote.replace(/\.git$/, '');
    }
  } catch (_) {
    // ignore
  }
  return null;
}

function buildTagMessage(version, previousTag) {
  let message = `Release ${version}`;
  const baseUrl = getRemoteHttpUrl();
  if (baseUrl && previousTag) {
    message += `

Full changelog: ${baseUrl}/compare/${previousTag}...v${version}`;
  } else if (baseUrl) {
    message += `

Full changelog: ${baseUrl}/releases/tag/v${version}`;
  }
  return message;
}

function createTag(version, previousTag) {
  const existing = runCapture(`git tag -l v${version}`);
  if (existing) {
    run(`git tag -d v${version}`);
  }
  const message = buildTagMessage(version, previousTag);
  run(`git tag -a v${version} -m ${JSON.stringify(message)}`);
}

(function main() {
  const nextVersion = parseArgs();
  ensureCleanWorktree();

  run(`npm version ${nextVersion} --no-git-tag-version`);
  updateVersionFiles(nextVersion);

  addReleaseFilesToGit();
  run(`git commit -m ${JSON.stringify(`chore(release): ${nextVersion}`)}`);

  const previousTag = getPreviousTag();
  createTag(nextVersion, previousTag);

  const fullCommit = runCapture('git rev-parse HEAD');
  const shortCommit = runCapture('git rev-parse --short HEAD');

  console.log('
Release ready!');
  console.log(`  version : ${nextVersion}`);
  console.log(`  commit  : ${fullCommit} (${shortCommit})`);
  console.log(`  tag     : v${nextVersion}`);
  if (previousTag) {
    console.log(`  previous: ${previousTag}`);
  }

  console.log('
Next steps:');
  console.log('  git push origin HEAD --tags');
  console.log('  docker compose up -d --build');
})();
