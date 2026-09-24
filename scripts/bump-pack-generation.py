#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Bump the offline-pack generation literal across the seven documented code sites
(public/sw.js + five test files + scripts/verify-continuation-handoff.mjs).

Rules, all enforced before any write:
  * the active literal `dwnb-full-pack-{FROM}` must be present and becomes `{TO}`;
  * `staging-{PREV}` and `previous-{PREV}` become `{FROM}` (the worker keeps one generation back);
  * after the substitution **no** `{FROM}`-active or `{PREV}` literal may remain in those files,
    and the new `{TO}` literal must appear in every file that carried the old one.
Refuses (exit 1) otherwise, so a drifted tree fails loudly instead of half-bumping.

Run: python3 scripts/bump-pack-generation.py [--from v160 --to v161 --prev v159] [--write]
"""
import argparse, io, json, os, re, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FILES = [
    "public/sw.js",
    "tests/unit/offline-pack-controls.test.ts",
    "tests/unit/offline-recovery-partial-export.test.ts",
    "tests/unit/today-offline-readiness.test.ts",
    "tests/unit/offline-curriculum-rollback.test.ts",
    "tests/e2e/critical-flows.spec.ts",
    "scripts/verify-continuation-handoff.mjs",
]


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--from", dest="frm", default="v160")
    ap.add_argument("--to", default="v161")
    ap.add_argument("--prev", default=None, help="generation the worker currently keeps as staging/previous")
    ap.add_argument("--write", action="store_true")
    a = ap.parse_args()
    prev = a.prev or f"v{int(a.frm[1:]) - 1}"
    subs = [
        (f"dwnb-full-pack-staging-{prev}", f"dwnb-full-pack-staging-{a.frm}"),
        (f"dwnb-full-pack-previous-{prev}", f"dwnb-full-pack-previous-{a.frm}"),
        (f"dwnb-full-pack-{a.frm}", f"dwnb-full-pack-{a.to}"),
    ]

    cache, report, errors = {}, [], []
    for rel in FILES:
        path = os.path.join(ROOT, rel)
        if not os.path.exists(path):
            errors.append(f"{rel}: file missing"); continue
        txt = io.open(path, encoding="utf-8").read()
        n_active = len(re.findall(rf"dwnb-full-pack-{re.escape(a.frm)}(?![-\w])", txt))
        n_stag = txt.count(f"dwnb-full-pack-staging-{prev}")
        n_prev = txt.count(f"dwnb-full-pack-previous-{prev}")
        if n_active + n_stag + n_prev == 0:
            errors.append(f"{rel}: no {a.frm}/{prev} literal to bump"); continue
        counts = {}
        for old, new in subs:
            c = txt.count(old)
            if c:
                # the three literals are mutually non-nested, so a plain replace is exact
                txt = txt.replace(old, new)
                counts[old] = c
        left = len(re.findall(rf"dwnb-full-pack-{re.escape(a.frm)}(?![-\w])", txt))
        if left:
            errors.append(f"{rel}: {left} active {a.frm} literal(s) survived")
        if f"dwnb-full-pack-staging-{prev}" in txt or f"dwnb-full-pack-previous-{prev}" in txt:
            errors.append(f"{rel}: {prev} staging/previous survived")
        cache[path] = txt
        report.append({"file": rel, "replaced": counts,
                       f"to_{a.to}": len(re.findall(rf"dwnb-full-pack-{re.escape(a.to)}(?![-\w])", txt))})

    print(json.dumps({"bump": f"{a.frm}->{a.to}", "stagingAndPrevious": f"{prev}->{a.frm}",
                      "files": report}, ensure_ascii=False, indent=1))
    if errors:
        print("-- errors --")
        for e in errors:
            print("  !", e)
        sys.exit(1)
    if a.write:
        for path, txt in cache.items():
            io.open(path, "w", encoding="utf-8").write(txt)
        print(f"written: {len(cache)} file(s)")
    else:
        print(f"dry run: {len(cache)} file(s) would change")


if __name__ == "__main__":
    main()
