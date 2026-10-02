# ADR-101 — قياس Offline بعد تغليف محوّل Vercel / Next 16

التاريخ: 2026-10-02 · الحالة: منفّذ ومختبر محليًا بالبناء التقليدي ومحوّل @vercel/next الفعلي. لا يعني ذلك نجاح نشر سحابي قبل ظهور نتيجته.

## العطل المثبت

بناء `ce7e166` على Vercel نجح في التجميع وTypeScript وتوليد 322 صفحة ثم فشل في `postbuild`: `Missing built Offline payload for /: .next/server/app/index.html`.

Next 16 يستدعي adapter.onBuildComplete قبل انتهاء `next build` وقبل دورة npm postbuild. محوّل @vercel/next يجهز Build Output API v3 في `distDir/output`، ويضع HTML/metadata في `functions/*.prerender-fallback.html|body` مع المسار النسبي في `*.prerender-config.json`، والأصول في `static/_next/static`. بعض المخرجات ثابتة تحت `static/` ومسار تقديمها معلن في `config.json.overrides`. لذا افتراض server/app لجميع المضيفين غير صالح.

## القرار

- `scripts/lib/built-payloads.mjs` يكتشف `.next/output` أو `.vercel/output` المعلنين بإصدار v3، وإلا يحافظ على بنية Next المحلية الأصلية.
- ملف fallback المعلن ومسارات static overrides هما المرجع، بما في ذلك الصفحة `/`، والصفحات المتداخلة، وmanifest.webmanifest، وfavicon.ico. لا يُعامل fallback=null كصفحة Offline.
- عند اختيار حزمة نشر، غياب الملف فيها يفشل البناء؛ لا خلط مع HTML أو JS قديم في .next لإجبار النجاح.
- مولّد الحجم يقيس gzip level 9 لنفس البيانات الفعلية، ويحافظ على بصمة نفس المحتوى بغض النظر عن مكان التخزين. يبقى فك URI لأصول [lessonId] وحارس منع traversal وفشل الملف المفقود.
- يُنشر offline-size-manifest.json الجديد إلى public/ وإلى static/ الخاص بحزمة النشر، لأن محوّل Vercel سبق أن نسخ public قبل postbuild. نتحقق من تطابق النسختين، ولا ننشر البيان القديم الملتزم سابقًا.
- حارس JS يقرأ chunks من مخرجات النشر نفسها. حدود 2,500,000/750,000 بايت واحتياطي 15% لم تتغير؛ المجلد الخالي ليس نجاحًا بصفر بايت. حارس الصوت والمنهج والحزم لم يُعطل.

## التحقق

13 اختبارات انحدار جديدة تغطي البنيتين، ومخرجات CLI، وHTML الثابت، وfallback metadata، وتحديث النسخة المقدمة، ومطابقة البصمة والقياس، والملفات والأصول المفقودة، والمسارات والترميز غير الصالحين، وغياب chunks. البناء بمحوّل @vercel/next@16.0.0 الفعلي نجح بجميع 322 صفحة وجميع مراحل postbuild، وكانت النسخة المقدمة مطابقة public/ حرفيًا. ثم نجح البناء المحلي التقليدي واختبارات الوحدة كاملة 1,198/1,198 في 173 ملفًا.

لا تُضاف حزمة @vercel/next إلى اعتماديات التطبيق؛ نسخة الاختبار مؤقتة في .arena/ وخارج Git. هذه دفعة توافق بناء ضمن v180؛ لا تغيير للمنهج أو المسارات أو Service Worker أو تعريف gzip، وتغيّر بصمة بيان الحجم لكل بناء يظل ظاهرًا.
