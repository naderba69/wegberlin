#!/usr/bin/env python3
"""A2 explanation batch #13 (24 items, 2026-09-23) — fifth batch picked from THE MEDIAN POPULATION.

Ids come from docs/run-logs/2026-09-23-a2-explanations-13/pick_median.ts: the shortest 24 items of the
1,250-item median population still under 60 chars (20-23 chars: miniTest items plus listening/reading
questions). Lifting them moves the measured distance 318 -> 294.

Guards are batch #12's, reused verbatim (band 156-212, no positional wording, no CJK, no duplicated
text, old text and its length READ FROM THE REPO, any case term in the old text must survive, an item
already >= 60 chars is refused as the wrong tranche). Content rule: every explanation cites the option,
the transcript or the reading sentence it is about, and every «…» quotation is a verbatim occurrence in
that item's options, its prompt, or its lesson source text, so scripts/audit-explanation-quotes.ts stays
at 0 ERROR.
"""
import json, re, sys, pathlib

ROOT = pathlib.Path(__file__).resolve().parents[3]
DATA = ROOT / "src" / "data"
PAYLOAD = ROOT / "docs" / "run-logs" / "a2-explanations-payloads" / "a2e13.json"
POS = re.compile(r"(الموضع|المرتبة|ترقيم|الفقرة\s*\d|الخيار\s+[A-Dأبجد]\b|الإعلان\s+[A-D]\b|البند\s+[A-D]\b|الأول|الثاني|الثالثة|الثالث|الرابع|الأخيرة|الأخير|option\s*[A-D]|choice\s*[A-D])", re.I)
CASE = re.compile(r"Akkusativ|Dativ|Genitiv|Nominativ|Kasus")
CJK = re.compile(r"[\u3040-\u30ff\u4e00-\u9fff]")

T = {
 "a2-01-rq3": "النصّ يسمّي الطلبَ وصاحبه: «weil sie Hilfe beim Umzug gebraucht hat»، ثم «Nach der Arbeit ist Karim zu ihr gefahren». فحملُ الصناديق ردٌّ على اتصال أخته؛ فحص ذاتي: مَن طلب المساعدة ومن ذهب إليها؟",
 "a2-01-lq1": "كلمة «Zuerst» تفتح سرد نورا ويأتي بعدها «bin ich zum Supermarkt gegangen und habe eingekauft». فالدرسُ والطبخُ وردا لاحقًا بـ«Danach» و«am Abend»؛ فحص ذاتي: أيّ لفظٍ يحدّد البداية؟",
 "a2-02-rq2": "كلمة «Erst» تحصر لحظةَ الاكتشاف: «Erst im Hotel hat sie ihn aufgemacht». وقبلها كانت في القطار المزدحم، وبعدها وُجدت حقيبتها عند موظف الاستعلام في المحطة؛ فحص ذاتي: أين ظهر الخطأ لا أين حُملت الحقيبة؟",
 "a2-03-lq1": "المكانُ مذكور في تفصيل الرحلة: «in einem kleinen Café gesessen habe» بعد «nach Wien gereist». فالمدرسةُ والقطارُ والفندق لم تُذكر في التسجيل؛ فحص ذاتي: أيُّ جملةٍ تحدّد المكان؟",
 "a2-04-rq3": "النصّ يربط الرسالة بسببه: «Weil er nicht zu Hause war, hat Hana es angenommen und ihm eine Nachricht geschickt». فالرغبةُ في الانتقال تخصّ وصولها هي؛ فحص ذاتي: ما الحدثُ السابق للرسالة؟",
 "a2-05-rq3": "القاعدةُ تلزم فعلًا واحدًا قبل المناسبة: «soll die Nachbarn vorher informieren». وفصلُ النفايات واجبٌ يومي، وتعديلُ النظام يُبحث شهريًّا؛ فحص ذاتي: أيُّ فعلٍ نصّ عليه قبل الحفلة؟",
 "a2-07-rq2": "الشرطُ والنتيجة في جملةٍ واحدة: «Wenn sich ein Termin geändert hat, informiert sie die Kundin und das Team». فمسحُ التقويم ليس من عملها؛ فحص ذاتي: مَن تُبلِغ عند تغيّر الموعد؟",
 "a2-09-rq3": "السببُ مذكورٌ بحرف الجر «wegen»: «wegen eines falschen Adressaufklebers im Lager geblieben». والسيدة كيلر كانت «in einer Besprechung» لا مريضة؛ فحص ذاتي: أيّ سببٍ ربطه النصّ بالتأخير؟",
 "a2-11-lq2": "الموظّفة تنفي الشمول ثم تسمّي الثمن: «Nein, das kostet neun Euro pro Tag extra» ردًّا على «Ist Frühstück inklusive?»، و«WLAN ist auch inklusive»؛ فحص ذاتي: ما الذي سُئل عنه ثم سُعِّر؟",
 "a2-11-m5": "السؤالُ يبدأ بـ«Kann man» ويُختم بالمصدر: «Kann man kostenlos stornieren?». و«Storno wie?» بلا فعلٍ مصرَّف، و«Kann kostenlos man storniert?» يخلط موضع الفعل؛ فحص ذاتي: أين وقف فعلك؟",
 "a2-13-rq3": "الجملةُ الختامية تحسم السلوك: «Wenn eine Woche schwierig ist, reduziert sie das Ziel». والتوقفُ حدث في خطتها الكبيرة أولًا؛ فحص ذاتي: ماذا تفعل حين يشتدّ الأسبوع؟",
 "a2-14-rq3": "الطلبُ صريحٌ بعد الطبيب: «Er fragt, ob eine Bescheinigung nötig ist». وهو لا يعد بعودةٍ مؤكدة لأن «Die Dauer kennt er noch nicht»؛ فحص ذاتي: ما الذي يطلبه لا ما يبلّغه؟",
 "a2-15-lq3": "الصيدلانية تُلزم المتعلّم بالانتظار: «Nehmen Sie nichts zusätzlich, bevor wir die Kombination geprüft haben». فهي تشرح «die Möglichkeiten» بعد فحص التوافق؛ فحص ذاتي: ما الشرطُ قبل تناولٍ إضافي؟",
 "a2-16-m1": "الخبرُ واقعةٌ قابلة للتحقق: «Der Zug fällt um 18 Uhr aus» تحمل وقتًا يمكن التأكد منه. وأمّا «eine schlechte Idee» و«wunderbar» فأحكامٌ تقييمية؛ فحص ذاتي: هل يمكن التحقق من جملتك؟",
 "a2-18-m4": "الموازنةُ تُبنى على رابطين متقابلين: «zwar … aber» يذكر وجهًا ثم يقابله بآخر. وأمّا «um … dass» فقد رُكِّبا خطأً، و«weil … deshalb» يجمع سببيْن؛ فحص ذاتي: أيّ رابطين يوازنان؟",
 "a2-19-m2": "جملةُ الشرط تنقل الفعلَ إلى نهايتها ثم تبدأ الجوابَ به: «Wenn ich müde bin, mache ich Pause». فالترتيبُ الألماني لا يقدّم الفاعلَ ولا يحذف الفعل، وصيغةُ الأمر لا تصلح جوابًا؛ فحص ذاتي: أين وقف الفعلُ في كل نصف؟",
 "a2-19-m5": "الاختبارُ المرجّأ يفصل المذاكرةَ عن السؤال: «بعد يوم أو عدة أيام» حتى يقيس الاحتفاظ لا الذاكرةَ اللحظية. فالتكرارُ المباشر يقيس الانتباه؛ فحص ذاتي: هل مرّ وقتٌ كافٍ بينهما؟",
 "a2-21-m4": "الظرفُ الزمني يتقدّم على الفعل المصرَّف: «Nächste Woche beginne ich den Kurs». فهذه هي طريقة الألمانية في التعبير عن المستقبل بالحاضر، مع «Nächste Woche» واضحة؛ فحص ذاتي: هل تقدّم الظرفُ على الفعل والفاعل؟",
 "a2-21-m5": "الهدفُ الجيد يحدّد المقدارَ والزمنَ والمراقبة معًا: «Viermal pro Woche 45 Minuten mit Wochenkontrolle». وأمّا «Mehr Deutsch bald» و«Alles perfekt» فعباراتٌ عامة؛ فحص ذاتي: كيف تعرف أنك تقدّمت؟",
 "a2-22-lq3": "الطلبُ المعلَّق هو: «Bitte sag mir noch, ob du vegetarisch essen möchtest». فالوقتُ والشرابُ حُسِما («Ein Getränk wäre nett»)؛ فحص ذاتي: أيُّ معلومةٍ بقيت غيرَ محسومة؟",
 "a2-23-rq3": "الحدُّ مصرَّحٌ به: «verweist das Team an professionelle Stellen» مع «verspricht keine Hilfe, die es nicht leisten kann». فلا تُوعَد الحالاتُ الخاصة بما لا يُنفَّذ؛ فحص ذاتي: إلى مَن يُحوَّل الطلبُ المتخصص؟",
 "a2-23-m1": "الاسمُ «der Helfer» مذكّر، فيأخذ في Nominativ الأداةَ «der». وأمّا «die» فللمؤنث، و«das» للمحايد، و«den» تُستعمل في المفعول (Akkusativ)؛ فحص ذاتي: هل الاسمُ فاعلٌ في الجملة أم مفعول؟",
 "a2-24-rq1": "النصّ ينفي التصويتَ الفوري: «Statt sofort abzustimmen, sammelt die Gruppe Kriterien». فالأفكارُ طرحت والمعاييرُ رجّحت الخيارَ لاحقًا؛ فحص ذاتي: ما الخطوةُ التي سبقت التصويت؟",
 "a2-24-lq2": "النفيُ المزدوج يسمّي اليومين: «weder auf Freitag noch auf Montag». والعلةُ «da fehlen wichtige Personen» لا ضيقُ القاعة؛ فحص ذاتي: أيّ يومين اعتُبرا غير مناسبين؟",
}


def current_texts():
    """id -> explanationAr currently in the repo, so oldLen is measured not typed."""
    found = {}
    idpat = re.compile(r'\{\s*"?id"?\s*:\s*"(a2-[0-9]{2}-(?:e|lq|m|rq)[0-9])"')
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


old_all = current_texts()
out, bad = {}, []
for k, txt in T.items():
    s = re.sub(r"\s+", " ", txt).replace("\u00ad", "").strip()
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
if len(out) != 24:
    bad.append(f"expected 24 items, built {len(out)}")
if bad:
    print("\nVIOLATIONS:")
    for b in bad:
        print("  x", b)
    sys.exit(1)
PAYLOAD.write_text(json.dumps(out, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")
print(f"\nvalidator: 0 violations · {len(out)} items · payload {PAYLOAD.relative_to(ROOT)}")
