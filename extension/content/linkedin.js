// LinkedIn job posting page config.
// Job description lives in .jobs-description__content or .jobs-description-content
// Title lives in .job-details-jobs-unified-top-card__job-title h1 (current) or .topcard__title (legacy)
// The "Apply" / "Easy Apply" button is .jobs-apply-button (anchor for our button).

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
                '.jobs-apply-button',
                'button[aria-label*="Apply"]',
                '.jobs-s-apply',
                '.jobs-unified-top-card__container--two-pane button'
            ]);
        },
        getJD: function () {
            const el = q([
                '.jobs-description__content .jobs-description-content__text',
                '.jobs-description-content__text',
                '.jobs-description__content',
                '.jobs-box__html-content',
                '.show-more-less-html__markup'
            ]);
            return txt(el);
        },
        getJobTitle: function () {
            const el = q([
                '.job-details-jobs-unified-top-card__job-title h1',
                '.job-details-jobs-unified-top-card__job-title',
                '.jobs-unified-top-card__job-title',
                '.topcard__title',
                'h1'
            ]);
            return txt(el);
        }
    };
})();
