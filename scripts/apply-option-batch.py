#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Apply an option-text batch to src/data/lessons-*.ts.

Payload shape: a Python module exposing `C = { "<itemId>": { <optionIndex>: "<new option text>", ... }, ... }`
(or a JSON file with the same shape). Only the listed option strings are replaced; the correct index, the
key and every explanation stay untouched.

Every guard below is checked BEFORE a single byte is written; any violation aborts with exit 1 and an
empty write set (P1-397 rewrite rule: a distractor may be extended, but the answer must never change,
no option may duplicate another, an option quoted inside its own explanation may not be edited, and no
Latin case name may be introduced into a controlled exercise).

Run: python3 scripts/apply-option-batch.py --level a1 --payload /home/user/tmp/x.py [--dry]
"""
import argparse, importlib.util, io, json, os, re, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
LEVEL_FILES = {
    "a1": "src/data/lessons-a1-*.ts",
    "a2": "src/data/lessons-a2-*.ts",
    "b1": "src/data/lessons-b1-*.ts",
    "b2": "src/data/lessons-b2-*.ts",
}
CASE_NAMES = ("Nominativ", "Akkusativ", "Dativ", "Genitiv")
CJK = re.compile(r"[\u3000-\u30ff\u4e00-\u9fff\uac00-\ud7af]")


def norm(value: str) -> str:
    """Same reduction the quote audit uses to decide whether an option is already quoted."""
    text = value.lower()
    text = re.sub(r"[.!?,;:،؛„“\"'’‘«»]", " ", text)
    return re.sub(r"\s+", " ", text).strip()


def load_payload(path: str) -> dict:
    if path.endswith(".json"):
        return json.load(io.open(path, encoding="utf-8"))
    spec = importlib.util.spec_from_file_location("payload", path)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module.C


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--level", required=True, choices=sorted(LEVEL_FILES))
    ap.add_argument("--payload", required=True)
    ap.add_argument("--dry", action="store_true")
    args = ap.parse_args()

    payload = load_payload(args.payload)
    pattern = re.compile(r"^" + os.path.basename(LEVEL_FILES[args.level]).replace("*", "[^/]*") + r"$")
    files = [
        os.path.join(ROOT, "src", "data", name)
        for name in sorted(os.listdir(os.path.join(ROOT, "src", "data")))
        if pattern.fullmatch(name)
    ]
    if not files:
        print(f"no source file for level {args.level}")
        return 1

    sources = {path: io.open(path, encoding="utf-8").read() for path in files}
    violations, edits, written, missing = [], [], 0, []
    for item_id in sorted(payload):
        block_re = re.compile(r'\{\s*"?id"?\s*:\s*"%s"' % re.escape(item_id))
        found = [(path, block_re.search(text)) for path, text in sources.items() if block_re.search(text)]
        if not found:
            missing.append(item_id)
            continue
        path, match = found[0]
        text = sources[path]
        start = match.start()
        depth, index, in_string, escaped = 0, start, False, False
        while index < len(text):
            char = text[index]
            if in_string:
                if escaped:
                    escaped = False
                elif char == "\\":
                    escaped = True
                elif char == '"':
                    in_string = False
            elif char == '"':
                in_string = True
            elif char == "{":
                depth += 1
            elif char == "}":
                depth -= 1
                if depth == 0:
                    break
            index += 1
        block = text[start:index + 1]
        m_opt = re.search(r'"?options"?\s*:\s*\[(.*?)\]', block, re.S)
        if not m_opt:
            violations.append(f"{item_id}: no options array in block")
            continue
        options = re.findall(r'"((?:[^"\\]|\\.)*)"', m_opt.group(1))
        key = re.search(r'"?correctIndex"?\s*:\s*(\d+)', block)
        if not key:
            violations.append(f"{item_id}: no correctIndex")
            continue
        correct = int(key.group(1))
        ex = re.search(r'"?explanationAr"?\s*:\s*"((?:[^"\\]|\\.)*)"', block)
        explanation = norm(ex.group(1)) if ex else ""
        for index, new_text in sorted(payload[item_id].items()):
            index = int(index)
            if index == correct:
                violations.append(f"{item_id}: index {index} is the correct answer")
                continue
            if index >= len(options):
                violations.append(f"{item_id}: index {index} out of range")
                continue
            old_text = options[index]
            if norm(old_text) and norm(old_text) in explanation:
                violations.append(f"{item_id}: option {index} is quoted inside its explanation")
            if any(norm(new_text) == norm(other) for i, other in enumerate(options) if i != index):
                violations.append(f"{item_id}: new option {index} duplicates another option")
            if CJK.search(new_text):
                violations.append(f"{item_id}: new option {index} contains CJK")
            for case in CASE_NAMES:
                if case in new_text and case not in old_text:
                    violations.append(f"{item_id}: new option {index} introduces case name {case}")
            if block.count(f'"{old_text}"') != 1:
                violations.append(f"{item_id}: old option {index} is not unique inside its own item")
            edits.append((path, item_id, index, old_text, new_text))

    if missing:
        violations += [f"{item_id}: id not found in {args.level} sources" for item_id in missing]
    if violations:
        print("VIOLATIONS:")
        for violation in violations:
            print(f"  x {violation}")
        print(f"refused: nothing written ({len(payload)} payload item(s), {len(edits)} candidate edit(s))")
        return 1
    if args.dry:
        print(f"dry: {len(edits)} edit(s) across {len({e[0] for e in edits})} file(s) — nothing written")
        for _, item_id, index, old_text, new_text in edits[:5]:
            print(f"  {item_id} [{index}] {len(old_text)} → {len(new_text)}: {new_text[:70]}")
        return 0

    for path, item_id, index, old_text, new_text in edits:
        text = sources[path]
        match = re.search(r'\{\s*"?id"?\s*:\s*"%s"' % re.escape(item_id), text)
        if not match:
            print(f"{item_id}: block vanished between check and write — aborting with no write")
            return 1
        head, tail = text[: match.start()], text[match.start():]
        head_offset = tail.find(f'"{old_text}"')
        if head_offset == -1:
            print(f"{item_id}: option text vanished between check and write — aborting with no write")
            return 1
        sources[path] = head + tail[:head_offset] + f'"{new_text}"' + tail[head_offset + len(old_text) + 2 :]
        written += 1
    for path, text in sources.items():
        if any(e[0] == path for e in edits):
            io.open(path, "w", encoding="utf-8").write(text)
    print(f"[{args.level}] applied {written} option edit(s) across {len(payload)} item(s)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
