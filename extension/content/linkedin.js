// LinkedIn job posting page config.
// Multi-strategy anchor finding because LinkedIn A/B tests its layout
// constantly and class names drift. Falls back to finding the Apply
// button by visible text content.

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
    // Walk all buttons/anchors and find one whose visible text starts with "Apply" or "Easy Apply".
    function findApplyByText() {
        const candidates = document.querySelectorAll(
            'button, a[role="button"], a.jobs-apply-button, [data-control-name*="apply"]'
        );
        for (const el of candidates) {
            const t = (el.innerText || el.textContent || '').trim().toLowerCase();
            if (!t) continue;
            if (t === 'apply' || t === 'easy apply' || t.startsWith('apply ') || t.startsWith('easy apply')) {
                // Skip our own button if it ever gets here.
                if (el.id === 'atshack-tailor-btn') continue;
                // Skip the LinkedIn Premium "Tailor my resume" item if present.
                if (t.includes('tailor my resume')) continue;
                return el;
            }
        }
        return null;
    }
    window.__ATSHACK_CONFIG = {
        // Default 'after' mode: anchor.insertAdjacentElement('afterend', btn)
        buttonAnchor: function () {
            // Best target: the Save button. Sits after Apply in the row.
            const save = document.querySelector('button.jobs-save-button');
            if (save && save.id !== 'atshack-tailor-btn') {
                console.log('[ATSHack] anchor: jobs-save-button');
                return save;
            }
            const saveAria = Array.from(
                document.querySelectorAll('button[aria-label*="Save"], button[aria-label*="Saved"]')
            ).find(b => b.id !== 'atshack-tailor-btn');
            if (saveAria) {
                console.log('[ATSHack] anchor: aria Save');
                return saveAria;
            }
            // Fallback: job title H1 (always visible above the row).
            const h1 = document.querySelector(
                'h1.job-details-jobs-unified-top-card__job-title, .job-details-jobs-unified-top-card__job-title h1, .jobs-unified-top-card__job-title, h1.t-24'
            );
            if (h1) {
                console.log('[ATSHack] anchor: job title h1');
                return h1;
            }
            console.warn('[ATSHack] no anchor found yet, will retry');
            return null;
        },
        getJD: function () {
            const el = q([
                '.jobs-description__content .jobs-description-content__text',
                '.jobs-description-content__text',
                '.jobs-description__content',
                '.jobs-box__html-content',
                '.show-more-less-html__markup',
                'article.jobs-description__container',
                '#job-details'
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
