## Goal
Temporarily lift the AI usage restrictions in `src/lib/ai.functions.ts` so you can record a demo video without hitting limits.

## What's currently restricting usage
1. **Global daily cap** — `DAILY_AI_LIMIT = 6`: only 6 AI prompts allowed per day across all visitors. Each `chatReply` / `annotationReply` call runs `consumeDailyQuota()`, which atomically increments the `ai_usage_daily` count and blocks once 6 is reached.
2. **Output token cap** — `MAX_OUTPUT_TOKENS = 400`: AI replies are truncated to 400 tokens, so longer answers get cut off mid-sentence.

## Plan
1. **Disable the daily cap (main blocker).** Bypass the `consumeDailyQuota()` gate in both `chatReply` and `annotationReply` so requests are never rejected with the "daily AI usage limit" message. The simplest reversible way is to short-circuit `consumeDailyQuota()` to always return `true` (leaving the DB call and message logic in place, just commented/guarded), so it's a one-line flip to restore later.
2. **Raise the output token limit.** Bump `MAX_OUTPUT_TOKENS` from `400` to a more generous value (e.g. `1500`) so demo answers read fully instead of getting truncated.

No UI, schema, or backend (RLS/migration) changes — this is purely the two constants/guards in `src/lib/ai.functions.ts`.

## Restoring later
Both changes are single-line tweaks. When the demo is done, set the daily-cap guard back and restore `MAX_OUTPUT_TOKENS = 400`.

## Technical details
- `consumeDailyQuota()` currently calls the `consume_ai_quota` RPC; I'll add an early `return true` (with a clear `// DEMO:` comment) so the quota is never consumed and nothing is blocked.
- `MAX_OUTPUT_TOKENS` constant raised to 1500.