# Business discovery repair

## Reproduction
The exact pinned homepage reader failed on https://f-g.com/ with the page-size error before collecting evidence. The homepage exceeded the shared 512000-byte ceiling.

## Repair
HTML responses now accept up to 1048576 bytes, enforced across received chunks. CSS and robots text retain their 512000-byte ceiling. DNS validation/pinning, same-origin redirects, robots rules, read deadlines, crawl limits and evidence text bounds are unchanged. No model, prompt, saved user field or UI changes.

## Verification
- 12 Brand Brain tests passed, including streamed size boundaries and the formerly rejected 709310-byte homepage-sized fixture.
- Actual collectBrandPages on f-g.com returned 10 evidence pages.
- Actual business, audience and voice model analyses returned schema-validated populated results; identity extraction returned populated results.
- These checks did not enqueue jobs, modify the owner's saved brand profile, or impersonate a signed-in user.
- Signed-in retry, persisted stage completion and UI readback remain unverified because external unmanaged authentication provides no test session.
- Application change is preview-only; no deployment requested.