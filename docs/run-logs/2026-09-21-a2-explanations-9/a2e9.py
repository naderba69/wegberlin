#!/usr/bin/env python3
"""A2 explanation batch #8 (24 items, 2026-09-21) — second batch picked from THE MEDIAN POPULATION.

Ids come from /home/user/tmp/pick_median.ts: the shortest 24 of the 1,063 population items still
under 60 chars (11–13 chars: miniTest items, listening/reading questions). Lifting 24 of them moves
the measured distance 438 → 414.

Guards identical to batch #7: band 156–212, no positional wording, no CJK, no duplicated text, old
text and its length are READ FROM THE REPO, any case term in the old text must survive, and an item
already >= 60 chars is refused (wrong tranche). Content rule: every explanation cites the passage or
transcript phrase it is about, so nothing depends on extra-linguistic (e.g. clinical) knowledge.
"""
import json, re, sys, pathlib

DATA = pathlib.Path("/home/user/der-weg-nach-berlin/src/data")
POS = re.compile(r"(الموضع|المرتبة|ترقيم|الفقرة\s*\d|الخيار\s+[A-Dأبجد]\b|الإعلان\s+[A-D]\b|البند\s+[A-D]\b|الأول|الثاني|الثالثة|الثالث|الرابع|الأخيرة|الأخير|option\s*[A-D]|choice\s*[A-D])", re.I)
CASE = re.compile(r"Akkusativ|Dativ|Genitiv|Nominativ|Kasus")
CJK = re.compile(r"[\u3040-\u30ff\u4e00-\u9fff]")

T = {
 "a2-01-rq1": "النصّ يشرح السبب صراحةً: «Gestern ist der Bus aber nicht gekommen». ثم مشى عشرين دقيقة وأخذ Straßenbahn، أمّا النومُ الزائد فانغلاقُ العمل فلا ذكر لهما. فحص ذاتي: هل أخذتَ السببَ من الجملة؟",
 "a2-01-m2": "الفعل kommen انتقالٌ، وفي Perfekt يُسند إلى sein لا haben: «Sie ist gekommen». لذلك تُرفض hat وhabt لأنّهما مع haben، أمّا wird فتبني Futur لا الماضي. فحص ذاتي: هل كان الحدثُ انتقالًا أو تغيّرَ حالة؟",
 "a2-01-m3": "الأفعال على -ieren تأخذ Partizip II بلا ge-: telefonieren ⇒ telefoniert. فـ«getelefoniert» تزيد ge-، و«telefonieren gehabt» تضيف فعلًا، و«geteleft» تُبدّل الجذر. فحص ذاتي: هل بدأتَ ge- بلا سبب؟",
 "a2-03-lq3": "يقول المتحدث: «Seitdem telefonieren wir jeden Monat». فالعادةُ المستمرة المكالمةُ الشهرية، وأمّا السفرُ الأسبوعي وتأليفُ كتابٍ فلا ذكر لهما في النصّ المسموع. فحص ذاتي: هل ربطتَ seitdem بما بعده؟",
 "a2-05-m1": "الواجبُ في نظام المبنى بصيغة müssen: «Den Müll muss man in vier Tonnen trennen». أمّا darf فتُبيح ولا تلزم، وwill تُبدي رغبةً فقط. فحص ذاتي: هل فرّقتَ بين الإلزام والإباحة؟",
 "a2-05-m3": "man ضميرٌ مفردٌ محايد، فيأخذ تصريف المفرد الغائب: «man muss» في قاعدةِ المبنى. أمّا müssen فجمعٌ، و müsst تخصّ ihr، و musst تخصّ du — ولا واحدٌ منها يصلح بعد man. فحص ذاتي: مَن الفاعلُ في الجملة؟",
 "a2-05-m4": "الإباحةُ بـ dürfen: «Man darf den Garten benutzen» حتى الواحدة والعشرين مساءً. أمّا muss فتُلزم، و«Man dürfen Garten» يخالف تصريفَ المفرد. فحص ذاتي: هل أبحتَ أم ألزمتَ؟",
 "a2-05-m5": "الطلبُ المهذّب مع الاحترام في Konjunktiv II: «Könnten Sie die Musik bitte leiser machen?». أمّا «Sei leise!» فأمرٌ مباشر غير رسمي، و«Musik aus jetzt» بلا تصريف. فحص ذاتي: هل بقي الأسلوبُ لاطفًا؟",
 "a2-07-rq1": "النصّ يحدّد دورها: «Leila koordiniert Termine» وتراجع صباحَها Kalender المشترك. أمّا العملاءُ الجدد فلدى Mara والطلباتُ لدى Ben. فحص ذاتي: هل ربطتَ كلَّ شخصٍ بمهمته؟",
 "a2-07-m1": "الصفةُ zuständig تأتي مع für: «Mara ist für neue Kundenanfragen zuständig». فلا يُستعمل معها um ولا mit ولا an؛ ومع um ينتقل المعنى إلى sich kümmern. فحص ذاتي: مع أيّ حرفِ جرٍّ حفظتَها؟",
 "a2-08-lq3": "سامي يقول في نهاية المكالمة: «Dann schicke ich meine Unterlagen morgen». فالخطوةُ الغدُ إرسالُ الوثائق، وأمّا الرحلةُ إلى Leipzig فليست في النصّ. فحص ذاتي: هل أخذتَ وعدَ المتحدث؟",
 "a2-09-lq3": "الموظّف يقول: «Frau Reuter soll Sie heute Nachmittag zurückrufen». فالوقتُ بعد ظهر اليوم، لا صباحُه ولا الخميس؛ وأمّا عددُ الطرود فسؤالٌ في الرسالة لا موعدُ اتصال. فحص ذاتي: هل ميّزتَ الموعدَ عن الموضوع؟",
 "a2-09-m2": "التعريفُ على الهاتف كما في المكالمة: «Hier spricht Nabil Osman von der Firma Meditex». أمّا «Ich hier bin Sami» فيُقدّم الظرفَ على الضمير، و«Sami spricht mich» يقلب المعنى. فحص ذاتي: هل الترتيبُ ألماني؟",
 "a2-10-m4": "الأقصى في المقارنة بصيغة am …sten: «am günstigsten». فـ«am günstiger» تخلط الدرجتين، و«der mehr günstig» ترجمةٌ حرفية، و«so günstigsten» للمساواة. فحص ذاتي: أيّ درجتين التقيتَ؟",
 "a2-10-m5": "الصفةُ قصيرةُ المقطع تُعتلّ مع اللاحقة: kurz ⇒ kürzer. فـ«kurzer» تنسى الاعتلال، و«mehr kurz» ترجمةٌ حرفية، و«am kurz» تُبقي الأصلَ حيث تُطلب المقارنة. فحص ذاتي: هل تحرّك حرفُ العلّة؟",
 "a2-12-m1": "الشكوى الموضوعية تُسمّي المشكلة: «Es gibt ein Problem mit meinem Zimmer». أمّا «Alles ist furchtbar!» فحكمٌ عامٌّ، و«Geld jetzt!» أمرٌ جافّ بلا توضيح. فحص ذاتي: هل وصفتَ الوقائع لا الانفعال؟",
 "a2-12-m4": "طلبُ الحلّ مع الاحترام: «Könnten Sie mir ein anderes Zimmer geben?». أمّا «Geben Zimmer sofort!» فأمرٌ بلا مُرسِل مهذَّب، و«Ich will alles Geld» تهديدٌ لا طلب. فحص ذاتي: هل بقي طلبُك مهذّبًا؟",
 "a2-13-m4": "weniger تفيد التقليل، كما في عنوان النصّ: «Sieben Tage weniger Ablenkung» أي تشتيتٌ أقلّ. أمّا mehr فتزيد، und genug للكفاية، و immer للدوام. فحص ذاتي: هل زاد الشيءُ أم نقص؟",
 "a2-14-m3": "جملةُ ob الجانبية تُبقي الفعلَ المُصرَّف في الآخر: «… ob ich morgen arbeiten kann». فـ«ob kann ich morgen arbeiten» تبدأ بالفعل كأنّها سؤالٌ مستقلّ. فحص ذاتي: أين انتهى الفعلُ في جملتك؟",
 "a2-14-m5": "لتمنّي الشفاء تُستعمل العبارةُ الجاهزة «Gute Besserung» كما في رسالة زميلٍ مريض. أمّا Gute Arbeit فتُثني على إنجاز، و Gute Pause تخصّ الاستراحة. فحص ذاتي: إلى مَن يتّجه الكلام؟",
 "a2-17-rq1": "النصّ يعلّل بغاية: «Er deaktiviert unwichtige Benachrichtigungen, um sich bei der Arbeit besser zu konzentrieren». فبيعُ الهاتف أو مكالماتٌ أكثر ليسَا سببَ التعطيل. فحص ذاتي: هل أخذتَ العلّة من um … zu؟",
 "a2-17-lq3": "مارا تقول: «… ändere ich trotzdem mein Passwort und aktiviere die Zwei-Faktor-Anmeldung». فالذي فُعِّل هو التحققُ بخطوتين، وأمّا الموقعُ العامّ فيُنصح بإغلاقه. فحص ذاتي: هل فرّقتَ بين ما فُعِّل وما أُلغي؟",
 "a2-22-m2": "لحدثٍ واحدٍ منقضٍ في الماضي تأتي als: «Als ich 18 wurde, …». أمّا wenn فللتكرار أو الشرط، لذلك «Wenn ich 18 wurde gestern» يكرّر مفردًا. فحص ذاتي: حدثٌ واحدٌ أم عادةٌ متكرّرة؟",
 "a2-24-m4": "النفيُ المزدوج بـ weder … noch بلا نفيٍ زائد: «weder Zeit noch Geld». فـ«weder keine Zeit noch kein Geld» يُضيف kein مرّتين، و«nicht weder Zeit» يترك أحدَ الطرفين. فحص ذاتي: كم نفيًا تكفي الجملة؟",
}

def current_texts():
    found = {}
    idpat = re.compile(r'\{\s*"?id"?\s*:\s*"(a2-[0-9]{2}-(?:e|lq|m|rq)[0-9])"')
    nextid = re.compile(r'[{,]\s*"?id"?:?\s*')
    expl = re.compile(r'explanationAr"?\s*:\s*"((?:[^"\\]|\\.)*)"')
    for f in sorted(DATA.glob("lessons-a2-module*.ts")):
        text = f.read_text(encoding="utf-8")
        for m in idpat.finditer(text):
            nxt = re.search(r'[{,]\s*"?id"?:', text[m.end():])
            seg = text[m.end():(m.end() + nxt.start()) if nxt else m.end() + 4000]
            e = expl.search(seg)
            if e and m.group(1) not in found:
                found[m.group(1)] = json.loads('"' + e.group(1) + '"')
    return found

    """id -> explanationAr currently in the repo, so oldLen is measured not typed."""
    found = {}
    idpat = re.compile(r'\{\s*"?id"?\s*:\s*"(a2-[0-9]{2}-(?:e|lq|m|rq)[0-9])"')
    nextid = re.compile(r'[{,]\s*"?id"?\s*:')
    expl = re.compile(r'explanationAr"?\s*:\s*"((?:[^"\\]|\\.)*)"')
    for f in sorted(DATA.glob("lessons-a2-module*.ts")):
        text = f.read_text(encoding="utf-8")
        for m in idpat.finditer(text):
            nxt = nextid.search(text, m.end())
            seg = text[m.end():(nxt.start() if nxt else m.end() + 4000)]
            e = expl.search(seg)
            if e and m.group(1) not in found:
                found[m.group(1)] = json.loads('"' + e.group(1) + '"')
    return found

old_all = current_texts()
out, bad = {}, []
for k, txt in T.items():
    s = re.sub(r"\s+", " ", txt).replace("­", "").strip()
    L = len(s)
    if not (156 <= L <= 212):
        bad.append(f"{k}: len {L} outside 156-212")
    if POS.search(s):
        bad.append(f"{k}: positional phrase {POS.search(s).group(0)!r}")
    if CJK.search(s):
        bad.append(f"{k}: CJK char {CJK.search(s).group(0)!r}")
    old = old_all.get(k)
    if old is None:
        bad.append(f"{k}: id not found in src/data")
        continue
    if len(old.strip()) >= 60:
        bad.append(f"{k}: already lifted ({len(old.strip())} chars) — wrong tranche?")
    oc, nc = set(CASE.findall(old)), set(CASE.findall(s))
    if oc - nc:
        bad.append(f"{k}: would drop case signal(s) {sorted(oc - nc)} — keep them with the meaning")
    out[k] = {"explanationAr": s, "oldLen": len(old.strip())}
    print(f"{k:12s} old={len(old.strip()):3d} new={L:3d}")
if len({v["explanationAr"] for v in out.values()}) != len(out):
    bad.append("duplicate explanation text")
json.dump(out, open("/home/user/tmp/a2e9.json", "w", encoding="utf-8"), ensure_ascii=False, indent=1)
if bad:
    print("\nVIOLATIONS:")
    for b in bad:
        print("  x", b)
    sys.exit(1)
print(f"\nvalidator: 0 violations · {len(out)} items · spec at /home/user/tmp/a2e9.json")
