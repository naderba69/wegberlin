#!/usr/bin/env python3
"""Build + validate the A2 explanation batch #4 (24 items, band 156-212, guard-safe phrasing)."""
import json, re, sys

POS = re.compile(r"(الموضع|المرتبة|ترقيم|الفقرة\s*\d|الخيار\s+[A-Dأبجد]\b|الإعلان\s+[A-D]\b|البند\s+[A-D]\b|الأول|الثاني|الثالثة|الثالث|الرابع|الأخيرة|الأخير|option\s*[A-D]|choice\s*[A-D])", re.I)
CASE = re.compile(r"Akkusativ|Dativ|Genitiv|Nominativ|Kasus")
CJK = re.compile(r"[\u3040-\u30ff\u4e00-\u9fff]")

T = {
 "a2-22-e5": (25, "الدعوة سؤال: «Möchtest du zur Feier kommen?»، والقبول يتمنّى: «Ich würde gern kommen.»، والرفض ينفي القدرة بلا تعلّل. قلب الوظيفتين يبقي العبارة مهذبة ومعناها معكوس. فحص ذاتي: هل تُعرف وظيفة كل عبارة من فعلها؟"),
 "a2-24-e5": (25, "الثنائية تحمل العلاقة: «entweder … oder» تختار واحدًا، و«weder … noch» تنفي الاثنين، و«sowohl … als auch» يجمعهما. وضع النفي موضع الجمع ينفي ما ثُبّت في النصّ. فحص ذاتي: هل البديلان موجودان أم أحدهما منفيّ؟"),
 "a2-01-e2": (26, "في Perfekt يأتي haben مُصرَّفًا في مكانه والمصدر في الآخر: «Wir haben Deutsch gelernt». الصيغة learnen لا وجود لها، و lernen المجردة تترك الفراغ بلا فعل تامّ. فحص ذاتي: هل تُنهي جملةَ الماضي صيغةُ ge؟"),
 "a2-02-e6": (26, "الحالة الماضية تُروى بـ sein في Präteritum: «Ich war müde». «bin müde gehabt» تُركّب ما لا يُركَّب مع الصفة، و«habe müde» تُسنِد الفعل لغير مفعول. فحص ذاتي: هل يحمل الفعل الزمن وحدَه؟"),
 "a2-07-e4": (26, "sich kümmern انعكاسي فلا يُفهم بلا ضمير يعود على الفاعل: «Ich kümmere mich um die Post». حذف mich يُبقي فعلًا معلّقًا، و«ich kümmere dich» تنسب العناية لغيرك. فحص ذاتي: هل ضميرك يعود على من يقوم بالفعل؟"),
 "a2-08-e4": (26, "جملة dass تحمل فعلها المُصرَّف إلى آخرها: «Ich weiß, dass Sie eine Mitarbeiterin suchen». إبقاء suchen بعد Sie يحوّل التابعة إلى إجابة مستقلة بلا أداة. فحص ذاتي: هل تُنهي جملة الأداة فعلَها؟"),
 "a2-10-e4": (26, "بعد صيغة التفضيل تأتي als للمفاضلة بين طرفين: «Das Auto ist bequemer als der Bus». wie تُستعمل مع so وفي صيغة المبالغة، فاستعمالها بعد bequemer يترك المقارنة بلا طرف ثانٍ. فحص ذاتي: هل جمعتُ طرفين بأداة واحدة؟"),
 "a2-14-e5": (26, "بلاغ الغياب يسدّ ثلاث خانات: «heute nicht kommen» للحضور، و«voraussichtlich bis Mittwoch» للمدة، و«morgen wieder melden» خبرًا. خلط المدة بالتتمة مهذَّبٌ بلا معلومة. فحص ذاتي: هل عرفتُ متى أسمع الخبر؟"),
 "a2-21-e4": (26, "إذا بدأت الجملة بظرف زمن جاء الفعل مُصرَّفًا في أثره مباشرة وانتقل الفاعل بعده: «Nächste Woche beginne ich den Kurs». الإبقاء على «ich beginne» يجعل التقديم بلا فاعلية. فحص ذاتي: هل سبق الفعلُ الفاعلَ بعد الظرف؟"),
 "a2-02-e3": (27, "في Präteritum لا يحتاج الفعل مصدرًا مساعدًا: «Ich hatte wenig Zeit». إرسال hatte إلى الآخر يترك الجملة الرئيسية بلا فعل مُصرَّف في مكانها، كأنها جملة جانبية بغير أداة. فحص ذاتي: هل فعلُك مُصرَّف لا مصدرًا؟"),
 "a2-05-e7": (27, "طلب خفض الصوت يصف الكيفية بالمقارنة: «Können Sie die Musik bitte leiser machen?». lauter تعكس الطلب، و viel لا تُستعمل صفة مقارنة هنا، و schnell تصف السرعة لا مستوى الصوت. فحص ذاتي: هل حدّدتُ الاتجاه لا المجاملة؟"),
 "a2-06-e4": (27, "جملة obwohl الجانبية تحمل فعلها في آخرها: «Obwohl er müde ist, räumt er auf». تقديم is يحوّلها سؤالًا، وترك الترتيب الخاطئ يُبقي أداة الربط بلا فعل مُصرَّف في مكانها. فحص ذاتي: هل يُنهي الجزءَ التابع فعلُه؟"),
 "a2-09-e1": (27, "التعريف الهاتفي المهني يذكر ما يثبت الهوية: «Hier spricht Sami Mansour». «Ich bin hier Sami machen» جملة بلا معنى، و«Sami am Telefon bin» تُخِلّ بمكان الفعل. فحص ذاتي: هل تُعرف الجهة من أول جملة؟"),
 "a2-09-e4": (27, "جملة ob تحمل فعلها إلى النهاية: «Können Sie mir sagen, ob Frau Keller da ist». تقديم is يجعل التابعة سؤالًا داخل سؤال فيضيع الطلب الرئيسي. فحص ذاتي: هل تُنهي جملةَ ob فعلُها؟"),
 "a2-12-e5": (27, "الشكوى تقوم على ثلاث ركائز: الدليل «Buchungsbestätigung»، والعطل «Heizung funktioniert nicht»، والحل «anderes Zimmer». إسقاط الدليل تُبقي الطلب رأيًا لا مطالبة. فحص ذاتي: هل معي ما يُثبت وما أريد؟"),
 "a2-22-e7": (27, "الصيغة الثابتة تسبقها البنية الاسمية: «Bitte sag bis Mittwoch Bescheid.». بلا Bescheid تسقط المطالبة وتبقى الجملة عاميّة مبهمة، و Bescheid machen لا تُستعمل لهذا المعنى. فحص ذاتي: هل حدّدتُ مَن يُخبِر ومتى؟"),
 "a2-03-e2": (28, "ما وقع مرّة واحدة في الماضي يُروى بـ als: «Als ich klein war, wohnte ich in Sfax». wenn تُستعمل للشرط أو للماضي المتكرر، فتحويل الطفولة إلى حدث متكرر يغيّر المعنى لا الصيغة. فحص ذاتي: هل الحدث وحدة واحدة؟"),
 "a2-03-e5": (28, "الشعور يُتعلم داخل جملة كاملة: «Ich hatte Angst.» و«Ich war stolz.» و«Ich habe mich gefreut.» — فـ haben تسند الاسم، و war تصف الحالة، و gefreut تحتاج الضمير الانعكاسي. فحص ذاتي: هل ذكرتَ مع كل شعور فعله؟"),
 "a2-03-e7": (28, "الفعل sich freuen انعكاسي، ومع wir يكون ضميره uns: «Wir haben uns sehr gefreut». حذفه يترك الفعل بلا مرجع، و euch تخاطب غير الفاعل، و unsich صيغة لا وجود لها. فحص ذاتي: هل ضميرك يطابق المتكلمين؟"),
 "a2-06-e1": (28, "الطلب المخفَّف يبني صيغة الودّ مع Konjunktiv II و bitte: «Könntest du bitte aufräumen?». «Räum jetzt auf!» أمر صريح، و«Aufräumen sofort!» برقيّ بلا مخاطَب. فحص ذاتي: هل خفّفت الفعل لا الصوت فقط؟"),
 "a2-08-e5": (28, "كل صفة تحتاج دليلًا من فعل: zuverlässig بمواعيد التزمت بها، و teamfähig بعمل مشترك، و organisiert بأجندة مُخطَّطة. إطلاق الوصف بلا مثال يحوّل السيرة إلى ادّعاء لا يُراجع. فحص ذاتي: هل أرفقتُ بكل صفة فعلًا يسندها؟"),
 "a2-09-e7": (28, "التركيب الثابت es geht um يسبق الموضوع: «Es geht um meine Bestellung». für تُغيّر الغرض و ohne تُدخل استثناءً، فتبقى الجملة سليمة اللغة ومعلومتها غير المطلوبة. فحص ذاتي: هل ذكرتُ الأمر المتعلَّق به؟"),
 "a2-21-e6": (28, "الهدف القابل للقياس يذكر التكرار والمدة ودليل التحقق: «Viermal pro Woche 45 Minuten und freitags eine Aufnahme.». «Mehr Deutsch.» لا يُعرَف إنجازاه، فيبقى الحافز بلا مقياس. فحص ذاتي: هل أستطيع عدّ ما فعلت؟"),
 "a2-23-e4": (28, "ضمير الصلة يعود على «Die Frau» مؤنثًا ويأتي في صدارة جملتها: «Die Frau, die das Treffen organisiert, kommt um neun». der عائد لغير المؤنث أو لجرّ، فلا يطابق ما عاد عليه. فحص ذاتي: هل الضمير يطابق من يعود إليه؟"),
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
    if CJK.search(s):
        bad.append(f"{k}: CJK char {CJK.search(s).group(0)!r}")
    out[k] = {"explanationAr": s, "oldLen": oldlen}
    print(f"{k:12s} new={L:3d} oldLen={oldlen}")
if len({v["explanationAr"] for v in out.values()}) != len(out):
    bad.append("duplicate explanation text")
json.dump(out, open("/home/user/tmp/a2e4.json", "w", encoding="utf-8"), ensure_ascii=False, indent=1)
if bad:
    print("\nVIOLATIONS:")
    for b in bad:
        print("  x", b)
    sys.exit(1)
print(f"\nvalidator: 0 violations · {len(out)} items · spec at /home/user/tmp/a2e4.json")
