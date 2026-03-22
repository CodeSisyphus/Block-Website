// Site Blocker — Background Service Worker
// All blocking is done via declarativeNetRequest for performance and privacy.

const RULE_OFFSET = 1; // Rule IDs start at 1

// Convert a domain string into a declarativeNetRequest rule
function createRule(id, domain) {
  const extensionUrl = chrome.runtime.getURL(
    `blocked/blocked.html?domain=${encodeURIComponent(domain)}`
  );
  return {
    id,
    priority: 1,
    action: {
      type: "redirect",
      redirect: { url: extensionUrl }
    },
    condition: {
      urlFilter: `||${domain}`,
      resourceTypes: ["main_frame"]
    }
  };
}

// Sync blocking rules with the stored blocked-sites list
async function syncRules(domains) {
  // Remove all existing dynamic rules first
  const existingRules = await chrome.declarativeNetRequest.getDynamicRules();
  const removeRuleIds = existingRules.map(r => r.id);

  // Build new rules
  const addRules = domains.map((domain, i) => createRule(i + RULE_OFFSET, domain));

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
