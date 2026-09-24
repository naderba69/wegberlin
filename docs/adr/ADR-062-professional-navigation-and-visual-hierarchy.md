# ADR-062 — Professional guidance-first navigation and visual hierarchy

Date: 2026-09-11 — Africa/Tunis

## Context

Real-learner feedback identified that a technically complete application can still feel unprofessional when navigation is flat, secondary destinations disappear on small phones, the current location is generic, and tools appear before the task. A modern look must improve orientation and task completion rather than add decoration.

## Decision

Adopt `professional-guidance-navigation-v1` across the application shell:

- desktop navigation is separated into “daily learning” and “resources and tools” groups;
- the active destination has a clear text/icon/surface state rather than color alone;
- the sticky top bar names the current context (lesson, assessment, writing, speaking, mediation, errors, or main destination) and separates it from the learner greeting;
- the mobile bottom bar contains four frequent learning destinations plus one explicit “More” action;
- “More” opens an accessible bottom destination sheet containing all nine main routes, current-location text, a close action, Escape support, focus trapping, and focus return;
- the sheet states that browsing does not alter progress and points continuing learners back to Today;
- dense cards use consistent 48 px actions, spacing, borders, radii, and restrained shadows;
- the page remains overflow-free from 320×568 through 1920×1080;
- reduced-motion removes the sheet entrance animation.

## Guidance hierarchy

The order is deliberate:

1. current context;
2. primary learning action;
3. progress/feedback;
4. secondary resources;
5. settings and system tools.

The speaking screen follows the same rule: the guided task appears before the large Redemittel bank. The error screen puts actual trend and intervention explanation before individual records.

## Accessibility

The sheet reuses `AccessibleDialog`, including modal semantics, Escape handling, bidirectional Tab trapping, and restoration to the More button. Every destination retains a visible label; icons never stand alone. Active state includes text and surface changes. High-contrast and reduced-motion preferences continue to apply.

## Acceptance

- Desktop renders two labeled navigation groups and a route-specific top-bar context.
- Mobile renders five stable destinations, with all omitted routes available in the sheet.
- Settings, practice, library, search, and exams remain reachable at 320 px.
- Opening and closing the sheet does not mutate learning evidence.
- Browser tests verify destination count, sheet links, navigation, dialog closure, horizontal overflow, and axe serious/critical results.
- Manual usability and assistive-technology review remains deferred to the final real-device round.
