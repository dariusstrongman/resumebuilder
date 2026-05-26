// Shared injection logic across all job boards.
// Each board-specific script (linkedin.js, indeed.js, etc.) sets
// window.__ATSHACK_CONFIG with: { selectors: [...], buttonAnchor: fn, getJD: fn, getJobTitle: fn }
// then this script handles inserting the button and wiring the click.

(function () {
    'use strict';
    if (window.__ATSHACK_INJECTED) return;
    window.__ATSHACK_INJECTED = true;
    console.log('[ATSHack] content script loaded on', location.hostname);

    const SITE_URL = 'https://www.atshack.com';
    const BTN_ID = 'atshack-tailor-btn';

    function findAnchor() {
        const cfg = window.__ATSHACK_CONFIG;
        if (!cfg || typeof cfg.buttonAnchor !== 'function') return null;
        try { return cfg.buttonAnchor(); } catch (e) { return null; }
    }

    function extractJD() {
        const cfg = window.__ATSHACK_CONFIG;
        if (!cfg || typeof cfg.getJD !== 'function') return '';
        try { return (cfg.getJD() || '').trim(); } catch (e) { return ''; }
    }

    function extractTitle() {
        const cfg = window.__ATSHACK_CONFIG;
        if (!cfg || typeof cfg.getJobTitle !== 'function') return '';
        try { return (cfg.getJobTitle() || '').trim(); } catch (e) { return ''; }
    }

    function buildButton() {
        const btn = document.createElement('button');
        btn.id = BTN_ID;
        btn.type = 'button';
        btn.className = 'atshack-btn';
        btn.setAttribute('aria-label', 'Tailor this job with ATSHack');
        btn.innerHTML =
            '<span class="atshack-btn__tile">ATS</span>' +
            '<span class="atshack-btn__label">Tailor with ATSHack</span>' +
            '<span class="atshack-btn__price">$1</span>';
        btn.addEventListener('click', onClick);
        return btn;
    }

    function onClick(e) {
        e.preventDefault();
        e.stopPropagation();
        const jd = extractJD();
        const title = extractTitle();
        if (!jd || jd.length < 80) {
            // Fail gracefully: just open ATSHack with no prefill.
            window.open(SITE_URL + '/?utm_source=extension&utm_medium=button&jd_missing=1', '_blank', 'noopener');
            return;
        }
        // Stash to chrome.storage so the homepage can read large JD payloads
        // without hitting URL length limits.
        try {
            chrome.storage.local.set({
                __atshack_pending: {
                    jd: jd,
                    title: title,
                    source: location.hostname,
                    ts: Date.now()
                }
            }, () => {
                const url = SITE_URL + '/?utm_source=extension&utm_medium=button&pickup=1' +
                    (title ? '&title=' + encodeURIComponent(title.slice(0, 200)) : '');
                window.open(url, '_blank', 'noopener');
            });
        } catch (err) {
            // Fallback: short JD via URL param.
            const url = SITE_URL + '/?utm_source=extension&utm_medium=button&jd=' +
                encodeURIComponent(jd.slice(0, 6000));
            window.open(url, '_blank', 'noopener');
        }
    }

    function tryInject() {
        if (document.getElementById(BTN_ID)) return true;
        const anchor = findAnchor();
        if (!anchor) return false;
        const btn = buildButton();
        const cfg = window.__ATSHACK_CONFIG || {};
        const mode = cfg.insertMode || 'after';
        if (mode === 'appendTo') {
            anchor.appendChild(btn);
        } else if (mode === 'prependTo') {
            anchor.insertBefore(btn, anchor.firstChild);
        } else {
            anchor.insertAdjacentElement('afterend', btn);
        }
        console.log('[ATSHack] button injected (mode=' + mode + ')');
        return true;
    }

    // Single-flight retry loop. Only one retry chain is ever in flight,
    // so DOM mutations cannot pile up parallel chains on heavy SPA pages.
    let attempts = 0;
    let retryTimer = null;
    let retryActive = false;
    const MAX_ATTEMPTS = 30;
    const RETRY_DELAY_MS = 500;

    function stopRetrying() {
        if (retryTimer) { clearTimeout(retryTimer); retryTimer = null; }
        retryActive = false;
    }

    function retryLoop() {
        if (tryInject()) { stopRetrying(); return; }
        attempts += 1;
        if (attempts >= MAX_ATTEMPTS) { stopRetrying(); return; }
        retryTimer = setTimeout(() => { retryTimer = null; retryLoop(); }, RETRY_DELAY_MS);
    }

    function startRetrying() {
        if (retryActive) return; // already running
        retryActive = true;
        attempts = 0;
        retryLoop();
    }

    startRetrying();

    // Debounced + capped observer. Checks at most once per second.
    // Disconnects once the button is in place; reconnects on navigation.
    let observerTick = null;
    const observer = new MutationObserver(() => {
        if (observerTick) return;
        observerTick = setTimeout(() => {
            observerTick = null;
            if (!document.getElementById(BTN_ID)) startRetrying();
        }, 1000);
    });

    function observePage() {
        try {
            observer.observe(document.body, { childList: true, subtree: false });
        } catch (e) {}
    }
    observePage();

    // SPA navigation: button anchor may change. Re-run injection.
    function onNavChange() {
        // Remove the previous button if it exists; LinkedIn may have
        // detached its old anchor and our button could now be orphaned.
        const old = document.getElementById(BTN_ID);
        if (old && !document.body.contains(old.parentNode)) {
            try { old.remove(); } catch (e) {}
        }
        startRetrying();
    }
    window.addEventListener('popstate', onNavChange);
    const origPush = history.pushState;
    history.pushState = function () {
        const r = origPush.apply(this, arguments);
        setTimeout(onNavChange, 600);
        return r;
    };
})();
