# ATSHack vNext full rebuild

Status: active off-production build.

- Branch: `build/atshack-vnext-full`
- Production `main`: untouched
- Live `atshack.com`: untouched
- Source baseline: Round 3 commit `d9190aa8deee083351bb00b0f6b7358b92355321`
- Domain contract: `../industry-excellence.md`
- Truth fixture: `../canonical-transformation.json`

## Build sequence

1. Rebuild homepage/product story around source evidence -> target role -> truthful rewrite -> parser-safe resume -> human-readable proof.
2. Rebuild pricing, login/account shell, ATS explainer, free tools, about, legal and blog surfaces into one coherent system.
3. Preserve existing production backend/auth/payment flows until each integration is explicitly mapped and tested.
4. Remove/replace unsupported absolute claims before production cutover.
5. Desktop/mobile browser QA, accessibility, performance and interaction pass.
6. Owner visual approval.
7. Only then plan a controlled production swap.

## Current rule

No live deploy, DNS change, `main` merge, Stripe/Supabase/n8n mutation, or production data change from this branch.
