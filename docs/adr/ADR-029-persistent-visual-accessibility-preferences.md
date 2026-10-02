# ADR-029 — Persistent visual accessibility preferences

- Status: Accepted
- Date: 2026-09-07
- Policy: `accessibility-preferences-v1`
- Closes: P1-19 and P1-258

## Context

The application already had keyboard focus, ARIA status announcements, Bidi boundaries, responsive layouts, and adjustable educational playback speed. It did not give the learner a durable way to request larger text, higher contrast, or reduced motion. Browser defaults alone were not visible inside the product and could not travel with a local learner profile.

## Decision

`LearningState` stores one versioned preference object:

```text
policyVersion = accessibility-preferences-v1
fontScale = compact | default | large
highContrast = boolean
reducedMotion = boolean
```

The Settings page provides compact, comfortable, and larger native controls, an immediate Arabic/German preview, a status announcement, and one Reset action. The comfortable profile is the default after real-learner feedback that the former baseline caused eye strain. A persistent top-bar control makes all three sizes discoverable without visiting Settings. `AppShell` projects the persisted values onto root data attributes so every route, including continuous exam rehearsal, receives the same visual state.

Larger text is not browser zoom emulation. Thirty-four shared typography tokens replace the previous fixed pixel declarations and receive explicit compact, comfortable, and larger values, allowing normal layout reflow. High contrast replaces the main surface, ink, border, focus, and shadow tokens and reinforces common controls. Reduced motion removes authored animations and transitions. The CSS also honors `prefers-reduced-motion: reduce` even when the local toggle is off.

The object is validated by Zod, receives defaults when an older schema-v3 record lacks the field, travels in DWNB v2/v3 archives, belongs to imported/new profiles, and uses the complete preference set from the newer snapshot during Merge.

## Automated acceptance

Unit coverage verifies all three size values, the comfortable default, old schema-v3 compatibility, rejection of an unknown scale, deterministic Merge, and DWNB round-trip. Desktop and mobile Playwright verify immediate computed-size change, root contrast/motion state, IndexedDB persistence, reload, Reset, system reduced-motion behavior, 320 px overflow, and axe serious/critical results.

## Boundaries

This closes only the software acceptance criteria in P1-19/P1-258. It does not close P0-255. NVDA, VoiceOver, TalkBack, Switch Control, physical device/browser testing, and user evaluation remain deferred to the final manual review. Automated axe checks and CSS preference emulation are not substitutes for assistive-technology testing by people.
