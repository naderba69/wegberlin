# ADR-069 — Release Candidate منفصل عن الترقية الإنتاجية

**السياسة:** `pre-production-release-candidate-v1`  
**التاريخ:** 2026-09-12

Workflow يدوي يشغل فحص History للأسرار و`npm run check` وكامل Playwright ثم ينشئ Attestation مربوطة باسم `rc-YYYY.MM.DD-N` وSHA كامل وبصمة package-lock وعدد Offline routes. يرفع Artifact 14 يومًا ولا يحتوي Deploy أو `--prod`. الحالة `candidate-tests-passed-not-promoted` والترقية تحتاج فعلًا بشريًا منفصلًا؛ وجود الملف لا يثبت Run بعيدًا قبل Push.
