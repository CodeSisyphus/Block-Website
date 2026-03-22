// Site Blocker — Popup Script

const domainInput = document.getElementById("domain-input");
const addBtn = document.getElementById("add-btn");
const errorMsg = document.getElementById("error-msg");
const siteList = document.getElementById("site-list");
const emptyState = document.getElementById("empty-state");
const exportBtn = document.getElementById("export-btn");
const importBtn = document.getElementById("import-btn");
const importFile = document.getElementById("import-file");

let blockedSites = [];

// ── Preset categories ──

const PRESETS = {
  social: [
    "facebook.com", "instagram.com", "twitter.com", "x.com",
    "tiktok.com", "snapchat.com", "reddit.com", "linkedin.com",
    "pinterest.com", "tumblr.com", "threads.net", "mastodon.social",
    "bsky.app"
  ],
  video: [
    "youtube.com", "netflix.com", "hulu.com", "disneyplus.com",
    "twitch.tv", "dailymotion.com", "vimeo.com", "peacocktv.com",
    "paramountplus.com", "crunchyroll.com"
  ],
  news: [
    "cnn.com", "foxnews.com", "bbc.com", "nytimes.com",
    "washingtonpost.com", "theguardian.com", "reuters.com",
    "apnews.com", "huffpost.com", "buzzfeed.com"
  ],
  shopping: [
    "amazon.com", "ebay.com", "walmart.com", "target.com",
    "etsy.com", "aliexpress.com", "shein.com", "wish.com",
    "bestbuy.com", "temu.com"
  ],
  gaming: [
    "store.steampowered.com", "epicgames.com", "roblox.com",
    "miniclip.com", "poki.com", "kongregate.com", "itch.io",
    "crazygames.com", "addictinggames.com"
  ],
  chinapropaganda: [
    "cgtn.com", "chinadaily.com.cn", "globaltimes.cn",
    "xinhuanet.com", "news.cn", "ecns.cn", "cctv.com",
    "peoplesdaily.com.cn", "en.people.cn", "china.org.cn",
    "chinaqw.com", "cri.cn", "taihainet.com", "81.cn",
    "guancha.cn", "ifeng.com"
  ],
  russiapropaganda: [
    "rt.com", "sputniknews.com", "sputnikglobe.com",
    "tass.com", "ria.ru", "iz.ru", "gazeta.ru",
    "vesti.ru", "rg.ru", "pravda.ru", "lenta.ru",
    "tsargrad.tv", "riafan.ru", "southfront.press",
    "strategic-culture.su", "journal-neo.su"
  ]
};

// ── Helpers ──

function showError(msg) {
  errorMsg.textContent = msg;
  errorMsg.classList.remove("hidden");
}

function hideError() {
  errorMsg.classList.add("hidden");
}

function isValidDomain(str) {
  return /^([a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/.test(str);
}

function cleanDomain(input) {
  let d = input.trim().toLowerCase();
  d = d.replace(/^(https?:\/\/)/, "");
  d = d.replace(/^www\./, "");
  d = d.replace(/\/.*$/, "");
  d = d.replace(/:\d+$/, "");
  return d;
}

// ── Rendering ──

function render() {
  siteList.innerHTML = "";

  if (blockedSites.length === 0) {
    emptyState.classList.remove("hidden");
    return;
  }

  emptyState.classList.add("hidden");

  blockedSites.forEach((domain) => {
    const li = document.createElement("li");

    const span = document.createElement("span");
    span.className = "domain-text";
    span.textContent = domain;

    const removeBtn = document.createElement("button");
    removeBtn.className = "remove-btn";
    removeBtn.textContent = "\u00d7";
    removeBtn.title = "Unblock " + domain;
    removeBtn.addEventListener("click", () => removeSite(domain));

    li.appendChild(span);
    li.appendChild(removeBtn);
    siteList.appendChild(li);
  });
}

// ── Storage & sync ──

async function save() {
  await chrome.storage.local.set({ blockedSites });
  await chrome.runtime.sendMessage({ action: "syncRules", domains: blockedSites });
}

async function load() {
  const { blockedSites: stored = [] } = await chrome.storage.local.get("blockedSites");
  blockedSites = stored;
  render();
}

// ── Actions ──

async function addSite() {
  hideError();
  const domain = cleanDomain(domainInput.value);

  if (!domain) {
    showError("Please enter a domain.");
    return;
  }

  if (!isValidDomain(domain)) {
    showError("Invalid domain format. Use e.g. example.com");
    return;
  }

  if (blockedSites.includes(domain)) {
    showError("This site is already blocked.");
    return;
  }

  blockedSites.push(domain);
  blockedSites.sort();
  await save();
  render();
  domainInput.value = "";
  domainInput.focus();
}

async function removeSite(domain) {
  blockedSites = blockedSites.filter((d) => d !== domain);
  await save();
  render();
}

// ── Preset Picker ──

const PRESET_LABELS = {
  social: "Social Media",
  video: "Video Streaming",
  news: "News",
  shopping: "Shopping",
  gaming: "Gaming",
  chinapropaganda: "China Propaganda",
  russiapropaganda: "Russia Propaganda"
};

const presetPicker = document.getElementById("preset-picker");
const presetPickerTitle = document.getElementById("preset-picker-title");
const presetPickerList = document.getElementById("preset-picker-list");
const presetPickerClose = document.getElementById("preset-picker-close");
const presetPickerConfirm = document.getElementById("preset-picker-confirm");
const presetSelectAll = document.getElementById("preset-select-all");
const presetSelectNone = document.getElementById("preset-select-none");

let currentPresetDomains = [];

function openPresetPicker(category) {
  hideError();
  const domains = PRESETS[category] || [];
  currentPresetDomains = domains;

  presetPickerTitle.textContent = PRESET_LABELS[category] || category;
  presetPickerList.innerHTML = "";

  domains.forEach((domain) => {
    const li = document.createElement("li");
    const alreadyBlocked = blockedSites.includes(domain);

    const label = document.createElement("label");
    label.className = "preset-check-label";

    const cb = document.createElement("input");
    cb.type = "checkbox";
    cb.value = domain;
    cb.checked = !alreadyBlocked;
    cb.disabled = alreadyBlocked;

    const text = document.createElement("span");
    text.textContent = domain;
    if (alreadyBlocked) {
      text.className = "already-blocked";
      text.textContent = domain + " (already blocked)";
    }

    label.appendChild(cb);
    label.appendChild(text);
    li.appendChild(label);
    presetPickerList.appendChild(li);
  });

  presetPicker.classList.remove("hidden");
}

function closePresetPicker() {
  presetPicker.classList.add("hidden");
}

function toggleAllCheckboxes(checked) {
  presetPickerList.querySelectorAll("input[type=checkbox]:not(:disabled)").forEach((cb) => {
    cb.checked = checked;
  });
}

async function confirmPresetPicker() {
  const selected = [];
  presetPickerList.querySelectorAll("input[type=checkbox]:checked:not(:disabled)").forEach((cb) => {
    selected.push(cb.value);
  });

  if (selected.length > 0) {
    for (const domain of selected) {
      if (!blockedSites.includes(domain)) {
        blockedSites.push(domain);
      }
    }
    blockedSites.sort();
    await save();
    render();
  }

  closePresetPicker();
}

presetPickerClose.addEventListener("click", closePresetPicker);
presetPickerConfirm.addEventListener("click", confirmPresetPicker);
presetSelectAll.addEventListener("click", () => toggleAllCheckboxes(true));
presetSelectNone.addEventListener("click", () => toggleAllCheckboxes(false));

// ── Import / Export ──

function exportList() {
  const data = JSON.stringify({ blockedSites }, null, 2);
  const blob = new Blob([data], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "site-blocker-backup.json";
  a.click();
  URL.revokeObjectURL(url);
}

function triggerImport() {
  importFile.value = "";
  importFile.click();
}

async function handleImport(event) {
  hideError();
  const file = event.target.files[0];
  if (!file) return;

  try {
    const text = await file.text();
    const data = JSON.parse(text);
    const imported = data.blockedSites;

    if (!Array.isArray(imported)) {
      showError("Invalid file: expected { blockedSites: [...] }");
      return;
    }

    let added = 0;
    for (const domain of imported) {
      const clean = cleanDomain(String(domain));
      if (clean && isValidDomain(clean) && !blockedSites.includes(clean)) {
        blockedSites.push(clean);
        added++;
      }
    }

    if (added > 0) {
      blockedSites.sort();
      await save();
      render();
    }
  } catch {
    showError("Could not read file. Make sure it is valid JSON.");
  }
}

// ── Event listeners ──

addBtn.addEventListener("click", addSite);
domainInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") addSite();
});

// Preset buttons
document.querySelectorAll(".preset-btn").forEach((btn) => {
  btn.addEventListener("click", () => openPresetPicker(btn.dataset.preset));
});

// Import / Export
exportBtn.addEventListener("click", exportList);
importBtn.addEventListener("click", triggerImport);
importFile.addEventListener("change", handleImport);

// Initialize
load();
