# Link Grabber Firefox Extension

## Project Overview
A Firefox extension that allows users to temporarily intercept and store link clicks instead of navigating to them. Users can toggle the mode, collect links, and export them for later use.

## Key Features
- Toggle link capture mode on/off via button or Escape key
- Intercept all link clicks when active
- Store captured links with timestamps
- View collected links in extension popup
- Export links (JSON format)
- Works across all websites

## Architecture

### Components
1. **Popup UI** - Main interface for toggle, viewing, and exporting links
2. **Content Script** - Injected into web pages to intercept clicks
3. **Background Script** - State management and message coordination
4. **Storage** - Persistent link storage using chrome.storage.local

### Data Flow
```
User clicks toggle button → Background → Content Script
Link clicked (when active) → Content Script → Background → Storage
Export request → Popup → Background → Storage → JSON file
```

## File Structure
```
link-grabber/
├── manifest.json
├── background.js
├── content.js
├── popup.html
├── popup.js
└── popup.css
```

## Implementation Plan

### Phase 1: Foundation
1. Create project directory structure
2. Write manifest.json with permissions (storage, activeTab, tabs)
3. Set up basic popup HTML with toggle button

### Phase 2: Core Logic
1. Implement background.js:
   - Message listeners for toggle, saveLink, getLinks, clearLinks
   - Link storage functions using chrome.storage.local
   - Tab coordination for content script communication

2. Implement content.js:
   - Activation state management
   - Event listeners for link clicks (capture phase)
   - Link URL extraction and message sending
   - Escape key listener for deactivation
   - Dynamic event listener attachment/removal

### Phase 3: User Interface
1. Complete popup.html:
   - Toggle button with visual state
   - Link list display (scrollable)
   - Export button
   - Clear button

2. Implement popup.js:
   - Toggle button click handler
   - Link list rendering
   - Export to JSON functionality
   - Clear all links functionality
   - UI state updates (active/inactive indicator)

3. Style with popup.css:
   - Responsive layout
   - Button states
   - Scrollable link list
   - Visual feedback for active state

### Phase 4: Testing & Refinement
1. Test on various websites
2. Verify link interception works correctly
3. Test export functionality
4. Check keyboard shortcuts
5. Handle edge cases (iframes, special links, etc.)

## Technical Details

### Permissions Required
- `storage` - For persisting links
- `activeTab` - For content script injection
- `tabs` - For tab management

### Storage Schema
```json
{
  "links": [
    {
      "url": "https://example.com",
      "timestamp": 1234567890
    }
  ]
}
```

### Content Script Strategy
- Use event capture phase (`addEventListener(..., true)`)
- `e.target.closest('a')` to find anchor element
- `e.preventDefault()` and `e.stopPropagation()` to block navigation
- Injected via content_scripts in manifest with `run_at: "document_start"`

### Communication Patterns
- Background → Content: Toggle activation state
- Content → Background: Save captured link URL
- Popup → Background: Get links, clear links
- Background → Popup: Return link data

## Testing Checklist
- [ ] Toggle button activates/deactivates mode
- [ ] Escape key deactivates mode
- [ ] Link clicks are captured and stored
- [ ] Original navigation is prevented when active
- [ ] Links display correctly in popup
- [ ] Export creates downloadable JSON file
- [ ] Clear button removes all stored links
- [ ] Works across different websites
- [ ] Persists across browser restarts

## Future Enhancements
- Category/tag system for links
- Export to CSV/HTML formats
- Link notes/comments
- Search/filter functionality
- Duplicate link detection
- Link preview in popup
- Batch operations (delete selected links)
