# Browserbase activation — 1 November 2026

- Both credentials collected via the secure form, not chat. Saved in the existing server-only configuration store and encrypted Vercel production/preview variables.
- An obsolete persistent billing stop initially blocked the existing app reader. The newly supplied account successfully created a session (201), rendered f-g.com, and released the session (200) before the stop was removed.
- The actual `browsePage` app reader subsequently returned a populated Future Group page, readable business text and HTML.
- 18 Browserbase session/Brand Brain tests and 10 setup navigation/save tests passed.
- Vercel deployment `dpl_FxAxmEa9CghbHvC5JB9AGtoreJDd` reached READY; getziad.com homepage, welcome and setup entry returned HTTP 200. Preview build log reports build OK.
- Browserbase is available to the existing cloud-browser and welcome-preview paths. Brand Brain's bounded DNS-pinned direct transport remains unchanged; no broad browser fallback or access-control bypass was added.
- Signed-in setup/scan persistence and chat readback remain unverified because external unmanaged authentication provides no available test session.