// Wellfound (formerly AngelList Talent) job posting page config.

(function () {
    'use strict';
    function q(selectors) {
        for (const s of selectors) {
            const el = document.querySelector(s);
            if (el) return el;
        }
        return null;
    }
    function txt(el) {
        return el ? (el.innerText || el.textContent || '').trim() : '';
    }
    window.__ATSHACK_CONFIG = {
        buttonAnchor: function () {
            const apply = q([
                'button[data-test="job-apply-button"]',
                'a[href*="/apply/"]',
                'button[class*="apply"]'
            ]);
            if (apply) { console.log('[ATSHack] anchor: Wellfound apply'); return apply; }
            const title = q([
                'h1[class*="job-title"]',
                'h1[class*="JobTitle"]',
                'h1'
            ]);
            if (title) { console.log('[ATSHack] anchor: Wellfound title h1'); return title; }
            return null;
        },
        getJD: function () {
            const el = q([
                'div[class*="job-description"]',
                'div.job-description-container',
                'div[class*="JobDescription"]',
                'section[class*="description"]'
            ]);
            return txt(el);
        },
        getJobTitle: function () {
            const el = q([
                'h1[class*="job-title"]',
                'h1[class*="JobTitle"]',
                'h1'
            ]);
            return txt(el);
        }
    };
})();
