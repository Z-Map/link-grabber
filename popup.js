let isActive = false;
let links = [];

const toggleBtn = document.getElementById('toggleBtn');
const savePageBtn = document.getElementById('savePageBtn');
const exportBtn = document.getElementById('exportBtn');
const exportMdBtn = document.getElementById('exportMdBtn');
const copyMdBtn = document.getElementById('copyMdBtn');
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
    
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'delete-btn';
    deleteBtn.innerHTML = '&times;';
    deleteBtn.title = 'Delete';
    deleteBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      deleteLink(link.url);
    });
    
    const textSpan = document.createElement('span');
    textSpan.className = 'link-text';
    textSpan.textContent = link.text || '(no text)';
    textSpan.title = link.text || '';
    
    const urlSpan = document.createElement('span');
    urlSpan.className = 'link-url';
    urlSpan.textContent = link.url;
    urlSpan.title = link.url;
    
    const pageSpan = document.createElement('span');
    pageSpan.className = 'link-page';
    pageSpan.textContent = link.pageUrl ? link.pageUrl : '';
    pageSpan.title = link.pageUrl || '';
    
    const timeSpan = document.createElement('span');
    timeSpan.className = 'link-time';
    timeSpan.textContent = formatTime(link.timestamp);
    
    li.appendChild(deleteBtn);
    li.appendChild(textSpan);
    li.appendChild(urlSpan);
    li.appendChild(pageSpan);
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

savePageBtn.addEventListener('click', async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  
  const result = await new Promise(resolve => {
    chrome.runtime.sendMessage({ 
      type: 'saveLink', 
      link: { 
        url: tab.url, 
        text: tab.title || '',
        pageUrl: '' 
      } 
    }, resolve);
  });
  
  if (result) {
    chrome.runtime.sendMessage({ type: 'getLinks' }, (updatedLinks) => {
      links = updatedLinks || [];
      renderLinks();
    });
  }
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

exportMdBtn.addEventListener('click', () => {
  if (links.length === 0) return;
  
  const md = generateMarkdown();
  
  const blob = new Blob([md], { type: 'text/markdown' });
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement('a');
  a.href = url;
  a.download = `links-${Date.now()}.md`;
  a.click();
  
  URL.revokeObjectURL(url);
});

copyMdBtn.addEventListener('click', async () => {
  if (links.length === 0) return;
  
  const md = generateMarkdown();
  await navigator.clipboard.writeText(md);
  
  const originalIcon = copyMdBtn.innerHTML;
  copyMdBtn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline></svg>`;
  setTimeout(() => {
    copyMdBtn.innerHTML = originalIcon;
  }, 1500);
});

function generateMarkdown() {
  const reversedLinks = links.slice().reverse();
  
  const grouped = {};
  const ungrouped = [];
  
  reversedLinks.forEach(link => {
    const source = link.pageUrl || '(no source)';
    if (!grouped[source]) grouped[source] = [];
    grouped[source].push(link);
  });
  
  let md = '# Captured Links\n\n';
  
  Object.entries(grouped).forEach(([source, sourceLinks]) => {
    if (sourceLinks.length > 1) {
      md += `## ${source}\n\n`;
      sourceLinks.forEach(link => {
        const text = link.text || link.url;
        md += `- [${text}](${link.url})\n`;
      });
      md += '\n';
    } else {
      ungrouped.push(sourceLinks[0]);
    }
  });
  
  if (ungrouped.length > 0) {
    md += '## Other\n\n';
    ungrouped.forEach(link => {
      const text = link.text || link.url;
      md += `- [${text}](${link.url})`;
      if (link.pageUrl) {
        md += ` (from ${link.pageUrl})`;
      }
      md += '\n';
    });
  }
  
  return md;
}

function deleteLink(url) {
  chrome.runtime.sendMessage({ type: 'deleteLink', url: url });
  links = links.filter(l => l.url !== url);
  renderLinks();
}

document.addEventListener('DOMContentLoaded', init);
