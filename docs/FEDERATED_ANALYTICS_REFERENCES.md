# مراجع التحليلات الموحّدة (P2-360)

**الحالة: مراجع فقط. لا يوجد تنفيذ ولا تفعيل.**

هذه الوثيقة تجمع المراجع التي طلبها المالك لتقييم تجربة Federated analytics. هي ليست تدقيق خصوصية، ولا تعتبر موافقة على التنفيذ.

## الشرط الملزم قبل أي تجربة

- لا تُنفَّذ أي تجربة قبل **تدقيق خصوصية مستقل** يقرّ بالتصميم المحدد (بند 360 في `IDEA_BACKLOG.md`).
- التحليل يبقى **اختياريًا** ولا يُفعَّل افتراضيًا. لا جمع بيانات دون موافقة صريحة.
- لا يُرسل أي شيء من جهاز المتعلم قبل ظهور نص الموافقة وتسجيلها محليًا.
- لا يُستخدم التحليل الموحّد لادعاء نتيجة امتحان أو مستوى CEFR.
- إذا تعذّر تحقيق الشرط الأول، يبقى البند مفتوحًا ولا يُغلق.

## المراجع

### 1. التحليلات الموحّدة والخصوصية التفاضلية (Google Research)

- Google Research, "Discovering new words with confidential federated analytics": يصف استخدام خصوصية تفاضلية على مستوى الخادم المشفّر، وسياسة وصول تحدد خطوات المعالجة المسموحة قبل الإخراج. https://research.google/blog/discovering-new-words-with-confidential-federated-analytics/
- Google Federated Learning & Analytics (الصفحة الرسمية للفريق): يشرح التجميع الآمن (Secure aggregation) بحيث لا يرى الخادم إلا المجموع. https://federated.withgoogle.com/
- Bagdasaryan et al., "Towards sparse federated analytics: Location heatmaps under distributed differential privacy with secure aggregation", Proceedings on Privacy Enhancing Technologies, 2022 (مذكور في مراجعة الخصوصية التفاضلية أدناه).

### 2. التجميع الآمن للإحصاءات (Prio)

- Corrigan-Gibbs & Boneh, "Prio: Private, Robust, and Scalable Computation of Aggregate Statistics", 2017. الفكرة: لا يرى الخوادم بيانات أي عميل، طالما بقي خادم واحد على الأقل أمينًا. الورقة: https://crypto.stanford.edu/prio/paper.pdf (نسخة arXiv: https://arxiv.org/pdf/1703.06255)
- ملاحظة: Prio تفترض عدة خوادم مستقلة، وهذا لا يتوفر في نشر PWA بسيط دون بنية خادم منفصلة.

### 3. مراجعة شاملة للخصوصية التفاضلية

- "A Comprehensive Guide to Differential Privacy: From Theory to User Expectations" (arXiv 2509.03294): يصف الفرق بين الخصوصية التفاضلية المركزية والمحلية والموزعة، وأن الخصوصية الموزعة تتطلب تجميعًا آمنًا وإضافة ضوضاء محلية. https://arxiv.org/html/2509.03294v1

### 4. معايير إخفاء الهوية والاسم المستعار (الاتحاد الأوروبي)

- Article 29 Working Party, Opinion 05/2014 on Anonymisation Techniques (WP216): الاسم المستعار وحده ليس إخفاء هوية؛ التجميع والتعميم قد يقللان الخطر؛ الخصوصية التفاضلية "قد لا" تكفي دون تحليل. https://ec.europa.eu/justice/article-29/documentation/opinion-recommendation/files/2014/wp216_en.pdf
- EDPB Guidelines 02/2026 on Anonymization (مسودة V1.0 للاستشارة العامة حتى 30 أكتوبر 2026)، حسب ملخص منشور من مكتب قانوني (مصدر ثانوي؛ يجب التحقق من النص الرسمي قبل الاعتماد): https://hlc.com/en/publications/edpb-publishes-new-guidelines-on-anonymization-under-the-gdpr
- EDPB Guidelines 01/2025 on Pseudonymisation: ملخص أكاديمي. https://eprints.soton.ac.uk/505030/1/4hhqjh1w57kgkawg59vjt0ytrosrkklu.pdf

## ما لم يُتحقق منه بعد

- لم يُجرَ تدقيق خصوصية مستقل لأي تصميم لهذا المشروع.
- لم يُتحقق من نص EDPB الرسمي 02/2026 مباشرة؛ الاعتماد عليه يتطلب قراءة المصدر الرسمي.
- لا يوجد تقدير لحجم الضوضاء أو ميزانية الخصوصية (epsilon) لأي تجربة.
