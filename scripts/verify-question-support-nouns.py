"""ADR-135 / v244: compare every question-support noun anchor with WiktionaryDE.
ADR-139 / v248: the same check runs on the Goethe A1 core-vocabulary anchors (export with `goethe-core`).
ADR-141 / v250: and on the Goethe A2 core-vocabulary anchors (export with `goethe-a2-core`).
ADR-142 / v251: and on the Goethe B1 food and perception anchors (export with `goethe-b1-core`).
ADR-150 / v259: and on the anchors of the six further B1 themes (export with `goethe-b1-themes`).
ADR-151 / v260: and on the anchors of four more B1 themes (export with `goethe-b1-themes-2`).
ADR-152 / v261: and on the anchors of the next four B1 themes (export with `goethe-b1-themes-3`).
ADR-153 / v262: and on the anchors of four more B1 themes (export with `goethe-b1-themes-4`).
ADR-154 / v263: and on the anchors of the project-work words in b1-24 (export with `goethe-b1-themes-5`).
ADR-155 / v264: and on the anchors appended to b1-08, b1-11, b1-19 and b1-20 (export with `goethe-b1-themes-6`).

Source: the `german_nouns` 1.2.5 package on PyPI (WiktionaryDE extract, CC BY-SA 4.0).
Usage:
  npx tsx scripts/export-question-support-nouns.ts /tmp/qs-nouns.json
  python -m venv /tmp/gnv && /tmp/gnv/bin/pip install german_nouns==1.2.5
  /tmp/gnv/bin/python scripts/verify-question-support-nouns.py /tmp/qs-nouns.json reports/lexical-review-packet/source-verification-question-support-nouns-2026-10-19.csv
Agent source verification (ADR-116 tier `source-verified-agent`), not an independent German review.
"""
import json, csv, sys
# Rows the package cannot decide (no genus recorded, or an adjectival noun filed under its strong form)
# were checked by hand on de.wiktionary on 2026-10-19.
MANUAL = {
    "a1-02-noun-17": ("confirmed-wiktionary-manual", "de.wiktionary «Spanisch»: Substantiv n, kein Plural; (das) Spanisch / (dem) Spanisch. german_nouns führt für Sprachnamen kein Genus."),
    "b2-08-noun-22": ("confirmed-wiktionary-manual", "de.wiktionary «Befragter»: Substantiv m, adjektivische Deklination; der Befragte / den Befragten / dem Befragten; Pl. die Befragten."),
}
from german_nouns.lookup import Nouns
N = Nouns()
G = {"m": "masculine", "f": "feminine", "n": "neuter"}
rows = json.load(open(sys.argv[1]))
# ADR-142 / v251: optional third argument records the check date (earlier evidence files used 2026-10-19).
CHECKED_ON = sys.argv[3] if len(sys.argv) > 3 else "2026-10-19"
def entries(word):
    try: return [e for e in N[word] if "Substantiv" in " ".join(e.get("pos", [])) or e.get("genus")]
    except Exception: return []
def forms(e, key):
    f = e.get("flexion", {}); return {v for k, v in f.items() if k.startswith(key)}
out = []
for r in rows:
    lemma = r["lemma"]; base = None
    cands = entries(lemma)
    if not cands:
        # compound: longest known tail
        for i in range(1, len(lemma) - 2):
            tail = lemma[i].upper() + lemma[i+1:]
            c = entries(tail)
            if c: base, cands = tail, c; break
    res, note = "unresolved", ""
    if r["gender"] == "plural-only":
        # ADR-139 / v248: a Pluraletantum has no genus in WiktionaryDE; compare the plural paradigm instead.
        for e in cands:
            f = e.get("flexion", {})
            if any(k.startswith("nominativ singular") for k in f): continue
            if r["nom"].split()[-1] == f.get("nominativ plural") and r["acc"].split()[-1] == f.get("akkusativ plural") and r["dat"].split()[-1] == f.get("dativ plural"):
                res, note = "confirmed-wiktionary-plural-only", "Pluraletantum: Nominativ, Akkusativ und Dativ Plural stimmen mit dem Wiktionary-Lemma ohne Singular überein."
                break
    for e in ([] if res != "unresolved" else cands):
        g = {G.get(x) for x in (e.get("genus"), e.get("genus 1"), e.get("genus 2")) if x}
        if r["gender"] not in g: continue
        pref = lemma[: len(lemma) - len(base)] if base else ""
        fix = lambda s: (pref + s[0].lower() + s[1:]) if base and s else s
        nom_pl = {fix(x) for x in forms(e, "nominativ plural")}
        acc = {fix(x) for x in forms(e, "akkusativ singular")}
        dat = {fix(x) for x in forms(e, "dativ singular")}
        a_ok = r["acc"].split()[-1] in acc; d_ok = r["dat"].split()[-1] in dat
        p_ok = r["plural"] is None or r["plural"] in nom_pl
        if a_ok and d_ok and p_ok:
            res = "confirmed-wiktionary-compound-head" if base else "confirmed-wiktionary"
            note = (f"Genus und Kasusformen stimmen mit dem Wiktionary-Lemma «{base}» als Grundwort überein." if base else "Genus und Kasusformen stimmen mit dem Wiktionary-Lemma überein.")
            if r["plural"] is None: note += " Kein Plural angegeben (unzählbar oder im Lektionssinn nicht gebraucht)."
            break
        note = f"Genus stimmt; Formen weichen ab: Plural {sorted(nom_pl)} Akk {sorted(acc)} Dat {sorted(dat)}"
        res = "form-mismatch"
    if res == "unresolved" and cands and not note:
        note = "Genus weicht ab: " + ",".join(sorted({str(e.get('genus')) for e in cands}))
        res = "gender-mismatch"
    if r["id"] in MANUAL: res, note = MANUAL[r["id"]]
    source = "de.wiktionary.org, manuell geprüft" if r["id"] in MANUAL else "WiktionaryDE via german_nouns 1.2.5 (PyPI, CC BY-SA 4.0)"
    out.append([r["id"], r["lessonId"], lemma, r["gender"], r["nom"], r["plural"] or "", res, note, source, CHECKED_ON])
from collections import Counter
print(dict(Counter(o[6] for o in out)))
for o in out:
    if not o[6].startswith("confirmed"): print(o[0], o[2], o[3], o[5], o[6], o[7])
w = csv.writer(open(sys.argv[2], "w", newline="", encoding="utf-8"), quoting=csv.QUOTE_ALL, lineterminator="\n")
w.writerow(["anchorId","lessonId","lemma","gender","nominative","plural","sourceResult","sourceNote","source","checkedOn"]); w.writerows(out)
