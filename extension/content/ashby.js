// Ashby ATS job posting page config (jobs.ashbyhq.com/<company>/...).

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
                'a[data-testing="apply-button"]',
                'a[href*="application"]',
                'button.ashby-apply-button',
                'a[class*="apply"]',
                'button[class*="apply"]'
            ]);
            if (apply) { console.log('[ATSHack] anchor: Ashby apply'); return apply; }
            const title = q(['h1[class*="job-title"]', 'h1[class*="JobTitle"]', 'h1']);
            if (title) { console.log('[ATSHack] anchor: Ashby title h1'); return title; }
            return null;
        },
        getJD: function () {
            const el = q([
                'div[class*="job-description-container"]',
                'div.ashby-job-description',
                'div[class*="JobDescription"]',
                'div[class*="job-posting"]',
                'main'
            ]);
            return txt(el);
        },
        getJobTitle: function () {
            const el = q(['h1[class*="job-title"]', 'h1[class*="JobTitle"]', 'h1']);
            return txt(el);
        }
    };
})();
