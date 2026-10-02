# ADR-009 — Novelty-weighted mastery and zoned review days

Date: 2026-09-03  
Status: accepted

## Context

Lesson completion previously derived its initial mastery from the raw number of correct attempts. Repeating one solved item could therefore increase the stored score even though lesson evidence gates used unique IDs. SM-2 scheduling also anchored every interval to UTC midnight, which can shift the learner-facing calendar day across timezones and daylight-saving changes.

## Decision

- Introduce `novelty-weighting-v1` with explicit evidence weights:
  - first unseen transfer item: 1.5;
  - first guided-practice item: 1;
  - latest same-item retry only: 0.25;
  - additional retries are audited but cannot add weight.
- Calculate initial lesson mastery from unique-item coverage and weighted accuracy, capped at the existing 65-point pre-retention boundary.
- Keep receptive dashboard accuracy based on the latest unique result, while exposing a separate novelty/retry weighting signal and version.
- Introduce `sm2-v2-calendar` and `review-calendar-v1` with an injected IANA timezone and local review hour.
- Add intervals as local calendar days, then convert the target local boundary to a UTC instant.
- Persist calendar policy/timezone on new review items and events; continue accepting legacy `sm2-v1` records.
- Resolve the browser timezone only when the learner grades a card. Do not retroactively move already scheduled instants when the operating-system timezone changes.

## Consequences

- Repeated clicking can no longer inflate initial lesson mastery.
- A genuinely new transfer item contributes more evidence than a guided first item or retry.
- Review dates stay on the intended local calendar day through DST changes.
- Item-ID novelty is deterministic but is not a psychometrically calibrated unseen-objective model; that remains a future refinement.
