# Meaning → Role → Case Form Coverage Report

Generated: 2026-09-05  
Version: `meaning-first-case-audit-v1`  
Policy: `meaning-first-case-v1`  
Content SHA-256: `d9c241d6e09bbc87622af7afb132e8d2349823b1af8ae93d61925ea8ec384f90`

## Result

`PASS` — **17 case-teaching contracts in 17 lessons** render the fixed sequence **Bedeutung → Rolle → Form** before controlled practice. They map **21 theory blocks**, **54 controlled exercises**, and **40 Mini-Test items**.

Explicit case-name discovery found 18 theory, 27 controlled, and 20 assessment signals; every discovered ID is owned by one lesson contract.

| Level | Contracts |
|---|---:|
| A1 | 6 |
| A2 | 4 |
| B1 | 4 |
| B2 | 3 |
| **Total** | **17** |

## Required order

1. **Bedeutung verstehen:** ask what happens in the situation without naming a case or ending.
2. **Rolle bestimmen:** choose actor, affected item, recipient, location/direction, source, topic, instrument, or reference-noun role.
3. **Form prüfen:** only then apply Nominativ/Akkusativ/Dativ/Genitiv and article/pronoun/adjective form.

The build fails if a contract starts with case/form terminology, loses teaching/practice/assessment references, owns an unknown ID, duplicates a lesson/ID, changes the required order, or leaves an explicit case-name signal unowned.

## Per-lesson contract

| Lesson | German focus | Semantic first question | Roles | Cases | Theory | Controlled | Assessment |
|---|---|---|---:|---|---:|---:|---:|
| `a1-10` | Wer tut was? | ما الشيء الذي يأكله الشخص أو يشتريه؟ | 2 | accusative | 2 | 4 | 4 |
| `a1-12` | Bestellung und Ziel | ما الطعام أو الشراب الذي يطلبه المتكلم؟ | 2 | accusative | 1 | 2 | 2 |
| `a1-13` | Was gibt es? | ما الشيء الموجود أو غير الموجود في الشقة؟ | 2 | accusative | 1 | 3 | 2 |
| `a1-14` | Ort oder Bewegung? | هل نصف مكان الشيء الآن أم حركة نحو مكان جديد؟ | 2 | dative | 1 | 4 | 3 |
| `a1-19` | Verkehrsmittel als Begleitung | ما الوسيلة المصاحبة للرحلة، وما الشيء الذي نركبه؟ | 2 | dative, accusative | 2 | 4 | 3 |
| `a1-20` | Ziel und Orientierungspunkt | هل نتحرك إلى وجهة أم نصف موضعًا مقابل معلم؟ | 2 | dative | 1 | 2 | 2 |
| `a2-04` | Person und Sache | من يتلقى المساعدة أو الشيء، وما الشيء الذي يُعطى؟ | 3 | dative, accusative | 2 | 6 | 4 |
| `a2-07` | Verantwortung und Aufgabe | عن أي مهمة يكون الشخص مسؤولًا، وما المهمة التي يعتني بها؟ | 2 | accusative | 2 | 4 | 2 |
| `a2-16` | Quelle der Aussage | من الجهة التي نُنسب إليها المعلومة؟ | 2 | dative, genitive | 1 | 1 | 1 |
| `a2-23` | Rolle im Relativsatz | هل الاسم هو من يقوم بالفعل داخل الجملة الموصولة أم يقع عليه؟ | 2 | nominative, accusative | 1 | 5 | 4 |
| `b1-02` | Gewählte oder abgelehnte Option | هل يختار الشخص هذا البديل أم يرفضه؟ | 2 | accusative | 1 | 3 | 2 |
| `b1-04` | Prozess und Handelnder | هل الجملة تركز على ما يحدث، أم تحتاج أيضًا إلى ذكر من نفذ الفعل؟ | 2 | dative | 1 | 2 | 1 |
| `b1-08` | Funktion vor Relativpronomen | من يفعل؟ من يقع عليه الفعل؟ ولمن يُكتب أو تُقدّم المساعدة؟ | 3 | nominative, accusative, dative | 1 | 5 | 3 |
| `b1-13` | Mittel des Fortschritts | بأي وسيلة أو ممارسة حدث التغير؟ | 2 | accusative | 1 | 1 | 1 |
| `b2-04` | Thema, Grund oder Perspektive | هل التركيب يحدد موضوعًا، سببًا، معيار مراعاة، أم منظورًا؟ | 3 | genitive, accusative | 1 | 5 | 3 |
| `b2-08` | Quelle und Distanz | لمن تُنسب المعلومة، وهل يتبناها الكاتب أم ينقلها؟ | 2 | dative, genitive | 1 | 1 | 1 |
| `b2-09` | Bezugsnomen und Attribut | ما الاسم الذي تصفه العبارة، وما دوره وجنسه وعدده داخل الجملة؟ | 3 | nominative, accusative, dative | 1 | 2 | 2 |

## Boundary

The audit proves authored sequencing and complete ownership of explicit case-name signals. It does not replace an independent linguistic judgment of every explanation or learner interpretation.
