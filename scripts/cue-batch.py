#!/usr/bin/env python3
"""Build a cue-parallelism batch from authored distractors.

Reads the item dump produced by the repo probe (one JSON per line with id/key/keyLen/correctIndex/others),
takes three new distractors per item (placed into the non-key positions in ascending index order),
validates every rule the repo guard enforces, and writes the batch JSON for scripts/parallelise-options.py.

Usage: python3 scripts/cue-batch.py <items.jsonl> <authored.json> <lessonId> <out.json>
"""
import json, re, sys

strip = lambda s: re.sub(r"[.!?]+$", "", s.strip())
AR = re.compile(r"[\u0600-\u06ff]")
STRAY = re.compile(r"[\u0590-\u05ff\u3000-\u30ff\u3400-\u4dbf\u4e00-\u9fff\u0400-\u04ff]")
LATIN = re.compile(r"[A-Za-zÄÖÜäöüß]")


def lang_of(s):
    a, l = bool(AR.search(s)), bool(LATIN.search(s))
    return "ar" if a and not l else "de" if l and not a else "mixed"


def main():
    items_file, authored_file, lesson, out = sys.argv[1:5]
    items = {}
    for line in open(items_file, encoding="utf-8"):
        d = json.loads(line)
        items[d["id"]] = d
    authored = json.load(open(authored_file, encoding="utf-8"))
    batch, report, errors = {}, [], []
    for iid, texts in authored.items():
        it = items.get(iid)
        if not it:
            errors.append(f"{iid}: ليس في قائمة العناصر المقيسة")
            continue
        four = [None] * 4
        four[it["correctIndex"]] = it["key"]
        free = [i for i in range(4) if i != it["correctIndex"]]
        if len(texts) != 3:
            errors.append(f"{iid}: ثلاثة مشتتات مطلوبة، لا {len(texts)}")
            continue
        for pos, txt in zip(free, texts):
            four[pos] = txt
        lens = [len(strip(o)) for o in four]
        k = it["correctIndex"]
        others = [lens[i] for i in range(4) if i != k]
        if STRAY.search("".join(four)):
            errors.append(f"{iid}: حروف شرق آسيوية/عبرية/كيريلية")
        if lang_of(it["key"]) != "de" or any(lang_of(four[i]) != "de" for i in range(4)):
            errors.append(f"{iid}: مجموعة الخيارات ليست ألمانية نقية (lang={set(lang_of(o) for o in four)})")
        folded = {strip(o).lower().replace("ä", "ae").replace("ö", "oe").replace("ü", "ue").replace("ß", "ss") for o in four}
        if len(folded) != 4:
            errors.append(f"{iid}: تكرار بعد الطي")
        if lens[k] == max(lens):
            errors.append(f"{iid}: المفتاح ما يزال الأطول وحده ({lens[k]})")
        if lens[k] == min(lens):
            errors.append(f"{iid}: المفتاح صار الأقصر وحده ({lens[k]})")
        if max(lens) - min(lens) > 25:
            errors.append(f"{iid}: توسيع {max(lens)-min(lens)} > 25")
        if not re.fullmatch(r"[ab][12]-\d{2}-[a-z]+[0-9]+", iid):
            errors.append(f"{iid}: معرّف غير متوقع")
        batch.setdefault(lesson, {})[iid] = four
        report.append((iid, lens, k, max(lens) - min(lens)))
    print(f"{"id":14s} أطوال (المفتاح *)        توسيع")
    for iid, lens, k, spread in report:
        marks = ["*" if i == k else " " for i in range(4)]
        print(f"{iid:14s} " + "  ".join(f"{l}{m}" for l, m in zip(lens, marks)) + f"   {spread}")
    if errors:
        print("\nأخطاء:")
        for e in errors:
            print("  ✗", e)
        sys.exit(1)
    missing = set(items) - set(authored)
    if missing:
        print(f"تنبيه: لم أُحرِّر {len(missing)} عنصرًا: {sorted(missing)[:6]}")
    json.dump(batch, open(out, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    print(f"\n✓ الدفعة جاهزة: {len(authored)} عنصرًا → {out}")


main()
