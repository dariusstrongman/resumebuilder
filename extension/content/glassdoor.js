// Glassdoor job posting page config.
// Glassdoor uses dynamic class names and bot detection. Rely on
// data-test attributes which are more stable than class names.

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
                'button[data-test="apply-button"]',
                'a[data-test="apply-button"]',
                'button[class*="apply"]',
                'a[class*="apply"]'
            ]);
            if (apply) { console.log('[ATSHack] anchor: Glassdoor apply'); return apply; }
            const title = q([
                'h1[data-test="job-title"]',
                'div[class*="JobDetails"] h1',
                'h1'
            ]);
            if (title) { console.log('[ATSHack] anchor: Glassdoor title h1'); return title; }
            return null;
        },
        getJD: function () {
            const el = q([
                'div[class*="jobDescriptionContent"]',
                '#JobDescriptionContainer',
                'div[class*="JobDescription"]',
                'section.description'
            ]);
            return txt(el);
        },
        getJobTitle: function () {
            const el = q([
                'h1[data-test="job-title"]',
                'div[class*="JobDetails"] h1',
                'h1'
            ]);
            return txt(el);
        }
    };
})();
