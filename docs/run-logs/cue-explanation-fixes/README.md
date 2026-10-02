# تصحيحاتُ شروحٍ أبطلتها إعادةُ كتابة القرينة (v156.2)

إعادةُ كتابة المشتتات في v156 خفضت «الأطول = الأصح» من **48.16%** إلى **39.28%**، لكنها تركت
ثلاثةَ شروحٍ تُسمّي مشتتاتٍ **حُذفت** — أي تُحيل المتعلّم إلى خياراتٍ ليست أمامه:

| البند | ما كان الشرح يسمّيه | الواقع بعد إعادة الكتابة |
|---|---|---|
| `b1-12-e1` | «weniger Abfall» · «150 getauschte Dinge» · «Bewohner im Viertel» | «Die Abfallmenge im Viertel reduzieren» · «Getauschte Dinge zählen» · «Bewohner des Viertels» |
| `b1-20-e1` | «Du musst…» · «Mach einfach das» · «Ich weiß alles» | «Kündige sofort…» · «Du darfst nur meine Lösung nehmen» · «Warte ab und sag dazu nichts» |
| `b2-13-e6` | «eindeutig» | «Die zweite Gruppe bestätigt den Effekt» · «Der Effekt ist bewiesen» |

## لماذا صارت الحمولاتُ هنا بدل `/home/user/tmp`

كانت في `tmp` فمحاها تراجعُ اللقطة الثاني عشر، ثم فشلت إعادةُ تطبيقها لأن `oldLen` المحفوظ كان
**الطولَ بعد التصحيح** لا قبله ⇒ `wrote 0 field(s)`. القفلُ تصرّف تصرُّفًا صحيحًا (رفض الكتابة على
نصٍّ لا يطابق المتوقَّع)، والخطأُ كان في مكان الحمولة. فنُقلت إلى المستودع وصارت ضمن
`scripts/restore-generation.sh`.

## إعادة التشغيل

```
python3 scripts/apply-explanation-batch.py --level b1 --payload docs/run-logs/cue-explanation-fixes/b1.json
python3 scripts/apply-explanation-batch.py --level b2 --payload docs/run-logs/cue-explanation-fixes/b2.json
npx tsx scripts/audit-explanation-quotes.ts      # يجب أن تكون 0 misquotes
```

**القاعدة:** أيُّ تعديلٍ على `options` يُبطل الشروحَ التي تسمّيها ⇒ شغّل حارسَ الاقتباسات بعده.
