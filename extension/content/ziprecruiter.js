// ZipRecruiter job posting page config.

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
                'a.job_apply_button',
                'button[data-testid="job-apply-button"]',
                'a[class*="apply"]',
                'button[class*="apply"]'
            ]);
            if (apply) { console.log('[ATSHack] anchor: Zip apply'); return apply; }
            const title = q(['h1.job_title', 'h1[class*="job_title"]', 'h1']);
            if (title) { console.log('[ATSHack] anchor: Zip title h1'); return title; }
            return null;
        },
        getJD: function () {
            const el = q([
                'div.job_description',
                'div[class*="job-description"]',
                'div[class*="job_description"]',
                'section[class*="description"]'
            ]);
            return txt(el);
        },
        getJobTitle: function () {
            const el = q(['h1.job_title', 'h1[class*="job_title"]', 'h1']);
            return txt(el);
        }
    };
})();
