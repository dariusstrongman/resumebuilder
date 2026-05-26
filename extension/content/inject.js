// Shared injection logic across all job boards.
// Each board-specific script (linkedin.js, indeed.js, etc.) sets
// window.__ATSHACK_CONFIG with: { selectors: [...], buttonAnchor: fn, getJD: fn, getJobTitle: fn }
// then this script handles inserting the button and wiring the click.

(function () {
    'use strict';
    if (window.__ATSHACK_INJECTED) return;
    window.__ATSHACK_INJECTED = true;

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
        anchor.insertAdjacentElement('afterend', btn);
        return true;
    }

    // Initial attempt + retry on DOM mutations (job boards are SPAs).
    let attempts = 0;
    function retryLoop() {
        if (tryInject()) return;
        attempts += 1;
        if (attempts < 40) setTimeout(retryLoop, 400);
    }
    retryLoop();

    const observer = new MutationObserver(() => {
        if (!document.getElementById(BTN_ID)) {
            attempts = 0;
            retryLoop();
        }
    });
    observer.observe(document.body, { childList: true, subtree: true });

    // SPA navigation: re-run on history changes.
    window.addEventListener('popstate', () => { attempts = 0; retryLoop(); });
    const origPush = history.pushState;
    history.pushState = function () {
        const r = origPush.apply(this, arguments);
        attempts = 0;
        setTimeout(retryLoop, 600);
        return r;
    };
})();
