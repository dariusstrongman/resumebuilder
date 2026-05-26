// Lever-hosted boards (jobs.lever.co).
// JD body: .section-wrapper .section, .content, .posting-page
// Title: .posting-headline h2 or .posting-name
// Apply button: a.postings-btn[href*="apply"] or .template-btn-submit

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
            return q([
                'a.postings-btn[href*="apply"]',
                '.template-btn-submit',
                '.posting-headline'
            ]);
        },
        getJD: function () {
            const els = document.querySelectorAll('.section-wrapper .section, .posting-page .section, .content');
            if (!els.length) {
                const e = q(['.posting', '.posting-page', '.content']);
                return txt(e);
            }
            return Array.from(els).map(e => txt(e)).filter(Boolean).join('\n\n');
        },
        getJobTitle: function () {
            const el = q([
                '.posting-headline h2',
                '.posting-name',
                'h2'
            ]);
            return txt(el);
        }
    };
})();
