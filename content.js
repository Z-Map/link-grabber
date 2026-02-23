let isActive = false;

function activate() {
  isActive = true;
  document.body.classList.add('link-grabber-active');
}

function deactivate() {
  isActive = false;
  document.body.classList.remove('link-grabber-active');
}

function handleLinkClick(e) {
  if (!isActive) return;
  
  const anchor = e.target.closest('a');
  if (!anchor) return;
  
  e.preventDefault();
  e.stopPropagation();
  
  const link = {
    url: anchor.href,
    text: anchor.textContent?.trim() || ''
  };
  
  if (link.url && !link.url.startsWith('javascript:') && !link.url.startsWith('mailto:')) {
    chrome.runtime.sendMessage({ type: 'saveLink', link });
    
    const indicator = document.createElement('div');
    indicator.className = 'link-grabber-indicator';
    indicator.textContent = 'Link captured!';
    document.body.appendChild(indicator);
    setTimeout(() => indicator.remove(), 1500);
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

chrome.runtime.sendMessage({ type: 'getActiveState' }, (active) => {
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
