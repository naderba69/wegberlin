#!/usr/bin/env python3
"""A2 explanation batch #15 (24 items, 2026-09-23) — fifth batch picked from THE MEDIAN POPULATION.

Ids come from docs/run-logs/2026-09-23-a2-explanations-15/pick_median.ts: the shortest 24 items of the
1,250-item median population still under 60 chars (25-28 chars: miniTest items plus listening/reading
questions). Lifting them moves the measured distance 270 -> 246.

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
PAYLOAD = ROOT / "docs" / "run-logs" / "a2-explanations-payloads" / "a2e15.json"
POS = re.compile(r"(الموضع|المرتبة|ترقيم|الفقرة\s*\d|الخيار\s+[A-Dأبجد]\b|الإعلان\s+[A-D]\b|البند\s+[A-D]\b|الأول|الثاني|الثالثة|الثالث|الرابع|الأخيرة|الأخير|option\s*[A-D]|choice\s*[A-D])", re.I)
CASE = re.compile(r"Akkusativ|Dativ|Genitiv|Nominativ|Kasus")
CJK = re.compile(r"[\u3040-\u30ff\u4e00-\u9fff]")

T = {
 "a2-02-rq3": "الجملة الختامية تحدّد ما تغيّر بعد الحادثة: «Seitdem bindet Dalia ein buntes Band an ihren Rucksack». والتبادل جرى «eine Stunde später vor dem Informationsschalter»؛ فحص ذاتي: ما العادةُ الجديدة بعد رحلة كولونيا؟",
 "a2-02-m5": "بعد رابط المفاجأة يأتي الفعلُ المصرَّف ثم الفاعل: «Plötzlich war die Tasche weg». فتقديمُ die Tasche أو حشرُها بعد war يكسر ترتيب الجملة الألمانية؛ فحص ذاتي: ما موضع الفعل بعد Plötzlich؟",
 "a2-03-rq1": "النصّ يسمّي السبب في مطلعه: «ihren ersten Vortrag auf Deutsch gehalten hat». وقد كانت «zwei Wochen lang vorbereitet»، والحاضرون استمعوا «aufmerksam» ثم سألوا؛ فحص ذاتي: ما الجديدُ الذي جعل الموقف موترًا؟",
 "a2-04-m3": "الفعل geben يأخذ مفعولين بحالتين: الشخص في Dativ والشيء في Akkusativ، فتصير «Ich gebe dir den Schlüssel». وأمّا dich وdu فلا تصلحان للشخص هنا؛ فحص ذاتي: أيّ ضميرٍ لمَن يأخذ الشيء؟",
 "a2-06-rq3": "النتيجة مقيسة بنصّها: «Nach zwei Wochen ist die Küche sauberer, und es gibt weniger Konflikte». فالخطة لم تختفِ بل تُراجَع «Jeden Sonntag» خمس دقائق؛ فحص ذاتي: ما المتغيّرُ بعد أسبوعين لا العادةُ الأسبوعية؟",
 "a2-06-lq2": "الجار يشرح السبب بنفسه: «Ich arbeite lange und höre erst spät Musik». فقولُه «Das tut mir leid» اعتذارٌ لا تبرير، وسماعات الرأس جاءت بعدها كحلّ؛ فحص ذاتي: ماذا قال عن سبب تأخّره؟",
 "a2-06-lq3": "الحلُّ يقابله قبولٌ صريح: «Ja, das kann ich machen» بعد «nach zehn Kopfhörer benutzen». ولم يُطلب منه مغادرة البيت ولا منعُ الموسيقى كليًّا؛ فحص ذاتي: أيُّ حلٍّ قبلَه الجارُ بلفظه؟",
 "a2-10-lq2": "الحكمُ على المسار الأنسب لفظي: «Das ist etwas stressig» عن تبديل القطار. وهو أرخص من المباشر، لكن مدّته «Drei Stunden» مع تبديلٍ في هانوفر؛ فحص ذاتي: السعرُ أزعجه أم ترتيبُ الرحلة؟",
 "a2-13-lq1": "أمير يعرّف مشكلته في مطلع المكالمة: «Ich sitze bei der Arbeit viel und bewege mich zu wenig». والحلُّ جاء بتمارين صغيرة معلنة كالمشي والدراجة؛ فحص ذاتي: ما العادةُ التي يريد تغييرها؟",
 "a2-14-rq1": "الجملةُ تذكر ما لا يعرفه بعد: «Die Dauer kennt er noch nicht». ولذلك يعد «ein kurzes Update» بدل وعدٍ موقوت، ثم يقول بعد الطبيب «bis Donnerstag»؛ فحص ذاتي: ما سببُ رفض الوعد قبل الفحص؟",
 "a2-15-m1": "المطلوب تكرارُ الجرعة لا كمّيتها: «zweimal täglich» يحدّد عدد المرات في اليوم. وأمّا «eine Tablette» فالكمية، و«nach dem Essen» الوقت، و«fünf Tage» المدة؛ فحص ذاتي: أيُّ لفظٍ يجيب عن «كم مرة»؟",
 "a2-16-lq2": "النشرة تتّخذ قرارًا بديلًا لا إلغاءً: «Bei starkem Regen wird das Fest in die Sporthalle verlegt». فالدخولُ «frei» كما هو، والتحذيرُ عن المحطة خبرٌ آخر؛ فحص ذاتي: أين تُقام الحفلة عند المطر؟",
 "a2-17-lq2": "المشورة في المكالمة: «Öffne die offizielle App direkt, um dein Konto zu prüfen». والمشورةُ الأخرى «Gib keine Zugangsdaten ein»، ولم ينقر مارا الرابط؛ فحص ذاتي: كيف تُفحَص الحالةُ في المصدر الرسمي؟",
 "a2-18-rq1": "رانيا تسمّي فائدتها: «nutzt Rania ein digitales Wörterbuch, um neue Wörter mit Aussprache zu hören». والرسائلُ الخاصة جزءٌ من الشكوى لا من الفائدة؛ فحص ذاتي: ما الذي يسمعه المتعلّم في هذه الميزة؟",
 "a2-18-m5": "الاعتراض المهنيّ يبقى في نطاق الرأي: «Ich sehe das etwas anders» ينفي الاتفاق لا الشخص. وأمّا «Das ist dumm» و«Nur ich habe recht» فتهاجم المخاطَب؛ فحص ذاتي: هل اعترضتَ على الفكرة أم على صاحبها؟",
 "a2-19-m1": "الاسترجاعُ النشط يعني الإخفاء والإنتاج لا القراءة: «Antwort verdecken und selbst sagen». فالقراءةُ تعطي إحساسًا زائفًا بالمعرفة، ونسخُ الحلّ لا يبني استدعاءً؛ فحص ذاتي: هل رأيت الجوابَ قبل المحاولة؟",
 "a2-20-lq1": "المقدار معلن كاملًا: «Sechs Unterrichtsstunden plus ungefähr drei Stunden Selbststudium» أي تسع ساعات. فمن اختار ستًّا وحدها أهمل شقًّا من الجملة؛ فحص ذاتي: هل عدَدتَ الفصلَ والدراسة معًا؟",
 "a2-20-lq2": "حدودُ الدورة واضحة: «Nein, nur einen internen Test»، فالاختبار الداخلي ليس شهادة. والشهادة الرسمية تُطلب «separat bei einem Prüfungszentrum»؛ فحص ذاتي: مَن يجري الاختبار ومَن يمنح الشهادة؟",
 "a2-20-m1": "في جملة bevor ينتقل الفعلُ المصرَّف إلى نهايتها: «Bevor ich mich anmelde». والضميرُ الانعكاسي يبقى قريبًا منه، والشقُّ الآخر يبدأ بالفعل «lese ich alles»؛ فحص ذاتي: أين وقف الفعلُ في كل نصف؟",
 "a2-21-m3": "المستقبل يُصاغ بـwerden ثانيًا والمصدر في النهاية: «Ich werde den Plan prüfen». فلا يُصرَّف الفعلُ الأصلي ولا يُنتزَع المصدرُ من آخره؛ فحص ذاتي: أين وقف prüfen في جملتك؟",
 "a2-22-m5": "الصياغة الحذرة تحصر الحكم في تجربتك: «In meiner Familie …» خبرٌ عن نطاقٍ تعرفه. وأمّا «Alle Menschen dort» و«Diese Kultur ist so» فتعميمٌ بلا دليل؛ فحص ذاتي: هل تحدّثت عن معرفتك أم عن «كلّ» الناس؟",
 "a2-23-rq1": "النصّ يعفي المتطوعين من الصفة المهنية صراحةً: «Niemand muss Sprachlehrer sein». والمطلوب بدل ذلك «eine kurze Einführung» في القواعد والخصوصية قبل أول مشاركة؛ فحص ذاتي: ما الشرطُ الحقيقي لا المهني؟",
 "a2-24-rq2": "سببُ استبعاد المتحف منصوص: «weder am gewünschten Termin frei noch für alle günstig». فالنزهةُ هي المرتبطة بالطقس، ومركزُ الحي جمَع «zentral» و«barrierefrei»؛ فحص ذاتي: أيُّ معيارين أخفق فيهما المتحف؟",
 "a2-24-lq3": "توزيع المهام يُحسم في آخر المكالمة: «Ben testet die Technik bis Montag»، وقد تطوّع بنفسه: «Das mache ich». وحجزُ القاعة على مارا، والدعواتُ خارج النصّ؛ فحص ذاتي: ما مهمةُ بن وموعدها؟",
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
