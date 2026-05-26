// Indeed job posting page config.
// Modern Indeed: #jobDescriptionText for the JD body. .jobsearch-JobInfoHeader-title for title.
// Apply button: button[data-testid*="apply"] or .indeed-apply-button.

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
                'button[data-testid="apply-now-button"]',
                'button[data-testid="apply-button"]',
                '#indeedApplyButton',
                '.indeed-apply-button',
                '.jobsearch-IndeedApplyButton-newDesign',
                '.jobsearch-JobInfoHeader-title-container'
            ]);
        },
        getJD: function () {
            const el = q([
                '#jobDescriptionText',
                '[data-testid="jobDescriptionText"]',
                '.jobsearch-jobDescriptionText',
                '.jobsearch-JobComponent-description'
            ]);
            return txt(el);
        },
        getJobTitle: function () {
            const el = q([
                '[data-testid="jobsearch-JobInfoHeader-title"]',
                '.jobsearch-JobInfoHeader-title',
                'h1.jobsearch-JobInfoHeader-title',
                'h1'
            ]);
            return txt(el);
        }
    };
})();
