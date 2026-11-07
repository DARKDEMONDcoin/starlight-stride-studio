# Pre-signup business analysis

- Added explicit URL form submission. Enter remains supported; results stay visible until Continue is selected.
- Replaced the deferred account-only job panel and timer with four real reader/interpretation checkpoints over a bounded streaming response.
- Preserved shared anonymous eight-attempt/hour budget, cache, URL validation, existing page/byte/corpus limits and account-free public evidence.
- Six focused Vitest checks and seven Bun checks passed, including chunked progress, interrupted/error streams, budget and reading checkpoints.
- Real unsigned visitor test: f-g.com returned four pages and a visible site card before registration, without browser errors. Desktop 1280×1800, 697×625 and mobile 390×844 had no horizontal overflow.
- AI interpretation returned HTTP 402 (insufficient gateway credits); no configured fallback could interpret the evidence. This remains an external blocker, not a successful interpretation. The interface shows partial analysis at 75%, preserves extracted evidence, and allows retry or continuing.
- No deployment requested for this change; preview only.