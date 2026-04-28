// Auth-aware nav: swaps the 'Sign in' link to 'Account' when the visitor is logged in.
// Include this on any page where #navAuthLink exists.
(function() {
    var link = document.getElementById('navAuthLink');
    if (!link || !window.supabase || !window.SUPABASE_URL || !window.SUPABASE_PUBLISHABLE_KEY) return;
    var sb = window.supabase.createClient(window.SUPABASE_URL, window.SUPABASE_PUBLISHABLE_KEY);
    sb.auth.getUser().then(function(res) {
        if (res && res.data && res.data.user) {
            link.href = '/account.html';
            link.textContent = 'Account';
            link.setAttribute('data-auth', 'in');
        }
    }).catch(function() {});
})();
