#!/usr/bin/env python3
"""A2 explanation batch #12 (24 items, 2026-09-23) — fourth batch picked from THE MEDIAN POPULATION.

Ids come from docs/run-logs/2026-09-21-a2-explanations-9/pick_median.ts: the shortest 24 items of the
1,250-item median population still under 60 chars (19-20 chars: miniTest items plus listening/reading
questions). Lifting them moves the measured distance 342 -> 318.

Guards are batch #11's, reused verbatim (band 156-212, no positional wording, no CJK, no duplicated
text, old text and its length READ FROM THE REPO, any case term in the old text must survive, an item
already >= 60 chars is refused as the wrong tranche). Content rule: every explanation cites the option,
the transcript or the reading sentence it is about, and every «…» quotation is a verbatim occurrence in
that item's options, its prompt, or its lesson source text, so scripts/audit-explanation-quotes.ts stays
at 0 ERROR.
"""
import json, re, sys, pathlib

ROOT = pathlib.Path(__file__).resolve().parents[3]
DATA = ROOT / "src" / "data"
PAYLOAD = ROOT / "docs" / "run-logs" / "a2-explanations-payloads" / "a2e12.json"
POS = re.compile(r"(الموضع|المرتبة|ترقيم|الفقرة\s*\d|الخيار\s+[A-Dأبجد]\b|الإعلان\s+[A-D]\b|البند\s+[A-D]\b|الأول|الثاني|الثالثة|الثالث|الرابع|الأخيرة|الأخير|option\s*[A-D]|choice\s*[A-D])", re.I)
CASE = re.compile(r"Akkusativ|Dativ|Genitiv|Nominativ|Kasus")
CJK = re.compile(r"[\u3040-\u30ff\u4e00-\u9fff]")

T = {
 "a2-01-m4": "الفعلُ einkaufen منفصلُ البادئة، والـPartizip II يحصر الجذر بين ein وge-: «eingekauft». أمّا geeinkauft فتكرّر ge، وeinkaufen تبقى مصدرًا، وeingekaufen تقلب الترتيب. فحص ذاتي: أين وقع الجذرُ بين ein وge؟",
 "a2-02-m2": "الحالةُ في الماضي تُروى بـPräteritum لا بـPerfekt: «Ich war müde.». وأمّا «Ich habe müde.» و«Ich bin müde gehabt.» فيبنيان Perfekt مع صفةٍ لا مع فعل. فحص ذاتي: هل وصفتَ حالةً أم حدثًا؟",
 "a2-02-m3": "رابطُ المفاجأة في سرد الماضي هو «Plötzlich»: يقطع التوقّع فجأة. أمّا Zuerst فيفتح تسلسلًا عاديًّا، وAm Ende يختم السرد، وSeitdem يربط بدايةً بمدةٍ ممتدة. فحص ذاتي: هل جاء الحدثُ مفاجئًا؟",
 "a2-03-m1": "الحدثُ الفريد في الماضي يُربط بـals وحده: «ich angekommen bin, war es spät» بعد الفراغ. أمّا Wenn فللتكرار أو الشرط، وDeshalb وSeit لا تربطان حدثين متتاليين. فحص ذاتي: حدثٌ مرةً واحدة أم عادة؟",
 "a2-04-m1": "الفعلُ helfen يطلب Dativ فيكون المفعولُ «mir» لا mich ولا ich ولا mein. وهذا ما يفسّر عنوان التمرين helfen + ich: تُصرَّف الضميرةُ في الحالة التي يفتحها الفعل. فحص ذاتي: أيّ حالةٍ يطلبها فعلك؟",
 "a2-04-m5": "المخاطبةُ الرسمية تُكتب Ihnen بحرفٍ كبير، بترتيبٍ سليم: «Kann ich Ihnen helfen?». وأمّا «Kann ich ihnen helfen?» بحرفٍ صغير فلمن نعرفه، والباقي يكسّر الترتيبَ. فحص ذاتي: لمن توجّه الجملة؟",
 "a2-04-rq2": "النصّ يسمّي ما جاءت به الجارة بالضبط: «Sie hat Hana einen kleinen Kuchen gegeben». وقد جلبت هناءُ صناديقها بنفسها، أمّا المفتاحُ والطردُ واللمبةُ فلا ذكر لها مع السيدة ماير. فحص ذاتي: مَن أعطى ماذا ولمن؟",
 "a2-05-m2": "المنعُ يُصاغ بـdürfen مع nicht: «Man darf nicht rauchen.». وأمّا «Man muss nicht rauchen.» فتعني أنّ التدخين غيرُ مطلوب (إباحة)، و«Man kann rauchen.» تُبيحه صراحةً. فحص ذاتي: هل منعتَ أم أبيحتَ؟",
 "a2-06-m1": "الطلبُ المهذّب يبدأ بـ«Könntest du bitte aufräumen?» فيبقى الفعلُ في النهاية. وأمّا «Räum sofort auf!» فأمرٌ جافّ، و«Können du räumt?» و«Du aufräumen jetzt.» فجملتان مكسورتان. فحص ذاتي: هل بقي طلبُك مؤدّبًا؟",
 "a2-06-m4": "الموافقةُ على حلٍّ وسط جملةٌ كاملة: «Damit bin ich einverstanden.». وأمّا «Das stört ich.» و«Kompromiss nicht passt alle.» فبلا فاعلٍ صحيح وبترتيبٍ عربيٍّ بالكلمات الألمانية. فحص ذاتي: هل جملتُك مبنيّة؟",
 "a2-07-lq1": "القائدُ كلّف سارة صراحةً: «kannst du dich um die Gästeliste kümmern?». فالتقنيةُ عملُ David، والرعايةُ اللوجستية لليلى، واستقبالُ الضيوف يتناوب عليه الفريق. فحص ذاتي: مَن كلّفه القائدُ بماذا؟",
 "a2-09-lq1": "نبيل يعرّف بنفسه في مطلع المكالمة: «hier spricht Nabil Osman von der Firma Meditex». فالعيادةُ Praxis am Markt جهةٌ يُتصل بها لا جهةُ عمله، وتفاصيل الشهاداتِ لا ترد في النصّ. فحص ذاتي: مَن المتّصل ومَن الجهة؟",
 "a2-11-rq1": "النصّ يثبت المركزية للفندق وحده: «Das Hotel Hafenblick liegt zentral». وأمّا Pension Seerose فتبعد ثلاثة كيلومترات عن المركز، والشقةُ تُقارن بالسعر لا بالموقع. فحص ذاتي: أيّ إقامةٍ وصفها النصّ بالمركزية؟",
 "a2-13-m2": "الفعلُ الانعكاسي مع ich يأخذ الضميرَ «mich»: ich entspanne mich. وأمّا sich فللغائب، وdich للمخاطَب، وmir ضميرُ جرٍّ لا يطلبه هذا الفعل. فحص ذاتي: مَن الفاعل ومَن الضمير العائد إليه؟",
 "a2-14-lq1": "أمينة تحدّد المدة بنفسها: «Heute und wahrscheinlich morgen». فكلمةُ wahrscheinlich لا تعِد بيومٍ رابع، وموعدُ العصر يخصّ اتصالها بعد الطبيب لا مدةَ الغياب. فحص ذاتي: هل أخذتَ القيدَ من جوابها؟",
 "a2-15-m2": "السؤالُ عن Zeitpunkt يسأل عن وقت تناول القرص: «nach dem Essen». وأمّا zwei Tabletten فالكمية، وfünf Tage مدةُ الاستعمال، وmit Wasser طريقةُ البلع. فحص ذاتي: أتجيب عن وقتٍ أم عن كمية؟",
 "a2-15-rq2": "النصّ يوجّه السؤال إلى من يتناول دواءً آخر: «Wer andere Medikamente nimmt, soll vorher … nachfragen». فلا يُلزم الأطفالُ وحدهم، والتحذيرُ من الحساسية حالةٌ أخرى. فحص ذاتي: ما الشرطُ الذي يُوجب السؤال؟",
 "a2-16-lq3": "الشرطةُ تنفي الإشاعة بنصّها: «Der Hauptbahnhof ist gesperrt». فهذا هو الخبرُ الكاذب، بينما «Der Bahnhof bleibt geöffnet.» والمصادرُ الرسمية في المتن. فحص ذاتي: أيُّ معلومةٍ جاءت منفية؟",
 "a2-16-m5": "شبكةُ الخبر تُبنى على أسئلةٍ تُغطّي الحدث: «Wer, was, wann, wo». وأمّا الصفاتُ العامة (schön, schlecht, toll) والأسئلةُ التي تُجاب بنعم أو لا فلا تُنتج خبرًا. فحص ذاتي: أيُّ سؤالٍ يبقى بلا جواب في مسودتك؟",
 "a2-16-rq2": "الخبرُ يسرد الوقائع، والرأيُ حكمٌ على المشروع: «Das Projekt ist unnötig» صياغةُ تقييمٍ شخصيّ. وأمّا الموعدُ والمدةُ والتكلفةُ فمعطياتٌ نُقلت عن جهةٍ رسمية. فحص ذاتي: هل الجملةُ خبرٌ أم تقييم؟",
 "a2-17-m1": "حين يتّحد الفاعلان يُستعمل um … zu بدل damit: «Ich lese, um informiert zu bleiben». وأمّا «Ich lese, damit informiert zu bleiben.» فتخلط الأداتين، وسائرُ الجمل تكسر الترتيب. فحص ذاتي: أفاعلٌ واحد أم فاعلان؟",
 "a2-20-rq2": "الشرطُ يسبق التسجيل عند الجميع: «Vor der Anmeldung müssen alle einen Einstufungstest machen». والاختبارُ الداخليّ في نهاية الدورة ليس شهادةً رسمية ولا امتحانًا خارجيًّا. فحص ذاتي: ما الخطوةُ الملزمة قبل الدفع؟",
 "a2-21-rq1": "الخطةُ تعدّ الأيامَ صراحةً: «montags, dienstags, donnerstags und samstags jeweils 45 Minuten». فهي أربع جلساتٍ في الأسبوع، والأحدُ للتقييم لا للدرس الجديد. فحص ذاتي: هل عددتَ الأيام أم خمّنت؟",
 "a2-23-m4": "الفاعلُ المعرّف في الجمع يأخذ die في Nominativ، وهو «die» في هذا التمرين. وأمّا der وdas فمفرد، وden تُستعمل في الجمع المنصوب (Akkusativ). فحص ذاتي: أهو فاعلٌ أم مفعولٌ في جملتك؟",
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
