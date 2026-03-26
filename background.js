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

// Pre-blocked sites on first install
const PRE_BLOCKED = [
  // Social media (minus LinkedIn)
  "facebook.com", "instagram.com", "twitter.com", "x.com",
  "tiktok.com", "snapchat.com", "reddit.com",
  "pinterest.com", "tumblr.com", "threads.net", "mastodon.social",
  "bsky.app",
  // China propaganda
  "cgtn.com", "chinadaily.com.cn", "globaltimes.cn",
  "xinhuanet.com", "news.cn", "ecns.cn", "cctv.com",
  "peoplesdaily.com.cn", "en.people.cn", "china.org.cn",
  "chinaqw.com", "cri.cn", "taihainet.com", "81.cn",
  "guancha.cn", "ifeng.com",
  // Russia propaganda
  "rt.com", "sputniknews.com", "sputnikglobe.com",
  "tass.com", "ria.ru", "iz.ru", "gazeta.ru",
  "vesti.ru", "rg.ru", "pravda.ru", "lenta.ru",
  "tsargrad.tv", "riafan.ru", "southfront.press",
  "strategic-culture.su", "journal-neo.su",
  // Deep red media
  "breitbart.com", "infowars.com", "newsmax.com", "oann.com",
  "thegatewaypundit.com", "dailywire.com", "theblaze.com",
  "naturalnews.com", "epochtimes.com", "ntd.com",
  "revolver.news", "zerohedge.com", "pjmedia.com",
  "townhall.com", "redstate.com", "americanthinker.com",
  "thefederalist.com", "nationalfile.com", "justthenews.com",
  "realclearpolitics.com"
];

// On install/update, sync rules from storage (pre-block on fresh install)
chrome.runtime.onInstalled.addListener(async (details) => {
  const { blockedSites = [], blockTimestamps = {} } = await chrome.storage.local.get(["blockedSites", "blockTimestamps"]);

  if (details.reason === "install") {
    // Fresh install — pre-block sites
    const now = Date.now();
    for (const domain of PRE_BLOCKED) {
      if (!blockedSites.includes(domain)) {
        blockedSites.push(domain);
        blockTimestamps[domain] = now;
      }
    }
    blockedSites.sort();
    await chrome.storage.local.set({ blockedSites, blockTimestamps });
  }

  await syncRules(blockedSites);
});

// Also sync on service worker startup (e.g. after browser restart)
(async () => {
  const { blockedSites = [] } = await chrome.storage.local.get("blockedSites");
  await syncRules(blockedSites);
})();
