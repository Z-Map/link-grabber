let isActive = false;
let currentDomain = null;

function activate() {
  isActive = true;
  currentDomain = window.location.hostname;
  document.body.classList.add('link-grabber-active');
}

function deactivate() {
  isActive = false;
  currentDomain = null;
  document.body.classList.remove('link-grabber-active');
}

function extractYouTubeRedirect(url) {
  try {
    const urlObj = new URL(url);
    if (urlObj.hostname.includes('youtube.com') && urlObj.pathname === '/redirect') {
      const qParam = urlObj.searchParams.get('q');
      if (qParam) {
        return qParam;
      }
    }
  } catch (e) {}
  return null;
}

function getDomain(url) {
  try {
    return new URL(url).hostname;
  } catch (e) {
    return null;
  }
}

function isSameDomain(url) {
  if (!currentDomain || !url) return false;
  const linkDomain = getDomain(url);
  if (!linkDomain) return false;
  return linkDomain === currentDomain || linkDomain.endsWith('.' + currentDomain);
}

function showIndicator(message) {
  const indicator = document.createElement('div');
  indicator.className = 'link-grabber-indicator';
  indicator.textContent = message;
  document.body.appendChild(indicator);
  setTimeout(() => indicator.remove(), 1500);
}

function handleLinkClick(e) {
  if (!isActive) return;
  
  const anchor = e.target.closest('a');
  if (!anchor) return;
  
  let url = anchor.href;
  
  const youtubeRedirect = extractYouTubeRedirect(url);
  if (youtubeRedirect) {
    url = youtubeRedirect;
  }
  
  if (isSameDomain(url)) {
    return;
  }
  
  if (url && !url.startsWith('javascript:') && !url.startsWith('mailto:')) {
    e.preventDefault();
    e.stopPropagation();
    
    const link = {
      url: url,
      text: anchor.textContent?.trim() || ''
    };
    
    chrome.runtime.sendMessage({ type: 'saveLink', link }, (saved) => {
      if (saved === false) {
        showIndicator('Link already captured!');
      } else {
        showIndicator('Link captured!');
      }
    });
  }
}

function handleKeyDown(e) {
  if (e.key === 'Escape' && isActive) {
    deactivate();
    chrome.runtime.sendMessage({ type: 'toggle', active: false });
  }
}

document.addEventListener('click', handleLinkClick, true);
document.addEventListener('keydown', handleKeyDown);

chrome.runtime.sendMessage({ type: 'getActiveState', tabId: null }, (active) => {
  if (active) {
    activate();
  }
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'toggle') {
    if (message.active) {
      activate();
    } else {
      deactivate();
    }
  }
});
