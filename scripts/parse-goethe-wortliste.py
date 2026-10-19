#!/usr/bin/env python3
"""Parse the official Goethe-Institut Wortliste PDFs (A1, A2, B1) into headword entries.

Usage (PDFs and output must live OUTSIDE the repository; the lists are copyrighted):
    python3 -m venv /tmp/pdfv && /tmp/pdfv/bin/pip install pdfplumber
    /tmp/pdfv/bin/python scripts/parse-goethe-wortliste.py --dir /tmp/goethe-src A1 A2 B1

Expects <dir>/raw/{A1,A2,B1}.pdf (the editions are pinned by SHA-256 in
docs/GOETHE_REFERENCE_ALIGNMENT_AR.md) and writes <dir>/{level}.entries.json and
<dir>/{level}.groups.txt. Only derived counts and missing-word lists may enter Git
(section 44b UrhG, text and data mining); delete the directory after the run.

Method: pdfplumber word boxes; keep only the headword column of the alphabetical pages,
group words into lines by their top coordinate, merge continuation lines (principal parts of
verbs, hyphenated breaks, regional notes), take the lemma after an article, flag indented
sub-entries (B1) and Austrian/Swiss-only variants.
"""
import argparse
import os
import pdfplumber, json, re, sys, collections

CFG = {
    "A1": {"pages": range(8, 27), "cols": [(135, 232)]},
    "A2": {"pages": range(7, 32), "cols": [(25, 100), (295, 370)]},
    "B1": {"pages": range(15, 104), "cols": [(25, 130), (305, 410)]},
}
ART = {"der", "die", "das"}
SKIP_FIRST = {"hat", "ist", "war", "hatte"}

def lemma_of(raw):
    t = raw.replace("(sich)", "sich").split()
    if not t:
        return None
    i = 0
    if t[0] in ART or re.fullmatch(r"(der|die|das)/(der|die|das)", t[0]):
        i = 1
    if i < len(t) and t[i] == "sich":
        i += 1
    if i >= len(t):
        return None
    w = t[i]
    w = w.replace("(", "").replace(")", "")
    w = w.split(",")[0]
    w = re.sub(r"[,;:]+$", "", w)
    w = re.sub(r"\d+\.?$", "", w)  # superscript / numbering glued
    w = w.strip("()")
    return w or None

def parse(level):
    cfg = CFG[level]
    out = []
    prev_text = None
    prev_top = None
    with pdfplumber.open(os.path.join(BASE, "raw", f"{level}.pdf")) as pdf:
        for p in cfg["pages"]:
            if p >= len(pdf.pages):
                break
            page = pdf.pages[p]
            words = page.extract_words(keep_blank_chars=False, use_text_flow=False, extra_attrs=["fontname", "size"])
            for (x0, x1) in cfg["cols"]:
                ws = [w for w in words if x0 <= w["x0"] < x1 and w["top"] < 800 and w["top"] > 40]
                if not ws:
                    continue
                colstart = min(w["x0"] for w in ws)
                lines = collections.OrderedDict()
                for w in sorted(ws, key=lambda w: (round(w["top"]), w["x0"])):
                    key = None
                    for k in lines:
                        if abs(k - w["top"]) < 2.5:
                            key = k
                            break
                    if key is None:
                        key = w["top"]
                        lines[key] = []
                    lines[key].append(w)
                prev_top = None
                for top in sorted(lines):
                    lw = sorted(lines[top], key=lambda w: w["x0"])
                    text = " ".join(w["text"] for w in lw).strip()
                    if not text:
                        continue
                    # single-letter section headers (A, B, ...)
                    if re.fullmatch(r"[A-ZÄÖÜ]", text):
                        prev_text = None
                        continue
                    first = text.split()[0]
                    cont = False
                    hyph = False
                    if prev_text is not None:
                        pt = prev_text.rstrip()
                        if pt.endswith(","):
                            cont = True
                        elif len(pt.split()) >= 2 and re.search(r"[a-zäöüß]-$", pt) and not re.search(r"/\S*-$", pt) and text[:1].islower():
                            cont = True
                            hyph = True
                    if first in SKIP_FIRST:
                        cont = True
                    if re.match(r"^(\((Pl\.|[A-Z, ]+)\)|→)", text):
                        cont = True
                    if prev_text is not None and prev_top is not None and top - prev_top < 14:
                        pt = prev_text.rstrip()
                        if pt.endswith(("→", ":", ";", "/")) or pt.count("(") > pt.count(")"):
                            cont = True
                    if not cont and out and text[:1].islower() and re.search(r"\b(hat|ist)\b", text) and not re.search(r"\b(hat|ist)\b", out[-1]["raw"]) and out[-1]["raw"][:1].islower():
                        cont = True
                    if not cont and out and "→" in out[-1]["raw"] and re.fullmatch(r"[A-ZÄÖÜ][\wäöüß-]*[;,]?", text):
                        cont = True
                    if cont and out:
                        if hyph:
                            out[-1]["raw"] = out[-1]["raw"][:-1] + text
                        else:
                            out[-1]["raw"] += " " + text
                        prev_text = text
                        prev_top = top
                        continue
                    indent = lw[0]["x0"] - colstart
                    out.append({"raw": text, "page": p + 1, "indent": round(indent, 1), "bold": "Bold" in lw[0]["fontname"]})
                    prev_text = text
                    prev_top = top
    for e in out:
        e["lemma"] = lemma_of(e["raw"])
        e["noun"] = e["raw"].split()[0] in ART or e["raw"].split()[0] in {"der/die"}
        e["sub"] = e["indent"] > 12
        e["regional"] = bool(re.search(r"\((A|CH|A, CH|CH, A)\)", e["raw"].split("→")[0]))
        e["alts"] = [a.strip("-") for a in (e["lemma"] or "").split("/") if a.strip("-")]
    JUNK = re.compile(r"^(INVeNTAre|WORTLISTE|Goethe-Institut|Dachauer|80637|Ihre|ALPHABETISCHER|Alphabetischer|\d)")
    out = [e for e in out if e["lemma"] and re.match(r"^[A-Za-zÄÖÜäöüß]", e["lemma"]) and not JUNK.match(e["raw"]) and not e["raw"].startswith("2 ")]
    return out

GROUP_PAGES = {"A1": range(5, 8), "A2": range(4, 7), "B1": range(7, 15)}
BASE = ""

if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--dir", required=True)
    ap.add_argument("levels", nargs="+", choices=sorted(CFG))
    args = ap.parse_args()
    BASE = os.path.abspath(args.dir)
    repo = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
    if BASE == repo or BASE.startswith(repo + os.sep):
        sys.exit("The Goethe lists are copyrighted: --dir must be outside the repository.")
    for lv in args.levels:
        ents = parse(lv)
        json.dump(ents, open(os.path.join(BASE, f"{lv}.entries.json"), "w"), ensure_ascii=False, indent=0)
        with pdfplumber.open(os.path.join(BASE, "raw", f"{lv}.pdf")) as pdf:
            text = "\n".join(pdf.pages[i].extract_text() or "" for i in GROUP_PAGES[lv])
        open(os.path.join(BASE, f"{lv}.groups.txt"), "w").write(text)
        main = [e for e in ents if not e["sub"]]
        print(lv, "entries", len(ents), "main", len(main), "sub", len(ents) - len(main), "regional", sum(e["regional"] for e in ents))
