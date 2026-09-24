#!/usr/bin/env python3
"""Parallelise multiple-choice option lengths so the correct answer is not the uniquely
longest option (the test-design cue measured by reports/lesson-quality-audit.json).

A batch is JSON: { lessonId: { itemId: ["opt A","opt B","opt C","opt D"] } }.
The key string must stay byte-identical at its current correctIndex; only distractors
are rewritten. Edits are bracket-safe by construction: the `options:[` array is located,
its extent scanned with quote awareness, and only the body between the brackets is replaced.

Run: python3 scripts/parallelise-options.py --batch <json> [--write]
"""
import argparse, glob, json, re, sys, unicodedata

LEN_RE = re.compile(r"[.!?]$")
CJK = re.compile(r"[\u3000-\u30ff\u3400-\u4dbf\u4e00-\u9fff\uff01-\uff5e\u3001-\u3003]")
HEBREW = re.compile(r"[\u0590-\u05ff]")
ARABIC = re.compile(r"[\u0600-\u06ff\u0750-\u077f\ufffb-\uffff]")

def eff_len(s: str) -> int:
    return len(LEN_RE.sub("", s.strip()))

def split_options(body: str):
    """Split a JS array body of double-quoted strings, honouring backslash escapes."""
    out, cur, quoted, esc = [], "", False, False
    for ch in body:
        if quoted:
            if esc:
                cur += ch; esc = False
            elif ch == "\\":
                cur += ch; esc = True
            elif ch == '"':
                quoted = False; out.append(cur.replace('\\"', '"').replace("\\n", "\n")); cur = ""
            else:
                cur += ch
            continue
        if ch == '"':
            quoted = True
        elif ch == "[":
            pass
    if quoted:
        raise SystemExit("unterminated string in options array")
    return out

def scan_array(text: str, open_idx: int):
    depth, i, quoted, esc = 0, open_idx, False, False
    while i < len(text):
        ch = text[i]
        if quoted:
            if esc: esc = False
            elif ch == "\\": esc = True
            elif ch == '"': quoted = False
            i += 1; continue
        if ch == "\\": esc = True; i += 1; continue
        if ch == '"': quoted = True; i += 1; continue
        if ch in "[{(": depth += 1
        elif ch in "]})":
            depth -= 1
            if depth == 0: return open_idx, i
        i += 1
    raise SystemExit("unbalanced array — refusing to edit")

def js_quote(s: str) -> str:
    return '"' + s.replace("\\", "\\\\").replace('"', '\\"') + '"'

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--batch", required=True)
    ap.add_argument("--write", action="store_true")
    args = ap.parse_args()
    batch = json.load(open(args.batch, encoding="utf-8"))
    import os
    root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    files = sorted(glob.glob(os.path.join(root, "src", "data", "lessons-*.ts")))
    cache = {f: open(f, encoding="utf-8").read() for f in files}
    touched, problems = set(), []
    for lesson_id, items in batch.items():
        for item_id, new_opts in items.items():
            hit = None
            for f, text in cache.items():
                for pat in (f'id:"{item_id}"', f'id: "{item_id}"'):
                    p = text.find(pat)
                    if p >= 0:
                        if hit and hit[0] != f:
                            problems.append(f"{item_id}: id appears in two files ({hit[0]} and {f})")
                        hit = (f, p, len(pat))
            if not hit:
                problems.append(f"{item_id}: item id not found"); continue
            f, pos, plen = hit
            text = cache[f]
            a = text.find("options:", pos)
            if a < 0 or a - (pos + plen) > 4000:
                problems.append(f"{item_id}: no options array right after the id"); continue
            ob = text.find("[", a)
            start, end = scan_array(text, ob)
            old = split_options(text[start + 1 : end])
            if len(old) != 4:
                problems.append(f"{item_id}: parsed {len(old)} options, expected 4"); continue
            m = re.compile(r"correctIndex:\s*([0-3])").search(text[end : end + 400])
            if not m:
                problems.append(f"{item_id}: correctIndex not found after options"); continue
            ci = int(m.group(1))
            key = old[ci]
            if [o for o in new_opts if o == key] != [key] or new_opts[ci] != key:
                problems.append(f"{item_id}: the key string must stay at index {ci} byte-identical"); continue
            if len(set(new_opts)) != 4:
                problems.append(f"{item_id}: duplicate options"); continue
            lens = [eff_len(o) for o in new_opts]
            spread = max(lens) - min(lens)
            ties = sum(1 for x in lens if x == max(lens))
            if spread > 25:
                problems.append(f"{item_id}: length spread {spread} exceeds 12 ({lens})")
            if lens[ci] == max(lens) and ties == 1:
                problems.append(f"{item_id}: the key is still the unique longest ({lens})")
            if lens[ci] == min(lens) and sum(1 for x in lens if x == min(lens)) == 1:
                problems.append(f"{item_id}: the key is now the unique shortest ({lens}) — a reverse cue")
            for o in new_opts:
                if CJK.search(o): problems.append(f"{item_id}: CJK in option text")
                if HEBREW.search(o): problems.append(f"{item_id}: Hebrew letters in option text")
            expl_new = items[item_id].get("explanationAr") if isinstance(items[item_id], dict) else None
            if expl_new:
                m2 = re.compile(r"explanationAr:\s*((?:\"[^\"]*\"|[^\"])*?)\s*(?:,|\})").search(text[end:end+1200])
                if not m2:
                    problems.append(f"{item_id}: explanationAr not found after options"); continue
                old_expl = m2.group(1).encode().decode("unicode_escape") if "\\" in m2.group(1) else m2.group(1)
            sep = ", " if '", "' in text[start + 1 : end] else ","
            new_body = sep.join(js_quote(o) for o in new_opts)
            old_lens = [eff_len(o) for o in old]
            print(f"{item_id}: lens {old_lens} -> {lens} spread {max(old_lens)-min(old_lens)}->{spread} key@{ci} {'OK' if not any(item_id in p for p in problems) else 'REJECT'}")
            cache[f] = text[: start + 1] + new_body + text[end:]
            touched.add(f)
    if problems:
        print("\n-- problems --")
        for p in problems: print("  !", p)
    if args.write:
        if problems:
            print("\nrefusing to write while problems remain"); sys.exit(2)
        for f in touched:
            open(f, "w", encoding="utf-8").write(cache[f])
        print(f"\nwritten: {len(touched)} file(s), {sum(len(v) for v in batch.values())} item(s)")
    else:
        print(f"\ndry run: {len(touched)} file(s) would change; {sum(len(v) for v in batch.values())} item(s)")

if __name__ == "__main__":
    main()
