// Auth-aware nav: swaps 'Sign in' to 'Account' when the visitor is signed in,
// and also exposes the current user id/email on window so other scripts (the
// home form) can attach it to their submissions.
(function() {
    if (!window.supabase || !window.SUPABASE_URL || !window.SUPABASE_PUBLISHABLE_KEY) return;
    var sb = window.supabase.createClient(window.SUPABASE_URL, window.SUPABASE_PUBLISHABLE_KEY);
    window.__sb = sb;
    sb.auth.getUser().then(function(res) {
        var user = res && res.data ? res.data.user : null;
        if (!user) return;
        window.RESUMEGO_USER_ID = user.id;
        window.RESUMEGO_USER_EMAIL = user.email || '';
        var link = document.getElementById('navAuthLink');
        if (link) {
            link.href = '/account.html';
            link.textContent = 'Account';
            link.setAttribute('data-auth', 'in');
        }
        // Auto-fill the form's email field if it's empty
        var emailInput = document.getElementById('userEmail');
        if (emailInput && !emailInput.value) emailInput.value = user.email || '';
        // Notify any listeners that auth state is ready
        document.dispatchEvent(new CustomEvent('resumego:auth-ready', { detail: { user: user } }));
    }).catch(function() {});
})();
