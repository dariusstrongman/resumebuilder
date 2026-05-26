// Workday public job sites (*.myworkdayjobs.com).
// Workday is JS-heavy and uses data-automation-id attributes. Class names
// are unreliable. Use data-automation-id selectors where possible.

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
                '[data-automation-id="applyButton"]',
                '[data-automation-id="adventureButton"]',
                'a[role="button"][href*="apply"]',
                '[data-automation-id="jobPostingHeader"]'
            ]);
        },
        getJD: function () {
            const el = q([
                '[data-automation-id="jobPostingDescription"]',
                '[data-automation-id="job-posting-description"]',
                '[data-automation-id="job_posting_description"]',
                '.GWTCKEditor-Disabled',
                '[data-automation-id="jobPostingPage"]'
            ]);
            return txt(el);
        },
        getJobTitle: function () {
            const el = q([
                '[data-automation-id="jobPostingHeader"]',
                'h1[data-automation-id]',
                'h1.css-1uss5wd',
                'h1'
            ]);
            return txt(el);
        }
    };
})();
