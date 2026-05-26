// SmartRecruiters job posting page config.

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
                'a#st-apply',
                'button.primary.apply',
                'a[href*="apply"]',
                'button[class*="apply"]'
            ]);
            if (apply) { console.log('[ATSHack] anchor: SR apply'); return apply; }
            const title = q([
                'h1[itemprop="title"]',
                'h1.job-title',
                'h1'
            ]);
            if (title) { console.log('[ATSHack] anchor: SR title h1'); return title; }
            return null;
        },
        getJD: function () {
            const el = q([
                'div[itemprop="description"]',
                'div#st-jobDescription',
                'section.job-sections',
                'div.job-description'
            ]);
            return txt(el);
        },
        getJobTitle: function () {
            const el = q([
                'h1[itemprop="title"]',
                'h1.job-title',
                'h1'
            ]);
            return txt(el);
        }
    };
})();
