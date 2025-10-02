const UI_VERSION = '1.0.0';
const LANGUAGES = [
  { code: 'ar', label: 'Arabic' },
  { code: 'bg', label: 'Bulgarian' },
  { code: 'cs', label: 'Czech' },
  { code: 'da', label: 'Danish' },
  { code: 'de', label: 'German' },
  { code: 'el', label: 'Greek' },
  { code: 'en', label: 'English' },
  { code: 'es', label: 'Spanish' },
  { code: 'fi', label: 'Finnish' },
  { code: 'fr', label: 'French' },
  { code: 'he', label: 'Hebrew' },
  { code: 'hi', label: 'Hindi' },
  { code: 'hr', label: 'Croatian' },
  { code: 'hu', label: 'Hungarian' },
  { code: 'id', label: 'Indonesian' },
  { code: 'it', label: 'Italian' },
  { code: 'ja', label: 'Japanese' },
  { code: 'ko', label: 'Korean' },
  { code: 'ms', label: 'Malay' },
  { code: 'nb', label: 'Norwegian' },
  { code: 'nl', label: 'Dutch' },
  { code: 'pl', label: 'Polish' },
  { code: 'pt', label: 'Portuguese' },
  { code: 'ro', label: 'Romanian' },
  { code: 'ru', label: 'Russian' },
  { code: 'sk', label: 'Slovak' },
  { code: 'sl', label: 'Slovenian' },
  { code: 'sr', label: 'Serbian' },
  { code: 'sv', label: 'Swedish' },
  { code: 'th', label: 'Thai' },
  { code: 'tr', label: 'Turkish' },
  { code: 'uk', label: 'Ukrainian' },
  { code: 'vi', label: 'Vietnamese' },
  { code: 'zh', label: 'Chinese' }
];

const FORMAT_OPTIONS = [
  { id: 'srt', label: 'SRT' },
  { id: 'ass', label: 'ASS/SSA' },
  { id: 'vtt', label: 'WebVTT' },
  { id: 'sub', label: 'SUB' },
  { id: 'txt', label: 'TXT' }
];

const SOURCE_OPTIONS = [
  { id: 'opensubtitles', label: 'OpenSubtitles' },
  { id: 'yavka', label: 'Yavka' },
  { id: 'subscene', label: 'Subscene' },
  { id: 'argenteam', label: 'Argenteam' },
  { id: 'assrt', label: 'Assrt' },
  { id: 'subswiki', label: 'SubsWiki' }
];

const state = {
  languages: new Set(),
  strictLanguages: false,
  includeHearing: true,
  preferHearing: false,
  formats: new Set(),
  sources: new Set()
};

const langContainer = document.querySelector('#languageOptions');
const langSummary = document.querySelector('#languageSummary');
const strictLanguages = document.querySelector('#strictLanguages');
const includeHearing = document.querySelector('#includeHearing');
const preferHearing = document.querySelector('#preferHearing');
const configPreview = document.querySelector('#configPreview');
const installLink = document.querySelector('#installLink');
const installUrlInput = document.querySelector('#installUrl');
const copyHttpBtn = document.querySelector('#copyHttp');
const formatContainer = document.querySelector('#formatOptions');
const sourceContainer = document.querySelector('#sourceOptions');
const uiVersionTag = document.querySelector('#uiVersion');
const addonVersionTag = document.querySelector('#addonVersion');
const addonCommitLink = document.querySelector('#addonCommit');

uiVersionTag.textContent = UI_VERSION;
async function loadVersionInfo() {
  try {
    const resp = await fetch('/version.json', { cache: 'no-store' });
    if (!resp.ok) throw new Error('bad status');
    const info = await resp.json();
    if (info.version) {
      addonVersionTag.textContent = info.version;
    }
    if (info.commit && info.commit.short) {
      addonCommitLink.textContent = info.commit.short;
      if (info.commit.url) {
        addonCommitLink.href = info.commit.url;
        addonCommitLink.target = '_blank';
      }
      addonCommitLink.removeAttribute('data-disabled');
    } else {
      addonCommitLink.textContent = '--';
      addonCommitLink.href = '#';
      addonCommitLink.setAttribute('data-disabled', 'true');
    }
  } catch (err) {
    try {
      const resp = await fetch('/version.txt', { cache: 'no-store' });
      if (!resp.ok) throw new Error('bad status');
      const text = (await resp.text()).trim();
      if (text) {
        addonVersionTag.textContent = text;
      }
    } catch (_) {
      addonVersionTag.textContent = 'unknown';
    } finally {
      addonCommitLink.textContent = '--';
      addonCommitLink.href = '#';
      addonCommitLink.setAttribute('data-disabled', 'true');
    }
  }
}

function renderLanguageOptions() {
  LANGUAGES.sort((a, b) => a.label.localeCompare(b.label, 'en'));
  langContainer.innerHTML = '';
  LANGUAGES.forEach(({ code, label }) => {
    const option = document.createElement('label');
    option.className = 'language-option';
    option.innerHTML = `
      <input type="checkbox" value="${code}" />
      <span>${label} <small>(${code})</small></span>
    `;
    const checkbox = option.querySelector('input');
    checkbox.addEventListener('change', () => {
      if (checkbox.checked) {
        state.languages.add(code);
      } else {
        state.languages.delete(code);
      }
      updateLanguageSummary();
      updateInstallData();
    });
    langContainer.appendChild(option);
  });
}

function renderChips(container, options, targetSet) {
  container.innerHTML = '';
  options.forEach(({ id, label }) => {
    const chip = document.createElement('button');
    chip.type = 'button';
    chip.className = 'chip';
    chip.dataset.value = id;
    chip.textContent = label;
    chip.addEventListener('click', () => {
      const active = chip.dataset.active === 'true';
      if (active) {
        chip.dataset.active = 'false';
        targetSet.delete(id);
      } else {
        chip.dataset.active = 'true';
        targetSet.add(id);
      }
      updateInstallData();
    });
    container.appendChild(chip);
  });
}

function updateLanguageSummary() {
  if (!state.languages.size) {
    langSummary.textContent = 'All languages (recommended)';
    return;
  }
  const codes = Array.from(state.languages);
  const labels = LANGUAGES.filter(({ code }) => codes.includes(code)).map(({ label }) => label);
  if (labels.length <= 3) {
    langSummary.textContent = labels.join(', ');
  } else {
    langSummary.textContent = `${labels.slice(0, 3).join(', ')} +${labels.length - 3}`;
  }
}

function buildPayload() {
  const prefs = {};

  if (state.languages.size) {
    prefs.languages = Array.from(state.languages);
    if (state.strictLanguages) {
      prefs.strictLanguages = true;
    }
  }

  if (!state.includeHearing) {
    prefs.includeHearingImpaired = false;
  }

  if (state.preferHearing && state.includeHearing) {
    prefs.preferHearingImpaired = true;
  }

  if (state.formats.size) {
    prefs.formats = Array.from(state.formats);
  }

  if (state.sources.size) {
    prefs.sources = Array.from(state.sources);
  }

  const payload = { version: 1 };
  if (Object.keys(prefs).length) {
    payload.preferences = prefs;
  }

  return payload;
}

function updateInstallData() {
  const payload = buildPayload();
  const hasPreferences = Boolean(payload.preferences);
  const configJSON = hasPreferences ? JSON.stringify(payload) : null;
  const encoded = configJSON ? encodeURIComponent(configJSON) : null;
  const baseHost = window.location.host;
  const baseOrigin = window.location.origin;

  const manifestPath = encoded ? `${encoded}/manifest.json` : 'manifest.json';
  installLink.href = `stremio://${baseHost}/${manifestPath}`;
  installUrlInput.value = `${baseOrigin}/${manifestPath}`;

  configPreview.textContent = configJSON
    ? JSON.stringify(payload, null, 2)
    : 'All subtitles will be offered. Select options above if you want to narrow things down.';
}

function bindToggles() {
  strictLanguages.addEventListener('change', () => {
    state.strictLanguages = strictLanguages.checked;
    updateInstallData();
  });

  includeHearing.addEventListener('change', () => {
    state.includeHearing = includeHearing.checked;
    if (!includeHearing.checked) {
      state.preferHearing = false;
      preferHearing.checked = false;
      preferHearing.disabled = true;
    } else {
      preferHearing.disabled = false;
    }
    updateInstallData();
  });

  preferHearing.addEventListener('change', () => {
    state.preferHearing = preferHearing.checked && includeHearing.checked;
    updateInstallData();
  });

  copyHttpBtn.addEventListener('click', async () => {
    const url = installUrlInput.value;
    try {
      await navigator.clipboard.writeText(url);
      copyHttpBtn.textContent = 'Copied!';
      copyHttpBtn.classList.remove('btn--ghost', 'btn--error');
      copyHttpBtn.classList.add('btn--primary');
      setTimeout(() => {
        copyHttpBtn.textContent = 'Copy HTTP URL';
        copyHttpBtn.classList.remove('btn--primary');
        copyHttpBtn.classList.add('btn--ghost');
      }, 1800);
    } catch (err) {
      copyHttpBtn.textContent = 'Copy failed';
      copyHttpBtn.classList.remove('btn--ghost', 'btn--primary');
      copyHttpBtn.classList.add('btn--error');
      setTimeout(() => {
        copyHttpBtn.textContent = 'Copy HTTP URL';
        copyHttpBtn.classList.remove('btn--error');
        copyHttpBtn.classList.add('btn--ghost');
      }, 1800);
    }
  });
}

renderLanguageOptions();
renderChips(formatContainer, FORMAT_OPTIONS, state.formats);
renderChips(sourceContainer, SOURCE_OPTIONS, state.sources);
bindToggles();
updateLanguageSummary();
updateInstallData();
loadVersionInfo();
