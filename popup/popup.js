// Site Blocker — Popup Script

const domainInput = document.getElementById("domain-input");
const addBtn = document.getElementById("add-btn");
const errorMsg = document.getElementById("error-msg");
const siteList = document.getElementById("site-list");
const emptyState = document.getElementById("empty-state");

let blockedSites = [];

// ── Helpers ──

function showError(msg) {
  errorMsg.textContent = msg;
  errorMsg.classList.remove("hidden");
}

function hideError() {
  errorMsg.classList.add("hidden");
}

// Basic domain validation: letters, numbers, dots, hyphens
function isValidDomain(str) {
  return /^([a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/.test(str);
}

// Strip protocol, www, paths, etc. to extract the bare domain
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

// ── Event listeners ──

addBtn.addEventListener("click", addSite);
domainInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") addSite();
});

// Initialize
load();
