// Runs on atshack.com. When the page is opened with ?pickup=1, read the
// JD stashed by the extension on the job board, drop it into the JD
// textarea (#jobText), and clear storage so it can't be reused.

(function () {
    'use strict';
    if (!location.search.includes('pickup=1') && !location.search.includes('utm_source=extension')) return;

    function tryFill(jd, title, retries) {
        const ta = document.getElementById('jobText');
        if (!ta) {
            if (retries > 0) setTimeout(() => tryFill(jd, title, retries - 1), 200);
            return;
        }
        if (jd) {
            ta.value = jd;
            ta.dispatchEvent(new Event('input', { bubbles: true }));
            ta.dispatchEvent(new Event('change', { bubbles: true }));
            // Visual confirmation: scroll the form into view + add a flash.
            ta.scrollIntoView({ behavior: 'smooth', block: 'center' });
            try { ta.focus({ preventScroll: true }); } catch (e) {}
            ta.classList.add('atshack-prefilled-flash');
            setTimeout(() => ta.classList.remove('atshack-prefilled-flash'), 1800);
        }
        showToast(title);
    }

    function showToast(title) {
        if (document.getElementById('atshack-pickup-toast')) return;
        const toast = document.createElement('div');
        toast.id = 'atshack-pickup-toast';
        toast.textContent = title
            ? 'Imported "' + (title.length > 60 ? title.slice(0, 60) + '...' : title) + '". Now upload your resume.'
            : 'Job description imported from the extension. Now upload your resume.';
        toast.style.cssText = [
            'position:fixed',
            'top:18px',
            'right:18px',
            'z-index:99999',
            'background:#0a0a0f',
            'color:#f5f6f8',
            'border:1.5px solid #CAFF00',
            'box-shadow:0 8px 28px rgba(202,255,0,0.18)',
            'border-radius:12px',
            'padding:14px 18px',
            'font:600 14px/1.4 Inter, system-ui, sans-serif',
            'max-width:340px',
            'opacity:0',
            'transition:opacity .25s ease'
        ].join(';');
        document.body.appendChild(toast);
        requestAnimationFrame(() => { toast.style.opacity = '1'; });
        setTimeout(() => {
            toast.style.opacity = '0';
            setTimeout(() => toast.remove(), 400);
        }, 5200);
    }

    function injectFlashStyles() {
        if (document.getElementById('atshack-flash-style')) return;
        const s = document.createElement('style');
        s.id = 'atshack-flash-style';
        s.textContent =
            '@keyframes atshackFlash { 0%,100%{box-shadow:0 0 0 0 rgba(202,255,0,0);} 30%{box-shadow:0 0 0 4px rgba(202,255,0,0.45);} }' +
            '.atshack-prefilled-flash { animation: atshackFlash 1.6s ease-out; border-color:#CAFF00 !important; }';
        document.head.appendChild(s);
    }

    chrome.storage.local.get('__atshack_pending', (res) => {
        const p = res && res.__atshack_pending;
        injectFlashStyles();
        if (!p || !p.jd) {
            // No payload, just acknowledge the visit.
            showToast(null);
            return;
        }
        // Discard payloads older than 10 minutes.
        if (Date.now() - (p.ts || 0) > 10 * 60 * 1000) {
            chrome.storage.local.remove('__atshack_pending');
            return;
        }
        chrome.storage.local.remove('__atshack_pending');
        tryFill(p.jd, p.title, 30);
    });
})();
