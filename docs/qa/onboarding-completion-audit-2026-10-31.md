# Onboarding completion audit

**Date:** 31 October 2026 (UTC)  
**Target:** current preview at localhost, not the previous Vercel deployment.  
**Verdict:** NOT fully verified. The complete signed-in journey could not be executed; one completion blocker was reproduced in the real decision rules, and additional risks need authenticated reproduction.

## Testing limitation

The testing environment reports `external_unmanaged` authentication and supplies no managed test session. Opening `/app/setup` or `/app` in a fresh browser correctly ends at `/auth?mode=signin`. No credentials were requested, no authentication was bypassed, no account was created or modified, and no sample query-cache data was used to claim successful setup. Hosted signup/sign-in settings were not read and remain unverified.

This is a testing-access limitation, not evidence that real users cannot sign in.

## Checks actually executed

| Check | Result |
| --- | --- |
| Public welcome → business purpose → skip optional website → team → custom sector `استشارات هندسية` → recommendation → completion → signup | Passed; final URL `/auth?mode=signup`, no page exceptions |
| Empty signup submission | Passed; email, full-name and password validation messages displayed |
| Invalid email, two-character name and short password | Passed; each field rejected with a specific message |
| Switch signup to sign-in | Passed; URL and heading changed to sign-in |
| Password-reset request with invalid email | Passed; stopped before sending an email and showed validation |
| Signed-out setup/dashboard access | Passed; both redirected to sign-in |
| Existing setup/objective unit tests | 16/16 passed across two files |
| Current preview build signal | `build OK`, timestamp `2026-10-31T02:56:54Z` |

Browser checks used Chromium at 1280×1800. Screenshots of signup validation, sign-in boundary, reset validation and welcome completion were inspected. These checks do not establish successful signup, provider connectivity or persisted setup.

## B1 — Advertising employee goals prevent setup completion

**Priority:** high for users choosing Abdullah's suggested advertising objectives.  
**Evidence:** reproduced in actual completion logic; UI wiring and SQL inspected. Not reproduced in a signed-in browser.

Both Abdullah suggestions (`roas`, `cpa`) use an advertising KPI source. Advertising connectivity is intentionally held. `requiredTools` produces an advertising requirement with an empty provider list, so no connection can satisfy it. The tools screen renders no connection button for that row; both completion controls depend on the failing readiness check. The database also explicitly rejects advertising-source KPIs at ready/complete stages.

The audit executed this concrete rule scenario:

- Valid manual business goal, hired Abdullah, valid `roas` employee objective, objectives/team steps complete.
- Requirements: `ads`, providers `[]`.
- Completion with a nominal connected `ads` row: **false**.
- Same setup with that KPI explicitly changed to manual review: **true** in the rule layer (not a database-save claim).

**User reproduction still needed:** sign in with a new workspace, save a business goal, hire Abdullah with either suggested objective, then enter tools. Confirm there is no advertising connection action and “أكمل الإعداد” cannot be used.

**Existing recovery:** return to team, edit Abdullah's KPI source to manual for an explicitly owner-reviewed goal, create a preparation objective, or remove Abdullah. Do not describe manual review as verified advertising data. The tools-screen recovery link opens business objectives, not the employee objective responsible for this blocker, making recovery indirect.

**Recommended remedy, not implemented:** offer a clear preparation-only employee goal and direct recovery to the affected employee objective while retaining all advertising evidence/connectivity safeguards.

**References:** `src/lib/onboarding-objectives.ts:157–160`; `src/lib/workplace-setup.ts:21–34`; `src/routes/app.setup.tsx:87–90`; `src/lib/workplace-setup.functions.ts:20–25`; migration `20261031010314_8893e3b9-837b-4bc1-86a8-2e8f17087db3.sql:32–44`.

## R1 — Objective catalog failure also hides custom-objective entry

**Priority:** high if the catalog service fails.  
**Evidence:** source-confirmed conditional rendering; failure not reproduced against a signed-in service.

The objective screen renders `WorkplaceGoals` only when the catalog request succeeds. Custom-goal entry is inside that component, so a catalog failure shows only Retry rather than allowing a user to write their own goal. A new user with no selected goals cannot advance while that request remains broken.

**Required reproduction:** in an authenticated fresh workspace, fail the objective-catalog request, confirm no custom-goal entry is available, then restore the service and retry.

**Recommended remedy, not implemented:** keep custom-goal entry available independently of suggestion loading/errors.

**References:** `src/routes/app.setup.tsx:55,85,89`; `src/components/app/WorkplaceGoals.tsx:35`.

## R2 — Integration-read failure blocks even manual-only setup

**Priority:** medium, conditional service failure.  
**Evidence:** source-confirmed readiness expression; failure not reproduced in an authenticated browser.

`ready` requires the integration query to finish without errors, even when selected objectives need no external tools. Consequently a manual-only workplace cannot finish during an integration-list outage. This conservative check is not proof of an outage today.

**Required reproduction:** save valid manual-only business/employee goals, fail integration-list reads, observe completion disabled, restore reads and refresh the status.

**Recommended remedy, not implemented:** consider handling the no-required-tools case independently while keeping server-side validation authoritative.

**References:** `src/routes/app.setup.tsx:32,61–62,87–89`; `src/lib/workplace-setup.functions.ts:20–23`.

## Required signed-in coverage still open

1. Real account creation/sign-in, Google/Microsoft callbacks, and workspace provisioning.
2. New account lands on setup before normal exploration; welcome industry/site context binds only to its intended new account.
3. Save business objectives with edited/custom KPIs; reload and verify actual persisted readback.
4. Hire recommended and nonrecommended employees; save employee objectives; reload and verify hiring and goals.
5. Cancel/fail/retry GA4, Search Console, social and email connections; verify provider callbacks and actual connection state, not visual labels alone.
6. Save and resume tools/ready stages; complete with “Let's GO”; confirm dashboard opens and persists across a fresh session.
7. Review a contextual first task without starting it; explicitly Start; verify the real stored chat message/result and approval safeguards.
8. Repeat save/resume and completion at a narrow viewport; test concurrent-session revision conflicts and recovery.

## Scope

Documentation only. No application logic, authentication settings, database records, provider permissions or deployments were changed. Passing unit tests and public checks do not certify onboarding completion.