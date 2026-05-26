// Minimal service worker. Manifest V3 requires top-level listener registration.
// First-install: open a welcome page on atshack.com so users see the product
// and know what the extension does.

chrome.runtime.onInstalled.addListener((details) => {
    if (details.reason === 'install') {
        chrome.tabs.create({
            url: 'https://www.atshack.com/?utm_source=extension&utm_medium=install'
        });
    }
});

// Toolbar icon click: if user is on a supported job board, the injected
// button is on the page. If they aren't, send them to atshack.com.
chrome.action.onClicked.addListener(async (tab) => {
    // Popup is configured in manifest, so this only fires when popup is missing.
    // Keep as a no-op fallback. The popup handles the UX.
});
