const ACTIVE_TAB_KEY = 'activeTabId';

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'toggle') {
    handleToggle(message.active, sender.tab?.id);
  } else if (message.type === 'saveLink') {
    handleSaveLink(message.link);
  } else if (message.type === 'getLinks') {
    handleGetLinks().then(links => sendResponse(links));
    return true;
  } else if (message.type === 'clearLinks') {
    handleClearLinks();
  } else if (message.type === 'getActiveState') {
    handleGetActiveState().then(active => sendResponse(active));
    return true;
  }
});

async function handleToggle(active, tabId) {
  if (active) {
    await chrome.storage.local.set({ [ACTIVE_TAB_KEY]: tabId });
  } else {
    await chrome.storage.local.remove(ACTIVE_TAB_KEY);
  }
}

async function handleSaveLink(link) {
  const data = await chrome.storage.local.get('links');
  const links = data.links || [];
  links.push({
    url: link.url,
    timestamp: Date.now()
  });
  await chrome.storage.local.set({ links });
}

async function handleGetLinks() {
  const data = await chrome.storage.local.get('links');
  return data.links || [];
}

async function handleClearLinks() {
  await chrome.storage.local.set({ links: [] });
}

async function handleGetActiveState() {
  const data = await chrome.storage.local.get(ACTIVE_TAB_KEY);
  return !!data[ACTIVE_TAB_KEY];
}

chrome.tabs.onRemoved.addListener(async (tabId) => {
  const data = await chrome.storage.local.get(ACTIVE_TAB_KEY);
  if (data[ACTIVE_TAB_KEY] === tabId) {
    await chrome.storage.local.remove(ACTIVE_TAB_KEY);
  }
});
