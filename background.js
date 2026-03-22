// Site Blocker — Background Service Worker
// All blocking is done via declarativeNetRequest for performance and privacy.

const RULE_OFFSET = 1; // Rule IDs start at 1

// Each domain gets two rules: one for the exact domain, one for all subdomains.
// Rule IDs are assigned as: domain index * 2 + RULE_OFFSET (exact), +1 (subdomains).
function createRules(index, domain) {
  const extensionUrl = chrome.runtime.getURL(
    `blocked/blocked.html?domain=${encodeURIComponent(domain)}`
  );
  const baseId = index * 2 + RULE_OFFSET;
  return [
    {
      id: baseId,
      priority: 1,
      action: { type: "redirect", redirect: { url: extensionUrl } },
      condition: {
        urlFilter: `||${domain}/`,
        resourceTypes: ["main_frame"]
      }
    },
    {
      id: baseId + 1,
      priority: 1,
      action: { type: "redirect", redirect: { url: extensionUrl } },
      condition: {
        urlFilter: `||.${domain}/`,
        resourceTypes: ["main_frame"]
      }
    }
  ];
}

// Sync blocking rules with the stored blocked-sites list
async function syncRules(domains) {
  const existingRules = await chrome.declarativeNetRequest.getDynamicRules();
  const removeRuleIds = existingRules.map(r => r.id);

  const addRules = domains.flatMap((domain, i) => createRules(i, domain));

  await chrome.declarativeNetRequest.updateDynamicRules({
    removeRuleIds,
    addRules
  });
}

// Listen for messages from the popup
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.action === "syncRules") {
    syncRules(message.domains).then(() => sendResponse({ success: true }));
    return true; // keep channel open for async response
  }
});

// On install/update, sync rules from storage
chrome.runtime.onInstalled.addListener(async () => {
  const { blockedSites = [] } = await chrome.storage.local.get("blockedSites");
  await syncRules(blockedSites);
});

// Also sync on service worker startup (e.g. after browser restart)
(async () => {
  const { blockedSites = [] } = await chrome.storage.local.get("blockedSites");
  await syncRules(blockedSites);
})();
