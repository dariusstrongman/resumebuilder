// Greenhouse-hosted boards (boards.greenhouse.io, job-boards.greenhouse.io).
// JD body: #content, #app_body, or .content
// Title: .app-title or h1.app-title
// Apply button: #submit_app_btn or "Apply" anchor.

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
                '#submit_app_btn',
                '.application--apply-button',
                'a[href*="apply"]',
                '.app-title'
            ]);
        },
        getJD: function () {
            const el = q([
                '#content .body',
                '#content',
                '#app_body',
                '.content',
                '.section-wrapper'
            ]);
            return txt(el);
        },
        getJobTitle: function () {
            const el = q([
                'h1.app-title',
                '.app-title',
                '.header h1',
                'h1'
            ]);
            return txt(el);
        }
    };
})();
