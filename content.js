const UI_ID = 'link-grabber-ui';
const STYLE_ID = 'link-grabber-styles';
const ICON_ID = 'link-grabber-active-icon';
const NOTIFY_ID = 'link-grabber-notify';

let isActive = false;
let currentDomain = null;

function injectStyles() {
  const existing = document.getElementById(STYLE_ID);
  if (existing) existing.remove();
  
  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = `
    #${ICON_ID} {
      position: fixed;
      top: 0px;
      right: 0px;
      width: 6vh;
      height: 6vh;
      background: #4caf50;
      border-radius: 0 0 0 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 999999;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
    }
    a.${UI_ID}-captured {
      position: relative !important;
      display: inline !important;
      overflow: clip !important;
    }
    a.${UI_ID}-captured::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: linear-gradient(90deg, transparent 0%, rgba(76, 175, 80, 0.8) 50%, transparent 100%);
      animation: ${UI_ID}-scan 0.5s ease-out forwards;
      pointer-events: none;
      z-index: 999998;
    }
    @keyframes ${UI_ID}-scan {
      0% { transform: translateX(-100%); }
      100% { transform: translateX(100%); }
    }
    #${NOTIFY_ID} {
      position: fixed;
      top: 1.6vh;
      right: 8vh;
      background: #333;
      color: #fff;
      padding: 0.2em 0.5em;
      border-radius: 8px;
      font-size: 2vh;
      font-weight: 500;
      z-index: 999999;
      animation: ${UI_ID}-fade 1.5s ease forwards;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
      display: inline-block;
      max-width: 200px;
      white-space: nowrap;
    }
    #${NOTIFY_ID}.success { background: #4caf50; }
    #${NOTIFY_ID}.duplicate { background: #ff9800; }
    @keyframes ${UI_ID}-fade {
      0% { opacity: 0; transform: translateY(-10px); }
      15% { opacity: 1; transform: translateY(0); }
      85% { opacity: 1; transform: translateY(0); }
      100% { opacity: 0; transform: translateY(-10px); }
    }
  `;
  (document.head || document.documentElement).appendChild(style);
}

function showIcon() {
  if (document.getElementById(ICON_ID)) return;
  
  const icon = document.createElement('div');
  icon.id = ICON_ID;
  icon.innerHTML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg>`;
  document.body.appendChild(icon);
}

function hideIcon() {
  const icon = document.getElementById(ICON_ID);
  if (icon) icon.remove();
}

function showNotification(message, isSuccess = true) {
  const existing = document.getElementById(NOTIFY_ID);
  if (existing) existing.remove();
  
  const notify = document.createElement('div');
  notify.id = NOTIFY_ID;
  notify.textContent = message;
  notify.className = isSuccess ? 'success' : 'duplicate';
  document.body.appendChild(notify);
  
  setTimeout(() => notify.remove(), 1500);
}

function applyLinkEffect(anchor) {
  anchor.classList.add(`${UI_ID}-captured`);
  setTimeout(() => anchor.classList.remove(`${UI_ID}-captured`), 500);
}

function cleanup() {
  hideIcon();
  const notify = document.getElementById(NOTIFY_ID);
  if (notify) notify.remove();
}

function activate() {
  isActive = true;
  currentDomain = window.location.hostname;
  document.body.classList.add('link-grabber-active');
  injectStyles();
  showIcon();
}

function deactivate() {
  isActive = false;
  currentDomain = null;
  document.body.classList.remove('link-grabber-active');
  cleanup();
}

function extractYouTubeRedirect(url) {
  try {
    const urlObj = new URL(url);
    if (urlObj.hostname.includes('youtube.com') && urlObj.pathname === '/redirect') {
      const qParam = urlObj.searchParams.get('q');
      if (qParam) return qParam;
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

function handleLinkClick(e) {
  if (!isActive) return;
  
  const anchor = e.target.closest('a');
  if (!anchor) return;
  
  let url = anchor.href;
  
  const youtubeRedirect = extractYouTubeRedirect(url);
  if (youtubeRedirect) url = youtubeRedirect;
  
  if (isSameDomain(url)) return;
  
  if (url && !url.startsWith('javascript:') && !url.startsWith('mailto:')) {
    e.preventDefault();
    e.stopPropagation();
    
    const link = { url, text: anchor.textContent?.trim() || '' };
    
    chrome.runtime.sendMessage({ type: 'saveLink', link }, (saved) => {
      if (saved === false) {
        showNotification('Already captured!', false);
      } else {
        showNotification('Link captured!', true);
        applyLinkEffect(anchor);
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

injectStyles();

chrome.runtime.sendMessage({ type: 'getActiveState', tabId: null }, (active) => {
  if (active) activate();
});

chrome.runtime.onMessage.addListener((message) => {
  if (message.type === 'toggle') {
    if (message.active) activate();
    else deactivate();
  }
});
