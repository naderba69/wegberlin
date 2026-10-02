#!/usr/bin/env python3
"""Build + validate the A2 explanation batch #3 (24 items, band 156-212, guard-safe phrasing)."""
import json, re, sys

POS = re.compile(r"(الموضع|المرتبة|ترقيم|الفقرة\s*\d|الخيار\s+[A-Dأبجد]\b|الإعلان\s+[A-D]\b|البند\s+[A-D]\b|الأول|الثاني|الثالثة|الثالث|الرابع|الأخيرة|الأخير|option\s*[A-D]|choice\s*[A-D])", re.I)
CASE = re.compile(r"Akkusativ|Dativ|Genitiv|Nominativ|Kasus")

T = {
 "a2-20-e7": (21, "beachten يعني يراعي، والمطلوب معه المهلة: «Bitte beachten Sie die Frist». كلمة Urlaub تحوّل الجملة إلى إجازة، و Termin موعدٌ لا آخر أجل، و Zusage ردّ بالموافقة. فحص ذاتي: هل أكملتُ بمدّة تُراعى لا بحدث يقع؟"),
 "a2-21-e1": (21, "الفعل vorhaben ينفصل: التقديم مع الفاعل والمصدر مع zu في النهاية: «Ich habe vor, mehr zu lernen». صيغة vorhabe ليست فعلًا مساعدًا، و zu vor يضيع معناها. فحص ذاتي: هل بقي جزء من الفعل مع الفاعل؟"),
 "a2-22-e6": (21, "قبل إحضار الطعام يُسأل عن الرغبات الخاصة: «Nach besonderen Wünschen fragen». الافتراض أن الجميع يأكل كل شيء يُوقع في حرج، والصمت لا يمنع شيئًا. فحص ذاتي: هل سألتُ قبل أن أقرّر؟"),
 "a2-01-e1": (22, "الفعل arbeiten يصرف مع haben: «Ich habe gearbeitet». sein تُستعمل مع الحركة أو التغيّر ولا تنطبق هنا، و werde تخصّ المستقبل، و ist تصف حالة. فحص ذاتي: هل الفعل الذي أكمله يتحرّك أو يتحوّل؟"),
 "a2-05-e1": (22, "الإلزام يأتي مع müssen: «Man muss den Müll trennen». darf ترخّص، و kann تقدر، و möchte ترغب؛ فلا واحدة منها تجعل الفرز واجبًا ولا تسلب الاختيار من الفاعل. فحص ذاتي: هل الجملة تمنع ترك الأمر؟"),
 "a2-10-e6": (22, "للتساوي تُستعمل so مع الصفة في صورتها المجردة ثم wie: «Der Zug ist so schnell wie das Auto». schneller تُجلب معها als للمفاضلة، و am للمبالغة، ولا تجتمع so مع صفة مقارنة. فحص ذاتي: هل قارنتُ من غير تفضيل؟"),
 "a2-15-e6": (22, "الدواء الآخر يحتاج تحققًا عند المختص: «Verträgt sich das mit meinem Medikament؟». الجمع بين الحبتين يترك التفاعل قائمًا، والاطمئنان السريع ليس معلومة. فحص ذاتي: هل سألتُ سؤالًا يجيبه الصيدلي؟"),
 "a2-16-e5": (22, "كل سؤال بـ W يسأل نوعًا مختلفًا: Wer عن الجهة، و Wann عن الوقت، و Wo عن المكان. إجابة الوقت عن سؤال الجهة تترك السؤال مفتوحًا وإن بدت جملة صحيحة اللغة. فحص ذاتي: هل نوع المعلومة يطابق حرف السؤال؟"),
 "a2-04-e1": (23, "helpen يعني يساعد، ومن يُساعد يُذكر بالمفعول غير المباشر: «Er hilft mir». mich و dich تعودان على المتكلم أو المخاطَب، و mein ملكية، و ich فاعل؛ فلا واحدة منها تُجيب عن لمن؟. فحص ذاتي: هل الجواب عن لمن وُضع؟"),
 "a2-06-e7": (23, "abwechselnd تصف عملًا بالتناوب: «Wir machen das abwechselnd». zufällig تصف العشوائية و gemeinsam تصف المشاركة، فلا واحدة منهما تجعل لكل شخص دوره في الوقت نفسه. فحص ذاتي: هل يتناوب شخصان على المهمة؟"),
 "a2-08-e7": (23, "sich interessieren تحتاج für: «Ich interessiere mich für die Stelle». über تُجلب مع sprechen، فالفعل وأداته وحدة واحدة لا تُفكّ. فحص ذاتي: هل الأداة هي ما تعلّمته مع الفعل؟"),
 "a2-04-e2": (24, "مع du يكون ضمير المفعول غير المباشر dir: «Ich helfe dir». dich للفعل الواقع عليك، و mein للملكية، و du للفاعل؛ فلا واحدة منها تصف من يقع عليه العون. فحص ذاتي: هل أكملتُ بما يجيب عن «لك»؟"),
 "a2-07-e6": (24, "السؤال الصحيح يبقي الفعل المُصرَّف بعد Wer: «Wer ist dafür zuständig؟». «Wer zuständig für das ist؟» إجابة رُتّبت كسؤال، و«Für wer das zuständig؟» فقدت الفعل. فحص ذاتي: هل الفعل بعد الضمير؟"),
 "a2-14-e7": (24, "Gute Besserung تُقال للمريض وحده: «Gute Besserung». gute Reise تُقال للمسافر، و gute Nacht قبل النوم؛ فلا تُوجَّه واحدة منهما إلى مريض إلا إن كان مسافرًا ليلًا. فحص ذاتي: ما حالة المخاطَب الآن؟"),
 "a2-17-e5": (24, "لكل إجراء هدف يبرّره: تغيير كلمة المرور يحمي الحساب، ومراجعة المصدر تمنع المعلومة الخاطئة، وحذف الاسم يحفظ الخصوصية. الربط من غير هدف يترك الإجراء عادةً بلا سبب. فحص ذاتي: هل ذكرتُ ما الذي يُمنع؟"),
 "a2-17-e6": (24, "قبل نشر صورة جماعية تُطلب الموافقة وتُراجع دائرة المشاهدين: «Zuerst Zustimmung fragen und Sichtbarkeit prüfen». النشر الفوري يسلب حق الاعتراض، والموقع معلومة زائدة. فحص ذاتي: هل بقي لأحد حق الرفض؟"),
 "a2-19-e2": (24, "Wenn تدخل على الشرط المتكرر وتؤخّر فعله: «Wenn ich ein Wort vergesse, wiederhole ich es». als للماضي الواقع مرة واحدة، ولا وجود لـ wenn mal؛ فلا يُخلط بين المتكرر والمنقضي. فحص ذاتي: هل الشرط يتكرر فعلًا؟"),
 "a2-08-e1": (25, "جملة dass تبدأ بالأداة ويأتي فعلها المُصرَّف في آخرها: «Ich glaube, dass die Stelle gut passt». تقديم الفعل بعد dass يجعلها إجابة مستقلة. فحص ذاتي: هل تنتهي جملة الأداة بفعلها؟"),
 "a2-08-e6": (25, "الخاتمة الرسمية القياسية هي «Mit freundlichen Grüßen». Tschüs و Bis bald, Leute تحيّتا أصدقاء، و Liebe Grüße تصلح لنص شبه شخصي لا لطلب لدى جهة. فحص ذاتي: لمن أكتب: لصديق أم لعقد؟"),
 "a2-12-e3": (25, "الطلب المؤدَّب يبدأ بالفعل فالفاعل فالمخاطَب فالمطلوب، ويُختم بالفعل الرئيسي: «Könnten Sie mir ein anderes Zimmer geben؟». توزيع الكلمات العاري يترك الطلب بلا فعل مُصرَّف في صدره. فحص ذاتي: هل سألتَ بـ Könnten؟"),
 "a2-15-e5": (25, "تقسيم التعليمات إلى خانات يفصل ما يُؤخذ ومتى وكم: Dosis = eine Tablette، و Häufigkeit = zweimal täglich، و Zeitpunkt = nach dem Essen. خلطها يترك الجملة صحيحة ومعلومتها خطرة. فحص ذاتي: هل عرفتُ الجرعة والوقت؟"),
 "a2-18-e1": (25, "بعد dass يسبق الفاعلُ فعله ويُذهب بالمُصرَّف إلى النهاية: «Ich finde, dass Handys nützlich sind». «dass sind Handys nützlich» تجعل فعل الصلة تابعًا للجملة الرئيسية. فحص ذاتي: هل أنهيَتَ الجملة بفعلها؟"),
 "a2-18-e4": (25, "الصواب بقاء فعل الصلة في نهاية جملة الأداة: «Ich denke, dass Online-Kurse praktisch sind». نقله إلى «dass Online-Kurse sind praktisch» يجعل التابعة إجابة مستقلة. فحص ذاتي: هل تنتهي التابعة بفعلها؟"),
 "a2-19-e4": (25, "في جملة wenn يتأخّر الفعل المُصرَّف إلى آخرها: «Wenn ich müde bin, mache ich eine Pause». تقديم bin يجعلها سؤالًا أو ردًّا. فحص ذاتي: هل كان فعل الشرط في آخر جملة wenn؟"),
}

out = {}
bad = []
for k, (oldlen, txt) in T.items():
    s = re.sub(r"\s+", " ", txt).strip()
    L = len(s)
    if not (156 <= L <= 212):
        bad.append(f"{k}: len {L} outside 156-212")
    if POS.search(s):
        bad.append(f"{k}: positional phrase {POS.search(s).group(0)!r}")
    if CASE.search(s):
        bad.append(f"{k}: case name {CASE.search(s).group(0)!r}")
    out[k] = {"explanationAr": s, "oldLen": oldlen}
    print(f"{k:12s} new={L:3d} oldLen={oldlen}")
if len({v["explanationAr"] for v in out.values()}) != len(out):
    bad.append("duplicate explanation text")
json.dump(out, open("/home/user/tmp/a2e3.json", "w", encoding="utf-8"), ensure_ascii=False, indent=1)
if bad:
    print("\nVIOLATIONS:")
    for b in bad:
        print("  x", b)
    sys.exit(1)
print(f"\nvalidator: 0 violations · {len(out)} items · spec at /home/user/tmp/a2e3.json")
