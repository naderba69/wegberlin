import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import { readingEvidenceByQuestionId } from "@/data/reading-evidence-index";
import { academicLessons } from "../../src/data/academic-lessons";
import { allPublishedExamTasks } from "../../src/data/exam-simulation-registry";
import { curriculum } from "../../src/data/curriculum";
import { defaultState } from "../../src/core/portability/db";
import { framesByLesson, nounsByLesson } from "../../src/data/lexical-grammar-registry";

async function waitForLearningReady(page: Page) {
  await expect(page.locator(".app-frame")).toHaveAttribute("data-learning-ready", "true");
}

/** الشريط الجانبي للمراحل مخفي على المقاسات الصغيرة، فيُفتح مرحلة المفردات من تذييل المرحلة هناك. */
async function openVocabularyStage(page: Page) {
  const sidebarStage = page.locator(".lesson-steps nav button").filter({ hasText: "العبارات" });
  if (await sidebarStage.isVisible()) {
    await sidebarStage.click();
  } else {
    for (let step = 0; step < 2; step += 1) {
      await page.getByRole("button", { name: /أكملت هذه الخطوة/ }).click();
      await expect(page.locator(".lesson-workspace h1")).toBeVisible();
    }
  }
  await expect(page.locator(".lesson-workspace h1")).toContainText("العبارات");
}

async function readActiveProfileId(page: Page) {
  return page.evaluate(() => new Promise<string | undefined>((resolve, reject) => {
    const open = indexedDB.open("der-weg-nach-berlin", 4);
    open.onerror = () => reject(open.error);
    open.onsuccess = () => {
      const request = open.result.transaction("metadata", "readonly").objectStore("metadata").get("active-profile");
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(typeof request.result === "string" ? request.result : undefined);
    };
  }));
}

test("library and exam hubs render their completed content contracts", async ({ page }) => {
  await page.goto("/library");
  await expect(page.getByRole("heading", { name: /نصوص مستقلة/ })).toBeVisible();
  await expect(page.getByText("160", { exact: true })).toBeVisible();

  await page.goto("/exams");
  await expect(page.getByRole("heading", { name: /تدرّب على امتحانك/ })).toBeVisible();
  await expect(page.getByText(/Goethe-Zertifikat B2/).first()).toBeVisible();
  await expect(page.getByText(/telc Deutsch B2/).first()).toBeVisible();
  await expect(page.locator(".exam-profile-banner")).toContainText("ملف الصيغة موثّق وحديث");
  await expect(page.locator(".exam-profile-banner")).toContainText("إعادة التحقق قبل 2026-10-03");
});

test("P0 exam readiness stays provider-scoped and exposes weak modules instead of one average", async ({ page }) => {
  const goetheReadingIds=allPublishedExamTasks.filter((task)=>task.provider==="goethe-b2"&&task.skill==="reading").slice(0,6).map((task)=>task.id);
  const completedLessonIds=curriculum.map((lesson)=>lesson.id);
  await page.goto("/exams");
  await waitForLearningReady(page);
  await page.evaluate(({baseState,goetheReadingIds,completedLessonIds})=>new Promise<void>((resolve,reject)=>{
    const open=indexedDB.open("der-weg-nach-berlin",4);
    open.onerror=()=>reject(open.error);
    open.onsuccess=()=>{
      const state=structuredClone(baseState);
      state.profile={name:"Nadia",targetExam:"goethe-b2",dailyMinutes:45,arabicSupport:"modern-standard-arabic",currentLevel:"B2",createdAt:new Date().toISOString()};
      state.diagnosticResult={estimatedLevel:"B2",score:16,maxScore:16,levelScores:{A1:4,A2:4,B1:4,B2:4},completedAt:new Date().toISOString()};
      state.completedLessonIds=completedLessonIds;
      state.mastery={...state.mastery,"level-a1-ready":100,"level-a2-ready":100,"level-b1-ready":100,"level-b2-ready":100,...Object.fromEntries(goetheReadingIds.map((id:string)=>[`exam-target-${id}`,50]))};
      const tx=open.result.transaction("learning-state","readwrite");
      tx.objectStore("learning-state").put(state,"primary");
      tx.oncomplete=()=>resolve();
      tx.onerror=()=>reject(tx.error);
    };
  }),{baseState:structuredClone(defaultState),goetheReadingIds,completedLessonIds});
  await page.reload();
  await waitForLearningReady(page);
  const board=page.locator(".exam-readiness-board");
  await expect(board.locator("article")).toHaveCount(4);
  const reading=board.locator("article").filter({hasText:"القراءة"});
  await expect(reading).toContainText("6 مهام بدليل");
  await expect(reading).toContainText("50%");
  await expect(reading).toContainText("يحتاج علاجًا");
  await expect(board).toContainText("لا يوجد متوسط يخفي فجوة مهارة");

  await page.locator(".exam-switch").getByRole("button",{name:/telc Deutsch B2/}).click();
  await expect(board.locator("article")).toHaveCount(5);
  await expect(board.locator("article").filter({hasText:"فهم القراءة"})).toContainText("بلا دليل");
  await expect(board).toContainText("لا تجمع نقاطًا رسمية");
  await page.goto("/today");
  await waitForLearningReady(page);
  await expect(page.getByText("هذه أضعف وحدة امتحانية.")).toBeVisible();
  await expect(page.locator(".hero-button")).toHaveAttribute("href",/^\/exams\/telc-deutsch-b2\//);
});

test("P0 onboarding captures goals and an explicit device-check skip locally", async ({ page }) => {
  await page.goto("/today");
  await waitForLearningReady(page);
  await expect(page.locator(".resilient-audio")).toHaveAttribute("data-audio-status", "ready", { timeout: 15_000 });
  expect(await page.getByLabel("عينة فحص الصوت الألماني").evaluate((audio: HTMLAudioElement) => audio.duration)).toBeGreaterThan(1);
  await page.getByLabel("كيف نناديك؟").fill("Nadia");
  await page.getByRole("button", { name: /أعرف بعض الأساسيات/ }).click();
  await page.getByRole("button", { name: /العمل.*مراسلات واجتماعات/ }).click();
  await page.getByRole("button", { name: /تخطَّ الفحص/ }).click();
  await expect(page.getByText(/تم تخطي فحص الجهاز/)).toBeVisible();
  await page.getByRole("button", { name: /أنشئ خطتي ثم شخّص مستواي/ }).click();
  await expect(page.getByRole("heading", { name: /لن نخمن مستواك/ })).toBeVisible();

  await expect.poll(() => page.evaluate(() => new Promise<unknown>((resolve, reject) => {
    const open = indexedDB.open("der-weg-nach-berlin", 4);
    open.onerror = () => reject(open.error);
    open.onsuccess = () => {
      const request = open.result.transaction("learning-state", "readonly").objectStore("learning-state").get("primary");
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve({ goals: request.result?.profile?.goals, priorExperience: request.result?.profile?.priorExperience, deviceReadiness: request.result?.profile?.deviceReadiness });
    };
  }))).toEqual({ goals: ["exam", "work"], priorExperience: "some", deviceReadiness: { audio: "skipped", microphone: "skipped", checkedAt: expect.any(String) } });
});

test("an absolute beginner starts A1 step by step and never receives an isolated writing demand", async ({ page }) => {
  await page.goto("/today");
  await waitForLearningReady(page);
  await page.getByLabel("كيف نناديك؟").fill("مبتدئ");
  await expect(page.getByRole("button", { name: /أبدأ من الصفر/ })).toHaveAttribute("aria-pressed", "true");
  await page.getByRole("button", { name: /تخطَّ الفحص/ }).click();
  await page.getByRole("button", { name: /ابدأ معي من الصفر/ }).click();
  await expect(page.getByText(/لن نختبرك أو نطلب منك كتابة ألمانية الآن/)).toBeVisible();
  await expect(page.locator(".hero-button")).toHaveAttribute("href", "/lernen/a1-01");
  await expect(page.locator(".mission-list")).not.toContainText("اختبار نقطة البداية");
  await page.locator(".hero-button").click();
  await expect(page).toHaveURL(/\/lernen\/a1-01$/);
  await expect(page.locator(".lesson-workspace h1")).toContainText("أهداف اليوم");

  await page.goto("/writing");
  await waitForLearningReady(page);
  await expect(page.getByRole("heading", { name: /لن نطلب منك الكتابة/ })).toBeVisible();
  await expect(page.locator(".beginner-lab-gate")).not.toContainText("Schreiben Sie");
  await expect(page.getByRole("link", { name: /ابدأ الدرس خطوة خطوة/ })).toHaveAttribute("href", "/lernen/a1-01");
});

test("P0 adaptive diagnostic stops at a clear boundary and stores four skill scores", async ({ page }) => {
  await page.goto("/diagnostic");
  await page.getByText("Ich heiße Ali.", { exact: true }).click();
  await page.getByRole("button", { name: /السؤال التالي/ }).click();
  await page.getByText("Gute Nacht!", { exact: true }).click();
  await page.getByRole("button", { name: /السؤال التالي/ }).click();
  await page.getByText("Montag und Mittwoch", { exact: true }).click();
  await page.getByRole("button", { name: /السؤال التالي/ }).click();
  const diagnosticAudio = page.locator(".diagnostic-listening .resilient-audio");
  await expect(diagnosticAudio).toHaveAttribute("data-audio-status", "ready", { timeout: 15_000 });
  expect(await page.getByLabel("مقطع التشخيص مواعيد الفتح").evaluate((audio: HTMLAudioElement) => audio.duration)).toBeGreaterThan(10);
  await expect(page.getByRole("button", { name: /تشغيل صوت المتصفح البديل/ })).toBeVisible();
  await page.getByText("Um acht", { exact: true }).click();
  await page.getByRole("button", { name: /قيّم هذا المستوى/ }).click();

  await expect(page.getByRole("heading", { name: /نقطة البداية المقترحة.*A1/ })).toBeVisible();
  await expect(page.getByText(/توقف التشخيص مبكرًا/)).toBeVisible();
  await expect(page.locator(".diagnostic-skill-report article")).toHaveCount(4);
  await expect.poll(() => page.evaluate(() => new Promise<unknown>((resolve, reject) => {
    const open = indexedDB.open("der-weg-nach-berlin", 4);
    open.onerror = () => reject(open.error);
    open.onsuccess = () => {
      const request = open.result.transaction("learning-state", "readonly").objectStore("learning-state").get("primary");
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result?.diagnosticResult);
    };
  }))).toMatchObject({ formId: "A", questionsAnswered: 4, stoppedEarly: true, confidence: "low", levelAttempted: { A1: 4, A2: 0, B1: 0, B2: 0 } });
});

test("P0-256: exam and lab results announce one short summary instead of the whole panel", async ({ page }) => {
  await page.goto("/exams/goethe-b2/goethe-b2-reading-01");
  await waitForLearningReady(page);
  await page.getByRole("button", { name: /ابدأ المؤقت والتدريب/ }).click();
  const selects = page.locator(".targeted-items select");
  for (let index = 0; index < await selects.count(); index += 1) {
    const select = selects.nth(index);
    if (await select.inputValue()) continue;
    const available = await select.locator("option").evaluateAll((options) => options.find((option) => (option as HTMLOptionElement).value && !(option as HTMLOptionElement).disabled)?.getAttribute("value"));
    if (available) await select.selectOption(available);
  }
  await page.getByRole("button", { name: /التزم بالإجابات وصحح/ }).click();
  const result = page.locator(".targeted-result");
  await expect(result).toBeVisible();
  const announcer = result.locator(".result-announcer");
  await expect(announcer).toHaveAttribute("role", "status");
  await expect(announcer).toHaveAttribute("aria-live", "polite");
  await expect(announcer).toHaveAttribute("aria-atomic", "true");
  await expect(announcer).toHaveText(/نتيجة (التدريب الجزئي|تدريب القراءة التفصيلية|تدريب العناصر اللغوية): \d+ من \d+ إجابة صحيحة\. النتيجة تدريبية داخلية وليست نقاطًا رسمية/);
  // لا تكرار: منطقة حيّة واحدة فقط في شاشة النتيجة، ولوحة النتائج نفسها ليست منطقة حيّة.
  await expect(result.locator('[role="status"]')).toHaveCount(1);
  await expect(result).not.toHaveAttribute("role", "status");
});

test("P0-266: one missed day becomes an explicit grace day with no deferred task", async ({ page }) => {
  // ساعة ثابتة: الخميس 2026-09-03 داخل أسبوع يبدأ 2026-08-31، حتى لا يتغير الاختبار بتاريخ التشغيل.
  await page.clock.setFixedTime(new Date("2026-09-03T09:00:00"));
  await page.goto("/today");
  await waitForLearningReady(page);

  const seed = (studiedDates: string[]) => page.evaluate(({ baseState, studiedDates }) => new Promise<void>((resolve, reject) => {
    const open = indexedDB.open("der-weg-nach-berlin", 4);
    open.onerror = () => reject(open.error);
    open.onsuccess = () => {
      const transaction = open.result.transaction("learning-state", "readwrite");
      const store = transaction.objectStore("learning-state");
      const request = store.get("primary");
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const state = request.result ?? structuredClone(baseState);
        state.profile = { name: "Test", targetExam: "goethe-b2", dailyMinutes: 45, arabicSupport: "modern-standard-arabic", currentLevel: "A1", createdAt: new Date().toISOString() };
        state.diagnosticResult = { estimatedLevel: "A1", score: 3, maxScore: 12, levelScores: { A1: 3, A2: 0, B1: 0, B2: 0 }, completedAt: new Date().toISOString() };
        state.studyHistory = studiedDates.map((date) => ({ date, minutes: 30, evidenceCount: 2 }));
        store.put(state, "primary");
      };
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    };
  }), { baseState: structuredClone(defaultState), studiedDates });

  // يوم واحد فائت (2026-09-02) داخل سقف السماح: لا مهمة مؤجلة ولا استعادة.
  await seed(["2026-08-31", "2026-09-01"]);
  await page.reload();
  await waitForLearningReady(page);
  const graceDay = page.locator(".weekly-plan-day.grace");
  await expect(graceDay).toHaveCount(1);
  await expect(graceDay).toContainText("يوم سماح");
  await expect(graceDay).toContainText("09-02");
  await expect(graceDay).toContainText("السلسلة تتوقف عنده فعلًا");
  const note = page.locator(".weekly-recovery-note");
  await expect(note).toContainText("بلا مهمة مؤجلة ولا مضاعفة");
  await expect(note).toContainText("لا يجمّد السلسلة ولا يمدّدها");
  await expect(page.locator(".weekly-plan-day .recovery")).toHaveCount(0);
  await expect(page.locator(".grace-counter")).toContainText("0/1");

  // يومان فائتان: الأول سماح، والثاني دين يُنقل منه مهمة واحدة داخل ميزانية اليوم (45 دقيقة).
  await seed(["2026-08-31"]);
  await page.reload();
  await waitForLearningReady(page);
  await expect(page.locator(".weekly-plan-day.grace")).toHaveCount(1);
  await expect(page.locator(".weekly-plan-day.missed")).toHaveCount(1);
  await expect(page.locator(".weekly-recovery-note")).toContainText("يوم دين");
  const recovery = page.locator(".weekly-plan-day .recovery");
  await expect(recovery).toHaveCount(1);
  await expect(page.locator(".weekly-plan-day.today")).toContainText("استعادة محدودة من 2026-09-02");

  const todayCard = page.locator(".weekly-plan-day.today");
  const budget = Number(((await todayCard.locator("header > b").textContent()) ?? "0").replace(/[^0-9]/gu, ""));
  const slotMinutes = await todayCard.locator("a").evaluateAll((nodes) => nodes.reduce((sum, node) => sum + Number((node.textContent ?? "").replace(/[^0-9]/gu, "")), 0));
  expect(slotMinutes).toBe(budget);
});

test("P0-38: a session keeps a short retrieval warm-up before any SM-2 card exists", async ({ page }) => {
  const readScheduling = () => page.evaluate(() => new Promise<{ reviewItems: number; reviewEvents: number; masteryKeys: number; attempts: number }>((resolve, reject) => {
    const open = indexedDB.open("der-weg-nach-berlin", 4);
    open.onerror = () => reject(open.error);
    open.onsuccess = () => {
      const request = open.result.transaction("learning-state", "readonly").objectStore("learning-state").get("primary");
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const state = request.result ?? {};
        resolve({
          reviewItems: (state.reviewItems ?? []).length,
          reviewEvents: (state.reviewEvents ?? []).length,
          masteryKeys: Object.keys(state.mastery ?? {}).length,
          attempts: (state.exerciseAttempts ?? []).length,
        });
      };
    };
  }));

  await page.goto("/today");
  await waitForLearningReady(page);
  // متعلّم أنهى التشخيص ووصل إلى المرحلة 3 من أول درس: لا بطاقة SM-2 واحدة موجودة بعد.
  await page.evaluate((baseState) => new Promise<void>((resolve, reject) => {
    const open = indexedDB.open("der-weg-nach-berlin", 4);
    open.onerror = () => reject(open.error);
    open.onsuccess = () => {
      const transaction = open.result.transaction("learning-state", "readwrite");
      const store = transaction.objectStore("learning-state");
      const request = store.get("primary");
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const state = request.result ?? structuredClone(baseState);
        state.profile = { name: "Test", targetExam: "goethe-b2", dailyMinutes: 45, arabicSupport: "modern-standard-arabic", currentLevel: "A1", createdAt: new Date().toISOString() };
        state.diagnosticResult = { estimatedLevel: "A1", score: 3, maxScore: 12, levelScores: { A1: 3, A2: 0, B1: 0, B2: 0 }, completedAt: new Date().toISOString() };
        state.completedLessonIds = [];
        state.reviewItems = [];
        state.reviewEvents = [];
        state.mastery = {};
        state.exerciseAttempts = [];
        state.currentLessonId = "a1-01";
        state.lessonProgress = { "a1-01": 2 };
        store.put(state, "primary");
      };
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    };
  }), structuredClone(defaultState));

  await page.reload();
  await waitForLearningReady(page);
  const warmupBlock = page.locator(".session-signal-card.warmup");
  await expect(warmupBlock).toBeVisible();
  await expect(warmupBlock).toContainText("إحماء استرجاع");
  await expect(warmupBlock).toContainText("بلا درجة");

  const before = await readScheduling();
  expect(before.reviewItems).toBe(0);

  await warmupBlock.getByRole("link", { name: /افتح الإحماء/ }).click();
  await expect(page).toHaveURL(/\/review$/);
  const zone = page.locator(".warmup-zone");
  await expect(zone).toBeVisible();

  // كل عنصر من مرحلة شاهدها المتعلّم فعلًا (المرحلة 3 كحد أقصى): لا قراءة ولا نطق.
  const seenStages: string[] = [];
  for (let step = 0; step < 6; step += 1) {
    if (!(await page.locator(".warmup-item").isVisible())) break;
    seenStages.push((await page.locator(".warmup-meta").textContent()) ?? "");
    await expect(page.locator(".warmup-answer")).toHaveCount(0);
    await page.getByRole("button", { name: /اكشف بعد المحاولة/ }).click();
    const answer = page.locator(".warmup-answer strong");
    await expect(answer).toBeVisible();
    expect(((await answer.textContent()) ?? "").trim().length).toBeGreaterThan(0);
    await page.getByRole("button", { name: /التالي|أنهِ الجولة/ }).click();
  }
  expect(seenStages.length).toBeGreaterThanOrEqual(3);
  for (const meta of seenStages) {
    expect(meta).toContain("مرحلة");
    expect(meta).not.toContain("القراءة");
    expect(meta).not.toContain("النطق");
  }
  await expect(zone).toContainText("أنهيت الجولة");
  await expect(zone).toContainText("لم تُسجَّل نتيجة");

  // الإحماء لا يلمس الجدولة ولا الإتقان ولا سجل المحاولات.
  const after = await readScheduling();
  expect(after).toEqual(before);
});

test("P0-26: an optional productive sample survives reload without any automatic score", async ({ page }) => {
  const readDiagnostic = () => page.evaluate(() => new Promise<unknown>((resolve, reject) => {
    const open = indexedDB.open("der-weg-nach-berlin", 4);
    open.onerror = () => reject(open.error);
    open.onsuccess = () => {
      const request = open.result.transaction("learning-state", "readonly").objectStore("learning-state").get("primary");
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const state = request.result ?? {};
        resolve({
          samples: state.diagnosticSamples ?? [],
          level: state.diagnosticResult?.estimatedLevel ?? null,
          score: state.diagnosticResult?.score ?? null,
          answered: state.diagnosticResult?.questionsAnswered ?? null,
        });
      };
    };
  })) as Promise<{ samples: Array<Record<string, unknown>>; level: string | null; score: number | null; answered: number | null }>;

  await page.goto("/diagnostic");
  await page.getByText("Ich heiße Ali.", { exact: true }).click();
  await page.getByRole("button", { name: /السؤال التالي/ }).click();
  await page.getByText("Gute Nacht!", { exact: true }).click();
  await page.getByRole("button", { name: /السؤال التالي/ }).click();
  await page.getByText("Montag und Mittwoch", { exact: true }).click();
  await page.getByRole("button", { name: /السؤال التالي/ }).click();
  await page.getByText("Um acht", { exact: true }).click();
  await page.getByRole("button", { name: /قيّم هذا المستوى/ }).click();
  await expect(page.getByRole("heading", { name: /نقطة البداية المقترحة/ })).toBeVisible();

  // نتيجة التشخيص قبل إضافة أي عينة: المرجع الذي يجب ألا يتغيّر.
  const before = await expect.poll(readDiagnostic).toMatchObject({ samples: [] }).then(() => readDiagnostic());
  expect(before.level).not.toBeNull();
  expect(before.score).not.toBeNull();

  const sampleCard = page.locator(".diagnostic-sample-card");
  await expect(sampleCard).toBeVisible();
  await expect(sampleCard.getByText(/لا يصحّحها البرنامج/)).toBeVisible();
  // الحد الأدنى شرط اكتمال: زر الحفظ معطّل قبل بلوغه.
  const saveButton = sampleCard.getByRole("button", { name: "احفظ العينة الكتابية" });
  await expect(saveButton).toBeDisabled();
  const sampleText = "Ich heiße Mila und ich wohne in Tunis. Ich lese gern und ich lerne Deutsch.";
  await sampleCard.locator("#diagnostic-sample-text").fill(sampleText);
  await expect(saveButton).toBeEnabled();
  await saveButton.click();
  await expect(sampleCard.getByText(/حُفظت العينة الكتابية/)).toBeVisible();

  // العينة تبقى بعد إعادة التحميل، ولا تضيف درجة ولا تغيّر نتيجة التشخيص.
  await page.reload();
  await page.goto("/progress");
  await expect(page.locator(".diagnostic-samples-section")).toBeVisible();
  await expect(page.locator(".sample-summary-list li")).toHaveCount(1);
  await expect(page.getByText(sampleText)).toBeVisible();

  const after = await expect.poll(readDiagnostic).toMatchObject({ samples: [{ kind: "writing", text: sampleText }] }).then(() => readDiagnostic());
  expect(after.score).toBe(before.score);
  expect(after.level).toBe(before.level);
  expect(after.answered).toBe(before.answered);
  expect(after.samples).toHaveLength(1);
  // لا حقل تقييم في العينة المحفوظة: لا درجة ولا تصحيح ولا مستوى مشتقًا.
  expect(Object.keys(after.samples[0])).not.toContain("score");
  expect(Object.keys(after.samples[0])).not.toContain("feedback");
  expect(Object.keys(after.samples[0])).not.toContain("estimatedLevel");
  expect(after.samples[0].wordCount).toBe(sampleText.trim().split(/\s+/u).length);
});

test("P0 tutor requires per-send consent, validates structured JSON, and deletes its local trace", async ({ page }) => {
  let networkRequests = 0;
  await page.route("**/v1beta/models/**", async (route) => {
    networkRequests += 1;
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ candidates: [{ content: { parts: [{ text: JSON.stringify({
        hintAr: "راقب موضع الفعل المصرف أولًا.",
        explanationAr: "بعد weil ينتقل الفعل المصرف إلى نهاية الجملة التابعة.",
        examplesDe: ["Ich lerne, weil ich in Berlin arbeiten möchte."],
        microExerciseAr: "كوّن جملة جديدة تشرح فيها سبب تعلمك الألمانية.",
      }) }] } }] }),
    });
  });
  await page.goto("/tutor");
  await waitForLearningReady(page);
  await page.evaluate((baseState) => new Promise<void>((resolve, reject) => {
    sessionStorage.setItem("dwnb-ai-key", "temporary-test-key");
    const state = structuredClone(baseState);
    state.aiSettings = { provider: "gemini", model: "gemini-2.5-flash", enabledFeatures: ["tutor"] };
    const open = indexedDB.open("der-weg-nach-berlin", 4);
    open.onerror = () => reject(open.error);
    open.onsuccess = () => {
      const transaction = open.result.transaction("learning-state", "readwrite");
      transaction.objectStore("learning-state").put(state, "primary");
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    };
  }), structuredClone(defaultState));
  await page.reload();
  await waitForLearningReady(page);
  await page.getByLabel("سؤال المرشد").fill("لماذا يأتي الفعل في النهاية بعد weil؟");
  await page.getByRole("button", { name: "إرسال السؤال" }).click();
  await expect(page.getByRole("dialog").getByRole("heading", { name: "موافقة مطلوبة قبل إرسال النص" })).toBeVisible();
  await expect(page.getByRole("dialog")).toContainText("لماذا يأتي الفعل في النهاية بعد weil؟");
  expect(networkRequests).toBe(0);
  await page.getByRole("button", { name: "أوافق وأرسل مرة واحدة" }).click();
  await expect(page.locator(".structured-tutor-answer")).toContainText("التلميح أولًا");
  await expect(page.locator(".structured-tutor-answer")).toContainText("tutor-v2");
  expect(networkRequests).toBe(1);
  await expect.poll(() => page.evaluate(() => new Promise<unknown>((resolve, reject) => {
    const open = indexedDB.open("der-weg-nach-berlin", 4);
    open.onerror = () => reject(open.error);
    open.onsuccess = () => {
      const request = open.result.transaction("learning-state", "readonly").objectStore("learning-state").get("primary");
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result.tutorInteractions[0]);
    };
  }))).toMatchObject({ provider: "gemini", model: "gemini-2.5-flash", promptVersion: "tutor-v2", consent: "explicit", lessonId: "a1-01" });

  await page.evaluate(() => new Promise<void>((resolve, reject) => {
    const open = indexedDB.open("der-weg-nach-berlin", 4);
    open.onerror = () => reject(open.error);
    open.onsuccess = () => {
      const db = open.result;
      const read = db.transaction("learning-state", "readonly").objectStore("learning-state").get("primary");
      read.onerror = () => reject(read.error);
      read.onsuccess = () => {
        const state = read.result;
        state.speakingAttempts.push({ id: "privacy-audio-attempt", taskId: "a1-01", mediaId: "privacy-audio", durationSeconds: 12, selfScore: 3, reflection: "local", createdAt: new Date().toISOString() });
        const transaction = db.transaction(["learning-state", "media"], "readwrite");
        transaction.objectStore("learning-state").put(state, "primary");
        transaction.objectStore("media").put(new Blob(["voice"], { type: "audio/webm" }), "privacy-audio");
        transaction.oncomplete = () => resolve();
        transaction.onerror = () => reject(transaction.error);
      };
    };
  }));

  await page.goto("/settings");
  await waitForLearningReady(page);
  await page.getByRole("button", { name: "حذف التسجيلات" }).click();
  await expect(page.getByRole("dialog").getByRole("heading", { name: "حذف التسجيلات الصوتية الآن؟" })).toBeVisible();
  await page.getByRole("button", { name: "نعم، احذف التسجيلات" }).click();
  await expect(page.getByText(/حُذفت فورًا 1 تسجيلات مرتبطة/)).toBeVisible();
  await page.getByRole("button", { name: "حذف سجل المعلم" }).click();
  await expect(page.getByRole("dialog").getByRole("heading", { name: "حذف سجل المرشد الآن؟" })).toBeVisible();
  await page.getByRole("button", { name: "نعم، احذف سجل المرشد" }).click();
  await expect(page.getByText(/حُذف فورًا سجل المرشد المحلي/)).toBeVisible();
  await page.getByRole("button", { name: "حذف المفتاح الآن" }).click();
  await expect(page.getByText(/حُذف المفتاح أو العنوان فورًا/)).toBeVisible();
  await expect.poll(() => page.evaluate(() => new Promise<unknown>((resolve, reject) => {
    const open = indexedDB.open("der-weg-nach-berlin", 4);
    open.onerror = () => reject(open.error);
    open.onsuccess = () => {
      const db = open.result;
      const transaction = db.transaction(["learning-state", "media"], "readonly");
      const stateRequest = transaction.objectStore("learning-state").get("primary");
      const mediaRequest = transaction.objectStore("media").get("privacy-audio");
      transaction.oncomplete = () => resolve({ history: stateRequest.result.tutorInteractions, key: sessionStorage.getItem("dwnb-ai-key"), media: mediaRequest.result, mediaId: stateRequest.result.speakingAttempts.find((attempt: { id: string }) => attempt.id === "privacy-audio-attempt")?.mediaId });
      transaction.onerror = () => reject(transaction.error);
    };
  }))).toEqual({ history: [], key: null, media: undefined, mediaId: undefined });
});

test("P0 daily check-in rebalances load and reflection stores tomorrow's decision", async ({ page }) => {
  await page.goto("/today");
  await waitForLearningReady(page);
  await page.evaluate((baseState) => new Promise<void>((resolve, reject) => {
    const open = indexedDB.open("der-weg-nach-berlin", 4);
    open.onerror = () => reject(open.error);
    open.onsuccess = () => {
      const state = structuredClone(baseState);
      state.profile = { name:"Nadia",targetExam:"goethe-b2",dailyMinutes:45,arabicSupport:"modern-standard-arabic",currentLevel:"A1",goals:["exam","work"],createdAt:new Date().toISOString() };
      state.diagnosticResult = { estimatedLevel:"A1",score:3,maxScore:4,levelScores:{A1:3,A2:0,B1:0,B2:0},completedAt:new Date().toISOString() };
      state.completedLessonIds = ["a1-01"];
      const transaction = open.result.transaction("learning-state", "readwrite");
      transaction.objectStore("learning-state").put(state, "primary");
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    };
  }), structuredClone(defaultState));
  await page.reload();
  await waitForLearningReady(page);
  await expect(page.getByText("نحو 45 دقيقة")).toBeVisible();

  const checkIn = page.locator(".session-signal-card").filter({ hasText:"تهيئة سريعة" });
  await checkIn.locator(".signal-scale button").first().click();
  await checkIn.getByRole("combobox").selectOption("60");
  await checkIn.getByRole("button", { name:/ثبّت تهيئة اليوم/ }).click();
  await expect(page.getByText("نحو 20 دقيقة")).toBeVisible();
  await expect(page.locator(".weekly-plan-day")).toHaveCount(7);
  await expect(page.locator(".weekly-plan-day.today")).toContainText("20 د");
  await expect(page.locator(".weekly-plan-card")).toContainText("كتابة مستقلة");
  await expect(page.locator(".weekly-plan-card")).toContainText("تدريب صيغة الامتحان");

  const reflectionCard = page.locator(".session-signal-card.reflection");
  await reflectionCard.locator(".signal-scale").nth(0).locator("button").nth(4).click();
  await reflectionCard.locator(".signal-scale").nth(1).locator("button").nth(1).click();
  await reflectionCard.getByRole("combobox").selectOption("lighter");
  await reflectionCard.getByRole("textbox").fill("الاستماع كان مرهقًا؛ أريد جلسة أخف غدًا.");
  await reflectionCard.getByRole("button", { name:/احفظ قرار الغد/ }).click();
  await expect(reflectionCard).toContainText("ابدأ بجلسة أخف");

  await expect.poll(() => page.evaluate(() => new Promise<unknown>((resolve, reject) => {
    const open = indexedDB.open("der-weg-nach-berlin", 4);
    open.onerror = () => reject(open.error);
    open.onsuccess = () => {
      const request = open.result.transaction("learning-state", "readonly").objectStore("learning-state").get("primary");
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(Object.values(request.result?.dailySessions ?? {})[0]);
    };
  }))).toMatchObject({ availableMinutes:60,energyBefore:1,difficultyAfter:5,confidenceAfter:2,nextFocus:"lighter" });
});

test("P0 clustered error clinic opens at three occurrences and stores a transfer attempt", async ({ page }) => {
  await page.goto("/errors");
  await waitForLearningReady(page);
  await page.evaluate((baseState) => new Promise<void>((resolve, reject) => {
    const open = indexedDB.open("der-weg-nach-berlin", 4);
    open.onerror = () => reject(open.error);
    open.onsuccess = () => {
      const state = structuredClone(baseState);
      state.errors = [{ id:"clinic-source",type:"word-order",wrong:"weil ich habe keine Zeit",correct:"weil ich keine Zeit habe",explanationAr:"الفعل في النهاية",occurrences:3,lastSeenAt:new Date().toISOString(),resolved:false,repairCount:0 }];
      const transaction = open.result.transaction("learning-state", "readwrite");
      transaction.objectStore("learning-state").put(state, "primary");
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    };
  }), structuredClone(defaultState));
  await page.reload();
  await waitForLearningReady(page);
  const clinic = page.locator(".error-clinic-card").filter({ hasText:"عيادة ترتيب الجملة" });
  await expect(clinic).toContainText("3 أدلة تكرار");
  await clinic.getByLabel("تمرين نقل عيادة ترتيب الجملة").fill("weil ich heute keine Zeit habe");
  await clinic.getByRole("button", { name:/تحقق من النقل/ }).click();
  await expect(clinic).toContainText("نجح تمرين النقل");
  await expect(clinic).toContainText("لا يغلق الأخطاء الفردية تلقائيًا");
  await expect.poll(() => page.evaluate(() => new Promise<unknown>((resolve, reject) => {
    const open = indexedDB.open("der-weg-nach-berlin", 4);
    open.onerror = () => reject(open.error);
    open.onsuccess = () => {
      const request = open.result.transaction("learning-state", "readonly").objectStore("learning-state").get("primary");
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve({ attempt:request.result?.errorClinicAttempts?.[0],resolved:request.result?.errors?.[0]?.resolved });
    };
  }))).toMatchObject({ attempt:{clinicType:"word-order",correct:true,sourceErrorIds:["clinic-source"]},resolved:false });
});

test("P0 writing lab enforces plan, draft, self-check, cited feedback, and revision", async ({ page }) => {
  await page.goto("/lernen/a1-01");
  await waitForLearningReady(page);
  for(let stage=0;stage<9;stage+=1)await page.getByRole("button",{name:/أكملت هذه الخطوة/}).click();
  await page.getByRole("link",{name:/افتح مختبر الكتابة/}).click();
  await expect(page).toHaveURL(/\/writing\?lesson=a1-01$/);
  await waitForLearningReady(page);
  await expect(page.locator(".writing-workflow > span")).toHaveCount(5);
  await page.getByLabel("لمن أكتب؟").fill("إدارة دورة اللغة");
  await page.getByLabel("ما النتيجة التي أريدها؟").fill("تقديم نفسي وبدء تواصل");
  await page.getByPlaceholder("النقطة 1").fill("تحية وتعارف");
  await page.getByPlaceholder("النقطة 2").fill("سؤالان واضحان");
  await page.getByRole("button", { name:/ابدأ المسودة/ }).click();
  const firstDraft="Guten Tag! Ich heiße Nadia und komme aus Tunesien. Ich lerne Deutsch in Berlin und arbeite heute im Büro. Wie heißen Sie? Wo wohnen Sie? Am Abend lerne ich mit meiner Freundin. Ich freue mich auf Ihre Antwort. Viele Grüße, Nadia.";
  await page.getByLabel("المسودة الألمانية").fill(firstDraft);
  await page.getByRole("button", { name:/حفظ المسودة والانتقال/ }).click();
  const selfCheck=page.locator(".writing-self-check");
  for(const checkbox of await selfCheck.locator('input[type="checkbox"]').all())await checkbox.check();
  await selfCheck.getByRole("button", { name:/شغّل الفحص المرتبط بنصي/ }).click();
  await expect(page.locator(".writing-dimensions article")).toHaveCount(5);
  await expect(page.locator(".feedback-box")).toContainText("«");
  // P0-256: ملخّص موجز يُقال مرة واحدة، لا اللوحة كاملة.
  const writingAnnouncer = page.locator(".writing-feedback .result-announcer");
  await expect(writingAnnouncer).toHaveAttribute("role", "status");
  await expect(writingAnnouncer).toHaveAttribute("aria-live", "polite");
  await expect(writingAnnouncer).toHaveAttribute("aria-atomic", "true");
  await expect(writingAnnouncer).toHaveText(/نتيجة فحص الكتابة: \d من 5 محاور مستوفاة/);
  await expect(page.locator(".writing-feedback [role=\"status\"]")).toHaveCount(1);
  await page.getByRole("button", { name:/ابدأ إعادة الكتابة/ }).click();
  await page.getByLabel("النسخة المنقحة").fill(`${firstDraft} Bis bald.`);
  await page.getByRole("button", { name:/حفظ النسخة المنقحة/ }).click();
  await expect(page.locator(".writing-reviewed-text")).toContainText("Bis bald");

  await expect.poll(() => page.evaluate(() => new Promise<unknown>((resolve, reject) => {
    const open=indexedDB.open("der-weg-nach-berlin",4);
    open.onerror=()=>reject(open.error);
    open.onsuccess=()=>{const request=open.result.transaction("learning-state","readonly").objectStore("learning-state").get("primary");request.onerror=()=>reject(request.error);request.onsuccess=()=>resolve(request.result?.writingSubmissions?.map((item:{status:string;sourceVersion?:number;dimensions?:unknown[];plan?:unknown})=>({status:item.status,sourceVersion:item.sourceVersion,dimensions:item.dimensions?.length,hasPlan:Boolean(item.plan)})))};
  }))).toEqual([{status:"draft",sourceVersion:undefined,dimensions:undefined,hasPlan:true},{status:"submitted",sourceVersion:undefined,dimensions:5,hasPlan:true},{status:"revised",sourceVersion:2,dimensions:5,hasPlan:true}]);
});

test("P0 speaking lab hides prompts during recording and requires playback before saving", async ({ page }) => {
  await page.addInitScript(() => {
    const fakeStream = { getTracks: () => [{ stop() {} }] };
    Object.defineProperty(navigator, "mediaDevices", { configurable:true, value:{ getUserMedia: async () => fakeStream } });
    class FakeMediaRecorder {
      state = "inactive";
      mimeType = "audio/webm";
      stream = fakeStream;
      ondataavailable: ((event:{data:Blob})=>void) | null = null;
      onstop: (()=>void) | null = null;
      start(){ this.state="recording"; }
      stop(){ this.state="inactive"; this.ondataavailable?.({data:new Blob(["fake-speaking-audio"],{type:this.mimeType})}); this.onstop?.(); }
    }
    Object.defineProperty(window, "MediaRecorder", { configurable:true, value:FakeMediaRecorder });
  });
  await page.goto("/speaking?lesson=a1-01");
  await waitForLearningReady(page);
  await expect(page.locator(".speaking-workflow > span")).toHaveCount(5);
  await page.getByPlaceholder("كلمة مفتاحية 1").fill("Name");
  await page.getByPlaceholder("كلمة مفتاحية 2").fill("Frage");
  await page.getByRole("button", { name:/أنهِ التحضير الآن/ }).click();
  await page.getByRole("button", { name:/ابدأ التسجيل/ }).click();
  await expect(page.locator(".prompt-chips")).toHaveCount(0);
  await expect(page.getByText(/التسجيل يعمل دون نموذج/)).toBeVisible();
  await page.getByRole("button", { name:/إيقاف/ }).click();
  const playback=page.getByLabel("تشغيل محاولة المحادثة");
  await expect(playback).toBeVisible();
  await playback.evaluate((audio)=>audio.dispatchEvent(new Event("ended")));
  await expect(page.getByText(/اكتمل الاستماع الذاتي/)).toBeVisible();
  for(const checkbox of await page.locator(".speaking-criteria input").all())await checkbox.check();
  await page.locator(".self-rubric .score-buttons button").nth(3).click();
  for(const checkbox of await page.locator(".speaking-review-check input").all())await checkbox.check();
  await page.getByPlaceholder(/توقفت قبل السؤال/).fill("سأحسن ترتيب السؤال في المحاولة التالية.");
  await page.getByRole("button", { name:/حفظ الدليل بعد الاستماع/ }).click();
  await expect(page.getByText(/حُفظت المحاولة والمراجعة الذاتية محليًا/)).toBeVisible();
  // P0-256: إعلان موجز بالمدة والمعايير المؤكَّدة ذاتيًا، مع حدّ «لا تقييم آلي للنطق».
  const speakingAnnouncer = page.locator(".lab-page .result-announcer");
  await expect(speakingAnnouncer).toHaveAttribute("aria-live", "polite");
  await expect(speakingAnnouncer).toHaveText(/حُفظ التسجيل: \d+ ثانية، وأكدت \d+ من \d+ معايير بنفسك\. لا تقييم آلي للنطق أو الطلاقة\./);
  await expect.poll(() => page.evaluate(() => new Promise<unknown>((resolve, reject) => {
    const open=indexedDB.open("der-weg-nach-berlin",4);
    open.onerror=()=>reject(open.error);
    open.onsuccess=()=>{const request=open.result.transaction("learning-state","readonly").objectStore("learning-state").get("primary");request.onerror=()=>reject(request.error);request.onsuccess=()=>resolve(request.result?.speakingAttempts?.[0])};
  }))).toMatchObject({taskId:"a1-01",targetSeconds:30,selfScore:4,selfReview:{listenedBack:true,clarityScore:4,turnTaking:true,repairUsed:true,preparationNotes:["Name","Frage"]}});
  await page.getByRole("button", { name:/ابدأ محاولة محسنة/ }).click();
  await expect(page.getByText(/تحضير بكلمات مفتاحية فقط/)).toBeVisible();
});

test("P0 mediation lab enforces source analysis, transfer, self-check, comparison, and revision", async ({ page }) => {
  await page.goto("/mediation?lesson=a1-01");
  await waitForLearningReady(page);
  await expect(page.locator(".mediation-workflow > span")).toHaveCount(5);
  await page.getByLabel("من هو المتلقي؟").fill("صديق يريد التسجيل");
  await page.getByLabel("ماذا يجب أن يستطيع فعله بعد الشرح؟").fill("يفهم السؤال ويكتب اسمه");
  await page.getByPlaceholder("حقيقة 1").fill("السؤال عن الاسم رسمي");
  await page.getByPlaceholder("حقيقة 2").fill("يجب كتابة الاسم هنا");
  await page.getByRole("button", { name:/ابدأ النقل الأول/ }).click();
  const firstTransfer="المعلمة تسأل عن الاسم بصيغة رسمية، ثم تطلب من صديقي أن يكتب اسمه في المكان المحدد.";
  await page.getByLabel("الشرح العربي").fill(firstTransfer);
  await page.getByLabel("الاستجابة الألمانية القصيرة").fill("Ich heiße Nadia. Danke schön.");
  await page.getByRole("button", { name:/حفظ النقل الأول/ }).click();
  for(const checkbox of await page.locator(".mediation-self-check input").all())await checkbox.check();
  await page.getByRole("button", { name:/افحص الوساطة/ }).click();
  await expect(page.locator(".mediation-dimensions article")).toHaveCount(5);
  await expect(page.getByText(/اقتراح للمقارنة بعد المحاولة/)).toBeVisible();
  await page.getByRole("button", { name:/ابدأ صياغة محسنة/ }).click();
  await page.getByLabel("الشرح العربي").fill(`${firstTransfer} ويمكنه أن يجيب باسمه مباشرة.`);
  await page.getByRole("button", { name:/حفظ الصياغة المحسنة/ }).click();
  await expect(page.locator(".mediation-reviewed")).toContainText("يجيب باسمه مباشرة");
  await expect.poll(() => page.evaluate(() => new Promise<unknown>((resolve, reject) => {
    const open=indexedDB.open("der-weg-nach-berlin",4);open.onerror=()=>reject(open.error);open.onsuccess=()=>{const request=open.result.transaction("learning-state","readonly").objectStore("learning-state").get("primary");request.onerror=()=>reject(request.error);request.onsuccess=()=>resolve(request.result?.mediationSubmissions?.map((item:{status:string;sourceVersion?:number;dimensions?:unknown[]})=>({status:item.status,sourceVersion:item.sourceVersion,dimensions:item.dimensions?.length})))};
  }))).toEqual([{status:"draft",sourceVersion:undefined,dimensions:undefined},{status:"submitted",sourceVersion:undefined,dimensions:5},{status:"revised",sourceVersion:2,dimensions:5}]);
});

test("generated library audio exposes provenance, playback, and Browser TTS fallback", async ({ page }) => {
  await page.goto("/library#lib-l-a1-01");
  const item = page.locator("#lib-l-a1-01");
  await expect(item).toHaveAttribute("open", "");
  await expect(item.getByText("ملف صوت اصطناعي مولّد للمشروع")).toBeVisible();
  const audio = item.getByLabel("تشغيل مواعيد الفتح");
  await expect(audio).toHaveAttribute("src", "/audio/library/lib-l-a1-01.mp3");
  await expect(item.getByRole("button", { name: /بديل Browser TTS/ })).toBeVisible();
  await item.getByText(/مصدر وحقوق الاستخدام/).click();
  await expect(item).toContainText("ليس تسجيلًا بشريًا أو صوت امتحان رسمي");
  const response = await page.request.get("/audio/library/lib-l-a1-01.mp3");
  expect(response.ok()).toBe(true);
  expect(response.headers()["content-type"]).toContain("audio/mpeg");
  const secondBatch = await page.request.get("/audio/library/lib-l-b2-04.mp3");
  expect(secondBatch.ok()).toBe(true);
  const thirdBatch = await page.request.get("/audio/library/lib-l-b2-06.mp3");
  expect(thirdBatch.ok()).toBe(true);
  const fourthBatch = await page.request.get("/audio/library/lib-l-b2-08.mp3");
  expect(fourthBatch.ok()).toBe(true);
  const fifthBatch = await page.request.get("/audio/library/lib-l-b2-10.mp3");
  expect(fifthBatch.ok()).toBe(true);
  const sixthBatch = await page.request.get("/audio/library/lib-l-b2-12.mp3");
  expect(sixthBatch.ok()).toBe(true);
  const seventhBatch = await page.request.get("/audio/library/lib-l-b2-14.mp3");
  expect(seventhBatch.ok()).toBe(true);
  const eighthBatch = await page.request.get("/audio/library/lib-l-b2-16.mp3");
  expect(eighthBatch.ok()).toBe(true);
  const manifest = await (await page.request.get("/audio/library/manifest.json")).json();
  expect(manifest.generatedAssetCount).toBe(80);
});

test("generated exam clips play with limits, provenance labels, and TTS fallback", async ({ page }) => {
  await page.goto("/exams/goethe-b2/goethe-b2-listening-01");
  await page.getByRole("button", { name: "ابدأ التدريب" }).click();
  const clips = page.locator(".listening-clip-stack > section");
  await expect(clips).toHaveCount(5);
  await expect(clips.first()).toContainText("MP3 مولّد");
  await expect(clips.first().getByRole("button", { name: "TTS بديل" })).toBeVisible();
  await clips.first().getByRole("button", { name: "تشغيل MP3" }).click();
  await expect(clips.first()).toContainText("التشغيل 1/1");
  const manifest = await (await page.request.get("/audio/exams/manifest.json")).json();
  expect(manifest.version).toBe(2);
  expect(manifest.generatedAssetCount).toBe(96);
  expect(manifest.coveredClipCount).toBe(90);
  expect(manifest.fullyCoveredTaskCount).toBe(42);
  expect(manifest.completeTargetedTaskCount).toBe(7);
  expect(manifest.completeFullSimulationTaskCount).toBe(35);
  expect(manifest.partiallyCoveredTaskCount).toBe(0);
  expect(manifest.taskCoverage).toHaveLength(42);
  expect(manifest.taskCoverage.filter((task: { scope: string }) => task.scope === "full-simulation")).toHaveLength(35);
  expect(manifest.taskCoverage.every((task: { status: string }) => task.status === "complete")).toBe(true);
  expect((await page.request.get("/audio/exams/goethe-h1-clip-5.mp3")).ok()).toBe(true);
  expect((await page.request.get("/audio/exams/telc-h2-mobility-dialogue-seg-2.mp3")).ok()).toBe(true);
  expect((await page.request.get("/audio/exams/goethe-h4-wayfinding-lecture-seg-3.mp3")).ok()).toBe(true);
  expect((await page.request.get("/audio/exams/g2-h1-5.mp3")).ok()).toBe(true);
  expect((await page.request.get("/audio/exams/g2-h4-seg-2.mp3")).ok()).toBe(true);
  expect((await page.request.get("/audio/exams/t2-h1.mp3")).ok()).toBe(true);
  expect((await page.request.get("/audio/exams/t2-h2.mp3")).ok()).toBe(true);
  expect((await page.request.get("/audio/exams/t2-h3-5.mp3")).ok()).toBe(true);
  expect((await page.request.get("/audio/exams/g3-h4.mp3")).ok()).toBe(true);
  expect((await page.request.get("/audio/exams/t3-h1.mp3")).ok()).toBe(true);
  expect((await page.request.get("/audio/exams/t3-h2.mp3")).ok()).toBe(true);
  expect((await page.request.get("/audio/exams/t3-h3-5.mp3")).ok()).toBe(true);
  expect((await page.request.get("/audio/exams/g3-h1-4.mp3")).ok()).toBe(true);
  expect((await page.request.get("/audio/exams/g3-h1-5.mp3")).ok()).toBe(true);
  expect((await page.request.get("/audio/exams/g4-h1-5.mp3")).ok()).toBe(true);
  expect((await page.request.get("/audio/exams/g4-h4.mp3")).ok()).toBe(true);
  expect((await page.request.get("/audio/exams/t4-h1.mp3")).ok()).toBe(true);
  expect((await page.request.get("/audio/exams/t4-h2.mp3")).ok()).toBe(true);
  expect((await page.request.get("/audio/exams/t4-h3-5.mp3")).ok()).toBe(true);
  expect((await page.request.get("/audio/exams/g5-h4.mp3")).ok()).toBe(true);
  expect((await page.request.get("/audio/exams/t5-h1.mp3")).ok()).toBe(true);
  expect((await page.request.get("/audio/exams/t5-h2.mp3")).ok()).toBe(true);
  expect((await page.request.get("/audio/exams/t5-h3-5.mp3")).ok()).toBe(true);
  expect((await page.request.get("/audio/exams/g5-h1-4.mp3")).ok()).toBe(true);
  expect((await page.request.get("/audio/exams/g5-h1-5.mp3")).ok()).toBe(true);
  expect((await page.request.get("/audio/exams/g6-h1-5.mp3")).ok()).toBe(true);
  expect((await page.request.get("/audio/exams/g6-h4.mp3")).ok()).toBe(true);
  expect((await page.request.get("/audio/exams/t6-h1.mp3")).ok()).toBe(true);
  expect((await page.request.get("/audio/exams/t6-h2.mp3")).ok()).toBe(true);
  expect((await page.request.get("/audio/exams/t6-h3-5.mp3")).ok()).toBe(true);

  await page.goto("/exams/goethe-b2/goethe-b2-listening-04");
  await page.getByRole("button", { name: "ابدأ التدريب" }).click();
  const segmentedClip = page.locator(".listening-clip-stack > section").first();
  await expect(segmentedClip).toContainText("3 مقاطع متسلسلة");
  await segmentedClip.getByRole("button", { name: "تشغيل MP3" }).click();
  await expect(segmentedClip).toContainText("التشغيل 1/2");

  await page.goto("/exams/goethe-b2/goethe-b2-full-02-listening-04");
  await page.getByRole("button", { name: "ابدأ التدريب" }).click();
  const fullSimulationClip = page.locator(".listening-clip-stack > section").first();
  await expect(fullSimulationClip).toContainText("MP3 مولّد · 2 مقاطع متسلسلة");
  await fullSimulationClip.getByRole("button", { name: "تشغيل MP3" }).click();
  await expect(fullSimulationClip).toContainText("التشغيل 1/2");

  await page.goto("/exams/telc-deutsch-b2/telc-b2-full-02-listening-03");
  await page.getByRole("button", { name: "ابدأ التدريب" }).click();
  const completedTelcClips = page.locator(".listening-clip-stack > section");
  await expect(completedTelcClips).toHaveCount(5);
  await expect(completedTelcClips.first()).toContainText("MP3 مولّد");
  await completedTelcClips.first().getByRole("button", { name: "تشغيل MP3" }).click();
  await expect(completedTelcClips.first()).toContainText("التشغيل 1/1");

  await page.goto("/exams/goethe-b2/goethe-b2-full-03-listening-04");
  await page.getByRole("button", { name: "ابدأ التدريب" }).click();
  await expect(page.locator(".listening-clip-stack > section").first()).toContainText("MP3 مولّد");

  await page.goto("/exams/goethe-b2/goethe-b2-full-03-listening-01");
  await page.getByRole("button", { name: "ابدأ التدريب" }).click();
  const completedFull03Clips = page.locator(".listening-clip-stack > section");
  await expect(completedFull03Clips).toHaveCount(5);
  await expect(completedFull03Clips.first()).toContainText("MP3 مولّد");
  await expect(completedFull03Clips.last()).toContainText("MP3 مولّد");

  await page.goto("/exams/goethe-b2/goethe-b2-full-04-listening-01");
  await page.getByRole("button", { name: "ابدأ التدريب" }).click();
  const full04GoetheClips = page.locator(".listening-clip-stack > section");
  await expect(full04GoetheClips).toHaveCount(5);
  await expect(full04GoetheClips.first()).toContainText("MP3 مولّد");
  await expect(full04GoetheClips.last()).toContainText("MP3 مولّد");

  await page.goto("/exams/telc-deutsch-b2/telc-b2-full-04-listening-02");
  await page.getByRole("button", { name: "ابدأ التدريب" }).click();
  await expect(page.locator(".listening-clip-stack > section").first()).toContainText("MP3 مولّد");

  await page.goto("/exams/telc-deutsch-b2/telc-b2-full-04-listening-03");
  await page.getByRole("button", { name: "ابدأ التدريب" }).click();
  await expect(page.locator(".listening-clip-stack > section").last()).toContainText("MP3 مولّد");

  await page.goto("/exams/goethe-b2/goethe-b2-full-05-listening-04");
  await page.getByRole("button", { name: "ابدأ التدريب" }).click();
  await expect(page.locator(".listening-clip-stack > section").first()).toContainText("MP3 مولّد");

  await page.goto("/exams/goethe-b2/goethe-b2-full-05-listening-01");
  await page.getByRole("button", { name: "ابدأ التدريب" }).click();
  const completedFull05Clips = page.locator(".listening-clip-stack > section");
  await expect(completedFull05Clips).toHaveCount(5);
  await expect(completedFull05Clips.first()).toContainText("MP3 مولّد");
  await expect(completedFull05Clips.last()).toContainText("MP3 مولّد");

  await page.goto("/exams/telc-deutsch-b2/telc-b2-full-05-listening-02");
  await page.getByRole("button", { name: "ابدأ التدريب" }).click();
  await expect(page.locator(".listening-clip-stack > section").first()).toContainText("MP3 مولّد");

  await page.goto("/exams/telc-deutsch-b2/telc-b2-full-05-listening-03");
  await page.getByRole("button", { name: "ابدأ التدريب" }).click();
  await expect(page.locator(".listening-clip-stack > section").last()).toContainText("MP3 مولّد");

  await page.goto("/exams/goethe-b2/goethe-b2-full-06-listening-01");
  await page.getByRole("button", { name: "ابدأ التدريب" }).click();
  const full06GoetheClips = page.locator(".listening-clip-stack > section");
  await expect(full06GoetheClips).toHaveCount(5);
  await expect(full06GoetheClips.first()).toContainText("MP3 مولّد");
  await expect(full06GoetheClips.last()).toContainText("MP3 مولّد");

  await page.goto("/exams/telc-deutsch-b2/telc-b2-full-06-listening-01");
  await page.getByRole("button", { name: "ابدأ التدريب" }).click();
  await expect(page.locator(".listening-clip-stack > section").first()).toContainText("MP3 مولّد");

  await page.goto("/exams/telc-deutsch-b2/telc-b2-full-06-listening-02");
  await page.getByRole("button", { name: "ابدأ التدريب" }).click();
  await expect(page.locator(".listening-clip-stack > section").first()).toContainText("MP3 مولّد");

  await page.goto("/exams/telc-deutsch-b2/telc-b2-full-06-listening-03");
  await page.getByRole("button", { name: "ابدأ التدريب" }).click();
  const finalExamClips = page.locator(".listening-clip-stack > section");
  await expect(finalExamClips).toHaveCount(5);
  await expect(finalExamClips.first()).toContainText("MP3 مولّد");
  await expect(finalExamClips.last()).toContainText("MP3 مولّد");
});

test("shadowing studio uses generated audio, speed controls, and delayed transcript", async ({ page }) => {
  await page.goto("/shadowing");
  await expect(page.getByRole("heading", { name: /اسمع، جزّئ/ })).toBeVisible();
  await expect(page.getByText("80", { exact: true })).toBeVisible();
  const model = page.getByLabel(/نموذج/);
  await expect(model).toHaveAttribute("src", /\/audio\/library\/lib-l-/);
  await page.getByRole("button", { name: "0.75×" }).click();
  expect(await model.evaluate((audio: HTMLAudioElement) => audio.playbackRate)).toBe(0.75);
  await expect(page.locator(".shadowing-transcript")).toHaveCount(0);
  await page.getByRole("button", { name: /إظهار النص بعد المحاولة/ }).click();
  await expect(page.locator(".shadowing-transcript")).toBeVisible();
  await page.getByRole("button", { name: "B2", exact: true }).click();
  await expect(page.locator(".shadowing-picker select option")).toHaveCount(16);
  await expect(page.getByText(/لا يدّعي التطبيق قياس النطق/)).toBeVisible();
});

test("a complete lesson run traverses all 14 stages and persists completion", async ({ page }) => {
  await page.goto("/lernen/a1-01");
  await waitForLearningReady(page);
  const lessonAudioManifest = await (await page.request.get("/audio/lessons/manifest.json")).json();
  expect(lessonAudioManifest.generatedAssetCount).toBe(84);
  expect((await page.request.get("/audio/lessons/a1-20.mp3")).ok()).toBe(true);
  expect((await page.request.get("/audio/lessons/a2-06.mp3")).ok()).toBe(true);
  expect((await page.request.get("/audio/lessons/a2-16.mp3")).ok()).toBe(true);
  expect((await page.request.get("/audio/lessons/b1-02.mp3")).ok()).toBe(true);
  expect((await page.request.get("/audio/lessons/b1-12.mp3")).ok()).toBe(true);
  expect((await page.request.get("/audio/lessons/b1-22.mp3")).ok()).toBe(true);
  expect((await page.request.get("/audio/lessons/b2-08.mp3")).ok()).toBe(true);
  expect((await page.request.get("/audio/lessons/b2-12.mp3")).ok()).toBe(true);

  const lesson = academicLessons["a1-01"];
  const stageNames = [
    "أهداف اليوم",
    "موقف البداية",
    "العبارات",
    "اكتشف النمط",
    "القاعدة والمقارنة",
    "تدريب موجّه",
    "القراءة",
    "الاستماع",
    "النطق",
    "الكتابة",
    "المحادثة",
    "الوساطة",
    "عيادة الأخطاء",
    "الاختبار والخطة",
  ];

  for (let index = 0; index < stageNames.length; index += 1) {
    await expect(page.getByText(`المرحلة ${index + 1} من 14`, { exact: false })).toBeVisible();
    await expect(page.locator(".lesson-workspace h1")).toContainText(stageNames[index]);
    if (index === 2) {
      await page.getByRole("button", { name: "استرجاع دون كشف" }).click();
      const firstRecall = page.locator(".phrase-recall-grid article").first();
      await firstRecall.getByRole("button", { name: /اكشف بعد الإجابة/ }).click();
      await firstRecall.getByRole("button", { name: "تذكرت" }).click();
      await page.getByText("خريطة تريكات الحفظ في هذا الدرس").click();
      await expect(page.locator(".lesson-memory-map article").first()).toBeVisible();
      const lexicalPanel = page.locator(".lexical-grammar-panel");
      await expect(lexicalPanel.locator(".noun-grammar-grid > article")).toHaveCount(4);
      await expect(lexicalPanel).toContainText("der Name");
      await expect(lexicalPanel).toContainText("die Namen");
      await expect(lexicalPanel).toContainText("nach dem Namen fragen");
      await lexicalPanel.locator("details").first().getByText(/Kasusformen ansehen/).click();
      await expect(lexicalPanel.locator("details").first()).toContainText("den Namen");
    }
    if (index === 5) {
      const multipleChoice = lesson.exercises.find((exercise) => exercise.type === "multiple-choice")!;
      const wrongIndex = multipleChoice.correctIndex === 0 ? 1 : 0;
      const card = page.locator(`.exercise-card[data-exercise-id="${multipleChoice.id}"]`);
      await expect(card.locator(".exercise-german-stem")).toContainText("heiße Mariam");
      await expect(card).not.toContainText(multipleChoice.id);
      const finalBlank=page.locator('.exercise-card[data-exercise-id="a1-01-e7"]');
      await expect(finalBlank.locator(".fill-sentence")).toContainText("Danke,");
      await expect(finalBlank.locator(".blank-slot")).toHaveText("?");
      await expect(finalBlank.getByLabel(/جواب تمرين: أكمل الرد/)).toBeVisible();
      await card.getByRole("button", { name: "تلميح", exact: true }).click();
      await expect(card.locator(".hint-panel")).toContainText("تلميح 1/2");
      await expect(card.locator(".exercise-feedback")).toHaveCount(0);
      await card.locator(".exercise-options button").filter({ hasText: multipleChoice.options[wrongIndex] }).click();
      await card.getByRole("button", { name: "تحقق" }).click();
      await expect(card).toHaveClass(/wrong/);
      await expect.poll(() => page.evaluate((exerciseId) => new Promise<unknown>((resolve, reject) => {
        const open=indexedDB.open("der-weg-nach-berlin",4);open.onerror=()=>reject(open.error);open.onsuccess=()=>{const request=open.result.transaction("learning-state","readonly").objectStore("learning-state").get("primary");request.onerror=()=>reject(request.error);request.onsuccess=()=>{const attempt=request.result.exerciseAttempts.filter((item:{exerciseId:string})=>item.exerciseId===exerciseId).at(-1);resolve({answerIndex:attempt?.answerIndex,shuffleSeed:attempt?.shuffleSeed,shuffleVersion:attempt?.shuffleVersion});};};
      }), multipleChoice.id)).toEqual({answerIndex:wrongIndex,shuffleSeed:multipleChoice.id,shuffleVersion:"lesson-shuffle-v1"});
    }
    if (index === 6) {
      await expect(page.locator(".reading-support-lock")).toContainText("القاموس والترجمة مؤجلان");
      await expect(page.locator(".glossary-strip")).toHaveCount(0);
      const readingQuestion = page.locator(".question-stack .quiz-item").first();
      await readingQuestion.getByRole("button", { name: "تلميح قبل الإجابة" }).click();
      await expect(readingQuestion.locator(".hint-panel")).toContainText("فكرة عامة أم تفصيلًا أم سببًا");
      await readingQuestion.locator(".quiz-options button").filter({ hasText: lesson.reading.questions[0].options[lesson.reading.questions[0].correctIndex] }).click();
      await readingQuestion.getByRole("button", { name: "تحقق" }).click();
      // P0-124: موضع الدليل معروض من جدول مؤلف، لا من مطابقة لفظية آلية.
      const authoredEvidence = readingEvidenceByQuestionId[lesson.reading.questions[0].id];
      await expect(readingQuestion.locator(".question-evidence q")).toHaveText(authoredEvidence.quote);
      await expect(readingQuestion.locator(".question-evidence")).toContainText(authoredEvidence.whyAr);
      await expect(readingQuestion.locator(".question-evidence small")).toContainText("موضع الدليل من النص");
      await expect(page.locator(".glossary-strip")).toBeVisible();
      await expect(page.locator(".reading-support-lock")).toHaveCount(0);
    }
    if (index === 7) {
      await expect(page.getByLabel(`استماع درس ${lesson.titleAr}`)).toHaveAttribute("src", "/audio/lessons/a1-01.mp3");
      await expect(page.getByRole("button", { name: /بديل Browser TTS/ })).toBeVisible();
    }
    if (index < stageNames.length - 1) {
      await page.getByRole("button", { name: /أكملت هذه الخطوة/ }).click();
    }
  }

  await expect(page.getByRole("button", { name: /الإكمال مقفول بالدليل/ })).toBeDisabled();
  await expect(page.locator(".lesson-evidence-gate")).toContainText("0/4");

  const controlledRequired = Math.ceil(lesson.exercises.length * 0.7);
  const miniTestRequired = Math.ceil(lesson.miniTest.length * 0.8);
  const evidenceIds = [
    ...lesson.exercises.slice(0, controlledRequired).map((exercise) => exercise.id),
    lesson.reading.questions[0].id,
    lesson.listening.questions[0].id,
    ...lesson.miniTest.slice(0, miniTestRequired).map((question) => question.id),
  ];
  await page.evaluate(({ lessonId, evidenceIds }) => new Promise<void>((resolve, reject) => {
    const open = indexedDB.open("der-weg-nach-berlin", 4);
    open.onerror = () => reject(open.error);
    open.onsuccess = () => {
      const transaction = open.result.transaction("learning-state", "readwrite");
      const store = transaction.objectStore("learning-state");
      const request = store.get("primary");
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const state = request.result;
        const now = new Date().toISOString();
        state.exerciseAttempts = [...state.exerciseAttempts, ...evidenceIds.map((exerciseId: string) => ({
          id: `attempt-${crypto.randomUUID()}`,
          lessonId,
          exerciseId,
          answer: "e2e-correct",
          correct: true,
          createdAt: now,
        }))];
        store.put(state, "primary");
      };
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    };
  }), { lessonId: lesson.id, evidenceIds });

  await page.reload();
  await waitForLearningReady(page);
  await expect(page.locator(".lesson-evidence-gate.passed")).toContainText("4/4");
  await page.getByRole("link", { name: /إنهاء وتحديث الخطة/ }).click();
  await expect(page).toHaveURL(/\/lernen\/a1-02$/);
  await expect.poll(() => page.evaluate(() => new Promise<boolean>((resolve, reject) => {
    const open = indexedDB.open("der-weg-nach-berlin", 4);
    open.onerror = () => reject(open.error);
    open.onsuccess = () => {
      const request = open.result.transaction("learning-state", "readonly").objectStore("learning-state").get("primary");
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const value = request.result as { completedLessonIds?: string[] } | undefined;
        resolve(Boolean(value?.completedLessonIds?.includes("a1-01")));
      };
    };
  }))).toBe(true);

  const recordedExercise = lesson.exercises.find((exercise) => exercise.type === "multiple-choice")!;
  await page.goto("/errors");
  const personalError = page.locator(".personal-errors article").filter({ hasText: recordedExercise.explanationAr });
  await expect(personalError).toBeVisible();
  await expect(personalError.getByText("التصحيح مخفي حتى المحاولة")).toBeVisible();
  await personalError.locator("input").fill(recordedExercise.options[recordedExercise.correctIndex]);
  await personalError.getByRole("button", { name: /تحقق من العلاج/ }).click();
  await expect(personalError.locator(".repair-pending")).toBeVisible();
  await expect(personalError).not.toHaveClass(/resolved/);
  const errorId = `lesson-error:${lesson.id}:${recordedExercise.id}`;
  await expect.poll(() => page.evaluate((id) => new Promise<boolean>((resolve, reject) => {
    const open = indexedDB.open("der-weg-nach-berlin", 4);
    open.onerror = () => reject(open.error);
    open.onsuccess = () => {
      const request = open.result.transaction("learning-state", "readonly").objectStore("learning-state").get("primary");
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(Boolean(request.result.errors.find((error: {id:string;nextReviewAt?:string}) => error.id === id)?.nextReviewAt));
    };
  }), errorId)).toBe(true);
  await page.evaluate((id) => new Promise<void>((resolve, reject) => {
    const open = indexedDB.open("der-weg-nach-berlin", 4);
    open.onerror = () => reject(open.error);
    open.onsuccess = () => {
      const transaction = open.result.transaction("learning-state", "readwrite");
      const store = transaction.objectStore("learning-state");
      const request = store.get("primary");
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const state = request.result;
        state.errors = state.errors.map((error: {id:string}) => error.id === id ? {...error,nextReviewAt:new Date(Date.now()-60_000).toISOString()} : error);
        store.put(state,"primary");
      };
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    };
  }), errorId);
  await page.reload();
  await waitForLearningReady(page);
  const dueError = page.locator(".personal-errors article").filter({ hasText: recordedExercise.explanationAr });
  await expect(dueError.getByText("التصحيح مخفي حتى المحاولة")).toBeVisible();
  await expect(dueError).toContainText("اختبار مؤجل");
  await dueError.locator("input").fill(recordedExercise.options[recordedExercise.correctIndex]);
  await dueError.getByRole("button", { name: /تحقق من العلاج/ }).click();
  await expect(dueError).toHaveClass(/resolved/);
  await expect(dueError).toContainText(recordedExercise.options[recordedExercise.correctIndex]);

  await page.goto("/review");
  await waitForLearningReady(page);
  const dueBefore = Number(await page.locator(".review-count strong").textContent());
  expect(dueBefore).toBeGreaterThanOrEqual(16);
  expect(dueBefore).toBeLessThanOrEqual(24);
  await expect(page.locator(".review-card-meta")).toContainText("a1-01");
  const masteryBeforeFirstReview = await page.evaluate(() => new Promise<number>((resolve, reject) => {
    const open = indexedDB.open("der-weg-nach-berlin", 4);
    open.onerror = () => reject(open.error);
    open.onsuccess = () => {
      const request = open.result.transaction("learning-state", "readonly").objectStore("learning-state").get("primary");
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result.mastery["a1-01"] ?? 0);
    };
  }));
  await page.locator(".flashcard").click();
  await page.getByRole("button", { name: /سهل/ }).click();
  await expect(page.locator(".review-count strong")).toHaveText(String(dueBefore - 1));
  await expect(page.locator(".review-card-meta")).toContainText("a1-01");
  const firstReview = await page.evaluate(() => new Promise<{cardId:string;kind:string;delta:number;mastery:number;algorithmVersion:string;calendarPolicyVersion:string;calendarTimeZone:string}>((resolve, reject) => {
    const open = indexedDB.open("der-weg-nach-berlin", 4);
    open.onerror = () => reject(open.error);
    open.onsuccess = () => {
      const request = open.result.transaction("learning-state", "readonly").objectStore("learning-state").get("primary");
      request.onerror = () => reject(request.error);
      request.onsuccess = () => { const state=request.result; const event=state.reviewEvents.at(-1); const review=state.reviewItems.find((item:{cardId:string})=>item.cardId===event.cardId); resolve({cardId:event.cardId,kind:event.evidenceKind,delta:event.masteryDelta,mastery:state.mastery["a1-01"]??0,algorithmVersion:review.algorithmVersion,calendarPolicyVersion:event.calendarPolicyVersion,calendarTimeZone:event.calendarTimeZone}); };
    };
  }));
  expect(firstReview).toMatchObject({ kind:"initial",delta:0,mastery:masteryBeforeFirstReview,algorithmVersion:"sm2-v2-calendar",calendarPolicyVersion:"review-calendar-v1",calendarTimeZone:expect.any(String) });

  await page.evaluate((cardId) => new Promise<void>((resolve, reject) => {
    const open = indexedDB.open("der-weg-nach-berlin", 4);
    open.onerror = () => reject(open.error);
    open.onsuccess = () => {
      const db=open.result; const read=db.transaction("learning-state","readonly").objectStore("learning-state").get("primary");
      read.onerror=()=>reject(read.error);
      read.onsuccess=()=>{const state=read.result;state.reviewItems=state.reviewItems.map((item:{cardId:string})=>item.cardId===cardId?{...item,nextReviewDate:new Date(Date.now()-60_000).toISOString()}:item);const tx=db.transaction("learning-state","readwrite");tx.objectStore("learning-state").put(state,"primary");tx.oncomplete=()=>resolve();tx.onerror=()=>reject(tx.error);};
    };
  }), firstReview.cardId);
  await page.reload();
  await waitForLearningReady(page);
  await page.locator(".flashcard").click();
  await page.getByRole("button", { name: /سهل/ }).click();
  await expect(page.locator(".retention-evidence-strip")).toContainText("1");
  await expect.poll(() => page.evaluate(() => new Promise<unknown>((resolve, reject) => {
    const open=indexedDB.open("der-weg-nach-berlin",4);open.onerror=()=>reject(open.error);open.onsuccess=()=>{const request=open.result.transaction("learning-state","readonly").objectStore("learning-state").get("primary");request.onerror=()=>reject(request.error);request.onsuccess=()=>{const state=request.result;const event=state.reviewEvents.at(-1);resolve({kind:event.evidenceKind,delta:event.masteryDelta,mastery:state.mastery["a1-01"]});};};
  }))).toEqual({kind:"delayed",delta:4,mastery:Math.min(100,masteryBeforeFirstReview+4)});
});

test("settings exports an encrypted DWNB archive and imports it as an isolated profile", async ({ page }) => {
  await page.goto("/settings");
  await waitForLearningReady(page);
  await expect(page.getByRole("heading", { name: /الإعدادات/ })).toBeVisible();
  await expect(page.getByText("تضمين التسجيلات الصوتية في ملف النسخة")).toBeVisible();
  await expect(page.getByText(/حارس التكلفة: 0 USD مسموح/)).toBeVisible();
  await expect(page.getByRole("button", { name: /استعادة ما قبل آخر استيراد/ })).toBeVisible();

  const passphrase = page.getByPlaceholder("8 أحرف على الأقل — لا تُحفظ");
  await passphrase.fill("Berlin-2026!");
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: /تصدير \.dwnb/ }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toMatch(/^der-weg-backup-\d{4}-\d{2}-\d{2}\.dwnb$/);
  const archivePath = await download.path();
  expect(archivePath).toBeTruthy();

  await page.locator('input[type="file"]').setInputFiles(archivePath!);
  const preview = page.locator(".import-preview");
  await expect(preview.getByText("معاينة النسخة قبل التنفيذ")).toBeVisible();
  await expect(preview).toContainText("مشفرة · DWNB v3");
  await preview.getByRole("button", { name: /ملف جديد/ }).click();
  await preview.getByRole("button", { name: "تأكيد إنشاء الملف" }).click();

  await expect(page.getByText(/تم إنشاء ملف شخصي مستقل/)).toBeVisible();
  await expect(page.locator(".profile-row")).toHaveCount(2);
  await expect.poll(() => readActiveProfileId(page)).toMatch(/^profile-/);
});

test("a previously loaded library survives a real offline reload", async ({ page, context }) => {
  await page.goto("/library");
  await waitForLearningReady(page);
  const initiallyControlled = await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
    return Boolean(navigator.serviceWorker.controller);
  });

  if (!initiallyControlled) {
    await page.reload();
    await page.waitForFunction(() => Boolean(navigator.serviceWorker.controller));
  }
  await waitForLearningReady(page);

  try {
    await context.setOffline(true);
    await page.reload({ waitUntil: "domcontentloaded" });
    await expect(page.getByRole("heading", { name: /نصوص مستقلة/ })).toBeVisible();
    await expect(page.getByText("160", { exact: true })).toBeVisible();
    await waitForLearningReady(page);
  } finally {
    await context.setOffline(false);
  }
});

test("the optional full content pack opens unvisited lessons and exam tasks offline", async ({ page, context }) => {
  await page.goto("/settings");
  await waitForLearningReady(page);
  const packCard = page.locator(".offline-pack-card");
  await expect(packCard.getByText(/ملفًا · .* MB معروفة من البيانات/)).toBeVisible({ timeout: 30_000 });
  await packCard.getByRole("checkbox", { name: /تضمين الصوت المولّد اختياريًا/ }).check();
  const downloadButton = packCard.getByRole("button", { name: /تنزيل الصفحات والصوت/ });
  await expect(downloadButton).toBeEnabled({ timeout: 30_000 });
  await downloadButton.click();
  await expect(packCard.getByText(/اكتمل تثبيت الصفحات والصوت/)).toBeVisible({ timeout: 180_000 });
  await expect(packCard).toContainText("298 مسارًا");

  const packEvidence = await page.evaluate(async () => {
    const cache = await caches.open("dwnb-full-pack-v60");
    const response = await cache.match("/__dwnb_offline_pack_meta__");
    const metadata = response ? await response.json() as { routeCount: number; assetCount: number; entryCount: number; includesAudio: boolean; audioEntryCount: number; byteSize: number } : null;
    const firstAudio = await cache.match("/audio/library/lib-l-a1-01.mp3");
    const secondBatchAudio = await cache.match("/audio/library/lib-l-b2-04.mp3");
    const thirdBatchAudio = await cache.match("/audio/library/lib-l-b2-06.mp3");
    const fourthBatchAudio = await cache.match("/audio/library/lib-l-b2-08.mp3");
    const fifthBatchAudio = await cache.match("/audio/library/lib-l-b2-10.mp3");
    const sixthBatchAudio = await cache.match("/audio/library/lib-l-b2-12.mp3");
    const seventhBatchAudio = await cache.match("/audio/library/lib-l-b2-14.mp3");
    const eighthBatchAudio = await cache.match("/audio/library/lib-l-b2-16.mp3");
    const lessonAudio = await cache.match("/audio/lessons/a1-01.mp3");
    const secondLessonAudioBatch = await cache.match("/audio/lessons/a1-20.mp3");
    const thirdLessonAudioBatch = await cache.match("/audio/lessons/a2-06.mp3");
    const fourthLessonAudioBatch = await cache.match("/audio/lessons/a2-16.mp3");
    const fifthLessonAudioBatch = await cache.match("/audio/lessons/b1-02.mp3");
    const sixthLessonAudioBatch = await cache.match("/audio/lessons/b1-12.mp3");
    const seventhLessonAudioBatch = await cache.match("/audio/lessons/b1-22.mp3");
    const eighthLessonAudioBatch = await cache.match("/audio/lessons/b2-08.mp3");
    const finalLessonAudioBatch = await cache.match("/audio/lessons/b2-12.mp3");
    const goetheExamAudio = await cache.match("/audio/exams/goethe-h1-clip-5.mp3");
    const telcExamAudio = await cache.match("/audio/exams/telc-h3-clip-5.mp3");
    const segmentedGoetheExamAudio = await cache.match("/audio/exams/goethe-h4-wayfinding-lecture-seg-3.mp3");
    const segmentedTelcExamAudio = await cache.match("/audio/exams/telc-h2-mobility-dialogue-seg-2.mp3");
    const fullGoetheExamAudio = await cache.match("/audio/exams/g2-h4-seg-2.mp3");
    const fullTelcExamAudio = await cache.match("/audio/exams/t2-h1.mp3");
    const completedFull02TelcAudio = await cache.match("/audio/exams/t2-h3-5.mp3");
    const full03GoetheAudio = await cache.match("/audio/exams/g3-h4.mp3");
    const full03TelcAudio = await cache.match("/audio/exams/t3-h1.mp3");
    const completedFull03TelcAudio = await cache.match("/audio/exams/t3-h3-5.mp3");
    const full03GoetheShortAudio = await cache.match("/audio/exams/g3-h1-5.mp3");
    const full04GoetheAudio = await cache.match("/audio/exams/g4-h4.mp3");
    const full04TelcAudio = await cache.match("/audio/exams/t4-h1.mp3");
    const completedFull04TelcAudio = await cache.match("/audio/exams/t4-h3-5.mp3");
    const full05GoetheAudio = await cache.match("/audio/exams/g5-h4.mp3");
    const full05TelcAudio = await cache.match("/audio/exams/t5-h1.mp3");
    const completedFull05TelcAudio = await cache.match("/audio/exams/t5-h3-5.mp3");
    const completedFull05GoetheAudio = await cache.match("/audio/exams/g5-h1-5.mp3");
    const full06GoetheAudio = await cache.match("/audio/exams/g6-h4.mp3");
    const full06TelcAudio = await cache.match("/audio/exams/t6-h1.mp3");
    const completedFull06TelcDialogue = await cache.match("/audio/exams/t6-h2.mp3");
    const completedFull06TelcAnnouncement = await cache.match("/audio/exams/t6-h3-5.mp3");
    return { metadata, generatedAudioCached: Boolean(firstAudio && secondBatchAudio && thirdBatchAudio && fourthBatchAudio && fifthBatchAudio && sixthBatchAudio && seventhBatchAudio && eighthBatchAudio && lessonAudio && secondLessonAudioBatch && thirdLessonAudioBatch && fourthLessonAudioBatch && fifthLessonAudioBatch && sixthLessonAudioBatch && seventhLessonAudioBatch && eighthLessonAudioBatch && finalLessonAudioBatch && goetheExamAudio && telcExamAudio && segmentedGoetheExamAudio && segmentedTelcExamAudio && fullGoetheExamAudio && fullTelcExamAudio && completedFull02TelcAudio && full03GoetheAudio && full03TelcAudio && completedFull03TelcAudio && full03GoetheShortAudio && full04GoetheAudio && full04TelcAudio && completedFull04TelcAudio && full05GoetheAudio && full05TelcAudio && completedFull05TelcAudio && completedFull05GoetheAudio && full06GoetheAudio && full06TelcAudio && completedFull06TelcDialogue && completedFull06TelcAnnouncement) };
  });
  expect(packEvidence.metadata?.routeCount).toBe(298);
  expect(packEvidence.metadata?.assetCount).toBeGreaterThan(90);
  expect(packEvidence.metadata?.entryCount).toBeGreaterThan(298);
  expect(packEvidence.metadata?.includesAudio).toBe(true);
  expect(packEvidence.metadata?.audioEntryCount).toBeGreaterThan(200);
  expect(packEvidence.metadata?.byteSize).toBeGreaterThan(10_000_000);
  expect(packEvidence.generatedAudioCached).toBe(true);

  try {
    await context.setOffline(true);
    await page.goto("/path", { waitUntil: "domcontentloaded" });
    await page.locator('a[href="/lernen/b2-12"]').click();
    await expect(page).toHaveURL(/\/lernen\/b2-12$/);
    await waitForLearningReady(page);
    await expect(page.locator(".lesson-workspace h1")).toContainText("أهداف اليوم");
    await page.getByRole("button", { name: /أكملت هذه الخطوة/ }).click();
    await expect(page.getByText("المرحلة 2 من 14", { exact: false })).toBeVisible();

    await page.goto("/mediation", { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("heading", { name:/انقل المقصد/ })).toBeVisible();

    await page.goto("/exams/goethe-b2/goethe-b2-full-06-reading-01", { waitUntil: "domcontentloaded" });
    await waitForLearningReady(page);
    await expect(page.locator("main h1").first()).toBeVisible();

    await page.goto("/shadowing", { waitUntil: "domcontentloaded" });
    await waitForLearningReady(page);
    await expect(page.getByRole("heading", { name: /اسمع، جزّئ/ })).toBeVisible();
    await expect(page.getByLabel(/نموذج/)).toHaveAttribute("src", /\/audio\/library\//);
  } finally {
    await context.setOffline(false);
  }

  await page.goto("/settings");
  await waitForLearningReady(page);
  const installedPack = page.locator(".offline-pack-card");
  await expect(installedPack).toContainText(/الحجم المثبت الفعلي/);
  page.once("dialog", (dialog) => void dialog.accept());
  await installedPack.getByRole("button", { name: "حذف صوت الحزمة فقط" }).click();
  await expect(installedPack).toContainText(/بقيت الصفحات والتقدم والتسجيلات الشخصية/);
  const afterAudioRemoval = await page.evaluate(async () => {
    const cache = await caches.open("dwnb-full-pack-v60");
    const audio = await cache.match("/audio/library/lib-l-a1-01.mp3");
    const lessonRoute = await cache.match("/lernen/b2-12");
    const response = await cache.match("/__dwnb_offline_pack_meta__");
    return { audio: Boolean(audio), lessonRoute: Boolean(lessonRoute), metadata: response ? await response.json() : null };
  });
  expect(afterAudioRemoval.audio).toBe(false);
  expect(afterAudioRemoval.lessonRoute).toBe(true);
  expect(afterAudioRemoval.metadata).toMatchObject({ includesAudio: false, audioEntryCount: 0 });
});

test("one level pack installs its own scope without downloading the whole course", async ({ page, context }) => {
  await page.goto("/settings");
  await waitForLearningReady(page);
  const packCard = page.locator(".offline-pack-card");
  await expect(packCard.getByText(/ملفًا · .* MB معروفة من البيانات/)).toBeVisible({ timeout: 30_000 });

  const sizePreview = packCard.locator(".pack-size-preview > div").first();
  await expect(sizePreview).toContainText("298 مسارًا");

  await packCard.locator(".pack-scope", { hasText: "مستوى A1" }).click();
  await expect(packCard.locator(".pack-scope.active")).toContainText("مستوى A1");
  await expect(packCard.locator(".pack-scope-hint")).toContainText("24 درسًا");
  await expect(sizePreview).toContainText("51 مسارًا");
  await expect(sizePreview).toContainText("مضغوطًا على الشبكة");

  const a1Download = packCard.getByRole("button", { name: /تنزيل حزمة الصفحات/ });
  await expect(a1Download).toBeEnabled({ timeout: 30_000 });
  await a1Download.click();
  await expect(packCard.getByText(/اكتملت حزمة الصفحات دون تنزيل الصوت الاختياري/)).toBeVisible({ timeout: 180_000 });

  const levelEvidence = await page.evaluate(async () => {
    const levelCache = await caches.open("dwnb-level-pack-a1-v60");
    const fullCache = await caches.open("dwnb-full-pack-v60");
    const metadataResponse = await levelCache.match("/__dwnb_offline_pack_meta__");
    const metadata = metadataResponse ? await metadataResponse.json() as { scope: string; routeCount: number; includesAudio: boolean; byteSize: number } : null;
    const a1Lesson = await levelCache.match("/lernen/a1-01");
    const a1Module = await levelCache.match("/module/a1-1");
    const b2Lesson = await levelCache.match("/lernen/b2-12");
    const examTask = await levelCache.match("/exams/goethe-b2/full/goethe-b2-full-06");
    const fullPackMetadata = await fullCache.match("/__dwnb_offline_pack_meta__");
    return {
      metadata,
      a1Lesson: Boolean(a1Lesson),
      a1Module: Boolean(a1Module),
      b2Lesson: Boolean(b2Lesson),
      examTask: Boolean(examTask),
      fullPackUntouched: fullPackMetadata === undefined,
    };
  });
  expect(levelEvidence.metadata?.scope).toBe("A1");
  expect(levelEvidence.metadata?.routeCount).toBe(51);
  expect(levelEvidence.metadata?.includesAudio).toBe(false);
  expect(levelEvidence.metadata?.byteSize).toBeGreaterThan(1_000_000);
  expect(levelEvidence.a1Lesson).toBe(true);
  expect(levelEvidence.a1Module).toBe(true);
  expect(levelEvidence.b2Lesson).toBe(false);
  expect(levelEvidence.examTask).toBe(false);
  expect(levelEvidence.fullPackUntouched).toBe(true);

  try {
    await context.setOffline(true);
    await page.goto("/lernen/a1-01", { waitUntil: "domcontentloaded" });
    await waitForLearningReady(page);
    await expect(page.locator(".lesson-workspace h1")).toContainText("أهداف اليوم");
    // مسار B2 ليس داخل حزمة A1: العامل يرجّع 503 لأي مورد غير محفوظ، ويُسقط التنقل على /today.
    const offlineProbe = await page.evaluate(async () => ({
      a1: await fetch("/lernen/a1-01").then((response) => response.status).catch(() => 0),
      b2: await fetch("/lernen/b2-12").then((response) => response.status).catch(() => 0),
      exam: await fetch("/exams/goethe-b2/full/goethe-b2-full-06").then((response) => response.status).catch(() => 0),
    }));
    expect(offlineProbe.a1).toBe(200);
    expect(offlineProbe.b2).toBe(503);
    expect(offlineProbe.exam).toBe(503);
    await page.goto("/lernen/b2-12", { waitUntil: "domcontentloaded" });
    await expect(page.locator(".lesson-workspace")).toHaveCount(0);
  } finally {
    await context.setOffline(false);
  }

  await page.goto("/settings");
  await waitForLearningReady(page);
  const installedLevelPack = page.locator(".offline-pack-card");
  await expect(installedLevelPack.locator(".pack-scope", { hasText: "مستوى A1" })).toContainText("مثبتة");
  await installedLevelPack.locator(".pack-scope", { hasText: "مستوى A1" }).click();
  await expect(installedLevelPack.locator(".pack-scope.active")).toContainText("مستوى A1");
  await expect(installedLevelPack).toContainText("51 مسارًا");
  page.once("dialog", (dialog) => void dialog.accept());
  await installedLevelPack.getByRole("button", { name: "حذف الحزمة" }).click();
  await expect(installedLevelPack.locator(".pack-scope", { hasText: "مستوى A1" })).toContainText("51 مسارًا");
  const afterLevelRemoval = await page.evaluate(async () => {
    const levelCache = await caches.open("dwnb-level-pack-a1-v60");
    const keys = await levelCache.keys();
    const names = await caches.keys();
    return { keys: keys.length, hasLevelCache: names.includes("dwnb-level-pack-a1-v60") };
  });
  expect(afterLevelRemoval.keys).toBe(0);
});

test("continuous full-exam mode persists one central clock and blocks task skipping", async ({ page }) => {
  const dashboard = "/exams/goethe-b2/full/goethe-b2-full-02";
  await page.goto(dashboard);
  await waitForLearningReady(page);
  await page.getByRole("button", { name: /بروفة زمنية متصلة/ }).click();
  await expect(page.locator(".continuous-clock")).toBeVisible();
  await expect(page.getByText(/الساعة لا تتوقف/)).toBeVisible();
  await expect(page.locator(".app-frame")).toHaveAttribute("data-exam-focus", "true");
  await expect(page.locator(".side-nav")).toHaveCount(0);
  await expect(page.locator(".exam-focus-topbar")).toContainText("المساعدات والتصحيح مخفيان");
  await page.getByRole("button", { name: "مغادرة مؤقتة" }).click();
  await expect(page.getByRole("dialog").getByRole("heading", { name: /مغادرة وضع التركيز مؤقتًا/ })).toBeVisible();
  await page.getByRole("button", { name: "ابقَ في البروفة" }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);

  const deadlineBeforeReload = await page.evaluate(() => new Promise<string>((resolve, reject) => {
    const open = indexedDB.open("der-weg-nach-berlin", 4);
    open.onerror = () => reject(open.error);
    open.onsuccess = () => {
      const request = open.result.transaction("learning-state", "readonly").objectStore("learning-state").get("primary");
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result.examSessions["goethe-b2-full-02"].deadlineAt);
    };
  }));

  await page.reload();
  await waitForLearningReady(page);
  await expect(page.locator(".continuous-clock")).toBeVisible();
  const deadlineAfterReload = await page.evaluate(() => new Promise<string>((resolve, reject) => {
    const open = indexedDB.open("der-weg-nach-berlin", 4);
    open.onerror = () => reject(open.error);
    open.onsuccess = () => {
      const request = open.result.transaction("learning-state", "readonly").objectStore("learning-state").get("primary");
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result.examSessions["goethe-b2-full-02"].deadlineAt);
    };
  }));
  expect(deadlineAfterReload).toBe(deadlineBeforeReload);

  await page.goto("/exams/goethe-b2/goethe-b2-full-02-reading-02");
  await waitForLearningReady(page);
  await expect(page.getByRole("heading", { name: "هذه ليست المهمة التالية" })).toBeVisible();

  await page.goto("/exams/goethe-b2/goethe-b2-full-02-reading-01");
  await waitForLearningReady(page);
  await expect(page.locator(".continuous-session-banner")).toBeVisible();
  await expect(page.getByText(/تركيز مغلق المساعدة:/)).toBeVisible();
  await page.getByRole("button", { name: /ابدأ المؤقت والتدريب/ }).click();
  await expect(page.locator(".exam-source-strip")).toHaveCount(0);
  await expect(page.locator(".exam-instructions > small")).toBeHidden();
  const firstAnswer = page.getByLabel("إجابة السؤال 1");
  const savedOption = await firstAnswer.locator("option").nth(1).getAttribute("value");
  expect(savedOption).toBeTruthy();
  await firstAnswer.selectOption(savedOption!);
  await expect.poll(() => page.evaluate(() => new Promise<string | undefined>((resolve, reject) => {
    const open = indexedDB.open("der-weg-nach-berlin", 4);
    open.onerror = () => reject(open.error);
    open.onsuccess = () => {
      const request = open.result.transaction("learning-state", "readonly").objectStore("learning-state").get("primary");
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result.examSessions["goethe-b2-full-02"].taskDrafts["goethe-b2-full-02-reading-01"]?.payload.answers?.[Object.keys(request.result.examSessions["goethe-b2-full-02"].taskDrafts["goethe-b2-full-02-reading-01"]?.payload.answers ?? {})[0]]);
    };
  }))).toBe(savedOption);
  await page.reload();
  await waitForLearningReady(page);
  await expect(page.getByLabel("إجابة السؤال 1")).toHaveValue(savedOption!);
  const answerSelects = page.locator(".targeted-items select");
  for (let index = 0; index < await answerSelects.count(); index += 1) {
    const select = answerSelects.nth(index);
    if (await select.inputValue()) continue;
    const available = await select.locator("option").evaluateAll((options) => options.find((option) => (option as HTMLOptionElement).value && !(option as HTMLOptionElement).disabled)?.getAttribute("value"));
    expect(available).toBeTruthy();
    await select.selectOption(available!);
  }
  await page.getByRole("button", { name: "ثبّت الإجابات وانتقل" }).click();
  await expect(page.locator(".continuous-task-submitted")).toBeVisible();
  await expect(page.getByText("ثُبّت التسليم دون كشف التصحيح")).toBeVisible();
  // P0-256: اللوحة نفسها لم تعد منطقة حيّة (لا تُقرأ العناوين والروابط كلها)، بل ملخّص واحد.
  await expect(page.locator(".continuous-task-submitted")).not.toHaveAttribute("role", "status");
  await expect(page.locator(".continuous-task-submitted .result-announcer")).toHaveText(/ثُبّت التسليم: \d+ من \d+ مهام مسلّمة/);
  await expect(page.locator(".continuous-task-submitted [role=\"status\"]")).toHaveCount(1);
  await expect(page.locator(".targeted-review-list")).toHaveCount(0);
  await expect(page.getByText(/الصحيح:/)).toHaveCount(0);

  await page.evaluate(() => new Promise<void>((resolve, reject) => {
    const open = indexedDB.open("der-weg-nach-berlin", 4);
    open.onerror = () => reject(open.error);
    open.onsuccess = () => {
      const db = open.result;
      const read = db.transaction("learning-state", "readonly").objectStore("learning-state").get("primary");
      read.onerror = () => reject(read.error);
      read.onsuccess = () => {
        const state = read.result;
        state.examSessions["goethe-b2-full-02"].currentTaskId = "goethe-b2-full-02-writing-01";
        const write = db.transaction("learning-state", "readwrite");
        write.objectStore("learning-state").put(state, "primary");
        write.oncomplete = () => resolve();
        write.onerror = () => reject(write.error);
      };
    };
  }));
  await page.goto("/exams/goethe-b2/goethe-b2-full-02-writing-01");
  await waitForLearningReady(page);
  await page.getByRole("button", { name: /ابدأ المؤقت والكتابة/ }).click();
  const draftText = "Dieser Entwurf bleibt nach dem Neuladen lokal erhalten.";
  await page.locator(".writing-exam-editor textarea").fill(draftText);
  await expect.poll(() => page.evaluate(() => new Promise<string | undefined>((resolve, reject) => {
    const open = indexedDB.open("der-weg-nach-berlin", 4);
    open.onerror = () => reject(open.error);
    open.onsuccess = () => {
      const request = open.result.transaction("learning-state", "readonly").objectStore("learning-state").get("primary");
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result.examSessions["goethe-b2-full-02"].taskDrafts["goethe-b2-full-02-writing-01"]?.payload.text);
    };
  }))).toBe(draftText);
  await page.reload();
  await waitForLearningReady(page);
  await expect(page.locator(".writing-exam-editor textarea")).toHaveValue(draftText);
  await page.goto(dashboard);
  await waitForLearningReady(page);

  const speakingTaskId = "goethe-b2-full-02-speaking-01";
  const temporaryMediaId = "exam-speaking-draft-e2e";
  await page.evaluate(({ speakingTaskId, temporaryMediaId }) => new Promise<void>((resolve, reject) => {
    const open = indexedDB.open("der-weg-nach-berlin", 4);
    open.onerror = () => reject(open.error);
    open.onsuccess = () => {
      const db = open.result;
      const transaction = db.transaction(["learning-state", "media"], "readwrite");
      const learningStore = transaction.objectStore("learning-state");
      const read = learningStore.get("primary");
      read.onerror = () => reject(read.error);
      read.onsuccess = () => {
        const state = read.result;
        const session = state.examSessions["goethe-b2-full-02"];
        session.currentTaskId = speakingTaskId;
        session.taskDrafts[speakingTaskId] = {
          taskId: speakingTaskId,
          kind: "speaking",
          payload: { choiceId: "g2-s1-a", phase: "recorded", mediaId: temporaryMediaId, duration: 12, selfScore: 4, reflection: "lokal wiederhergestellt" },
          savedAt: new Date().toISOString(),
        };
        learningStore.put(state, "primary");
        transaction.objectStore("media").put(new Blob(["draft-audio"], { type: "audio/webm" }), temporaryMediaId);
      };
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    };
  }), { speakingTaskId, temporaryMediaId });
  await page.goto(`/exams/goethe-b2/${speakingTaskId}`);
  await waitForLearningReady(page);
  await expect(page.getByText(/استُعيد التسجيل المؤقت محليًا/)).toBeVisible();
  await expect(page.getByText("اكتمل التسجيل المؤقت")).toBeVisible();
  await expect(page.locator(".audio-player")).toHaveCount(0);
  await expect(page.locator(".reflection-field")).toHaveCount(0);
  await expect(page.getByText(/سؤال شريك محتمل/)).toHaveCount(0);
  await page.getByRole("button", { name: /ثبّت التسجيل وانتقل/ }).click();
  await expect.poll(() => page.evaluate(({ speakingTaskId, temporaryMediaId }) => new Promise<boolean>((resolve, reject) => {
    const open = indexedDB.open("der-weg-nach-berlin", 4);
    open.onerror = () => reject(open.error);
    open.onsuccess = () => {
      const request = open.result.transaction("learning-state", "readonly").objectStore("learning-state").get("primary");
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const state = request.result;
        const linked = state.speakingAttempts.some((attempt: { taskId: string; mediaId?: string }) => attempt.taskId === speakingTaskId && attempt.mediaId === temporaryMediaId);
        const draftRemoved = !state.examSessions["goethe-b2-full-02"].taskDrafts[speakingTaskId];
        resolve(linked && draftRemoved);
      };
    };
  }), { speakingTaskId, temporaryMediaId })).toBe(true);

  await page.goto(dashboard);
  await waitForLearningReady(page);
  await expect(page.locator(".app-frame")).toHaveAttribute("data-exam-focus", "true");
  await page.getByRole("button", { name: "إنهاء هذه البروفة المتصلة" }).click();
  await expect(page.getByRole("dialog").getByRole("heading", { name: /تنهي البروفة المتصلة نهائيًا/ })).toBeVisible();
  await page.getByRole("button", { name: "إلغاء والعودة" }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await page.getByRole("button", { name: "إنهاء هذه البروفة المتصلة" }).click();
  await page.getByRole("button", { name: "نعم، أنهِ البروفة" }).click();
  await expect(page.locator(".app-frame")).toHaveAttribute("data-exam-focus", "false");
  await expect(page.getByRole("heading", { name: "انتهت هذه البروفة يدويًا" })).toBeVisible();
  await expect.poll(() => page.evaluate(() => new Promise<unknown>((resolve, reject) => {
    const open = indexedDB.open("der-weg-nach-berlin", 4);
    open.onerror = () => reject(open.error);
    open.onsuccess = () => {
      const request = open.result.transaction("learning-state", "readonly").objectStore("learning-state").get("primary");
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve({ status: request.result.examSessions["goethe-b2-full-02"].status, drafts: request.result.examSessions["goethe-b2-full-02"].taskDrafts });
    };
  }))).toEqual({ status: "abandoned", drafts: {} });
});

test("bilingual local search ranks German and Arabic results and returns to context", async ({ page }) => {
  await page.goto("/search");
  await expect(page.getByRole("heading", { name: /ابحث عن العبارة/ })).toBeVisible();
  await expect(page.getByText(/3[.,]?080/)).toBeVisible();
  const search = page.getByRole("searchbox", { name: "البحث بالألمانية أو العربية" });

  await search.fill("Heizung");
  await expect(page.locator(".search-result-card").first()).toBeVisible();
  await expect(page.locator(".search-results")).toContainText("Heizung");
  await page.getByRole("button", { name: "المكتبة" }).click();
  await expect(page.locator(".search-result-card").first()).toHaveAttribute("href", /\/library#/);

  await search.fill("التدفئة");
  const libraryResult = page.locator(".search-result-card").first();
  await expect(libraryResult).toBeVisible();
  await libraryResult.click();
  await expect(page).toHaveURL(/\/library#lib-/);
  const targetId = new URL(page.url()).hash.slice(1);
  await expect(page.locator(`#${targetId}`)).toHaveAttribute("open", "");
});

test("progress and daily coach derive metrics, risks, dates, and streaks from evidence", async ({ page }) => {
  await page.goto("/progress");
  await waitForLearningReady(page);
  await expect(page.locator(".evidence-overview")).toContainText("—");
  await expect(page.locator(".evidence-skill")).toHaveCount(5);

  const lesson = academicLessons["a1-01"];
  await page.evaluate(({ readingId, listeningId, grammarId, baseState }) => new Promise<void>((resolve, reject) => {
    const open = indexedDB.open("der-weg-nach-berlin", 4);
    open.onerror = () => reject(open.error);
    open.onsuccess = () => {
      const transaction = open.result.transaction("learning-state", "readwrite");
      const store = transaction.objectStore("learning-state");
      const request = store.get("primary");
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const state = request.result ?? structuredClone(baseState);
        const now = new Date();
        const yesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
        const local = (date: Date) => `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,"0")}-${String(date.getDate()).padStart(2,"0")}`;
        state.profile = { name:"Test",targetExam:"goethe-b2",dailyMinutes:45,arabicSupport:"modern-standard-arabic",currentLevel:"A1",createdAt:new Date(now.getTime()-2*86_400_000).toISOString() };
        state.diagnosticResult = { estimatedLevel:"A1",score:3,maxScore:12,levelScores:{A1:3,A2:0,B1:0,B2:0},completedAt:now.toISOString() };
        state.exerciseAttempts = [
          {id:"reading-evidence",lessonId:"a1-01",exerciseId:readingId,answer:"correct",correct:true,createdAt:now.toISOString()},
          {id:"listening-evidence",lessonId:"a1-01",exerciseId:listeningId,answer:"wrong",correct:false,createdAt:now.toISOString()},
          {id:"grammar-evidence",lessonId:"a1-01",exerciseId:grammarId,answer:"correct",correct:true,createdAt:now.toISOString()},
        ];
        state.studyHistory = [{date:local(yesterday),minutes:10,evidenceCount:1},{date:local(now),minutes:15,evidenceCount:3}];
        store.put(state,"primary");
      };
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    };
  }), { readingId:lesson.reading.questions[0].id, listeningId:lesson.listening.questions[0].id, grammarId:lesson.exercises[0].id, baseState:structuredClone(defaultState) });

  await page.reload();
  await waitForLearningReady(page);
  await expect(page.locator(".evidence-skill").filter({ hasText:"القراءة" })).toContainText("1/1 صحيح");
  await expect(page.locator(".evidence-skill").filter({ hasText:"الاستماع" })).toContainText("0/1 صحيح");
  await expect(page.locator(".evidence-overview-stats")).toContainText("2 أيام متتالية");

  await page.goto("/today");
  await waitForLearningReady(page);
  await expect(page.locator(".coach-note")).toContainText("الاستماع");
  await expect(page.locator(".stat-pair").first()).toContainText("2");
  await page.locator(".mission-row").first().click();
  await expect.poll(() => page.evaluate(() => new Promise<boolean>((resolve, reject) => {
    const open = indexedDB.open("der-weg-nach-berlin", 4);
    open.onerror = () => reject(open.error);
    open.onsuccess = () => {
      const request = open.result.transaction("learning-state", "readonly").objectStore("learning-state").get("primary");
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result.completedBlockIds.some((id: string) => /^\d{4}-\d{2}-\d{2}:/.test(id)));
    };
  }))).toBe(true);
});

test("keyboard users can skip navigation, follow lesson focus, hear results, and escape modals", async ({ page }) => {
  await page.goto("/today");
  await waitForLearningReady(page);
  await page.locator("body").focus();
  await page.keyboard.press("Tab");
  const skipLink = page.getByRole("link", { name: "تجاوز التنقل إلى المحتوى" });
  await expect(skipLink).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.locator("#main-content")).toBeFocused();

  await page.goto("/lernen/a1-01");
  await waitForLearningReady(page);
  for (let step = 0; step < 5; step += 1) {
    await page.getByRole("button", { name: /أكملت هذه الخطوة/ }).click();
    await expect(page.locator(".lesson-workspace h1")).toBeFocused();
  }
  await expect(page.locator('.lesson-steps button[aria-current="step"]')).toContainText("تدريب موجّه");
  const exercise = page.locator(".exercise-card").first();
  await exercise.locator(".exercise-options button").first().click();
  await exercise.getByRole("button", { name: "تحقق" }).click();
  await expect(exercise.getByRole("status")).toBeVisible();
  await expect(exercise.getByRole("status")).toHaveAttribute("aria-atomic", "true");

  await page.goto("/tutor");
  await waitForLearningReady(page);
  await page.evaluate((baseState) => new Promise<void>((resolve, reject) => {
    const state = structuredClone(baseState);
    state.aiSettings = { provider: "gemini", model: "gemini-2.5-flash", enabledFeatures: ["tutor"] };
    const open = indexedDB.open("der-weg-nach-berlin", 4);
    open.onerror = () => reject(open.error);
    open.onsuccess = () => {
      const transaction = open.result.transaction("learning-state", "readwrite");
      transaction.objectStore("learning-state").put(state, "primary");
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    };
  }), structuredClone(defaultState));
  await page.reload();
  await waitForLearningReady(page);
  await page.getByLabel("سؤال المرشد").fill("اشرح weil");
  const sendButton = page.getByRole("button", { name: "إرسال السؤال" });
  await sendButton.click();
  await expect(page.getByRole("button", { name: "إلغاء الإرسال" })).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(sendButton).toBeFocused();
});

test("Arabic shell and German content keep explicit direction", async ({ page }) => {
  await page.goto("/library");
  await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
  await expect(page.locator("html")).toHaveAttribute("lang", "ar");
  await page.getByText("Das kleine Café", { exact: true }).click();
  // الألماني المرئي هو المقصود: شريط التنقل الجانبي (وفيه شارة العلامة الألمانية) مخفي على الهاتف.
  await expect(page.locator('[lang="de"][dir="ltr"]:visible').first()).toBeVisible();
});

test("representative 320–1920 px viewports avoid document-level horizontal overflow", async ({ page }) => {
  const sizes = [
    { width: 320, height: 568 },
    { width: 360, height: 800 },
    { width: 768, height: 1024 },
    { width: 1024, height: 768 },
    { width: 1440, height: 900 },
    { width: 1920, height: 1080 },
  ];
  for (const size of sizes) {
    await page.setViewportSize(size);
    await page.goto("/exams");
    await expect(page.locator("main")).toBeVisible();
    const dimensions = await page.evaluate(() => ({ width: document.documentElement.clientWidth, scrollWidth: document.documentElement.scrollWidth }));
    expect(dimensions.scrollWidth, `/exams at ${size.width}×${size.height}`).toBeLessThanOrEqual(dimensions.width + 1);
  }

  await page.setViewportSize({ width: 320, height: 568 });
  for (const route of ["/path", "/library", "/search", "/settings", "/shadowing", "/progress", "/tutor"]) {
    await page.goto(route);
    await expect(page.locator("main")).toBeVisible();
    const dimensions = await page.evaluate(() => ({ width: document.documentElement.clientWidth, scrollWidth: document.documentElement.scrollWidth }));
    expect(dimensions.scrollWidth, `${route} at 320×568`).toBeLessThanOrEqual(dimensions.width + 1);
  }
});

test("critical pages have no automatically detectable serious WCAG violations", async ({ page }) => {
  for (const route of ["/library", "/library#lib-l-a1-01", "/shadowing", "/search", "/errors", "/progress", "/exams", "/settings", "/tutor"]) {
    await page.goto(route);
    const result = await new AxeBuilder({ page }).include("main").withTags(["wcag2a", "wcag2aa"]).analyze();
    const serious = result.violations.filter((item) => item.impact === "serious" || item.impact === "critical");
    expect(serious, `${route}: ${serious.map((item) => item.id).join(", ")}`).toEqual([]);
  }
});

test("A2 vocabulary stage renders four noun anchors and two verb-preposition frames", async ({ page }) => {
  await page.goto("/lernen/a2-04");
  await waitForLearningReady(page);
  await openVocabularyStage(page);
  await expect(page.locator(".lesson-workspace h1")).toContainText("العبارات");
  const lexicalPanel = page.locator(".lexical-grammar-panel");
  await expect(lexicalPanel.locator(".noun-grammar-grid > article")).toHaveCount(4);
  // أسماء مسرد القراءة تُعرض داخل details حتى لا تزاحم المراسي الأربع.
  const inventoryCount = nounsByLesson["a2-04"].filter((noun) => noun.origin === "inventory").length;
  // البطاقات موجودة في DOM لكنها مخفية حتى يفتح المتعلم القسم.
  await expect(lexicalPanel.locator(".inventory-noun-card")).toHaveCount(inventoryCount);
  await expect(lexicalPanel.locator(".inventory-noun-card").first()).toBeHidden();
  await lexicalPanel.locator(".inventory-noun-block > summary").click();
  await expect(lexicalPanel.locator(".inventory-noun-card").first()).toBeVisible();
  await expect(lexicalPanel).toContainText("die Mülltonne");
  await expect(lexicalPanel.locator(".verb-frame-card")).toHaveCount(framesByLesson["a2-04"].length);
  await expect(lexicalPanel).toContainText("der Nachbar");
  await expect(lexicalPanel).toContainText("sich für die Hilfe bedanken");
  await expect(lexicalPanel).toContainText("um Hilfe bitten");
  await expect(lexicalPanel).toContainText("لم تُراجَع ألمانيًا بشريًا بعد");
  await expect(lexicalPanel).toContainText("des Nachbarn");
  await expect(lexicalPanel).toContainText("den Nachbarn");
  await lexicalPanel.locator("details").first().getByText(/Kasusformen ansehen/).click();
  await expect(lexicalPanel.locator("details").first()).toContainText("dem Nachbarn");
  await expect(lexicalPanel.locator("details").first()).toContainText("des Nachbarn");
});

test("B2 vocabulary stage renders four noun anchors and the Genitiv preposition frames", async ({ page }) => {
  await page.goto("/lernen/b2-04");
  await waitForLearningReady(page);
  await openVocabularyStage(page);
  await expect(page.locator(".lesson-workspace h1")).toContainText("العبارات");
  const lexicalPanel = page.locator(".lexical-grammar-panel");
  await expect(lexicalPanel.locator(".noun-grammar-grid > article")).toHaveCount(4);
  // الإطارات مقيسة من نص الدرس: b2-04 يملك إطارين مؤلفين وإطارًا مشتقًا من جرد التكافؤ.
  await expect(lexicalPanel.locator(".verb-frame-card")).toHaveCount(framesByLesson["b2-04"].length);
  await expect(lexicalPanel.locator('.verb-frame-card[data-origin="derived"]')).toHaveCount(1);
  await expect(lexicalPanel).toContainText("um Wiederholung bitten");
  await expect(lexicalPanel).toContainText("der Leistungsumfang");
  await expect(lexicalPanel).toContainText("angesichts der Frist entscheiden");
  await expect(lexicalPanel).toContainText("angesichts + Genitiv");
  await expect(lexicalPanel).toContainText("hinsichtlich + Genitiv");
  // الاسم بلا جمع يصرّح بعدم وجود جمع مجرور بدل اختلاق صيغة.
  await expect(lexicalPanel).toContainText("des Leistungsumfangs");
  await expect(lexicalPanel).toContainText("kein Dativ Plural");
});

test("every published lesson vocabulary stage keeps the authored anchor count", async ({ page }) => {
  for (const lessonId of ["a1-12", "a2-17", "b1-19", "b2-09"]) {
    await page.goto(`/lernen/${lessonId}`);
    await waitForLearningReady(page);
    await openVocabularyStage(page);
    const lexicalPanel = page.locator(".lexical-grammar-panel");
    await expect(lexicalPanel.locator(".noun-grammar-grid > article"), lessonId).toHaveCount(4);
    await expect(lexicalPanel.locator(".verb-frame-card"), lessonId).toHaveCount(framesByLesson[lessonId].length);
    const inventoryCount = nounsByLesson[lessonId].filter((noun) => noun.origin === "inventory").length;
    if (inventoryCount > 0) {
      await expect(lexicalPanel.locator(".inventory-noun-card"), lessonId).toHaveCount(inventoryCount);
      await expect(lexicalPanel.locator(".inventory-noun-card").first(), lessonId).toBeHidden();
      await lexicalPanel.locator(".inventory-noun-block > summary").click();
      await expect(lexicalPanel.locator(".inventory-noun-card").first(), lessonId).toBeVisible();
    }
    const article = lexicalPanel.locator(".noun-grammar-grid > article").first();
    await expect(article.locator("b").nth(1), lessonId).toHaveText(/^(den |kein Dativ Plural)/);
  }
});
