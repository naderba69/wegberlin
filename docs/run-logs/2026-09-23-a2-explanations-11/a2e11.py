#!/usr/bin/env python3
"""A2 explanation batch #11 (24 items, 2026-09-23) — third batch picked from THE MEDIAN POPULATION.

Ids come from docs/run-logs/2026-09-21-a2-explanations-9/pick_median.ts: the shortest 24 items of the
1,250-item median population still under 60 chars (17-19 chars: miniTest items plus listening/reading
questions). Lifting them moves the measured distance 366 -> 342.

Guards are batch #9's, reused verbatim (band 156-212, no positional wording, no CJK, no duplicated
text, old text and its length READ FROM THE REPO, any case term in the old text must survive, an item
already >= 60 chars is refused as the wrong tranche). Content rule: every explanation cites the option,
the transcript or the reading sentence it is about, so nothing depends on outside knowledge -- and every
«…» quotation below is a verbatim occurrence in that item's options, its prompt, or its lesson source
text, so scripts/audit-explanation-quotes.ts stays at 0 ERROR.
"""
import json, re, sys, pathlib

ROOT = pathlib.Path(__file__).resolve().parents[3]
DATA = ROOT / "src" / "data"
PAYLOAD = ROOT / "docs" / "run-logs" / "a2-explanations-payloads" / "a2e11.json"
POS = re.compile(r"(الموضع|المرتبة|ترقيم|الفقرة\s*\d|الخيار\s+[A-Dأبجد]\b|الإعلان\s+[A-D]\b|البند\s+[A-D]\b|الأول|الثاني|الثالثة|الثالث|الرابع|الأخيرة|الأخير|option\s*[A-D]|choice\s*[A-D])", re.I)
CASE = re.compile(r"Akkusativ|Dativ|Genitiv|Nominativ|Kasus")
CJK = re.compile(r"[\u3040-\u30ff\u4e00-\u9fff]")

T = {
 "a2-17-m5": "الرابط damit يفتح جملةَ غايةٍ ويُبقي الفعلَ المُصرَّف في النهاية: «damit alle entscheiden können». فـ«damit können alle entscheiden» تُقدّم الفعل بعد الرابط مباشرة. فحص ذاتي: أين انتهى الفعل في جملتك؟",
 "a2-18-m1": "صيغةُ الرأي تبدأ بـ finde ثم dass وفعلُها المساعد في النهاية: «Ich finde, dass Handys nützlich sind.». فـ«dass sind Handys nützlich» تقلب ترتيب الجملة التابعة. فحص ذاتي: هل بقي الفعل في آخر الجملة؟",
 "a2-19-m4": "الهدفُ القابل للقياس يحمل عددًا ومدةً معًا: «zehn Karten fünf Tage testen». أمّا «viel lernen» و«alles verstehen» فعامّان لا يتحقّق منهما شيء. فحص ذاتي: هل في هدفك رقمٌ وتاريخ؟",
 "a2-20-lq3": "المستشارة تعرض خطوةً واحدة قبل القرار: «Kann ich eine Probestunde besuchen?». فالنجاحُ في الامتحان ليس خطوةً متاحة، والشهادةُ الدولية تُطلب من مركز امتحانٍ منفصل. فحص ذاتي: ما المتاحُ قبل التسجيل؟",
 "a2-20-m4": "قبل التسجيل تُفحص أربعةُ أشياء صراحةً: «Ziele, Zeit, Kosten und Prüfung prüfen». فقراءةُ العنوان وحدها لا تكشف الرسوم ولا حالات الالتحاق. فحص ذاتي: ما سألتَ عنه قبل أن تدفع؟",
 "a2-20-m5": "السؤالُ غير المباشر يبدأ بـ ob ويُبقي الفعلَ في النهاية: «ob es eine Prüfung gibt». فـ«ob gibt es eine Prüfung» تنقل ترتيبَ السؤال المباشر إلى التابعة. فحص ذاتي: هل حرّكت الفعل بعد ob؟",
 "a2-20-rq1": "النصّ يفرّق بين الدورات بالأرقام: «Kurs B ist ein Intensivkurs … Er dauert acht Wochen». فالدورةُ A تمتدّ خمسة أشهر، والدورةُ C تجتمع أسبوعيًا. فحص ذاتي: هل قابلتَ المدة بالدورة الصحيحة؟",
 "a2-23-m5": "الانخراطُ الواقعيّ يحدّد مدةً ومقدارًا معًا: «Vier Wochen je eine Stunde ausprobieren». أمّا تبنّي كلّ المهامّ دائمًا فينتهي بالانسحاب. فحص ذاتي: هل بيّنتَ وقتك المتاح؟",
 "a2-24-m5": "القرارُ القابل للتنفيذ يسمّي مسؤولًا وموعدًا وبديلًا: «Mara bucht bis Dienstag; Plan B ist online.». أمّا «Später vielleicht.» فبلا تاريخ فلا يمكن متابعته. فحص ذاتي: مَن ينفّذ ومتى وما البديل؟",
 "a2-01-m1": "فعلُ arbeiten لا ينتقل ولا يُغيّر حالة، فيأخذ haben في الماضي: «habe». أمّا bin فأداةُ sein لانتقالٍ كالذهاب، وwerde تبني المستقبل. فحص ذاتي: هل كان الحدثُ عملًا أم انتقالًا؟",
 "a2-02-lq3": "التسجيل يسمّي مكان المفتاح حين انتهى البحث: «In einer Kuchendose». فالمواضعُ الأخرى ذُكرت في سياق البحث عنه لا في سياق إيجاده. فحص ذاتي: أيّ المواضع كان موضعَ إيجاد؟",
 "a2-05-lq3": "قاعدةُ الغسيل تُحدّد نهايتَه بساعةٍ واحدة: «Bis 22 Uhr». والساعةُ العشرون والحاديةُ والعشرون تخصّ الشواء في الحديقة لا الغسيل. فحص ذاتي: أيّ نشاطٍ تسأل عنه؟",
 "a2-05-rq2": "النصّ يفصل قاعدتين بساعتين: الشواءُ في الحديقة حتى «Bis 21 Uhr»، وغسلُ الملابس حتى وقتٍ متأخّر عنه. فالساعةُ التاسعة عشرة لا تنتمي إلى الشواء. فحص ذاتي: هل قرأتَ السطرَ الصحيح؟",
 "a2-07-m5": "التركيبُ الألماني يجمع الاسمَ في مركّب واحد ثم يأتي بالفعل: «Kundenanfragen beantworten». فـ«Kunden antworten Anfrage machen» تكرّر فعلين بلا مركّب. فحص ذاتي: هل نسخت تركيبَ الألمان؟",
 "a2-09-m3": "الطلبُ المنقول بـ sollen يُبقي المصدرَ في النهاية: «Sie soll zurückrufen.». فـ«Sie soll ruft zurück.» تصرّف الفعلَ بعد sollen فيصير فعلين. فحص ذاتي: كم فعلًا صرّفتَ؟",
 "a2-11-m4": "الكلمةُ «inklusive» تُدرج الخدمةَ في السعر المعلن، فلا يُطلب مبلغٌ إضافي عند الوصول، ولا تعني إلغاءً للحجز ولا بُعدًا للمكان. فحص ذاتي: هل زاد المبلغ أم ابتلع الخدمة؟",
 "a2-12-lq2": "الموظّف يعلّل التأجيل بغياب الفني: «Leider ist heute kein Techniker mehr da.». فالتدفئةُ موجودة لكنها معطّلة، والبديلُ المعروض غرفةٌ أخرى بلا سعرٍ إضافي. فحص ذاتي: هل أخذتَ السبب من كلام الموظّف؟",
 "a2-12-m3": "الرابط deshalb يُقدَّم فيأتي الفعلُ مباشرةً بعده: «Deshalb brauche ich eine Lösung.». فـ«Deshalb ich brauche Lösung.» تُبقي ترتيبَ الجملة العادية فتفقد أثرَ الرابط. فحص ذاتي: هل جاء الفعل بعد الرابط مباشرة؟",
 "a2-13-m5": "الهدفُ الصحّي القابل للقياس يسمّي اليومَ والمدة معًا: «Montag und Donnerstag je 20 Minuten gehen.». أمّا «Immer gesund sein.» نتيجةٌ لا خطة. فحص ذاتي: هل يمكن التحقّق من هدفك؟",
 "a2-15-m3": "sollen تنقل توصيةَ الطبيب وتُبقي المصدرَ في النهاية: «Ich soll die Tablette nehmen.». فـ«Ich soll nehme die Tablette.» تصرّف الفعلَ بعد sollen. فحص ذاتي: هل بقي الفعل مصدرًا؟",
 "a2-17-m2": "لمّا اختلف الفاعلان لم يصلح um … zu فجاء damit: «Ich sende es, damit du es liest.». فـ«Ich sende es, um du es liest.» تُبقي um مع فاعلٍ ثانٍ. فحص ذاتي: هل اتّحد الفاعلان أم اختلفا؟",
 "a2-23-lq1": "المنسّقة تحصر العملَ في جملةٍ واحدة: «Wir suchen Helfer, die samstags Lebensmittel sortieren und verteilen.». فالتعليمُ باللغة الألمانية ليس من المهامّ. فحص ذاتي: هل حصرتَ العمل فيما قيل؟",
 "a2-24-lq1": "مارا تسمّي العائق بحرفه: «Der kleine Raum ist zwar frei, aber nicht barrierefrei.». فالسعرُ لم يكن مشكلةً، والإغلاقُ عقبةُ موعدٍ لا مكان. فحص ذاتي: أيّ شرطٍ لم تستوفِه الغرفة؟",
 "a2-01-lq3": "التسجيل يجيب عن الموعد بلفظٍ واحد: «Gegen elf». فـ«Um neun» و«Um zehn» تسبقان مجيء الصديقة، وهي ذهبت إلى النوم فورًا بعد خروجها. فحص ذاتي: هل التقطتَ اللفظ كما قيل؟",
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
