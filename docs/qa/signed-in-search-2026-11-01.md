# Signed-in search repair — 1 November 2026

## Reproduced and repaired
- Signed in through the real UI using the supplied demo account; credentials were not added to the project.
- Brand Brain megsyai.com scan failed at zero pages because its HTTPS redirect to www was rejected.
- Allow exact apex/www canonical aliases only, retaining public DNS pinning, HTTPS, robots, bounded reads and unrelated-redirect rejection.
- The site returns an empty server-rendered body. Added Browserbase rendering with target requests intercepted and fulfilled by the pinned reader. Blocks writes, off-site resources, workers and sockets; limits 120 resources, 12 MiB total, 1 MiB per script/HTML, existing CSS/text caps and 35-second rendering deadline. Sessions release on exit.
- Then reproduced analysis HTTP 403. Stored AI key differed from the registered runtime key; the registered key passed a real generation before secure replacement. Analysis explicitly uses the shared server-side key resolver.
- Signed-in scan completed all four stages; refreshing showed all sections saved, sources retained, and 100% completeness.
- Signed-in integration search previously matched Arabic display labels only: Google returned zero. Shared normalized matching now returns seven Google providers for both Google/google; Facebook Arabic returned one, unmatched returned zero, clearing restored 45. Public integrations uses the same matcher; decisions now matches case-insensitively.

## Checks
- 34 initial brand/profile/welcome/ranking checks, 11 rendering/setup tests, 32 browser/brand/ranking/welcome checks, and 27 final matcher/rendering/key/brand tests passed (overlapping sets, not a unique total).
- Preview build log OK. Website-analysis deployment dpl_9bF3wTiSyAQtLiWXBCohpgkrXkD5 reached Vercel READY. Final multilingual list-search deployment was blocked by Vercel daily file-upload limit (429); those changes remain in preview only.
- Browser checked public integrations, signed-in integrations/help/decisions, workspace, campaigns, old brain, discovery entry and Nour chat entry. Help matching/empty/clear worked. No search available in the account's empty campaign/task view; no data created to manufacture coverage.
- Full competitor discovery and employee web-research execution were investigated in source but not verified end-to-end. No claim of universal external-provider availability.
- Successful scan was started in signed-in preview; its real background worker ran the deployed Vercel code and saved results into the account, verified through UI refresh.

## Account impact
The requested website scan and its results remain saved in the demo workspace. No password, integrations, employee messages or existing owner edits changed.