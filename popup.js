let isActive = false;
let links = [];

const toggleBtn = document.getElementById('toggleBtn');
const exportBtn = document.getElementById('exportBtn');
const clearBtn = document.getElementById('clearBtn');
const linksList = document.getElementById('linksList');
const linkCount = document.getElementById('linkCount');
const statusEl = document.getElementById('status');

let currentTabId = null;

async function init() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  currentTabId = tab.id;
  
  chrome.runtime.sendMessage({ type: 'getActiveState', tabId: currentTabId }, (active) => {
    isActive = !!active;
    updateUI();
  });
  
  chrome.runtime.sendMessage({ type: 'getLinks' }, (result) => {
    links = result || [];
    renderLinks();
  });
}

function updateUI() {
  if (isActive) {
    toggleBtn.textContent = 'Deactivate';
    toggleBtn.classList.add('active');
    statusEl.textContent = 'Active';
    statusEl.className = 'status active';
  } else {
    toggleBtn.textContent = 'Activate';
    toggleBtn.classList.remove('active');
    statusEl.textContent = 'Inactive';
    statusEl.className = 'status inactive';
  }
}

function renderLinks() {
  linksList.innerHTML = '';
  linkCount.textContent = links.length;
  
  if (links.length === 0) {
    linksList.innerHTML = '<li class="empty">No links captured yet</li>';
    return;
  }
  
  links.slice().reverse().forEach((link, index) => {
    const li = document.createElement('li');
    li.className = 'link-item';
    
    const urlSpan = document.createElement('span');
    urlSpan.className = 'link-url';
    urlSpan.textContent = link.url;
    urlSpan.title = link.url;
    
    const timeSpan = document.createElement('span');
    timeSpan.className = 'link-time';
    timeSpan.textContent = formatTime(link.timestamp);
    
    li.appendChild(urlSpan);
    li.appendChild(timeSpan);
    linksList.appendChild(li);
  });
}

function formatTime(timestamp) {
  const date = new Date(timestamp);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

toggleBtn.addEventListener('click', async () => {
  isActive = !isActive;
  
  chrome.runtime.sendMessage({ type: 'toggle', active: isActive, tabId: currentTabId });
  
  updateUI();
  
  chrome.tabs.sendMessage(currentTabId, { type: 'toggle', active: isActive });
});

exportBtn.addEventListener('click', () => {
  if (links.length === 0) return;
  
  const blob = new Blob([JSON.stringify(links, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement('a');
  a.href = url;
  a.download = `links-${Date.now()}.json`;
  a.click();
  
  URL.revokeObjectURL(url);
});

clearBtn.addEventListener('click', () => {
  if (links.length === 0) return;
  
  chrome.runtime.sendMessage({ type: 'clearLinks' });
  links = [];
  renderLinks();
});

document.addEventListener('DOMContentLoaded', init);
