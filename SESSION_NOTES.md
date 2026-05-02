# Session notes — handoff for home PC

Snapshot of what shipped this session. Read top to bottom; everything below is live in prod.

## Rebrand: BeatTheJob/ResumeGo → ATSHack

- Bought `atshack.com`. Site live at `https://www.atshack.com`.
- Bulk rename across 33 files (158 occurrences) of "BeatTheJob" → "ATSHack".
- Favicon swapped (R → A).
- Domain migration:
  - `CNAME` flipped from `resume.stromation.com` to `www.atshack.com`.
  - Apex `atshack.com` → 301 → `www.atshack.com`.
  - Old domain `resume.stromation.com` redirects to `www.atshack.com` via separate repo `dariusstrongman/stromation-redirect` (just a CNAME + index.html + 404.html with JS+meta-refresh that preserves path).
  - 102 canonical/og:url URLs updated.
- Hostinger DNS gotcha: had a rogue `A @ → 2.57.91.91` parking record breaking ~20% of apex visitors. Removed.
- New `/ats.html` SEO/education page (1745 words, JSON-LD Article + FAQPage). `/applicationtrackingsystem.html` meta-refreshes to `/ats.html`. Nav + footer link to it.

## Supabase Auth migration

Project: `jjiizicwjldusuteffnb` (the prod one — `iadzcnzgbtuigyodeqas` stays dormant).

- Site URL: `https://www.atshack.com`.
- Redirect URLs allowlist: includes `https://www.atshack.com/**` (wildcard — needed for `/reset-password.html` to be reachable from email link).
- Custom SMTP: Hostinger, sending as `noreply@atshack.com` (alias under primary `darius@atshack.com`). Up to 10 aliases available on this plan.
- Branded password reset email template at `email-templates/reset-password.html` (dark/lime card, single CTA, link fallback, `{{ .SiteURL }}` footer). Pasted into Supabase template editor. Click Save in Supabase or it silently keeps default.

## n8n changes (workflow `5FNXUIt4sJ93VL8j` — the actual tailor; ignore the misnamed "Reviewer")

Reminder: PUT auto-deactivates the workflow. Always POST `/activate` after.

### Rebrand pass
- Replaced `ResumeGo` → `ATSHack`, `RESUMEGO` → `ATSHACK`, `https://resume.stromation.com` → `https://www.atshack.com` in all Code-node `jsCode`.
- Second pass caught standalone `resume.stromation.com` link text (negative lookbehind for `n8n.` so n8n's own hostname is untouched).
- Email-sender workflow `llar5ONJX9FWpUxZ` "Sale email" node `From:` → `noreply@atshack.com`.

### Customer email simplified
New body: dark hero ("We hacked the ATS with your resume.") + score block + changes block + share-with-friends ask + footer. Score-block headline reframed from "Your Match" → "Your shot at landing this", and the `% match` copy reworded to `% chance of landing`.

### Layout validation (just shipped — see below)
Added a render-then-retry node-equivalent inside the `Process Request` Code node. Functions inserted right after `jsonResumeToPdf`:

```js
function pdfPageStats(pdfBytes) {
    // writes pdf to tmp, runs `pdfinfo` for page count,
    // runs `pdftotext -f N -l N` to count rows on last page,
    // returns { pages, lastPageRows }. Errors swallowed.
}
function checkLayout(jsonData) {
    // renders via jsonResumeToPdf, runs pdfPageStats,
    // returns { needsCompress: pages > 1 && lastPageRows < 6, stats }
}
```

Both code paths get the same retry block:
- **Inline path** (Pro/promo, after `pResume = jsonResumeToText(pData)`)
- **Fulfill path** (post-Stripe payment, after `globalThis.__rData = rData`)

When `needsCompress`, re-prompts GPT with: "COMPRESS TO 1 PAGE: cap the most-recent role at 3 bullets, tighten summary by 1 sentence if needed. Do NOT drop any job, do NOT invent." Cleanup vs tailor branches use the right input (resume only vs resume+job posting).

Cost: ~$0.005 only when retry fires. Latency: +5–10s only when retry fires. Errors all swallowed so the main flow is unbreakable.

Verified post-install: 1 `pdfPageStats` def, 1 `checkLayout` def, 3 call sites (1 def + 2 retries), 2 `.needsCompress` branches, workflow active.

## Dashboard: removed n8n round-trips

`account.html` was hitting the n8n webhook on every page load (`pro_status`, `get_resume`, `rename_resume`, `delete_resume`). Replaced all with direct Supabase queries from the browser using user's own JWT.

- `pro_status`: replaced with direct count query against `resumego_sessions` filtered by `user_id`, `status='complete'`, `created_at >= sub.current_period_start`.
- `get_resume` / `rename_resume` / `delete_resume`: direct table reads/updates/deletes.

For UPDATE/DELETE to work under RLS, applied `migrations/dashboard_write_rls.sql`:
```sql
create policy users_update_own_sessions on public.resumego_sessions
  for update to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy users_delete_own_sessions on public.resumego_sessions
  for delete to authenticated
  using (auth.uid() = user_id);
```

(Applied via Supabase SQL Editor — DDL doesn't run via REST.)

## Files to be aware of

- `/tmp/process_request.js` — 225K-char dump of the n8n Process Request Code node (read before compaction; reread if needed).
- `/tmp/add_validation.py` — the script that installed the layout validation. Idempotent (skips if `pdfPageStats` already in code). Re-runnable safely.
- `/tmp/simplify_email.py` — customer email body simplification.
- `/tmp/update_tailor_brand.py` + `/tmp/update_tailor_brand2.py` — rebrand passes.

These `/tmp/` scripts are NOT in the repo (they have the n8n API key inline). Don't commit them.

## Open follow-ups

- Watch for retry-triggered runs over the next few days to confirm the validation actually fires on borderline cases. Look in n8n executions for runs that took noticeably longer than usual on a single resume.
- Education-on-page-2 issue: root cause was model variance producing 5 bullets on Operations Manager when the prompt says "3 typical." Validation retry should now catch the resulting orphan-tail page.
- Pro economics still: most users sub for 1 month during active job search, cancel after. Treat Pro as a single-purchase upsell, not recurring revenue.

## Untracked in repo right now

```
long_test_resume.docx
long_test_resume.pdf
sample_resumes/
v2_init.sql
```

These are local-only test fixtures; don't commit unless you actually want them in.
