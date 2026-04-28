// Auth-aware nav: swaps 'Sign in' to 'Account' when the visitor is signed in.
// Reads the persisted Supabase session synchronously so there's no flicker —
// the link is set BEFORE first paint, and the async getUser() reconciles
// later in case the local token has been revoked.
(function() {
    if (!window.supabase || !window.SUPABASE_URL || !window.SUPABASE_PUBLISHABLE_KEY) return;

    function setLink(signedIn) {
        var link = document.getElementById('navAuthLink');
        if (!link) return;
        if (signedIn) {
            link.href = '/account.html';
            link.textContent = 'Account';
            link.setAttribute('data-auth', 'in');
        } else if (link.getAttribute('data-auth') === 'in') {
            // Reverting from a stale "Account" render (token revoked server-side).
            link.href = '/login.html';
            link.textContent = 'Sign in';
            link.removeAttribute('data-auth');
        }
    }

    // Synchronous local session probe — Supabase v2 stores the session under
    // localStorage key sb-<project-ref>-auth-token.
    var hasLocal = false;
    try {
        var m = window.SUPABASE_URL.match(/https:\/\/([^.]+)\.supabase\.co/);
        if (m) {
            var raw = localStorage.getItem('sb-' + m[1] + '-auth-token');
            if (raw) {
                var parsed = JSON.parse(raw);
                hasLocal = !!(parsed && (parsed.access_token || (parsed.currentSession && parsed.currentSession.access_token)));
            }
        }
    } catch(e) {}

    function ready(fn) {
        if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fn);
        else fn();
    }

    if (hasLocal) ready(function() { setLink(true); });

    var sb = window.supabase.createClient(window.SUPABASE_URL, window.SUPABASE_PUBLISHABLE_KEY);
    window.__sb = sb;
    sb.auth.getUser().then(function(res) {
        var user = res && res.data ? res.data.user : null;
        ready(function() {
            if (user) {
                window.RESUMEGO_USER_ID = user.id;
                window.RESUMEGO_USER_EMAIL = user.email || '';
                setLink(true);
                var emailInput = document.getElementById('userEmail');
                if (emailInput && !emailInput.value) emailInput.value = user.email || '';
            } else {
                setLink(false);
            }
            document.dispatchEvent(new CustomEvent('resumego:auth-ready', { detail: { user: user } }));
        });
    }).catch(function() {});
})();
