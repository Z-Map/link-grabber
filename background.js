const ACTIVE_TAB_KEY = 'activeTabId';

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'toggle') {
    handleToggle(message.active, message.tabId || sender.tab?.id);
  } else if (message.type === 'saveLink') {
    handleSaveLink(message.link).then(result => sendResponse(result));
    return true;
  } else if (message.type === 'getLinks') {
    handleGetLinks().then(links => sendResponse(links));
    return true;
  } else if (message.type === 'clearLinks') {
    handleClearLinks();
  } else if (message.type === 'getActiveState') {
    handleGetActiveState(message.tabId).then(active => sendResponse(active));
    return true;
  } else if (message.type === 'grabLinkFromContext') {
    handleSaveLink(message.link).then(result => sendResponse(result));
    return true;
  }
});

async function handleToggle(active, tabId) {
  const iconPath = active 
    ? { '16': 'icons/icon-16.png', '32': 'icons/icon-32.png', '48': 'icons/icon-48.png', '96': 'icons/icon-96.png', '128': 'icons/icon-128.png' }
    : { '16': 'icons/icon-inactive-16.png', '32': 'icons/icon-inactive-32.png', '48': 'icons/icon-inactive-48.png', '96': 'icons/icon-inactive-96.png', '128': 'icons/icon-inactive-128.png' };
  
  await chrome.action.setIcon({path: iconPath});
  
  if (active) {
    await chrome.storage.local.set({ [ACTIVE_TAB_KEY]: tabId });
  } else {
    await chrome.storage.local.remove(ACTIVE_TAB_KEY);
  }
}

async function handleSaveLink(link) {
  const data = await chrome.storage.local.get('links');
  const links = data.links || [];
  
  if (links.some(l => l.url === link.url)) {
    return false;
  }
  
  links.push({
    url: link.url,
    text: link.text || '',
    pageUrl: link.pageUrl || '',
    timestamp: Date.now()
  });
  await chrome.storage.local.set({ links });
  return true;
}

async function handleGetLinks() {
  const data = await chrome.storage.local.get('links');
  return data.links || [];
}

async function handleClearLinks() {
  await chrome.storage.local.set({ links: [] });
}

async function handleGetActiveState(tabId) {
  const data = await chrome.storage.local.get(ACTIVE_TAB_KEY);
  return data[ACTIVE_TAB_KEY] === tabId;
}

chrome.tabs.onRemoved.addListener(async (tabId) => {
  const data = await chrome.storage.local.get(ACTIVE_TAB_KEY);
  if (data[ACTIVE_TAB_KEY] === tabId) {
    await chrome.storage.local.remove(ACTIVE_TAB_KEY);
  }
});

chrome.tabs.onActivated.addListener(async (activeInfo) => {
  const data = await chrome.storage.local.get(ACTIVE_TAB_KEY);
  if (data[ACTIVE_TAB_KEY] && data[ACTIVE_TAB_KEY] !== activeInfo.tabId) {
    await chrome.storage.local.remove(ACTIVE_TAB_KEY);
    const iconPath = { '16': 'icons/icon-inactive-16.png', '32': 'icons/icon-inactive-32.png', '48': 'icons/icon-inactive-48.png', '96': 'icons/icon-inactive-96.png', '128': 'icons/icon-inactive-128.png' };
    await chrome.action.setIcon({path: iconPath});
    chrome.tabs.sendMessage(data[ACTIVE_TAB_KEY], { type: 'toggle', active: false });
  }
});

(async () => {
  const data = await chrome.storage.local.get(ACTIVE_TAB_KEY);
  const isActive = !!data[ACTIVE_TAB_KEY];
  const iconPath = isActive
    ? { '16': 'icons/icon-16.png', '32': 'icons/icon-32.png', '48': 'icons/icon-48.png', '96': 'icons/icon-96.png', '128': 'icons/icon-128.png' }
    : { '16': 'icons/icon-inactive-16.png', '32': 'icons/icon-inactive-32.png', '48': 'icons/icon-inactive-48.png', '96': 'icons/icon-inactive-96.png', '128': 'icons/icon-inactive-128.png' };
  await chrome.action.setIcon({path: iconPath});
})();

chrome.contextMenus.create({
  id: 'grab-link',
  title: 'Grab Link',
  contexts: ['link']
});

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId === 'grab-link' && info.linkUrl) {
    const result = await handleSaveLink({
      url: info.linkUrl,
      text: info.linkText || '',
      pageUrl: tab.url || ''
    });
    if (result) {
      chrome.tabs.sendMessage(tab.id, { type: 'linkGrabbed', link: info.linkUrl });
    }
  }
});
