# ATSHack Browser Extension

Adds a "Tailor with ATSHack" button next to the Apply button on LinkedIn, Indeed, Greenhouse, Lever, and Workday job postings. Click it and the job description is auto-imported into the ATSHack tailor form. One-click, no copy-paste.

## Architecture (Manifest V3)

- **Per-board content scripts** (`content/linkedin.js`, `indeed.js`, `greenhouse.js`, `lever.js`, `workday.js`): each sets `window.__ATSHACK_CONFIG` with that site's specific DOM selectors for the job description, job title, and the anchor element next to which the button gets injected.
- **Shared injector** (`content/inject.js`): reads `__ATSHACK_CONFIG`, builds and injects the styled button, handles SPA navigation, retries on DOM changes.
- **Site receiver** (`content/atshack-receiver.js`): runs on atshack.com. When the page is opened by the extension (`?pickup=1`), reads the stashed JD from `chrome.storage.local` and pre-fills the `#jobText` textarea.
- **Service worker** (`background.js`): minimal. Opens a welcome tab on first install.
- **Popup** (`popup/popup.html`): toolbar icon UI for users not on a supported page.

## Data flow

1. User views a job posting on, e.g., LinkedIn.
2. Content script injects the "Tailor with ATSHack" button next to the Apply button.
3. User clicks the button.
4. Job description text is extracted from the DOM and stashed in `chrome.storage.local` along with the job title.
5. A new tab opens to `https://www.atshack.com/?utm_source=extension&utm_medium=button&pickup=1&title=...`.
6. The atshack.com content script reads `chrome.storage.local`, pre-fills `#jobText`, shows a confirmation toast, and clears storage.

No data leaves the browser until the user manually proceeds with the tailor flow on atshack.com (the website itself is what handles the OpenAI call).

## Permissions, justified

- `activeTab`, `storage`: required for the data flow above.
- `host_permissions`: limited to the six supported job board domains plus atshack.com. No `<all_urls>`.

## Local development

1. Open Chrome → `chrome://extensions/`
2. Enable "Developer mode" (top right)
3. Click "Load unpacked"
4. Select the `extension/` directory
5. Visit a LinkedIn job posting. You should see "Tailor with ATSHack" next to the Apply button.

## Packaging for Chrome Web Store

Run from the repo root:
```
bash extension/build.sh
```
Produces `extension-build/atshack-extension-v1.0.0.zip` ready to upload to the Web Store developer dashboard.

## Per-board notes

| Board | Stability | Notes |
|---|---|---|
| LinkedIn | Brittle | Frequently A/B-tested. Multiple selector fallbacks in `linkedin.js`. |
| Indeed | Medium | Uses `#jobDescriptionText` (ID, stable). |
| Greenhouse | Low brittleness | Multi-tenant ATS; stable structure across companies. |
| Lever | Low brittleness | Same as Greenhouse. |
| Workday | High brittleness | Uses `data-automation-id` attributes which are more stable than classes. Still the riskiest. |

## Phase 2 (not in v1)

- ATS autofill for Pro users: pre-fills name, email, work history into Workday/Greenhouse/Lever application forms. Requires JWT auth bridge with atshack.com (stored in `chrome.storage`).
- Save-to-tracker: one-click to add the job to the ATSHack application tracker (Pro feature).

## Files

```
extension/
  manifest.json
  background.js              service worker (V3)
  content/
    inject.js                shared button injector
    inject.css               button styles
    linkedin.js
    indeed.js
    greenhouse.js
    lever.js
    workday.js
    atshack-receiver.js      runs on atshack.com to pick up JD
  popup/
    popup.html               toolbar popup
  icons/
    icon16.png  icon32.png  icon48.png  icon128.png
  README.md
  build.sh                   produces the .zip for Web Store upload
```
