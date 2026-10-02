#!/usr/bin/env python3
"""A2 explanation batch #14 (24 items, 2026-09-23) — fifth batch picked from THE MEDIAN POPULATION.

Ids come from docs/run-logs/2026-09-23-a2-explanations-14/pick_median.ts: the shortest 24 items of the
1,250-item median population still under 60 chars (23-25 chars: miniTest items plus listening/reading
questions). Lifting them moves the measured distance 294 -> 270.

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
PAYLOAD = ROOT / "docs" / "run-logs" / "a2-explanations-payloads" / "a2e14.json"
POS = re.compile(r"(الموضع|المرتبة|ترقيم|الفقرة\s*\d|الخيار\s+[A-Dأبجد]\b|الإعلان\s+[A-D]\b|البند\s+[A-D]\b|الأول|الثاني|الثالثة|الثالث|الرابع|الأخيرة|الأخير|option\s*[A-D]|choice\s*[A-D])", re.I)
CASE = re.compile(r"Akkusativ|Dativ|Genitiv|Nominativ|Kasus")
CJK = re.compile(r"[\u3040-\u30ff\u4e00-\u9fff]")

T = {
 "a2-03-m2": "في جملة السبب بـweil ينتقل الفعلُ المصرَّف إلى النهاية: «weil ich den Weg nicht kannte». فالترتيب المباشر يقلب الجملة، وحشوُ الفاعل بين den Weg وkannte يكسر القاعدة؛ فحص ذاتي: أين وقف الفعلُ في جملتك؟",
 "a2-03-m3": "بعد الرابط «Deshalb» يأتي الفعلُ المصرَّف فورًا: «Deshalb habe ich Hilfe gesucht». فالفاعلُ لا يسبق الفعلَ هنا، وإذا سبقه صار الترتيب نقلًا حرفيًّا من العربية؛ فحص ذاتي: هل سبق الفاعلُ الفعلَ بعد الرابط؟",
 "a2-04-rq1": "النصّ يعدّ مساعدتَين ملموستَين من بول: «zwei Kisten nach oben gebracht und den Keller gezeigt». والكعكُ جاء من السيدة ماير، وموعدُ جمع النفايات هي التي شرحته؛ فحص ذاتي: مَن حمل الصناديق ومَن أرى القبو؟",
 "a2-04-m4": "في جملة wenn ينتقل الفعلُ المصرَّف إلى آخر الجزء الأوّل: «Wenn du Zeit hast». ثم يبدأ الجوابُ بالفعل: «hilfst du mir»؛ فحص ذاتي: أين وقف الفعلُ في كل نصفٍ من الجملة؟",
 "a2-06-rq2": "الخطة الجديدة تراعي من يعمل مساءً: «Wenn jemand abends spät arbeitet, räumt die Person am nächsten Morgen auf». فالترتيب فورَ الطبخ غير ممكن، وإخراجُ النفايات مهمةٌ بالتناوب؛ فحص ذاتي: ماذا يفعل المتأخّر صباحًا؟",
 "a2-06-m2": "الفعلُ المنفصل في جملة wenn يجتمع في نهايتها: «Wenn jeder mithilft». وبعدها يبدأ الشقُّ الآخر بالفعل «sind wir fertig»؛ فحص ذاتي: هل رجعت البادئةُ إلى آخر الفعل المنفصل؟",
 "a2-06-m5": "المعنى المطلوب هو توزيع الدور لا المصاحبة الدائمة: «بالتناوب». وخطةُ الشقة المشتركة في النصّ تعتمد عليه في إخراج النفايات؛ فحص ذاتي: هل يوزّع abwechselnd المهمةَ أم يجمعها؟",
 "a2-07-m3": "في جملة wenn ينتقل الفعلُ المصرَّف إلى نهايتها: «Wenn ein Kunde anruft». والشقُّ الآخر يبدأ بالفعل «notiere ich den Namen»؛ فحص ذاتي: أين وقف anrufen في جملتك أنت؟",
 "a2-07-m4": "الرابط «Dafür» يفتح الجملة فيأتي بعده الفعلُ المصرَّف: «Dafür ist Mara zuständig». وإذا تأخّر الفعلُ أو حُذف صار الترتيب عربيًّا بمفردات ألمانية؛ فحص ذاتي: ما موضع ist في جملتك؟",
 "a2-08-rq1": "قائمة المهام في الإعلان محصورة: «telefonische Anfragen, E-Mails, Terminvereinbarungen und die Pflege einfacher Kundendaten». وإصلاحُ الأجهزة التقنية لا يذكره الإعلان؛ فحص ذاتي: أيُّ مهمةٍ لم تُذكر في الوظيفة؟",
 "a2-08-rq3": "الشرط صريح: «Die Bewerbung soll aus einem kurzen Anschreiben und einem Lebenslauf bestehen». وأمّا الشهاداتُ فتُضاف «freiwillig»، والصورةُ وجوازُ السفر لا يُطلبان أصلًا؛ فحص ذاتي: ما الحدُّ الأدنى للطلب؟",
 "a2-08-lq2": "السيدة برغر تحصر المهمّ: «Wichtig ist, dass Sie gut mit Kunden kommunizieren». فسنةُ البيع كانت كافية للتقدّم، واللغاتُ ميزةٌ في الإعلان لا شرطٌ في المكالمة؛ فحص ذاتي: ما الذي أكّدته في التسجيل؟",
 "a2-08-m2": "الفعل sich interessieren يطلب حرف الجرّ «für»: ich interessiere mich für Deutsch. وأمّا an وum وmit فلا يفتحها هذا الفعل بهذا المعنى؛ فحص ذاتي: أيّ حرفٍ يحفظه المعجم مع هذا الفعل؟",
 "a2-09-lq2": "الطلبُ المعلَّق في الرسالة: «ob 25 Pakete ausreichen oder ob sie 30 braucht». فالحسابُ ومدةُ المرض لم تُذكر، وما تبقّى هو نقلُ السؤال بدقة؛ فحص ذاتي: أيُّ رقمٍ ينتظر تأكيد السيدة؟",
 "a2-09-m4": "في المكالمة تُختم بـ«Auf Wiederhören» لأنها تُسمع لا تُرى، و«Auf Wiedersehen» عند اللقاء الحضوري. وصيغٌ مثل «Ende jetzt» ليست ألمانية؛ فحص ذاتي: هل تُنهي مكالمةً أم لقاءً؟",
 "a2-10-lq3": "القرار مبنيّ على الوقت والثمن معًا: «um 11:00 Uhr für 42 Euro». فالمسار المباشر صباحًا كان أغلى، وأمّا البديل بتبديل القطار فقد وصفه بأنه «stressig»؛ فحص ذاتي: أيُّ رحلةٍ لاءمت جدولَه؟",
 "a2-11-lq3": "الشرط الزمني منصوص: «Bis fünf Tage vorher kostenlos»، وبعدها يصير الإلغاء بثمن ليلة. والموعدُ المحجوز هو من 3 إلى 6 آب؛ فحص ذاتي: كم يومًا قبل الوصول يبقى الإلغاء مجانيًّا؟",
 "a2-12-rq1": "حلُّ القطار مذكور في نصّ الرحلة: «eine andere Verbindung ohne Aufpreis». والمشكلتان الباقيتان تخصّان غرفةَ الفندق والحقيبة لا السفر نفسه؛ فحص ذاتي: أيُّ حلٍّ قُدِّم عند شابّة التذاكر؟",
 "a2-15-lq1": "المتعلّم يذكر حالته المزمنة في مطلع المكالمة: «ein Medikament gegen hohen Blutdruck» مع سعالٍ منذ ثلاثة أيام. والصيدلانية تسأل عن الاسم مصوّرًا قبل أيّ إضافة؛ فحص ذاتي: ما الدواءُ الذي يتناوله أصلًا؟",
 "a2-17-m4": "قبل النشر يُقاس أمران: «Zustimmung und Publikum prüfen»، فلا يُنشر ما يخصّ غيرَك بلا إذن. وإضافةُ الموقع أو الصور تزيد المدى بلا ضرورة؛ فحص ذاتي: مَن سيرى المنشور وهل يوافق أصحابُه؟",
 "a2-18-m3": "الموافقة الجزئية تُبنى على ربطٍ صريح: «Das stimmt, aber …» يقرّ بوجهٍ ثم يعترض. والرفضُ الجاف أو غيابُ الرأي لا يفتحان حوارًا؛ فحص ذاتي: هل أقْررتَ ثم أبديتَ تحفّظك؟",
 "a2-19-rq2": "النتيجة مقيسة بعد تغيير الطريقة: «Am Ende der Woche kann er acht Wörter ohne Hilfe benutzen». وقبل التغيير لم يكن يُنتج إلا «vier» ويتعرّف عليها فقط؛ فحص ذاتي: كم كلمةً أنتجها بالاسترجاع النشط؟",
 "a2-21-rq2": "توزيع أيام عمر معلن: «Samstags bearbeitet er eine gemischte Aufgabe und nimmt eine mündliche Antwort auf». فالكتابةُ الاثنين والخميس، والبطاقاتُ الثلاثاء؛ فحص ذاتي: ما الذي يجمع تدريبًا وتسجيلًا في يوم؟",
 "a2-21-lq3": "قرار ليلى عند النتيجة الضعيفة: «verschiebe ich die Anmeldung und arbeite gezielt an der schwächsten Fertigkeit». فهي تريد «stabil» لا سريعًا، وتقيس باختبارٍ لا تعرفه؛ فحص ذاتي: ماذا تفعل بدل التسجيل الفوري؟",
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
