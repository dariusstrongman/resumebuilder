// Dice job posting page config (www.dice.com/job-detail/...).

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
                'button#apply-button',
                'a[data-analytics-action="apply-now"]',
                'button[class*="apply"]',
                'a[class*="apply"]'
            ]);
            if (apply) { console.log('[ATSHack] anchor: Dice apply'); return apply; }
            const title = q(['h1#jobTitle', 'h1[data-cy="jobTitle"]', 'h1']);
            if (title) { console.log('[ATSHack] anchor: Dice title h1'); return title; }
            return null;
        },
        getJD: function () {
            const el = q([
                'div#jobDescription',
                'div.job-description',
                'div[data-cy="jobDescription"]',
                'section[class*="description"]'
            ]);
            return txt(el);
        },
        getJobTitle: function () {
            const el = q(['h1#jobTitle', 'h1[data-cy="jobTitle"]', 'h1']);
            return txt(el);
        }
    };
})();
