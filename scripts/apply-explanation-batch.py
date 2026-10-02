#!/usr/bin/env python3
"""Apply an authored explanation batch to `src/data/lessons-<level>-module*.ts`.

Why this exists (measured 2026-09-21): a sandbox snapshot reverted the lesson files to a state
before batches #3-#8. Only the payload JSONs survived, and re-applying them restored 145 items in
one pass. The payloads and this applier therefore live in the repository
(`docs/run-logs/a2-explanations-payloads/`), not in a scratch directory.

Payload shape: { "<exerciseId>": { "explanationAr": "...", "promptAr": "...", "oldLen": 14 } }.
`oldLen` is a positional safety lock: the field is only rewritten when the current text length
matches what the batch was authored against, so an already-lifted item is skipped instead of
silently overwritten, and a batch authored against a different generation refuses to land.

usage: python3 scripts/apply-explanation-batch.py --level a2 --payload <file.json> [--dry-run]
"""
import argparse, json, pathlib, re, sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
FIELD = lambda name: re.compile(r'%s"?\s*:\s*"' % name)
STATUS = re.compile(r"^\d+->\d+$")


def read_val(text, i):  # i at opening quote
    j = i + 1
    while j < len(text) and not (text[j] == '"' and text[j - 1] != "\\"):
        j += 1
    return json.loads('"' + text[i + 1 : j] + '"'), i, j


def write_val(text, i, j, new):
    return text[:i] + '"' + json.dumps(new, ensure_ascii=False)[1:-1] + '"' + text[j + 1 :]


def main():
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--level", required=True)
    ap.add_argument("--payload", required=True)
    ap.add_argument("--dry-run", action="store_true")
    ap.add_argument("--data-root", default=str(ROOT / "src" / "data"))
    args = ap.parse_args()

    spec = json.loads(pathlib.Path(args.payload).read_text(encoding="utf8"))
    data = pathlib.Path(args.data_root)
    files = sorted(data.glob(f"lessons-{args.level}-module*.ts"))
    if not files:
        print(f"batch refused: no lessons-{args.level}-module*.ts under {data}", file=sys.stderr)
        return 1

    report, written, refused = [], 0, 0
    for f in files:
        text = f.read_text(encoding="utf8")
        orig = text
        for exid, patch in spec.items():
            m = re.search(r'[{,]\s*"?id"?\s*:\s*"%s"' % re.escape(exid), text)
            if not m:
                continue
            for field in ("promptAr", "explanationAr"):
                if field not in patch:
                    continue
                fm = FIELD(field).search(text, m.end())
                if not fm:
                    report.append((exid, field, "FIELD-MISS"))
                    refused += 1
                    continue
                obj = text[m.end() : fm.start()]
                if re.search(r'[{,]\s*"?id"?\s*:', obj):
                    report.append((exid, field, "ABORT-cross-object"))
                    refused += 1
                    continue
                old, i, j = read_val(text, fm.end() - 1)
                if patch.get("oldLen") is not None and len(old.strip()) != patch["oldLen"]:
                    report.append((exid, field, f"SKIP-already-lifted measured={len(old.strip())} expected={patch['oldLen']}"))
                    continue
                new = patch[field]
                text = write_val(text, i, j, new)
                report.append((exid, field, f"{len(old.strip())}->{len(new)}"))
                written += 1
        if text != orig and not args.dry_run:
            f.write_text(text, encoding="utf8")

    for r in report:
        print(r)
    touched = len({r[0] for r in report if STATUS.match(str(r[2]))})
    missing = sorted(set(spec) - {r[0] for r in report})
    print(f"{'dry-run: would write' if args.dry_run else 'wrote'} {written} field(s) across {touched} item(s) of {len(spec)} payload · skipped-or-refused: {refused} · not found: {len(missing)}")
    if missing:
        print("missing ids:", ", ".join(missing), file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
