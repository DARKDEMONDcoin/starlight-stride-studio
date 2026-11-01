# Setup navigation and discovery — 1 November 2026

## Implemented in preview
- Both desktop rails are minimized on `/app/setup` and throughout incomplete setup (including brand/integration visits). Saved normal navigation preferences are not overwritten. The employee visibility/hiring rules remain unchanged.
- Profile/notification controls are at the physical left of non-chat headers, independent of RTL. Existing centered employee-chat controls are preserved.
- Direct target HTTP 202 receives exactly one retry within the existing 12-second read deadline. Pending bodies never enter evidence; persistent 202 explains manual entry and possible website administrator assistance. DNS pinning, same-origin redirects, robots rules and byte limits remain intact.

## Evidence
- 10 Vitest setup navigation/save tests and 16 Bun brand-reader tests passed.
- Actual `readBrandPublic` returned robots (674 bytes) and homepage (709311 bytes) for f-g.com; `collectBrandPages` returned 10 pages and real Future Group homepage content.
- Isolated stylesheet/layout harness at 1280×1800, 847×625 and 390×844: desktop rails each 64px; left account group at 28px/12px; no horizontal overflow. This validates geometry, not a signed-in AppShell workflow.
- Actual `/app/setup` redirected to `/auth?mode=signin` when signed out. Latest preview build is OK.

## Still unverified / blocked
- Screenshot 202 originates in the direct website reader, before AI processing; the target is currently returning 200 from this sandbox. Live 202 headers/body and whether it occurs on robots or homepage were not obtained. Do not attribute this to a particular firewall or claim a complete live repair.
- External unmanaged Supabase provides no available managed session: actual account setup/save/scan readback remains unverified.
- No deployment requested this turn; current changes are preview-only. A live retry must follow deployment to exercise the new recovery. Persistent target 202 may still require website administrator allowlisting; no access-control bypass or alternate browser service was introduced.