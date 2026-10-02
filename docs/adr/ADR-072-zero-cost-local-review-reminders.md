# ADR-072 — Zero-cost local review reminders

- **Status:** accepted and implemented
- **Date:** 2026-09-12
- **Scope:** SM-2 due queue, Settings, AppShell, IndexedDB/DWNB/Merge

## Context

The platform displayed due reviews on Today and Review but offered no learner-selected reminder time. A pure PWA cannot honestly guarantee a scheduled notification after the browser is closed without a push service or platform-specific scheduler.

## Decision

1. `local-review-reminder-v1` stores enablement, local time, IANA time zone, daily in-app dismissal, and device-delivery date in LearningState.
2. The reminder count comes from `buildDueReviewQueue`; the stale aggregate `dueReviews` field is not used as proof that a card is currently due.
3. An in-app banner appears only after the selected local time, when at least one eligible card is due and quiet hours are inactive.
4. Daily dismissal hides the in-app banner without grading, deleting, or rescheduling a card.
5. Notification API permission is requested only from the explicit Settings action. A granted permission allows one device notification per local day while the app is open.
6. Denied or unsupported device notifications fall back to the in-app reminder without blocking learning.
7. There is no push endpoint, service-worker push subscription, paid scheduler, mastery mutation, streak penalty, or background-delivery guarantee.
8. Existing schema-v3 states default safely to reminders disabled. IndexedDB, DWNB, and newer-state Merge preserve the preference and delivery markers.
9. Quiet-hour calculation now uses its stored IANA zone instead of silently using the host machine clock.

## Boundary

This feature is a local study prompt, not a guaranteed alarm. The downloaded ICS calendar remains the platform-independent option for reminders managed by the operating system while the PWA is closed.
