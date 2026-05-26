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
    // Find the Apply button by text content. Also handles div-based
    // buttons (modern React apps often use div + click handler instead
    // of a real <button>).
    function findApplyByText() {
        const els = document.querySelectorAll(
            'button, a, [role="button"], div[class*="apply" i], div[class*="Apply"]'
        );
        for (const el of els) {
            if (el.id === 'atshack-tailor-btn') continue;
            const t = (el.innerText || el.textContent || '').trim().toLowerCase();
            if (!t || t.length > 40) continue;
            if (
                t === 'apply' ||
                t === '1-click apply' ||
                t === 'quick apply' ||
                t.startsWith('apply now') ||
                t.startsWith('1-click apply') ||
                t.startsWith('quick apply')
            ) {
                return el;
            }
        }
        // Fallback: any element directly containing the "apply" text.
        const all = document.querySelectorAll('div, span, a, button');
        for (const el of all) {
            if (el.id === 'atshack-tailor-btn') continue;
            // Only consider leaf-like elements with short text.
            if (el.children.length > 2) continue;
            const t = (el.innerText || el.textContent || '').trim().toLowerCase();
            if (!t || t.length > 25) continue;
            if (t === 'apply' || t === '1-click apply' || t === 'quick apply') {
                // Use closest clickable parent.
                let parent = el;
                for (let i = 0; i < 4 && parent; i++) {
                    if (parent.tagName === 'BUTTON' || parent.tagName === 'A' ||
                        parent.getAttribute('role') === 'button' ||
                        parent.onclick != null) {
                        return parent;
                    }
                    parent = parent.parentElement;
                }
                return el;
            }
        }
        return null;
    }

    window.__ATSHACK_CONFIG = {
        buttonAnchor: function () {
            const byClass = q([
                'a.job_apply_button',
                'button[data-testid="job-apply-button"]',
                'button[data-testid*="apply" i]',
                'a[class*="apply"]',
                'button[class*="apply"]'
            ]);
            if (byClass) { console.log('[ATSHack] anchor: Zip apply (class)'); return byClass; }
            const byText = findApplyByText();
            if (byText) { console.log('[ATSHack] anchor: Zip apply (text)'); return byText; }
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
