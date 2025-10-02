const express = require('express');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const getRouter = require('stremio-addon-sdk/src/getRouter');
const addonInterface = require('./addon');
const pkg = require('../package.json');

const PORT = process.env.PORT || 7000;
const app = express();
const staticDir = path.join(__dirname, '..', 'public');
const versionFile = path.join(__dirname, '..', 'version.txt');
const versionJsonFile = path.join(__dirname, '..', 'version.json');
const REPO_COMMIT_URL = process.env.ADDON_COMMIT_URL_BASE || 'https://github.com/CreepsoOff/libre-subtitles-stremio/commit/';

app.get('/', (_, res) => {
  res.sendFile(path.join(staticDir, 'index.html'));
});

app.use(express.static(staticDir));
function getGitInfo() {
  try {
    const full = execSync('git rev-parse HEAD', { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim();
    if (!full) return {};
    let short = '';
    try {
      short = execSync('git rev-parse --short HEAD', { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim();
    } catch (_) {
      short = full.slice(0, 7);
    }
    return { full, short };
  } catch (_) {
    return {};
  }
}

function loadVersionInfo(callback) {
  const envVersion = process.env.ADDON_VERSION || process.env.GIT_TAG || pkg.version;
  const envCommitFull = process.env.ADDON_COMMIT || process.env.GIT_COMMIT || process.env.GITHUB_SHA || '';
  const envCommitShort = process.env.ADDON_COMMIT_SHORT || (envCommitFull ? envCommitFull.slice(0, 7) : '');
  const envCommitUrl = process.env.ADDON_COMMIT_URL || (envCommitFull ? `${REPO_COMMIT_URL}${envCommitFull}` : '');

  const enhance = (base) => {
    const info = base || {};
    if (!info.version) info.version = envVersion;

    const commit = info.commit ? { ...info.commit } : {};
    if (envCommitFull && !commit.full) commit.full = envCommitFull;
    if (envCommitShort && !commit.short) commit.short = envCommitShort;
    if (!commit.short && commit.full) commit.short = commit.full.slice(0, 7);
    if (envCommitUrl && !commit.url) commit.url = envCommitUrl;
    if (!commit.url && commit.full) commit.url = `${REPO_COMMIT_URL}${commit.full}`;

    if ((!commit.full || !commit.short) && !envCommitFull) {
      const gitInfo = getGitInfo();
      if (gitInfo.full && !commit.full) commit.full = gitInfo.full;
      if (gitInfo.short && !commit.short) commit.short = gitInfo.short;
      if (!commit.url && gitInfo.full) commit.url = `${REPO_COMMIT_URL}${gitInfo.full}`;
    }

    if (Object.keys(commit).length) {
      info.commit = commit;
    }

    return info;
  };

  fs.readFile(versionJsonFile, 'utf8', (jsonErr, jsonData) => {
    if (!jsonErr) {
      try {
        const parsed = JSON.parse(jsonData);
        callback(null, enhance(parsed));
        return;
      } catch (parseErr) {
        console.warn('Failed to parse version.json:', parseErr.message);
      }
    }

    fs.readFile(versionFile, 'utf8', (txtErr, txtData) => {
      if (!txtErr) {
        callback(null, enhance({ version: txtData.trim() }));
        return;
      }

      try {
        callback(null, enhance({}));
      } catch (err) {
        callback(err);
      }
    });
  });
}

app.get('/version.json', (_, res) => {
  loadVersionInfo((err, info) => {
    if (err) {
      res.status(404).json({ error: err.message });
      return;
    }
    res.json(info);
  });
});

app.get('/version.txt', (_, res) => {
  loadVersionInfo((err, info) => {
    if (err) {
      res.status(404).send('version not set');
      return;
    }
    res.type('text/plain').send((info.version || '').trim());
  });
});

app.get('/health', (_, res) => {
  res.json({ status: 'ok' });
});

app.use(getRouter(addonInterface));

const server = app.listen(PORT, () => {
  const address = server.address();
  const actualPort = address && typeof address === 'object' ? address.port : PORT;

  console.log(`Libre Subtitles Stremio Addon listening on port ${actualPort}`);
  console.log(`Install URL: http://localhost:${actualPort}/manifest.json`);
  console.log('');
  console.log('Interface web: http://localhost:' + actualPort + '/');
  console.log('To install this addon in Stremio:');
  console.log('1. Open Stremio');
  console.log('2. Go to Addons');
  console.log('3. Click on "Community Addons"');
  console.log(`4. Paste the URL: http://localhost:${actualPort}/manifest.json`);
});

module.exports = { app, server };
