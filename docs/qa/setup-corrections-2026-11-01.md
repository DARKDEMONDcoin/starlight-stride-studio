# Setup corrections — 1 November 2026

## Changes
- Removed connection checks from setup readiness in the browser, server function and database RPC. Valid business/employee goals, owner access, revision checks and null KPI baselines remain required. No provider execution safeguards changed.
- Employee navigation is hidden until all three steps are saved. Afterwards only selected employees open chat; unselected employees are dimmed and link to their hiring dialog.
- Successful website discovery stores a business name for signup and new-account context, including OAuth-bound context. A guarded database trigger corrects recent personal workspaces only when their name still equals the owner's personal name and discovery is available. Custom names and older workspaces remain untouched.

## Verification
- 24 focused tests pass: setup rules, employee visibility/selection, business-name storage, and ready/complete server saves for social, GA4, Search Console and advertising goals without querying integrations.
- Inspected the deployed database RPC after migration: connection checks removed; owner/revision/KPI protections remain.
- Database readback: zero recent personal-name defaults with available saved discovery.
- Browser: `/app/setup` redirects to `/auth?mode=signin`; `/welcome` renders; no runtime errors.
- Preview build passed after edits.

## Limits
Signed-in skip, dashboard and hiring interactions cannot be checked end-to-end because this external Supabase project has no available managed browser session. Handler tests use a mocked persistence response, not a real signed-in save. No deployment requested or performed.

The existing disabled leaked-password protection warning predates these migrations and is unchanged.