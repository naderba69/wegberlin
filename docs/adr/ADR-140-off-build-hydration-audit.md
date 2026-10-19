# ADR-140: Audit every page as a learner far from the build day and zone

- Status: accepted, 2026-10-19 (v249)
- Owner delegation: «نفّذ ما يفيد المتعلم والصحيح». Under that delegation, «واصل» is read as "carry out the next useful batch".
- Evidence tier: measured in a production build and a development build, with Chromium. Not a device lab.
- Follows: IDEA 404 / 406 (the first React #418 diagnosis, v141–v245) and the `no-storage-in-render-init` fence.

## Context

The pages are prerendered once, at build time, and served statically. A learner opens them days or weeks later, often in another time zone (Tunisia is UTC+1, the build runs in UTC).

The v248 mobile E2E run logged React error #418 ("server rendered text didn't match the client") during eight flows that pin the browser clock. A probe then opened all 321 routes with the device clock 400 days ahead and the UTC+14 zone, and found three pages that failed with no learner data at all:

| Route | What differed between the built HTML and the first client render |
|---|---|
| `/exams` | The format-profile freshness status ("موثّق وحديث" vs "يحتاج إعادة تحقق"), computed from `new Date()` during render. |
| `/errors` | The eight weekly labels of the error-trend chart (`31/8 …` vs `4/10 …`). |
| `/settings` | The quiet-hours time zone (`useMemo(() => Intl…timeZone)`), the quiet-active flag (`new Date()` in render) and the AI capability rows, whose blocked/ready state follows source freshness. |

On #418, React discards the server HTML and re-renders the whole tree on the client. The page still works, but it pays a second full render, can flash, and loses the benefit of the static HTML. A learner would meet it on every visit once the build is a few weeks old.

None of the gates caught this:

- The browser accessibility audit (642 checks) fails on page errors, but it runs on the build day in the build zone, so the built HTML and the client render agree.
- The `no-storage-in-render-init` fence scans declaration lines only. The planning control writes several statements on one line, so its `useMemo(()=>Intl…)` was invisible.

## Decision

1. **Fix the three pages with the existing pattern.** The server and the first client render use a fixed value, and the device value arrives after hydration through `useSyncExternalStore`, as `useDeviceValue` already does.
   - `src/components/device-value.ts` gains `useDeviceDay()`, which returns the local `YYYY-MM-DD` or `""`, and `useDeviceMinute()`, which returns a whole minute or `0`. Both are stable by value, so neither can cause the render loop that `Date.now()` caused in 2026-09 (React #185).
   - `/exams` shows "نقارن تاريخ التحقق بتاريخ جهازك…" until hydration, then the real status. The two dates in the banner come from the source record and were never date-dependent.
   - `/errors` builds the eight weeks from the device day, and shows "—" as the week labels before hydration.
   - `/settings` reads the zone with `useDeviceValue` and the quiet-active flag from `useDeviceMinute`. It builds the AI capability rows after hydration, and shows one status line before that.
2. **Make the browser audit look like a learner far from the build.**
   - The mobile pass of `npm run a11y:browser` now runs with the device clock 400 days ahead and the `Pacific/Kiritimati` zone (UTC+14).
   - The desktop pass keeps the real clock and zone, so both conditions are covered without extra runtime.
   - Any date- or zone-dependent first render now fails `npm run check` as a page error. The report records the device profile per check.
3. **Pin it.** `tests/unit/off-build-hydration.test.ts` checks:
   - The server snapshot of the new hooks is empty.
   - The four components no longer compute the visible values in the first render.
   - No client file reads the zone in an inline memo anywhere on a line.
   - The audit keeps the off-build profile.

## Results

- Off-build probe over all 321 prerendered routes: **3 failing → 0**.
- Development-build hydration diff: no mismatch on `/settings`, `/errors`, `/exams`, `/today`, `/progress`, `/tutor` or `/review`, with the clock both 42 days behind and 400 days ahead.
- JS grows by 493 B gzip (2,121,564 of 2,125,000). The static HTML of `/settings` and `/exams` is slightly smaller, because the date-dependent rows are no longer prerendered.
- No lesson content changed. The curriculum gzip is unchanged.

## Consequences

- A page that shows a date-dependent value now shows a neutral placeholder in its static HTML. Without JavaScript the AI capability rows are not listed. They need JavaScript to act anyway.
- The audit's mobile pass may show future-dated states, such as stale sources or a blocked AI provider. If such a state introduces a contrast or ARIA failure, the audit reports it as a real failure, because a learner will reach that state.
- The pack generation moves to v249, because the client code inside the offline pack changed.
