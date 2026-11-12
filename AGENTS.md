<!-- LOVABLE:BEGIN -->

> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.

<!-- LOVABLE:END -->

- Keep the hero background slideshow and its motion in the focused hero-carousel component; foreground animation remains independent and unchanged.
- Music thumbnails activate inline privacy-enhanced YouTube players, with only one player mounted to avoid simultaneous audio and unnecessary initial loading.
- Apply persistent theme selection through root data-theme and semantic CSS tokens; photographic sections retain dedicated contrast tokens for readability in either theme.
- Netlify deploys build with NITRO_PRESET=netlify (set in netlify.toml), publishing dist; Lovable builds ignore it and stay on Cloudflare. npm + package-lock.json is the package manager.
- Ticket checkout calls Stripe's REST API with fetch from src/lib/events.functions.ts (no SDK); tickets are recorded idempotently on the success page by session id, so no webhook is required.
- Donation checkout uses a shared Stripe product with amount-specific prices; secret-verified database RPCs store orders and idempotent paid receipts without a service role key. Confirm return-page payments and reconcile paid recurring invoices on authorized administrator refreshes; totals never count pending promises.
- Shared giving validation and ticket aggregation live in a client-safe module; poster enlargement uses a reusable accessible dialog.
