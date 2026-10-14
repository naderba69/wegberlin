import csv, re, sys
NOUNS = "/tmp/gn/nouns.csv"
SRC = "/home/user/wegberlin/reports/lexical-review-packet/unresolved-candidates.csv"
OUT = "/home/user/lexical-check/noun-check.csv"
ARTS = {"der","die","das","den","dem","des","ein","eine","einen","einem","einer","eines"}
ALLOWED = {
  "m": {"der","den","dem","des","ein","einen","einem","eines"},
  "f": {"die","der","eine","einer","ein"},
  "n": {"das","dem","des","ein","eines"},
}
# genus lookup from Wiktionary (noun rows only)
gen = {}
with open(NOUNS, encoding="utf-8", newline="") as f:
    for row in csv.DictReader(f):
        if "Substantiv" not in row["pos"]: continue
        lemma = row["lemma"]
        g = row["genus"].strip()
        if lemma and g in ("m","f","n","m,n","f,n","m,f","m,f,n") and lemma not in gen:
            gen[lemma] = g
def lemma_of(word):
    # inflected forms: strip common genitive/plural endings for lookup
    cands = [word]
    for suf in ("es","s","en","n","e"):
        if word.endswith(suf) and len(word) > len(suf)+2:
            cands.append(word[:-len(suf)])
    cands += [w + "e" for w in cands[:1]]
    for c in cands:
        if c in gen: return c
    return None
def article_before(text, word):
    # find word occurrence, walk back up to 3 lowercase tokens to an article
    toks = re.findall(r"[A-Za-zÄÖÜäöüß\-]+|[,.;:!?„“\"()]", text)
    res = []
    for i, t in enumerate(toks):
        if t == word:
            j = i - 1; steps = 0
            while j >= 0 and steps < 4 and toks[j][:1].islower() and toks[j] not in ARTS:
                j -= 1; steps += 1
            if j >= 0 and toks[j] in ARTS:
                res.append(toks[j])
    return res
rows = list(csv.DictReader(open(SRC, encoding="utf-8")))
out = []
for r in rows:
    if r["automatedInventoryStatus"] != "pending-human" or r["candidateType"] != "noun": continue
    word = r["candidate"]
    text = r["targetReferences"] + " || " + r["contextReferences"]
    text = re.sub(r"\[[^\]]*\]\s*", "", text)
    lem = word if word in gen else lemma_of(word)
    inflected = (lem is not None and lem != word)
    g = gen.get(lem, "") if lem else ""
    arts = []
    for w in {word, lem or word}:
        arts += article_before(text, w)
    arts = sorted(set(arts))
    if not lem:
        status = "lemma-not-in-wiktionary"
    elif not arts:
        status = "gender-not-shown-in-text"
    else:
        ok = all(any(a in ALLOWED.get(x, set()) for x in g.split(",")) for a in arts)
        status = "agrees" if ok else "discrepancy"
    out.append([r["candidateId"], r["level"], r["lessonId"], word, lem or "", g, ";".join(arts), "yes" if inflected else "no", status])
with open(OUT, "w", encoding="utf-8", newline="") as f:
    w = csv.writer(f)
    w.writerow(["candidateId","level","lessonId","candidate","wiktionaryLemma","wiktionaryGenus","articlesInAuthoredText","inflectedSurface","status"])
    w.writerows(out)
from collections import Counter
print(len(out), Counter(x[-1] for x in out))
