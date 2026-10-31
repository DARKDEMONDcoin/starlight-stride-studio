# Workplace setup — 31 October 2026

Latest completion audit: [31 October audit](./onboarding-completion-audit-2026-10-31.md). Signed-in completion remains unverified; advertising-objective readiness was reproduced as blocked in the rule layer, and catalog/integration failure risks are documented separately.

Implemented the approved account-first setup home, business goals with multiple editable KPIs and custom goals, recommended/all employees, goal selection before confirmed hire, required/optional tools, saved completion summary, Let's GO, dashboard suggestions and employee task review with explicit start.

Industry suggestions are literal seeded rows in an authenticated read-only catalog. Setup uses an owner-scoped atomic revision RPC; profile field merging preserves Brand Brain and existing context. New-workspace gating does not retroactively require setup for established workspaces. Selected employee goals mirror into the existing objectivesPrompt path; missing targets and baselines remain unknown. Task starts use the existing chat submission/stream and approval boundary. Dashboard started status reads real user messages tagged for the first task, not speculative progress.

## Verification
- 16 tests pass in src/lib/qa/workplace-setup.test.ts and onboarding-objectives.test.ts.
- Latest harness result: build OK.
- Signed-out /app/setup redirects to /auth?mode=signin.
- Actual objective editor exercised in an isolated browser harness: select goal, change target, add KPI, add custom goal; desktop and 390px checked without horizontal overflow. This is not authenticated flow verification. The harness itself required matching Vite React module versions; its host page error fallback was unrelated to the editor.
- Deployment uploaded 1148 files, Vercel returned READY; production /app/setup responds 200.

## Approved visual correction — 31 October
- Replaced inherited cream tokens with white, deep blue-green text, teal states and coral actions. English uses Plus Jakarta Sans; Arabic uses IBM Plex Sans Arabic. Generated mockups do not contain verifiable font metadata, so this is an implemented visual match, not a claim of identical source fonts.
- Setup and the first dashboard use a single text-and-icon sidebar, compact top bar, separated business/selection summary, expandable KPI rows, employee objective dialog, essential tool rows, three-column completion and first-task rows with a team sidebar.
- Browser checked public welcome/auth and all actual setup views using isolated query-cache sample data at 1440×1000, plus objectives/auth at 390×844. No horizontal overflow or page errors. The hiring dialog was captured after animation; its confirm controls remain accessible while scrolling.
- 16 existing setup/objective tests passed. Temporary visual harness removed; latest preview build OK. Authenticated saved-data/provider execution remains unverified, not simulated as a successful account flow.
- Vercel publishing attempt failed during file upload with 429 api-upload-free (daily 5000-file limit exhausted). Reset reported as 1 November 2026 02:43 UTC; no new production deployment was created.

## Unverified / external dependencies
- External unmanaged Supabase provides no managed test session. Full authenticated save/resume, live OAuth account connections, Let's GO and chat output readback were not exercised end-to-end. Do not claim them verified.
- Advertising connectivity remains held by existing evidence/provider safeguards. Setup does not fabricate ad connections or claim live metric baselines.
- Existing Supabase warning: leaked-password protection disabled; unrelated to these migrations and unchanged.