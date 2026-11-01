# App shell rules

- Global navigation stays in AppShell rail; employee tools share a centered header but scroll main, unlike chat. Why: prevent trapped calendars. Design editing stays in chat.
- Desktop AppShell collapses to an employee icon rail with local persistence; align fixed chat overlays to its width.
- Setup rail minimization is derived from the current route and persisted setup state, never written to navigation preferences. Why: compact setup without changing the owner's normal layout.
- Rail expands independently; chat controls clear both sidebars; embedded chat hides the rail to avoid overlap.
- Invitees accept/decline in the AppShell NotificationBell (`invite-inbox.functions.ts`); inviters get a `user_notifications` row. Why: no reliance on copied links.
- Chat media uses `ChatAttachments` with bounded sizing, fullscreen viewing and avatar-side assistant alignment. Why: preserve sender attribution.
- AccountMenu owns UI; AppShell owns auth/data. Account entry points only; uniform stays in settings.
