import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import { readFile } from "node:fs/promises";
import { academicLessons } from "../../src/data/academic-lessons";
import { allPublishedExamTasks } from "../../src/data/exam-simulation-registry";
import { curriculum } from "../../src/data/curriculum";
import { readingLibrary } from "../../src/data/library-registry";
import { writingBenchmarkPrompt } from "../../src/core/writing/device-benchmark";
import { defaultState } from "../../src/core/portability/db";
import { diagnosticForms } from "../../src/data/diagnostic";
import { unknownWordChallenge } from "../../src/core/reading/unknown-word";

async function waitForLearningReady(page: Page) {
  await expect(page.locator(".app-frame")).toHaveAttribute("data-learning-ready", "true", { timeout:30_000 });
}

async function assertLanguageBoundaries(page: Page, label: string) {
  const audit = await page.evaluate(() => {
    const german = [...document.querySelectorAll<HTMLElement>('[lang="de"]')];
    const ltr = [...document.querySelectorAll<HTMLElement>('[dir="ltr"]')];
    const rtl = [...document.querySelectorAll<HTMLElement>('[dir="rtl"]')];
    return {
      germanCount: german.length,
      germanViolations: german.filter((element) => element.getAttribute("dir") !== "ltr" || getComputedStyle(element).unicodeBidi !== "isolate").map((element) => element.outerHTML.slice(0, 120)),
      ltrViolations: ltr.filter((element) => element.getAttribute("lang") !== "de" && !element.hasAttribute("data-bidi-scope")).map((element) => element.outerHTML.slice(0, 120)),
      rtlViolations: rtl.filter((element) => element.tagName !== "HTML" && element.getAttribute("lang") !== "ar" && !element.hasAttribute("data-bidi-scope")).map((element) => element.outerHTML.slice(0, 120)),
    };
  });
  expect(audit.germanCount, `${label}: no German fragment`).toBeGreaterThan(0);
  expect(audit.germanViolations, `${label}: German lang/dir/isolation`).toEqual([]);
  expect(audit.ltrViolations, `${label}: unowned LTR fragment`).toEqual([]);
  expect(audit.rtlViolations, `${label}: unowned RTL fragment`).toEqual([]);
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

test("critical pages have no automatically detectable serious WCAG violations", async ({ page }) => {
  test.setTimeout(90_000);
  for (const route of ["/library", "/library#lib-l-a1-01", "/shadowing", "/practice/dictation", "/search", "/errors", "/progress", "/exams", "/settings", "/tutor"]) {
    await page.goto(route);
    const result = await new AxeBuilder({ page }).include("main").withTags(["wcag2a", "wcag2aa"]).analyze();
    const serious = result.violations.filter((item) => item.impact === "serious" || item.impact === "critical");
    expect(serious, `${route}: ${serious.map((item) => item.id).join(", ")}`).toEqual([]);
  }
});

test("library and exam hubs render their completed content contracts", async ({ page }) => {
  const webgpuRuntime=await page.request.head("/vendor/webgpu/transformers.web.min.js");
  expect(webgpuRuntime.ok()).toBe(true);
  expect(webgpuRuntime.headers()["content-type"]).toContain("javascript");
  expect(webgpuRuntime.headers()["x-dwnb-security-policy"]).toBe("vercel-csp-headers-v1");
  expect(webgpuRuntime.headers()["content-security-policy"]).toContain("frame-ancestors 'none'");
  expect(webgpuRuntime.headers()["content-security-policy"]).toContain("https://generativelanguage.googleapis.com");
  expect(webgpuRuntime.headers()["content-security-policy"]).not.toMatch(/(?:^|\s|;)\*(?:\s|;|$)/);
  const webgpuWasm=await page.request.head("/vendor/webgpu/ort-wasm-simd-threaded.jsep.wasm");
  expect(webgpuWasm.ok()).toBe(true);
  expect(webgpuWasm.headers()["content-type"]).toContain("application/wasm");
  await page.goto("/library");
  await expect(page.getByRole("heading", { name: /نصوص مستقلة/ })).toBeVisible();
  await expect(page.getByText("160", { exact: true })).toBeVisible();
  const strategyItem=readingLibrary.find(item=>unknownWordChallenge(item))!;const strategyDetails=page.locator(`#${strategyItem.id}`);await strategyDetails.locator(":scope > summary").click();await expect(strategyDetails.locator('[data-unknown-word-policy="unknown-word-and-compound-strategy-v1"]')).toBeVisible();await strategyDetails.locator(".unknown-word-strategy>div button").first().click();await expect(strategyDetails.locator(".unknown-word-strategy>article>strong")).toBeVisible();const modeSwitch=page.locator('[data-reading-mode="easy"]');await modeSwitch.getByRole("button",{name:/Prüfungslesen/}).click();await expect(page.locator('[data-reading-mode="exam"]')).toBeVisible();await expect(strategyDetails.locator(".exam-reading-lock")).toBeVisible();await expect(strategyDetails.locator(".unknown-word-strategy")).toHaveCount(0);await page.locator('[data-reading-mode="exam"]').getByRole("button",{name:/Einfach lesen/}).click();

  await page.goto("/path");await waitForLearningReady(page);const grammarMap=page.locator('[data-grammar-map-policy="grammar-progression-map-v1"]');await expect(grammarMap).toBeVisible();await expect(grammarMap.locator(".grammar-level-columns article")).toHaveCount(24);await expect(grammarMap).toContainText("تعلم هذا أولًا");await expect(grammarMap).toContainText("لا حكم CEFR رسميًا");
  await page.goto("/module/a2-1");await waitForLearningReady(page);const recyclingStrip=page.locator('[data-recycling-policy="module-recycling-ratio-v1"]');await expect(recyclingStrip).toContainText("30%");await expect(recyclingStrip).toContainText("3 أسئلة سابقة");await expect(page.locator('[data-recycling-scope="recycled"]')).toHaveCount(3);await expect(page.locator('[data-recycling-scope="current"]')).toHaveCount(7);

  await page.goto("/exams");
  await expect(page.getByRole("heading", { name: /تدرّب على امتحانك/ })).toBeVisible();
  await expect(page.getByText(/Goethe-Zertifikat B2/).first()).toBeVisible();
  await expect(page.getByText(/telc Deutsch B2/).first()).toBeVisible();
  await expect(page.locator(".exam-profile-banner")).toContainText("ملف الصيغة موثّق وحديث");
  await expect(page.locator(".exam-profile-banner")).toContainText("إعادة التحقق قبل 2026-10-03");

  await page.goto("/lernen/a1-14");
  await waitForLearningReady(page);
  for(let step=0;step<2;step+=1)await page.getByRole("button",{name:/أكملت هذه الخطوة/}).click();
  const roomNounPanel = page.locator(".lexical-grammar-panel");
  await expect(roomNounPanel.locator(".additional-noun-anchors")).toContainText("أسماء هدف إضافية موثقة · 11");
  await expect(roomNounPanel).toContainText("Plural Dativ: den Stühlen");
  for(let step=0;step<2;step+=1)await page.getByRole("button",{name:/أكملت هذه الخطوة/}).click();
  const casePanel=page.locator('.meaning-first-case-panel[data-case-policy="meaning-first-case-v1"]');
  await expect(casePanel).toBeVisible();
  await expect(casePanel).toContainText("Bedeutung → Rolle → Form");
  await expect(casePanel.locator(".case-sequence > article")).toHaveCount(3);
  await expect(casePanel.locator(".case-sequence > article").nth(0)).toContainText("هل نصف مكان الشيء الآن");
  await expect(casePanel.locator(".case-sequence > article").nth(2)).toContainText("اختر Dativ");

  await page.goto("/lernen/a1-11");
  await waitForLearningReady(page);
  await page.getByRole("button", { name: /أكملت هذه الخطوة/ }).click();
  await page.getByRole("button", { name: /أكملت هذه الخطوة/ }).click();
  const a1GapFramePanel = page.locator(".lexical-grammar-panel");
  await expect(a1GapFramePanel.locator(".verb-frame-card")).toHaveCount(2);
  await expect(a1GapFramePanel).toContainText("mit der Karte bezahlen");
  await expect(a1GapFramePanel).toContainText("15 مراسي اسم و2 إطار فعل");

  await page.goto("/lernen/a1-04");
  await waitForLearningReady(page);
  await page.getByRole("button", { name: /أكملت هذه الخطوة/ }).click();
  await page.getByRole("button", { name: /أكملت هذه الخطوة/ }).click();
  const pluralOnlyPanel = page.locator(".lexical-grammar-panel");
  const familyExtras = pluralOnlyPanel.locator(".additional-noun-anchors");
  await expect(familyExtras).toContainText("أسماء هدف إضافية موثقة · 8");
  await familyExtras.getByText("Weitere Zielnomen").click();
  await expect(familyExtras).toContainText("die Eltern");
  await expect(familyExtras).toContainText("nur Plural");
  await familyExtras.locator("details").filter({ hasText:"die Eltern" }).getByText(/Kasusformen ansehen/).click();
  await expect(familyExtras).toContainText("den Eltern");

  await page.goto("/lernen/a1-10");
  await waitForLearningReady(page);
  await page.getByRole("button", { name: /أكملت هذه الخطوة/ }).click();
  await page.getByRole("button", { name: /أكملت هذه الخطوة/ }).click();
  const foodNounPanel = page.locator(".lexical-grammar-panel");
  const foodExtras = foodNounPanel.locator(".additional-noun-anchors");
  await expect(foodExtras).toContainText("أسماء هدف إضافية موثقة · 13");
  await foodExtras.getByText("Weitere Zielnomen").click();
  await expect(foodExtras).toContainText("der Apfel");
  await expect(foodExtras).toContainText("das Wasser");

  await page.goto("/lernen/a1-22");
  await waitForLearningReady(page);
  await page.getByRole("button", { name: /أكملت هذه الخطوة/ }).click();
  await page.getByRole("button", { name: /أكملت هذه الخطوة/ }).click();
  const bodyNounPanel = page.locator(".lexical-grammar-panel");
  const bodyExtras = bodyNounPanel.locator(".additional-noun-anchors");
  await expect(bodyExtras).toContainText("أسماء هدف إضافية موثقة · 12");
  await bodyExtras.getByText("Weitere Zielnomen").click();
  await expect(bodyExtras).toContainText("das Auge");
  await expect(bodyExtras).toContainText("die Augen");
  await expect(bodyExtras).toContainText("der Fuß");

  await page.goto("/lernen/a2-05");
  await waitForLearningReady(page);
  await page.getByRole("button", { name: /أكملت هذه الخطوة/ }).click();
  await page.getByRole("button", { name: /أكملت هذه الخطوة/ }).click();
  const a2LexicalPanel = page.locator(".lexical-grammar-panel");
  await expect(a2LexicalPanel.locator(".baseline-nouns > article")).toHaveCount(4);
  await expect(a2LexicalPanel.locator(".verb-frame-card")).toHaveCount(2);
  await expect(a2LexicalPanel).toContainText("die Hausordnung");
  await expect(a2LexicalPanel).toContainText("sich an die Hausordnung halten");
  await expect(a2LexicalPanel).toContainText("auf andere Rücksicht nehmen");
  await expect(a2LexicalPanel).toContainText("14 مراسي اسم و2 إطار فعل");
  const a2Extras = a2LexicalPanel.locator(".additional-noun-anchors");
  await expect(a2Extras).toContainText("أسماء هدف إضافية موثقة · 10");
  await a2Extras.getByText("Weitere Zielnomen").click();
  await expect(a2Extras).toContainText("das Treppenhaus");

  await page.goto("/lernen/b1-02");
  await waitForLearningReady(page);
  await page.getByRole("button", { name: /أكملت هذه الخطوة/ }).click();
  await page.getByRole("button", { name: /أكملت هذه الخطوة/ }).click();
  const b1LexicalPanel = page.locator(".lexical-grammar-panel");
  await expect(b1LexicalPanel.locator(".baseline-nouns > article")).toHaveCount(4);
  await expect(b1LexicalPanel.locator(".verb-frame-card")).toHaveCount(2);
  await expect(b1LexicalPanel).toContainText("die Entscheidung");
  await expect(b1LexicalPanel).toContainText("sich für eine Möglichkeit entscheiden");
  await expect(b1LexicalPanel).toContainText("sich gegen eine Möglichkeit entscheiden");
  await expect(b1LexicalPanel).toContainText("7 مراسي اسم و2 إطار فعل");

  await page.goto("/lernen/b1-01");
  await waitForLearningReady(page);
  await page.getByRole("button", { name: /أكملت هذه الخطوة/ }).click();
  await page.getByRole("button", { name: /أكملت هذه الخطوة/ }).click();
  const biographyNouns = page.locator(".lexical-grammar-panel");
  const biographyExtras = biographyNouns.locator(".additional-noun-anchors");
  await expect(biographyExtras).toContainText("أسماء هدف إضافية موثقة · 8");
  await biographyExtras.getByText("Weitere Zielnomen").click();
  await biographyExtras.locator("details").filter({hasText:"das Studium"}).getByText(/Kasusformen ansehen/).click();
  await expect(biographyExtras).toContainText("des Studiums");

  await page.goto("/lernen/b2-09");
  await waitForLearningReady(page);
  await page.getByRole("button", { name: /أكملت هذه الخطوة/ }).click();
  await page.getByRole("button", { name: /أكملت هذه الخطوة/ }).click();
  const b2LexicalPanel = page.locator(".lexical-grammar-panel");
  await expect(b2LexicalPanel.locator(".baseline-nouns > article")).toHaveCount(4);
  await expect(b2LexicalPanel.locator(".verb-frame-card")).toHaveCount(2);
  await expect(b2LexicalPanel).toContainText("die Perspektive");
  await expect(b2LexicalPanel).toContainText("von Erfahrungen geprägt sein");
  await expect(b2LexicalPanel).toContainText("von der Situation abhängen");
  await expect(b2LexicalPanel).toContainText("A1–B2");
});

test("bilingual local search ranks German and Arabic results and returns to context", async ({ page }) => {
  test.setTimeout(90_000);
  await page.goto("/search");
  await expect(page.getByRole("heading", { name: /ابحث عن العبارة/ })).toBeVisible();
  await expect(page.getByText(/3[.,]?080/)).toBeVisible();
  const grammarGlossary=page.locator('[data-grammar-glossary-policy="bilingual-grammar-glossary-v1"]');
  await expect(grammarGlossary).toContainText("قاموس مصطلحات القواعد");
  await grammarGlossary.locator("summary").click();
  await expect(grammarGlossary.locator(".grammar-glossary-grid article")).toHaveCount(24);
  await grammarGlossary.getByRole("button",{name:"A2",exact:true}).click();
  await expect(grammarGlossary.locator(".grammar-glossary-grid article")).toHaveCount(6);
  await grammarGlossary.getByPlaceholder(/Dativ/).fill("Dativ");
  await expect(grammarGlossary.locator(".grammar-glossary-grid article")).toHaveCount(1);
  await expect(grammarGlossary).toContainText("حالة المفعول غير المباشر");
  const explorer=page.locator('[data-lexical-strategy-policy="lexical-strategy-registry-v1"]');
  await expect(explorer).toBeVisible();await expect(explorer.locator(".word-family-card")).toHaveCount(8);await expect(explorer).toContainText("wohnen");
  await explorer.getByRole("button",{name:/Register.*السجل/}).click();await expect(explorer.locator('[data-language-register]')).toHaveCount(8);await explorer.getByRole("button",{name:/umgangssprachlich.*محادثي/}).click();await expect(explorer.locator('[data-language-register="colloquial"]')).toHaveCount(2);await expect(explorer).toContainText("تعتمد العمر والعلاقة والمنطقة");
  await explorer.getByRole("button",{name:/Nicht verwechseln.*كلمات مربكة/}).click();await expect(explorer.locator(".confusion-grid article")).toHaveCount(6);await expect(explorer).toContainText("لا نفترض أن كل متعلم عربي يرتكبها");
  await explorer.getByRole("button",{name:/Wiederverwenden.*إعادة التدوير/}).click();await expect(explorer.locator('[data-recycling-policy="module-recycling-ratio-v1"]')).toHaveCount(8);await expect(explorer.locator(".recycling-module-grid article").nth(0)).toContainText("0%");await expect(explorer.locator(".recycling-module-grid article").nth(1)).toContainText("20%");
  const practical=page.locator('[data-practical-context-policy="practical-context-registry-v1"]');await expect(practical.locator("article")).toHaveCount(4);await expect(practical).toContainText("مراجعة مستقلة معلقة");await practical.getByRole("button",{name:/النماذج والإشعارات/}).click();await expect(practical.locator("article")).toHaveCount(5);await expect(practical).toContainText("استخدم بيانات تدريبية");
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

test("visual accessibility preferences preview immediately, persist, reset, and respect system motion", async ({ page }) => {
  await page.goto("/settings");
  await waitForLearningReady(page);
  const frame = page.locator(".app-frame");
  const preview = page.locator("[data-accessibility-preview]");
  const quickSize = page.getByRole("group", { name: "تغيير حجم النص" });
  await expect(quickSize).toBeVisible();
  await quickSize.getByRole("button", { name: "أصغر" }).click();
  await expect(frame).toHaveAttribute("data-font-scale", "compact");
  await quickSize.getByRole("button", { name: "مريح" }).click();
  await expect(frame).toHaveAttribute("data-font-scale", "default");
  const germanSample = preview.getByText("Heute lerne ich Schritt für Schritt.", { exact: true });
  const initialFontSize = await germanSample.evaluate((element) => Number.parseFloat(getComputedStyle(element).fontSize));

  await page.locator(".accessibility-preferences-card").getByRole("button", { name: /أكبر/ }).click();
  await expect(frame).toHaveAttribute("data-font-scale", "large");
  await expect.poll(() => germanSample.evaluate((element) => Number.parseFloat(getComputedStyle(element).fontSize))).toBeGreaterThan(initialFontSize * 1.15);

  await page.getByRole("checkbox", { name: /تباين أعلى/ }).check();
  await expect(frame).toHaveAttribute("data-high-contrast", "true");
  await expect(page.locator(".accessibility-preferences-card")).toHaveCSS("box-shadow", "none");

  await page.getByRole("checkbox", { name: /حركة مخفضة/ }).check();
  await expect(frame).toHaveAttribute("data-reduced-motion", "true");
  await expect(preview).toHaveAttribute("data-motion", "reduced");
  await expect(page.locator(".accessibility-preview-orb")).toHaveCSS("animation-name", "none");
  await expect(page.getByRole("status").filter({ hasText: /تم تقليل الحركة/ })).toBeVisible();

  await expect.poll(() => page.evaluate(() => new Promise<unknown>((resolve, reject) => {
    const open = indexedDB.open("der-weg-nach-berlin", 4);
    open.onerror = () => reject(open.error);
    open.onsuccess = () => {
      const request = open.result.transaction("learning-state", "readonly").objectStore("learning-state").get("primary");
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result.accessibilityPreferences);
    };
  }))).toEqual({ policyVersion: "accessibility-preferences-v1", fontScale: "large", highContrast: true, reducedMotion: true });

  await page.reload();
  await waitForLearningReady(page);
  await expect(frame).toHaveAttribute("data-font-scale", "large");
  await expect(frame).toHaveAttribute("data-high-contrast", "true");
  await expect(frame).toHaveAttribute("data-reduced-motion", "true");
  const axe = await new AxeBuilder({ page }).include("main").withTags(["wcag2a", "wcag2aa"]).analyze();
  expect(axe.violations.filter((item) => item.impact === "serious" || item.impact === "critical")).toEqual([]);

  await page.setViewportSize({ width: 320, height: 568 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(await page.evaluate(() => document.documentElement.clientWidth + 1));
  await page.getByRole("button", { name: "إعادة الضبط" }).click();
  await expect(frame).toHaveAttribute("data-font-scale", "default");
  await expect(frame).toHaveAttribute("data-high-contrast", "false");
  await expect(frame).toHaveAttribute("data-reduced-motion", "false");

  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(preview).toHaveAttribute("data-motion", "reduced");

  const motivation=page.locator('[data-motivation-policy="gamification-visibility-v1"]');
  await motivation.getByRole("button",{name:/واجهة هادئة بالكامل/}).click();
  await expect(frame).toHaveAttribute("data-gamification-visible","false");
  await expect(motivation).toContainText("تبقى المهمة، الشروط، النتائج والتنبيهات الوظيفية فقط");
  await expect.poll(()=>page.evaluate(()=>new Promise<unknown>((resolve,reject)=>{const open=indexedDB.open("der-weg-nach-berlin",4);open.onerror=()=>reject(open.error);open.onsuccess=()=>{const request=open.result.transaction("learning-state","readonly").objectStore("learning-state").get("primary");request.onerror=()=>reject(request.error);request.onsuccess=()=>resolve(request.result.motivationPreferences)}}))).toEqual({policyVersion:"gamification-visibility-v1",gamificationVisible:false});
  await page.goto("/progress");await waitForLearningReady(page);
  await expect(page.locator('[data-achievement-policy="evidence-derived-achievement-v1"]')).toHaveCount(0);
  await expect(page.locator(".evidence-overview")).toBeVisible();
  await page.goto("/today");await waitForLearningReady(page);
  await expect(page.locator(".gamification-surface:visible")).toHaveCount(0);
  await expect(page.locator("#main-content")).toBeVisible();
  await page.reload();await waitForLearningReady(page);
  await expect(frame).toHaveAttribute("data-gamification-visible","false");
  await page.goto("/settings");await waitForLearningReady(page);
  await page.getByRole("button",{name:/إعادة إظهار الوضع الافتراضي/}).click();
  await expect(frame).toHaveAttribute("data-gamification-visible","true");
  await page.goto("/progress");await waitForLearningReady(page);
  await expect(page.locator('[data-achievement-policy="evidence-derived-achievement-v1"]')).toBeVisible();
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
      const now=new Date();
      state.profile={name:"Nadia",targetExam:"goethe-b2",dailyMinutes:45,arabicSupport:"modern-standard-arabic",currentLevel:"B2",createdAt:new Date(now.getTime()-20*86_400_000).toISOString()};
      state.diagnosticResult={estimatedLevel:"B2",score:16,maxScore:16,levelScores:{A1:4,A2:4,B1:4,B2:4},completedAt:now.toISOString()};
      state.studyHistory=[18,15,12,9,6,3].map((daysAgo)=>({date:new Date(now.getTime()-daysAgo*86_400_000).toISOString().slice(0,10),minutes:30,evidenceCount:2}));
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
  const forecast=board.locator('[data-readiness-forecast-policy="evidence-velocity-readiness-range-v1"]');
  await expect(forecast).toBeVisible();
  await expect(forecast).toContainText(/نطاق التخطيط الحالي نحو \d+–\d+ أسابيع/);
  await expect(forecast).toContainText("ليس موعد نجاح");

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
  const onboardingAudio = page.getByLabel("عينة فحص الصوت الألماني", { exact:true });
  expect(await onboardingAudio.evaluate((audio: HTMLAudioElement) => audio.duration)).toBeGreaterThan(1);
  await page.locator(".resilient-audio").getByRole("button", { name:"0.75×" }).click();
  expect(await onboardingAudio.evaluate((audio: HTMLAudioElement) => ({ rate:audio.playbackRate,preservesPitch:audio.preservesPitch }))).toEqual({ rate:0.75,preservesPitch:true });
  await page.getByLabel("كيف نناديك؟").fill("Nadia");
  await page.getByRole("button", { name: /أعرف بعض الأساسيات/ }).click();
  await page.locator(".onboarding-context summary").click();
  await page.getByRole("button",{name:"كتاب",exact:true}).click();
  await page.getByRole("button",{name:"دورة مع مدرس",exact:true}).click();
  await page.getByLabel("اسم كتاب أو دورة إن أردت").fill("كتاب قديم ودورة مسائية");
  await page.getByRole("button",{name:"الكلام",exact:true}).click();
  await page.getByRole("button",{name:"ضيق الوقت",exact:true}).click();
  await page.getByLabel("الدعم العربي").selectOption("tunisian-supported");
  await expect(page.locator(".arabic-support-choice")).toContainText("ملاحظة تونسية قصيرة");
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
      request.onsuccess = () => resolve({ goals: request.result?.profile?.goals, priorExperience: request.result?.profile?.priorExperience, onboardingContext:request.result?.profile?.onboardingContext, arabicSupport: request.result?.profile?.arabicSupport, deviceReadiness: request.result?.profile?.deviceReadiness });
    };
  }))).toEqual({ goals: ["exam", "work"], priorExperience: "some", onboardingContext:{policyVersion:"prior-experience-context-v1",priorLearningSources:["book","course"],priorCourseOrBookNote:"كتاب قديم ودورة مسائية",concerns:["speaking","time"],evidenceBoundary:"learner-stated-planning-context-no-level-or-mastery"}, arabicSupport: "tunisian-supported", deviceReadiness: { audio: "skipped", microphone: "skipped", checkedAt: expect.any(String) } });

  await page.goto("/lernen/a1-01");
  await waitForLearningReady(page);
  for (let step = 0; step < 4; step += 1) await page.getByRole("button", { name: /أكملت هذه الخطوة/ }).click();
  const tunisianPanel = page.locator('[data-tunisian-policy="tunisian-support-v1"]');
  await expect(tunisianPanel).toBeVisible();
  await expect(tunisianPanel).toContainText("بالتونسي للتقريب");
  await expect(tunisianPanel).toContainText("شنوّة اسمك؟");
  await expect(tunisianPanel).toContainText("مراجعة مستقلة معلّقة");
  await expect(tunisianPanel.locator('[lang="ar-TN"][dir="rtl"]')).toBeVisible();
  await expect(tunisianPanel.locator('[lang="de"][dir="ltr"]')).toHaveCount(3);
});

test("an absolute beginner starts A1 step by step and never receives an isolated writing demand", async ({ page }) => {
  await page.goto("/today");
  await waitForLearningReady(page);
  await page.getByLabel("كيف نناديك؟").fill("مبتدئ");
  await expect(page.getByRole("button", { name: /أبدأ من الصفر/ })).toHaveAttribute("aria-pressed", "true");
  await page.getByRole("button", { name: /تخطَّ الفحص/ }).click();
  await page.getByRole("button", { name: /ابدأ معي من الصفر/ }).click();
  await expect(page.getByText(/لن نختبرك أو نطلب منك كتابة ألمانية الآن/)).toBeVisible();
  const journey=page.locator('[data-journey-policy="journey-state-machine-v1"]');
  await expect(journey.locator("nav > span")).toHaveCount(5);
  await expect(journey.locator('[aria-current="step"]')).toContainText("بناء الأساس");
  await expect(journey).toContainText("مرحلة مشتقة من أدلة محلية");
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
  expect(await page.getByLabel("مقطع التشخيص مواعيد الفتح", { exact:true }).evaluate((audio: HTMLAudioElement) => audio.duration)).toBeGreaterThan(10);
  await expect(page.getByRole("button", { name: /تشغيل صوت المتصفح البديل/ })).toBeVisible();
  await page.getByText("Um acht", { exact: true }).click();
  await page.getByRole("button", { name: /قيّم هذا المستوى/ }).click();

  const productiveSample=page.locator(".diagnostic-productive-sample");
  await expect(productiveSample).toHaveAttribute("data-productive-policy","diagnostic-productive-sample-v1");
  await expect(productiveSample).toContainText("Produktionsprobe ohne Note");
  await expect(productiveSample).toContainText("Stellen Sie sich in ein bis drei Sätzen vor");
  await productiveSample.getByLabel(/Kurze Schreibprobe/).fill("Ich heiße Nadia. Ich lerne Deutsch.");
  await productiveSample.getByRole("button",{name:"دون مساعدة"}).click();
  await productiveSample.getByRole("button",{name:/حفظ العينة وعرض نتيجة الفهم/}).click();

  await expect(page.getByRole("heading", { name: /نقطة البداية المقترحة.*A1/ })).toBeVisible();
  await expect(page.locator('.diagnostic-result [data-status-policy="status-announcement-v1"]')).toBeVisible();
  await expect(page.locator('.diagnostic-result [role="status"]')).toHaveAttribute("aria-atomic","true");
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
  }))).toMatchObject({ formId:"A",questionsAnswered:4,stoppedEarly:true,confidence:"low",levelAttempted:{A1:4,A2:0,B1:0,B2:0},productiveSample:{policyVersion:"diagnostic-productive-sample-v1",mode:"writing",writingWordCount:6,selfAssessment:"independent",evaluationBoundary:"self-evidence-no-automated-language-score"} });
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

  await expect(page.getByLabel("أوامر متابعة آخر جواب")).toBeVisible();
  await page.getByRole("button", { name: "Einfacher · اشرح أبسط" }).click();
  await expect(page.getByRole("dialog").getByRole("heading", { name: "موافقة مطلوبة قبل إرسال النص" })).toBeVisible();
  await expect(page.getByRole("dialog")).toContainText("آخر سؤال مرتبط");
  await expect(page.getByRole("dialog")).toContainText("لا تُرسل أخطاء نشطة أو مفتاح إجابة التمرين");
  expect(networkRequests).toBe(1);
  await page.getByRole("button", { name: "أوافق وأرسل مرة واحدة" }).click();
  await expect(page.locator(".structured-tutor-answer")).toHaveCount(2);
  await expect(page.locator(".structured-tutor-answer").last()).toContainText("tutor-follow-up-command-v1");
  expect(networkRequests).toBe(2);
  await expect.poll(() => page.evaluate(() => new Promise<unknown>((resolve, reject) => {
    const open = indexedDB.open("der-weg-nach-berlin", 4);
    open.onerror = () => reject(open.error);
    open.onsuccess = () => {
      const request = open.result.transaction("learning-state", "readonly").objectStore("learning-state").get("primary");
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const interactions = request.result.tutorInteractions;
        resolve({
          count: interactions.length,
          linked: interactions[1]?.parentInteractionId === interactions[0]?.id,
          command: interactions[1],
          mastery: request.result.mastery,
        });
      };
    };
  }))).toMatchObject({
    count: 2,
    linked: true,
    command: {
      command: "simpler",
      promptVersion: "tutor-follow-up-command-v1",
      commandPolicyVersion: "tutor-follow-up-command-v1",
      evidenceBoundary: "support-only-no-answer-key-no-mastery-or-correctness",
      consent: "explicit",
      errorIds: [],
    },
    mastery: defaultState.mastery,
  });

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
  const capabilityMatrix = page.locator('[data-capability-policy="ai-provider-capability-matrix-v1"]');
  await expect(capabilityMatrix).toBeVisible();
  await expect(capabilityMatrix.locator("[data-provider-capability]")).toHaveCount(5);
  await expect(capabilityMatrix.locator('[data-provider-capability="gemini"]')).toContainText("gemini-2.5-flash");
  await expect(capabilityMatrix.locator('[data-provider-capability="openrouter"]')).toContainText("openrouter/free");
  await expect(capabilityMatrix.locator('[data-provider-capability="browser-webgpu"]')).toContainText("ليس مرشدًا مولدًا");
  await expect(capabilityMatrix).toContainText("لا تعرض المنصة «حصة متبقية الآن»");
  const settingsStatus=page.locator(".status-announcement > span:not(.sr-only)");
  await page.getByRole("button", { name: "حذف الصوت والنص المصدر" }).click();
  await expect(page.getByRole("dialog").getByRole("heading", { name: "حذف التسجيلات ونصوص المتابعة الآن؟" })).toBeVisible();
  await page.getByRole("button", { name: "نعم، احذف الصوت والنص" }).click();
  await expect(settingsStatus.filter({hasText:/حُذفت فورًا 1 تسجيلات مرتبطة و0 مقتطفات متابعة/})).toBeVisible();
  await page.getByRole("button", { name: "حذف سجل المعلم" }).click();
  await expect(page.getByRole("dialog").getByRole("heading", { name: "حذف سجل المرشد الآن؟" })).toBeVisible();
  await page.getByRole("button", { name: "نعم، احذف سجل المرشد" }).click();
  await expect(settingsStatus.filter({hasText:/حُذف فورًا سجل المرشد المحلي/})).toBeVisible();
  await page.getByRole("button", { name: "حذف المفتاح الآن" }).click();
  await expect(settingsStatus.filter({hasText:/حُذف المفتاح أو العنوان فورًا/})).toBeVisible();
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

test("optional AI 429 falls back locally once and retry requires fresh consent", async ({ page }) => {
  let requests=0;await page.route("https://openrouter.ai/api/v1/chat/completions",async route=>{requests+=1;await route.fulfill({status:429,body:"rate limit"})});
  await page.goto("/tutor");await waitForLearningReady(page);
  await page.evaluate((baseState)=>new Promise<void>((resolve,reject)=>{const state=structuredClone(baseState);state.aiSettings={provider:"openrouter",model:"openrouter/free",enabledFeatures:["tutor"]};state.profile={name:"Nadia",targetExam:"goethe-b2",dailyMinutes:45,arabicSupport:"modern-standard-arabic",currentLevel:"A1",createdAt:"2026-08-01T00:00:00Z"};sessionStorage.setItem("dwnb-ai-key","test-key");const open=indexedDB.open("der-weg-nach-berlin",4);open.onerror=()=>reject(open.error);open.onsuccess=()=>{const tx=open.result.transaction("learning-state","readwrite");tx.objectStore("learning-state").put(state,"primary");tx.oncomplete=()=>resolve();tx.onerror=()=>reject(tx.error)}}),structuredClone(defaultState));
  await page.reload();await waitForLearningReady(page);await page.getByLabel("سؤال المرشد").fill("اشرح weil");await page.getByRole("button",{name:"إرسال السؤال"}).click();await page.getByRole("button",{name:"أوافق وأرسل مرة واحدة"}).click();
  await expect(page.locator(".structured-tutor-answer")).toContainText("المرشد المحلي المدمج");await expect(page.locator(".tutor-fallback-notice")).toContainText("حد الطلبات 429");await expect(page.locator(".tutor-fallback-notice")).toContainText("دون إرسال ثانٍ");expect(requests).toBe(1);
  await page.getByRole("button",{name:"أعد الشبكة بموافقة جديدة"}).click();await expect(page.getByRole("dialog").getByRole("heading",{name:"موافقة مطلوبة قبل إرسال النص"})).toBeVisible();expect(requests).toBe(1);await page.getByRole("button",{name:"إلغاء الإرسال"}).click();
  await expect.poll(()=>page.evaluate(()=>new Promise<unknown>((resolve,reject)=>{const open=indexedDB.open("der-weg-nach-berlin",4);open.onerror=()=>reject(open.error);open.onsuccess=()=>{const request=open.result.transaction("learning-state","readonly").objectStore("learning-state").get("primary");request.onerror=()=>reject(request.error);request.onsuccess=()=>resolve(request.result.tutorInteractions[0])}}))).toMatchObject({provider:"disabled",model:"local-rules-v2",consent:"explicit",fallbackEvidence:{policyVersion:"ai-resilient-fallback-v1",attemptedProvider:"openrouter",attemptedModel:"openrouter/free",failureKind:"rate-limit",httpStatus:429,networkAttemptCount:1,fallbackProvider:"disabled",retryRequiresNewConsent:true}});
});

test("P0 daily check-in rebalances load and reflection stores tomorrow's decision", async ({ page }) => {
  await page.clock.setFixedTime(new Date("2026-09-02T09:00:00Z"));
  await page.goto("/today");
  await waitForLearningReady(page);
  await page.evaluate((baseState) => new Promise<void>((resolve, reject) => {
    const open = indexedDB.open("der-weg-nach-berlin", 4);
    open.onerror = () => reject(open.error);
    open.onsuccess = () => {
      const state = structuredClone(baseState);
      state.profile = { name:"Nadia",targetExam:"goethe-b2",dailyMinutes:45,arabicSupport:"modern-standard-arabic",currentLevel:"A1",goals:["exam","work"],createdAt:new Date().toISOString() };
      state.diagnosticResult = { estimatedLevel:"A1",score:3,maxScore:4,levelScores:{A1:3,A2:0,B1:0,B2:0},completedAt:new Date().toISOString() };
      state.completedLessonIds = [];
      const transaction = open.result.transaction("learning-state", "readwrite");
      transaction.objectStore("learning-state").put(state, "primary");
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    };
  }), structuredClone(defaultState));
  await page.reload();
  await waitForLearningReady(page);
  const todayOffline=page.locator('[data-offline-readiness-policy="today-session-offline-readiness-v1"]');
  await expect(todayOffline).toBeVisible();
  await expect(todayOffline).toContainText(/لن ندّعي الجاهزية|تحقق Service Worker/,{timeout:15_000});
  await expect(page.getByText("نحو 45 دقيقة")).toBeVisible();
  const warmup=page.locator(".retrieval-warmup-card");
  await expect(warmup).toHaveAttribute("data-warmup-policy","pre-srs-retrieval-warmup-v1");
  await expect(warmup).toContainText("Abruf-Warm-up");
  await expect(warmup).toContainText("Sagen Sie die deutsche Wendung.");
  for(let item=0;item<3;item+=1){await warmup.getByRole("button",{name:"اكشف بعد محاولة الاسترجاع"}).click();await expect(warmup.locator(".warmup-prompt > p")).toBeVisible();await warmup.getByRole("button",{name:item===1?"تذكرتها قبل الكشف":"أحتاج إعادتها"}).click()}
  await expect(warmup.getByRole("status")).toContainText("حاولت استرجاع ثلاث عبارات");
  await expect(page.locator(".continuity-policy")).toContainText("weekly-grace-v1");
  await expect(page.locator(".continuity-policy")).toContainText("يوم السماح");

  const checkIn = page.locator(".session-signal-card").filter({ hasText:"تهيئة سريعة" });
  await checkIn.locator(".signal-scale button").nth(3).click();
  await checkIn.getByRole("combobox").selectOption("60");
  await checkIn.getByRole("button", { name:/ثبّت تهيئة اليوم/ }).click();
  await expect(page.getByText("نحو 60 دقيقة")).toBeVisible();
  const adaptation=page.locator('[data-adaptation-policy="session-adaptation-v1"]');
  await adaptation.getByRole("button",{name:/لدي وقت أقل/}).click();
  await expect(adaptation).toContainText("من 60 إلى 45 دقيقة");
  await expect(page.getByText("نحو 45 دقيقة")).toBeVisible();
  await adaptation.getByRole("button",{name:/هذا سهل/}).click();
  await expect(adaptation).toContainText("لم يتغير الإتقان");
  const originalPractice=page.locator(".mission-row-shell").filter({hasText:"تثبيت موجّه"});
  await expect(originalPractice.locator(".mission-row")).toContainText("5 د");
  await originalPractice.getByRole("button",{name:"لا يناسبني الآن"}).click();
  const alternativePractice=page.locator(".mission-row-shell.alternative").filter({hasText:"بديل التدريب"});
  await expect(alternativePractice).toContainText("الأصل غير مكتمل");
  await expect(alternativePractice.locator(".mission-row")).toContainText("5 د");
  await expect.poll(()=>page.evaluate(()=>new Promise<unknown>((resolve,reject)=>{const open=indexedDB.open("der-weg-nach-berlin",4);open.onerror=()=>reject(open.error);open.onsuccess=()=>{const request=open.result.transaction("learning-state","readonly").objectStore("learning-state").get("primary");request.onerror=()=>reject(request.error);request.onsuccess=()=>{const session=Object.values(request.result.dailySessions)[0] as {missionAlternatives?:unknown[]};resolve({alternatives:session.missionAlternatives,completedOriginal:request.result.completedBlockIds.some((id:string)=>id.endsWith(":practice"))})}}}))).toMatchObject({alternatives:[{policyVersion:"equivalent-mission-alternative-v1",originalBlockId:"practice",alternativeBlockId:"alternative-practice",evidenceKind:"controlled-practice",minutes:5,originalCompletedAtSelection:false,evidenceBoundary:"planning-substitution-no-completion-mastery-or-correctness"}],completedOriginal:false});
  const timeline=page.locator('[data-plan-change-policy="explainable-plan-change-timeline-v1"]');
  await expect(timeline).toContainText("لماذا تغيرت خطتي؟");
  await timeline.locator("summary").click();
  await expect(timeline).toContainText("تغيير بقية الجلسة");
  await expect(timeline).toContainText("اختيار مهمة بديلة");
  await expect(timeline).toContainText("60 → 45 دقيقة");
  const readingBenchmark=page.locator('[data-reading-benchmark-policy="reading-comprehension-benchmark-v1"]');
  await readingBenchmark.getByRole("button",{name:/ابدأ القراءة والمؤقت/}).click();
  await expect(readingBenchmark.locator(".reading-benchmark-reading article")).toBeVisible();
  await page.waitForTimeout(5_100);
  await readingBenchmark.getByRole("button",{name:/انتهيت.*افتح أسئلة الفهم/}).click();
  const benchmarkItem=readingLibrary.find((item)=>item.level==="A1")!;
  for(let index=0;index<2;index+=1)await readingBenchmark.locator("fieldset").nth(index).getByRole("button",{name:benchmarkItem.questions[index].options[benchmarkItem.questions[index].correctIndex],exact:true}).click();
  await readingBenchmark.getByRole("button",{name:/تحقق واحفظ/}).click();
  await expect(readingBenchmark).toContainText("مع فهم 2/2");
  await expect(page.locator(".mission-row").filter({hasText:"قراءة بطول مناسب"})).toContainText("5 د");
  await expect.poll(()=>page.evaluate(()=>new Promise<unknown>((resolve,reject)=>{const open=indexedDB.open("der-weg-nach-berlin",4);open.onerror=()=>reject(open.error);open.onsuccess=()=>{const request=open.result.transaction("learning-state","readonly").objectStore("learning-state").get("primary");request.onerror=()=>reject(request.error);request.onsuccess=()=>resolve(request.result.readingBenchmarkAttempts[0])}}))).toMatchObject({policyVersion:"reading-comprehension-benchmark-v1",qualified:true,comprehensionCorrect:2,comprehensionTotal:2,recommendedReadingMinutes:5,timingSource:"visible-performance-timer",evidenceBoundary:"planning-only-no-cefr-or-mastery"});
  const benchmarkAxe=await new AxeBuilder({page}).include(".reading-benchmark-card").withTags(["wcag2a","wcag2aa"]).analyze();
  expect(benchmarkAxe.violations.filter((item)=>item.impact==="serious"||item.impact==="critical")).toEqual([]);
  await adaptation.getByRole("button",{name:/هذا صعب/}).click();
  await expect(adaptation).toContainText("من 45 إلى 20 دقيقة");
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
  await expect(timeline).toContainText("قرار الجلسة التالية");
  await expect(timeline).not.toContainText("الاستماع كان مرهقًا");

  await expect.poll(() => page.evaluate(() => new Promise<unknown>((resolve, reject) => {
    const open = indexedDB.open("der-weg-nach-berlin", 4);
    open.onerror = () => reject(open.error);
    open.onsuccess = () => {
      const request = open.result.transaction("learning-state", "readonly").objectStore("learning-state").get("primary");
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(Object.values(request.result?.dailySessions ?? {})[0]);
    };
  }))).toMatchObject({ availableMinutes:20,energyBefore:4,planningSignal:"too-hard",adaptations:[{policyVersion:"session-adaptation-v1",reason:"less-time",beforeMinutes:60,afterMinutes:45,evidenceBoundary:"planning-signal-no-mastery-or-correctness"},{policyVersion:"session-adaptation-v1",reason:"too-easy",beforeMinutes:45,afterMinutes:45,evidenceBoundary:"planning-signal-no-mastery-or-correctness"},{policyVersion:"session-adaptation-v1",reason:"too-hard",beforeMinutes:45,afterMinutes:20,evidenceBoundary:"planning-signal-no-mastery-or-correctness"}],difficultyAfter:5,confidenceAfter:2,nextFocus:"lighter" });
});

test("P2 partial-closure guidance surfaces persist bounded local decisions",async({page})=>{
  await page.clock.setFixedTime(new Date("2026-09-10T10:00:00Z"));
  await page.goto("/today");await waitForLearningReady(page);
  await page.evaluate((baseState)=>new Promise<void>((resolve,reject)=>{const open=indexedDB.open("der-weg-nach-berlin",4);open.onerror=()=>reject(open.error);open.onsuccess=()=>{const state=structuredClone(baseState);state.profile={name:"Nadia",targetExam:"goethe-b2",targetDate:"2027-09-10",dailyMinutes:45,arabicSupport:"modern-standard-arabic",currentLevel:"A1",priorExperience:"none",createdAt:"2026-09-01T00:00:00Z"};state.diagnosticResult={estimatedLevel:"A1",score:3,maxScore:4,levelScores:{A1:3,A2:0,B1:0,B2:0},completedAt:"2026-09-01T00:00:00Z"};const tx=open.result.transaction("learning-state","readwrite");tx.objectStore("learning-state").put(state,"primary");tx.oncomplete=()=>resolve();tx.onerror=()=>reject(tx.error)};}),structuredClone(defaultState));
  await page.reload();await waitForLearningReady(page);
  const focusTools=page.locator('[data-focus-tools-policy="guidance-focus-tools-v1"]');await expect(focusTools).toBeVisible();await expect(focusTools.locator('[data-quick-practice-policy="weakest-target-five-minute-practice-v1"]')).toContainText("5 د");await focusTools.getByRole("button",{name:/صباح سريع/}).click();await expect(focusTools.locator(".routine-mode-action")).toContainText("ابدأ خمس دقائق");await focusTools.getByRole("button",{name:/ثبّت المهمة/}).click();await expect(focusTools.locator('[data-pinned-task-policy="learner-pinned-task-v1"]')).toContainText("التثبيت لا يستبدل توصية المدرب");await expect(focusTools.locator('[data-exam-countdown-policy="exam-countdown-12-8-4-1-v1"]')).toBeVisible();await expect(focusTools.locator('[data-extra-time-policy="local-extra-thirty-minutes-what-if-v1"]')).toContainText("30 دقيقة إضافية");
  const rescue=page.locator('[data-rescue-day-policy="save-my-day-ten-minute-v1"]');await expect(rescue).toBeVisible();await rescue.getByRole("button",{name:/فعّل جلسة الإنقاذ/}).click();await expect(page.getByText("نحو 10 دقيقة")).toBeVisible();
  const weekly=page.locator('[data-weekly-reflection-policy="independent-weekly-reflection-v1"]');await expect(weekly).toBeVisible();await weekly.getByText("الاسترجاع",{exact:true}).click();await weekly.getByText("الوقت",{exact:true}).click();await weekly.getByRole("combobox").selectOption("lighter-plan");await weekly.getByRole("textbox").fill("أثبت وقتًا أقصر في الأسبوع القادم.");await weekly.getByRole("button",{name:/احفظ تأمل الأسبوع/}).click();await expect(weekly.getByRole("status")).toContainText("لم ننسخ ملاحظة الإغلاق اليومية");
  await expect.poll(()=>page.evaluate(()=>new Promise<unknown>((resolve,reject)=>{const open=indexedDB.open("der-weg-nach-berlin",4);open.onerror=()=>reject(open.error);open.onsuccess=()=>{const req=open.result.transaction("learning-state","readonly").objectStore("learning-state").get("primary");req.onerror=()=>reject(req.error);req.onsuccess=()=>resolve({reflection:req.result.weeklyReflections[0],rescue:Object.values(req.result.dailySessions)[0],pinned:req.result.pinnedLearningTask,routine:req.result.studyRoutineMode})}}))).toMatchObject({reflection:{policyVersion:"independent-weekly-reflection-v1",oneAdjustment:"lighter-plan",source:"weekly-form-only",dailyReflectionReuseConsent:false},rescue:{availableMinutes:10,rescueMode:{policyVersion:"save-my-day-ten-minute-v1"}},pinned:{policyVersion:"learner-pinned-task-v1"},routine:{policyVersion:"learner-selected-morning-evening-mode-v1",mode:"morning-quick"}});
  await page.goto("/settings");await waitForLearningReady(page);const low=page.locator('[data-data-usage-policy="persisted-low-data-mode-v1"]');await low.getByRole("checkbox").check();await expect(page.locator(".app-frame")).toHaveAttribute("data-low-data-mode","true");await expect(page.locator('[data-raw-export-policy="raw-indexeddb-store-export-v1"]')).toBeVisible();await expect(page.getByRole("link",{name:"اقرأ سياسة الخصوصية"})).toHaveAttribute("href","/privacy");
  await page.goto("/practice/practical-day");await expect(page.getByRole("heading",{name:/سكن وعمل وإدارة/})).toBeVisible();await expect(page.locator('[data-practical-day-policy="multi-step-practical-day-mode-v1"] nav button')).toHaveCount(3);
  await page.goto("/path");await waitForLearningReady(page);await expect(page.locator('[data-concept-map-policy="interactive-grammar-vocabulary-concept-map-v1"]')).toBeVisible();
  await page.goto("/status");await expect(page.locator('[data-delivery-health-policy="unified-delivery-health-dashboard-v1"]')).toBeVisible();
});

test("P1 repeated session errors offer one learner-controlled load reduction without penalty",async({page})=>{
  await page.clock.setFixedTime(new Date("2026-09-03T09:10:00Z"));await page.goto("/today");await waitForLearningReady(page);
  await page.evaluate((baseState)=>new Promise<void>((resolve,reject)=>{const open=indexedDB.open("der-weg-nach-berlin",4);open.onerror=()=>reject(open.error);open.onsuccess=()=>{const state=structuredClone(baseState);state.profile={name:"Nadia",targetExam:"goethe-b2",dailyMinutes:45,arabicSupport:"modern-standard-arabic",currentLevel:"A1",createdAt:"2026-09-01T00:00:00.000Z"};state.diagnosticResult={estimatedLevel:"A1",score:3,maxScore:4,levelScores:{A1:3,A2:0,B1:0,B2:0},completedAt:"2026-09-01T00:00:00.000Z"};state.dailySessions["2026-09-03"]={date:"2026-09-03",availableMinutes:45,energyBefore:4,checkedInAt:"2026-09-03T09:00:00.000Z"};state.exerciseAttempts=[1,2,3].map((item)=>({id:`session-wrong-${item}`,lessonId:"a1-01",exerciseId:`a1-01-e${item}`,answer:"x",correct:false,createdAt:`2026-09-03T09:0${item}:00.000Z`}));const tx=open.result.transaction("learning-state","readwrite");tx.objectStore("learning-state").put(state,"primary");tx.oncomplete=()=>resolve();tx.onerror=()=>reject(tx.error)};}),structuredClone(defaultState));
  await page.reload();await waitForLearningReady(page);const offer=page.locator('[data-load-offer-policy="automatic-load-reduction-offer-v1"]');await expect(offer).toBeVisible({timeout:15_000});await expect(offer).toContainText("3 إجابات غير صحيحة متتالية");await offer.getByRole("button",{name:"لا، أبقِ خطتي"}).click();await expect(offer).toBeHidden();
  await expect.poll(()=>page.evaluate(()=>new Promise<unknown>((resolve,reject)=>{const open=indexedDB.open("der-weg-nach-berlin",4);open.onerror=()=>reject(open.error);open.onsuccess=()=>{const request=open.result.transaction("learning-state","readonly").objectStore("learning-state").get("primary");request.onerror=()=>reject(request.error);request.onsuccess=()=>resolve({offer:request.result.dailySessions["2026-09-03"].loadReductionOffer,adaptations:request.result.dailySessions["2026-09-03"].adaptations??[],attempts:request.result.exerciseAttempts.length,mastery:request.result.mastery})}}))).toMatchObject({offer:{status:"declined",offeredOnce:true,evidenceBoundary:"learner-controlled-planning-offer-no-penalty-mastery-or-deletion"},adaptations:[],attempts:3,mastery:defaultState.mastery});
  await page.reload();await waitForLearningReady(page);await expect(page.locator('[data-load-offer-policy="automatic-load-reduction-offer-v1"]')).toHaveCount(0);
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
  test.setTimeout(60_000);
  let writingReviewRequests=0;
  await page.route("**/v1beta/models/**",async route=>{writingReviewRequests+=1;await route.fulfill({status:200,contentType:"application/json",body:JSON.stringify({candidates:[{content:{parts:[{text:JSON.stringify({summaryAr:"حدد Gemini خطأ صرف واضحًا وترك ملاءمة النبرة للحكم السياقي.",issues:[{category:"grammar",excerpt:"Ich heiße Nadia und ich kommen aus Tunesien.",explanationAr:"بعد ich نحتاج الفعل المصرف.",suggestionDe:"Ich heiße Nadia und ich komme aus Tunesien.",confidence:"high"}],unresolvedAr:["ملاءمة النبرة للمؤسسة"]})}]}}]})})});
  await page.goto("/lernen/a1-01");
  await waitForLearningReady(page);
  await page.evaluate((baseState)=>new Promise<void>((resolve,reject)=>{sessionStorage.setItem("dwnb-ai-key","writing-test-key");const open=indexedDB.open("der-weg-nach-berlin",4);open.onerror=()=>reject(open.error);open.onsuccess=()=>{const read=open.result.transaction("learning-state","readonly").objectStore("learning-state").get("primary");read.onerror=()=>reject(read.error);read.onsuccess=()=>{const state=read.result??structuredClone(baseState);state.aiSettings={provider:"gemini",model:"gemini-2.5-flash",enabledFeatures:["writing"]};const tx=open.result.transaction("learning-state","readwrite");tx.objectStore("learning-state").put(state,"primary");tx.oncomplete=()=>resolve();tx.onerror=()=>reject(tx.error)}}}),structuredClone(defaultState));
  await page.reload();await waitForLearningReady(page);
  for(let stage=0;stage<9;stage+=1)await page.getByRole("button",{name:/أكملت هذه الخطوة/}).click();
  await page.getByRole("link",{name:/افتح مختبر الكتابة/}).click();
  await expect(page).toHaveURL(/\/writing\?lesson=a1-01$/);
  await waitForLearningReady(page);
  await expect(page.locator(".writing-workflow > span")).toHaveCount(5);
  const typingBenchmark=page.locator('[data-writing-benchmark-policy="writing-device-benchmark-v1"]');
  await typingBenchmark.getByRole("button",{name:/ابدأ مؤقت الكتابة/}).click();
  await expect(typingBenchmark.getByText(writingBenchmarkPrompt("A1").textDe,{exact:true})).toBeVisible();
  await typingBenchmark.getByLabel("Satz für die Gerätegeschwindigkeit abschreiben").fill(writingBenchmarkPrompt("A1").textDe);
  await page.waitForTimeout(5_100);
  await typingBenchmark.getByRole("button",{name:/انتهيت.*احفظ التخطيط/}).click();
  await expect(typingBenchmark).toContainText(/كلمة\/د/);
  await expect(typingBenchmark).toContainText("لا يوجد تصحيح لغة");
  await expect.poll(()=>page.evaluate(()=>new Promise<unknown>((resolve,reject)=>{const open=indexedDB.open("der-weg-nach-berlin",4);open.onerror=()=>reject(open.error);open.onsuccess=()=>{const request=open.result.transaction("learning-state","readonly").objectStore("learning-state").get("primary");request.onerror=()=>reject(request.error);request.onsuccess=()=>resolve(request.result.writingBenchmarkAttempts[0])}}))).toMatchObject({policyVersion:"writing-device-benchmark-v1",qualified:true,copyAccuracyPercent:100,recommendedWritingMinutes:5,timingSource:"visible-performance-timer",evidenceBoundary:"device-input-planning-only-no-language-score"});
  const typingAxe=await new AxeBuilder({page}).include(".writing-device-benchmark").withTags(["wcag2a","wcag2aa"]).analyze();
  expect(typingAxe.violations.filter((item)=>item.impact==="serious"||item.impact==="critical")).toEqual([]);
  await page.getByLabel("لمن أكتب؟").fill("إدارة دورة اللغة");
  await page.getByLabel("ما النتيجة التي أريدها؟").fill("تقديم نفسي وبدء تواصل");
  await page.getByPlaceholder("النقطة 1").fill("تحية وتعارف");
  await page.getByPlaceholder("النقطة 2").fill("سؤالان واضحان");
  await page.getByRole("button", { name:/ابدأ المسودة/ }).click();
  const firstDraft="Guten Tag! Ich heiße Nadia und ich kommen aus Tunesien. Ich lerne Deutsch in Berlin und arbeite heute im Büro. Wie heißen Sie? Wo wohnen Sie? Am Abend lerne ich mit meiner Freundin. Ich freue mich auf Ihre Antwort. Viele Grüße, Nadia.";
  await page.getByLabel("المسودة الألمانية").fill(firstDraft);
  await page.getByRole("button", { name:/حفظ المسودة والانتقال/ }).click();
  const selfCheck=page.locator(".writing-self-check");
  for(const checkbox of await selfCheck.locator('input[type="checkbox"]').all())await checkbox.check();
  await selfCheck.getByRole("button", { name:/شغّل الفحص المرتبط بنصي/ }).click();
  await expect(page.locator(".writing-dimensions article")).toHaveCount(5);
  await expect(page.locator(".feedback-box")).toContainText("«");
  const repair=page.locator('[data-writing-repair-policy="writing-error-micro-practice-v1"]');
  await expect(repair).toContainText("ich kommen aus Tunesien");
  const correctedSentence="Ich heiße Nadia und ich komme aus Tunesien.";
  await expect(repair.getByText(correctedSentence,{exact:true})).toHaveCount(0);
  await repair.getByLabel("Ihre Korrektur · تصحيحك").fill(correctedSentence);
  await repair.getByRole("button",{name:/Prüfen/}).click();
  await expect(repair).toContainText("مطابقة للتصحيح المحلي");
  await expect(repair.getByText(correctedSentence,{exact:true})).toBeVisible();
  const hybrid=page.locator('[data-writing-review-policy="hybrid-writing-review-v1"]');
  await expect(hybrid).toContainText("المعلّم الذاتي الأساسي والصادق");
  await hybrid.getByRole("button",{name:/اسأل Gemini عند الشك/}).click();
  await expect(page.getByRole("dialog").getByRole("heading",{name:"موافقة مستقلة لإرسال نص الكتابة"})).toBeVisible();
  expect(writingReviewRequests).toBe(0);
  await page.getByRole("button",{name:"أوافق وأرسل هذه النسخة مرة واحدة"}).click();
  await expect(hybrid.locator(".gemini-writing-result")).toContainText("خطأ صرف واضح");
  await expect(hybrid.locator(".gemini-writing-result")).toContainText("Ich heiße Nadia und ich komme aus Tunesien.");
  expect(writingReviewRequests).toBe(1);
  await expect.poll(()=>page.evaluate(()=>new Promise<unknown>((resolve,reject)=>{const open=indexedDB.open("der-weg-nach-berlin",4);open.onerror=()=>reject(open.error);open.onsuccess=()=>{const request=open.result.transaction("learning-state","readonly").objectStore("learning-state").get("primary");request.onerror=()=>reject(request.error);request.onsuccess=()=>resolve(request.result.writingAIReviews[0])}}))).toMatchObject({policyVersion:"hybrid-writing-review-v1",provider:"gemini",model:"gemini-2.5-flash",promptVersion:"writing-review-v1",consent:"explicit",evaluationBoundary:"advisory-writing-review-no-official-score-or-mastery",sourceVersion:2});
  await page.getByRole("button", { name:/ابدأ إعادة الكتابة/ }).click();
  await page.getByLabel("النسخة المنقحة").fill(`${firstDraft} Bis bald.`);
  await page.getByRole("button", { name:/حفظ النسخة المنقحة/ }).click();
  await expect(page.locator(".writing-reviewed-text")).toContainText("Bis bald");
  const versionDiff=page.locator('[data-writing-diff-policy="visible-writing-version-diff-v1"]');await expect(versionDiff).toBeVisible();await expect(versionDiff.locator("ins")).toContainText("Bis bald");
  await expect(page.locator(".writing-feedback .behavioral-praise")).toContainText("غيّرت النسخة بعد الفحص");
  await expect(page.locator(".writing-feedback .behavioral-praise")).toHaveAttribute("data-status-policy","status-announcement-v1");

  await expect.poll(() => page.evaluate(() => new Promise<unknown>((resolve, reject) => {
    const open=indexedDB.open("der-weg-nach-berlin",4);
    open.onerror=()=>reject(open.error);
    open.onsuccess=()=>{const request=open.result.transaction("learning-state","readonly").objectStore("learning-state").get("primary");request.onerror=()=>reject(request.error);request.onsuccess=()=>resolve(request.result?.writingSubmissions?.map((item:{status:string;sourceVersion?:number;dimensions?:unknown[];plan?:unknown})=>({status:item.status,sourceVersion:item.sourceVersion,dimensions:item.dimensions?.length,hasPlan:Boolean(item.plan)})))};
  }))).toEqual([{status:"draft",sourceVersion:undefined,dimensions:undefined,hasPlan:true},{status:"submitted",sourceVersion:undefined,dimensions:5,hasPlan:true},{status:"revised",sourceVersion:2,dimensions:5,hasPlan:true}]);
  await expect.poll(()=>page.evaluate(()=>new Promise<unknown>((resolve,reject)=>{const open=indexedDB.open("der-weg-nach-berlin",4);open.onerror=()=>reject(open.error);open.onsuccess=()=>{const r=open.result.transaction("learning-state","readonly").objectStore("learning-state").get("primary");r.onsuccess=()=>resolve(r.result.trainingInteractionEvents);r.onerror=()=>reject(r.error)}}))).toEqual(expect.arrayContaining([expect.objectContaining({policyVersion:"training-interaction-log-v1",surface:"writing-draft",event:"resume",evidenceBoundary:"process-metadata-only-no-answer-text-correctness-mastery-or-keystrokes"}),expect.objectContaining({event:"answer-change"}),expect.objectContaining({event:"pause"})]));
  await expect.poll(()=>page.evaluate(()=>new Promise<unknown>((resolve,reject)=>{const open=indexedDB.open("der-weg-nach-berlin",4);open.onerror=()=>reject(open.error);open.onsuccess=()=>{const request=open.result.transaction("learning-state","readonly").objectStore("learning-state").get("primary");request.onerror=()=>reject(request.error);request.onsuccess=()=>resolve(request.result.writingRepairAttempts[0])}}))).toMatchObject({policyVersion:"writing-error-micro-practice-v1",patternId:"ich-infinitive",correct:true,evidenceBoundary:"personal-writing-repair-no-mastery-or-gate",sourceVersion:2});
  await page.goto("/settings");await waitForLearningReady(page);
  await page.getByRole("button",{name:"حذف الكتابة والعلاج"}).click();
  await expect(page.getByRole("dialog").getByRole("heading",{name:"حذف الكتابة وعلاجها الآن؟"})).toBeVisible();
  await page.getByRole("button",{name:"نعم، احذف الكتابة والعلاج"}).click();
  await expect.poll(()=>page.evaluate(()=>new Promise<unknown>((resolve,reject)=>{const open=indexedDB.open("der-weg-nach-berlin",4);open.onerror=()=>reject(open.error);open.onsuccess=()=>{const request=open.result.transaction("learning-state","readonly").objectStore("learning-state").get("primary");request.onerror=()=>reject(request.error);request.onsuccess=()=>resolve({writing:request.result.writingSubmissions,repairs:request.result.writingRepairAttempts,reviews:request.result.writingAIReviews})}}))).toEqual({writing:[],repairs:[],reviews:[]});
});

test("P0 WebGPU model is opt-in, runs ranked follow-up locally, and can be deleted", async ({ page }) => {
  await page.route("**/vendor/webgpu/**",(route)=>route.fulfill({status:200,contentType:route.request().url().endsWith(".wasm")?"application/wasm":"text/javascript",body:"mock-runtime"}));
  await page.route("**/webgpu-model-worker.js",(route)=>route.fulfill({status:200,contentType:"text/javascript",body:"// mocked by addInitScript"}));
  await page.addInitScript(() => {
    Object.defineProperty(window, "isSecureContext", { configurable:true,value:true });
    Object.defineProperty(navigator, "gpu", { configurable:true,value:{ requestAdapter:async()=>({limits:{maxBufferSize:268_435_456}}) } });
    Object.defineProperty(navigator, "deviceMemory", { configurable:true,value:8 });
    Object.defineProperty(navigator.storage, "estimate", { configurable:true,value:async()=>({quota:1_000_000_000,usage:100_000_000}) });
    class FakeModelWorker {
      listeners = new Set<(event:MessageEvent)=>void>();
      addEventListener(type:string,listener:(event:MessageEvent)=>void){if(type==="message")this.listeners.add(listener)}
      removeEventListener(type:string,listener:(event:MessageEvent)=>void){if(type==="message")this.listeners.delete(listener)}
      postMessage(payload:{requestId:string;type:string;registry:{policyVersion:string;modelId:string;modelRevision:string;dtype:string}}){
        const send=(data:Record<string,unknown>)=>this.listeners.forEach((listener)=>listener(new MessageEvent("message",{data:{requestId:payload.requestId,...data}})));
        if(payload.type==="install"){
          send({type:"progress",progress:{phase:"download",percent:55,loadedBytes:70_000_000,totalBytes:130_000_000,file:"model_quantized.onnx"}});
          void caches.open("dwnb-webgpu-model-v1").then(async(cache)=>{const metadata={policyVersion:payload.registry.policyVersion,modelId:payload.registry.modelId,modelRevision:payload.registry.modelRevision,dtype:payload.registry.dtype,installedAt:new Date().toISOString(),cacheEntries:7,headerByteSize:130_000_000};await cache.put("/__dwnb_webgpu_model_meta__",new Response(JSON.stringify(metadata)));send({type:"installed",metadata})});
        }else if(payload.type==="rank")queueMicrotask(()=>send({type:"ranked",selectedIndex:2,scores:[0.2,0.4,0.91,0.3]}));
      }
      terminate(){}
    }
    Object.defineProperty(window,"Worker",{configurable:true,value:FakeModelWorker});
    const fakeStream={getTracks:()=>[{stop(){}}]};
    Object.defineProperty(navigator,"mediaDevices",{configurable:true,value:{getUserMedia:async()=>fakeStream}});
    class FakeMediaRecorder {state="inactive";mimeType="audio/webm";stream=fakeStream;ondataavailable:((event:{data:Blob})=>void)|null=null;onstop:(()=>void)|null=null;start(){this.state="recording"}stop(){this.state="inactive";this.ondataavailable?.({data:new Blob(["webgpu-speaking-audio"],{type:this.mimeType})});this.onstop?.()}}
    Object.defineProperty(window,"MediaRecorder",{configurable:true,value:FakeMediaRecorder});
  });

  await page.goto("/settings");
  await waitForLearningReady(page);
  const card=page.locator('[data-webgpu-policy="browser-webgpu-model-v1"]');
  await expect(card).toContainText("مدعوم مبدئيًا");
  await expect(card).toContainText("نحو 130–150 MB");
  await expect(card).toContainText("Apache-2.0");
  await expect(card.getByRole("button",{name:/نزّل وشغّل عبر WebGPU/})).toBeDisabled();
  await card.getByRole("checkbox",{name:/أوافق على تنزيل النموذج/}).check();
  await card.getByRole("button",{name:/نزّل وشغّل عبر WebGPU/}).click();
  await expect(card).toContainText("النموذج مثبت");
  await expect(card).toContainText("اكتمل تنزيل النموذج وتهيئته داخل Web Worker");

  await page.goto("/speaking?lesson=a1-01");
  await waitForLearningReady(page);
  await page.getByRole("button",{name:/تدرّبت، انتقل إلى التسجيل/}).click();
  await page.getByRole("button",{name:/ابدأ تسجيلًا قصيرًا/}).click();
  await page.getByRole("button",{name:/أنهِ التسجيل/}).click();
  await page.getByLabel("تشغيل محاولة المحادثة").evaluate((audio)=>audio.dispatchEvent(new Event("ended")));
  const followUp=page.locator('[data-follow-up-policy="content-grounded-follow-up-v1"]');
  await followUp.getByLabel("Kurzer Inhalt Ihrer Antwort").fill("Ich komme aus Tunesien und wohne in Berlin.");
  await followUp.getByRole("button",{name:/رتّب بنموذج WebGPU المحلي/}).click();
  await expect(followUp.locator(".content-follow-up-result")).toContainText("Warum ist „Tunesien“ für Sie wichtig?");
  await expect(followUp).toContainText("لم يُرسل النص أو التسجيل");
  await page.getByPlaceholder(/توقفت قبل السؤال/).fill("سأجيب عن السؤال المرتبط بالمكان.");
  await page.getByRole("button",{name:/احفظ المحاولة بعد مراجعتها/}).click();
  await expect(page.getByRole("button",{name:"تم حفظ المحاولة"})).toBeVisible();
  await expect.poll(()=>page.evaluate(()=>new Promise<unknown>((resolve,reject)=>{const open=indexedDB.open("der-weg-nach-berlin",4);open.onerror=()=>reject(open.error);open.onsuccess=()=>{const request=open.result.transaction("learning-state","readonly").objectStore("learning-state").get("primary");request.onerror=()=>reject(request.error);request.onsuccess=()=>resolve(request.result.speakingAttempts.find((attempt:{contentFollowUp?:{provider:string}})=>attempt.contentFollowUp?.provider==="browser-webgpu")?.contentFollowUp)}})),{timeout:15_000}).toMatchObject({provider:"browser-webgpu",model:"Xenova/paraphrase-multilingual-MiniLM-L12-v2",consent:"not-required",sourceCue:"Tunesien"});

  await page.goto("/settings");
  await waitForLearningReady(page);
  const installed=page.locator('[data-webgpu-policy="browser-webgpu-model-v1"]');
  page.once("dialog",(dialog)=>void dialog.accept());
  await installed.getByRole("button",{name:"حذف النموذج المحلي"}).click();
  await expect(installed).toContainText("حُذف Cache النموذج");
  await expect.poll(()=>page.evaluate(async()=>caches.has("dwnb-webgpu-model-v1"))).toBe(false);
});

test("standard pronunciation pack installs explicitly and matches expected German words locally", async ({ page }) => {
  let remoteAudioRequests=0;
  await page.route("https://huggingface.co/**",async(route)=>{remoteAudioRequests+=1;await route.abort()});
  await page.addInitScript(()=>{
    Object.defineProperty(window,"isSecureContext",{configurable:true,value:true});
    Object.defineProperty(navigator,"deviceMemory",{configurable:true,value:8});
    Object.defineProperty(navigator,"gpu",{configurable:true,value:{requestAdapter:async()=>({limits:{maxBufferSize:268_435_456}})}});
    Object.defineProperty(navigator,"storage",{configurable:true,value:{estimate:async()=>({quota:1_000_000_000,usage:100_000_000}),persist:async()=>true}});
    const listeners=new Set<(event:{data:unknown})=>void>();
    let transcriptionCount=0;
    class FakePronunciationWorker {
      addEventListener(type:string,listener:(event:{data:unknown})=>void){if(type==="message")listeners.add(listener)}
      removeEventListener(type:string,listener:(event:{data:unknown})=>void){if(type==="message")listeners.delete(listener)}
      postMessage(payload:{requestId:string;type:string;registry:{policyVersion:string;modelId:string;modelRevision:string;dtype:string}}){
        const send=(data:unknown)=>listeners.forEach((listener)=>listener({data}));
        if(payload.type==="install"){
          const metadata={policyVersion:payload.registry.policyVersion,modelId:payload.registry.modelId,modelRevision:payload.registry.modelRevision,dtype:payload.registry.dtype,installedAt:new Date().toISOString(),cacheEntries:8,headerByteSize:70_000_000};
          send({requestId:payload.requestId,type:"progress",progress:{phase:"download",percent:70,loadedBytes:60_000_000,totalBytes:80_000_000,file:"encoder_model_quantized.onnx"}});
          void caches.open("dwnb-pronunciation-model-v1").then(async(cache)=>{await cache.put("/__dwnb_pronunciation_model_meta__",new Response(JSON.stringify(metadata)));send({requestId:payload.requestId,type:"installed",metadata})});
        }else if(payload.type==="transcribe"){transcriptionCount+=1;const transcript=transcriptionCount===1?"Hallo ich heiße Nadia. Wie heißt du?":"geht";queueMicrotask(()=>send({requestId:payload.requestId,type:"transcribed",transcript}))}
      }
      terminate(){}
    }
    Object.defineProperty(window,"Worker",{configurable:true,value:FakePronunciationWorker});
    const fakeStream={getTracks:()=>[{stop(){}}]};
    Object.defineProperty(navigator,"mediaDevices",{configurable:true,value:{getUserMedia:async()=>fakeStream}});
    class FakeMediaRecorder {state="inactive";mimeType="audio/webm";stream=fakeStream;ondataavailable:((event:{data:Blob})=>void)|null=null;onstop:(()=>void)|null=null;start(){this.state="recording"}stop(){this.state="inactive";this.ondataavailable?.({data:new Blob(["local-word-audio"],{type:this.mimeType})});this.onstop?.()}}
    Object.defineProperty(window,"MediaRecorder",{configurable:true,value:FakeMediaRecorder});
    class FakeAudioContext {
      createMediaStreamSource(){return{connect(){},disconnect(){}}}
      createAnalyser(){return{fftSize:1024,getFloatTimeDomainData(data:Float32Array){data.fill(.04)}}}
      async decodeAudioData(){const samples=new Float32Array(16_000).fill(.04);return{length:samples.length,sampleRate:16_000,numberOfChannels:1,getChannelData:()=>samples}}
      async close(){}
    }
    Object.defineProperty(window,"AudioContext",{configurable:true,value:FakeAudioContext});
  });
  await page.goto("/settings");await waitForLearningReady(page);
  const pack=page.locator('[data-local-pronunciation-model="local-german-word-matching-v1"]');
  await expect(pack).toContainText("مدعوم مبدئيًا");
  await pack.getByRole("checkbox",{name:/أوافق على تنزيل حزمة الصوت/}).check();
  await pack.getByRole("button",{name:/نزّل حزمة مطابقة الكلمات/}).click();
  await expect(pack).toContainText("الحزمة مثبتة");
  await page.goto("/speaking?lesson=a1-01");await waitForLearningReady(page);
  await page.getByRole("button",{name:/تدرّبت، انتقل إلى التسجيل/}).click();
  await page.getByRole("button",{name:/ابدأ تسجيلًا قصيرًا/}).click();
  await page.getByRole("button",{name:/أنهِ التسجيل/}).click();
  await page.getByLabel("تشغيل محاولة المحادثة").evaluate((audio)=>audio.dispatchEvent(new Event("ended")));
  const matcher=page.locator('[data-local-word-match="local-german-word-matching-v1"]');
  await matcher.getByRole("button",{name:/افحص الإشارة وطابق الكلمات/}).click();
  await expect(matcher.locator('[data-microphone-signal="local-microphone-signal-check-v1"]')).toContainText("الإشارة مناسبة");
  await expect(matcher).toContainText("Hallo ich heiße Nadia. Wie heißt du?");
  await expect(matcher.getByRole("button",{name:/تم التعرف على Hallo/})).toBeVisible();
  await matcher.getByRole("button",{name:/لم تُؤكد geht، افتح تدريبها/}).click();
  const repair=matcher.locator('[data-word-repair-policy="local-word-repair-loop-v1"]');
  await expect(repair).toContainText("درّب كلمة واحدة");
  await repair.getByRole("button",{name:/سجّل الكلمة/}).click();
  await repair.getByRole("button",{name:/أنهِ تسجيل الكلمة/}).click();
  await repair.getByLabel("استمع إلى تسجيل كلمة geht").evaluate((audio)=>audio.dispatchEvent(new Event("ended")));
  await repair.getByRole("button",{name:/افحص الكلمة محليًا/}).click();
  await expect(repair).toContainText("استطاع النموذج التعرف على «geht»");
  await expect(matcher).toContainText("لم يُرسل التسجيل ولم تُحسب درجة نطق");
  expect(remoteAudioRequests).toBe(0);
});

test("guided speaking keeps learner-selected support visible, grounds typed follow-up, and requires consent before optional AI", async ({ page }) => {
  let followUpRequests = 0;
  await page.route("**/v1beta/models/**", async (route) => {
    followUpRequests += 1;
    await route.fulfill({ status:200,contentType:"application/json",body:JSON.stringify({candidates:[{content:{parts:[{text:JSON.stringify({questionDe:"Was möchten Sie in Berlin zuerst machen?",supportAr:"السؤال مرتبط بمدينة Berlin التي كتبتها.",groundingCue:"Berlin"})}]}}]}) });
  });
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
  await page.evaluate((baseState) => new Promise<void>((resolve, reject) => {
    sessionStorage.setItem("dwnb-ai-key", "temporary-speaking-key");
    const state=structuredClone(baseState);
    state.aiSettings={provider:"gemini",model:"gemini-2.5-flash",enabledFeatures:["speaking"]};
    const open=indexedDB.open("der-weg-nach-berlin",4);
    open.onerror=()=>reject(open.error);
    open.onsuccess=()=>{const transaction=open.result.transaction("learning-state","readwrite");transaction.objectStore("learning-state").put(state,"primary");transaction.oncomplete=()=>resolve();transaction.onerror=()=>reject(transaction.error)};
  }),structuredClone(defaultState));
  await page.reload();
  await waitForLearningReady(page);
  const redemittel=page.locator('[data-redemittel-policy="central-redemittel-function-register-v1"]');await expect(redemittel).toBeVisible();await expect(redemittel.locator("article")).toHaveCount(8);
  await expect(page.locator(".speaking-workflow > span")).toHaveCount(5);
  await page.getByPlaceholder("اسمي").fill("Name");
  await page.getByPlaceholder("سؤال الاسم").fill("Frage");
  await page.getByRole("button", { name:/تدرّبت، انتقل إلى التسجيل/ }).click();
  await page.getByRole("button", { name:/ابدأ تسجيلًا قصيرًا/ }).click();
  await expect(page.locator(".recording-visible-support")).toContainText("Wie heißt du?");
  await expect(page.getByText(/التسجيل يعمل على جهازك/)).toBeVisible();
  await page.getByRole("button", { name:/أنهِ التسجيل/ }).click();
  const playback=page.getByLabel("تشغيل محاولة المحادثة");
  await expect(playback).toBeVisible();await expect(page.locator('[data-pause-policy="local-rms-pause-estimate-v1"]')).toBeVisible();
  await playback.evaluate((audio)=>audio.dispatchEvent(new Event("ended")));
  await expect(page.getByText(/اكتمل الاستماع الذاتي/)).toBeVisible();
  const followUp=page.locator('[data-follow-up-policy="content-grounded-follow-up-v1"]');
  await expect(followUp).toContainText("Was haben Sie gesagt?");
  await expect(followUp).toContainText("ليس تحويلًا أو فهمًا للتسجيل");
  await followUp.getByLabel("Kurzer Inhalt Ihrer Antwort").fill("Ich komme aus Tunesien und wohne in Berlin.");
  await followUp.getByRole("button",{name:/متابعة محلية دون شبكة/}).click();
  await expect(followUp.locator(".content-follow-up-result")).toContainText("Tunesien");
  await expect(followUp).toContainText("لم يُحلل التسجيل ولم تُستخدم الشبكة");
  await followUp.getByRole("button",{name:/متابعة عبر Gemini/}).click();
  await expect(page.getByRole("dialog").getByRole("heading",{name:"موافقة مطلوبة قبل إرسال خلاصة جوابك"})).toBeVisible();
  await expect(page.getByRole("dialog")).toContainText("Ich komme aus Tunesien und wohne in Berlin.");
  expect(followUpRequests).toBe(0);
  await page.getByRole("button",{name:"أوافق وأرسل هذا النص مرة واحدة"}).click();
  await expect(followUp.locator(".content-follow-up-result")).toContainText("Was möchten Sie in Berlin zuerst machen?");
  await expect(followUp).toContainText("موافقة إرسال صريحة");
  expect(followUpRequests).toBe(1);
  for(const checkbox of await page.locator(".speaking-criteria input").all())await checkbox.check();
  await page.locator(".self-rubric .score-buttons button").nth(3).click();
  for(const checkbox of await page.locator(".speaking-review-check input").all())await checkbox.check();
  const condition=page.locator('[data-condition-policy="learner-attributed-language-vs-device-v1"]');await condition.getByRole("button",{name:"كلاهما",exact:true}).click();await condition.getByRole("button",{name:"المفردات",exact:true}).click();await condition.getByRole("button",{name:"الضجيج",exact:true}).click();
  await page.getByPlaceholder(/توقفت قبل السؤال/).fill("سأحسن ترتيب السؤال في المحاولة التالية.");
  await page.getByRole("button", { name:/احفظ المحاولة بعد مراجعتها/ }).click();
  await expect(page.locator('.speaking-task .status-announcement > span:not(.sr-only)').filter({hasText:/استمعت إلى التسجيل كاملًا وحددت فجوة/})).toBeVisible();
  await expect(page.locator('.speaking-task > [data-status-policy="status-announcement-v1"]')).toBeVisible();
  await expect.poll(() => page.evaluate(() => new Promise<unknown>((resolve, reject) => {
    const open=indexedDB.open("der-weg-nach-berlin",4);
    open.onerror=()=>reject(open.error);
    open.onsuccess=()=>{const request=open.result.transaction("learning-state","readonly").objectStore("learning-state").get("primary");request.onerror=()=>reject(request.error);request.onsuccess=()=>resolve(request.result?.speakingAttempts?.[0])};
  }))).toMatchObject({taskId:"a1-01",targetSeconds:10,selfScore:4,selfReview:{listenedBack:true,clarityScore:4,turnTaking:true,repairUsed:true,preparationNotes:["Name","Frage"],supportVisibleDuringRecording:true},pauseMetrics:{policyVersion:"local-rms-pause-estimate-v1",evidenceBoundary:"energy-only-no-word-phoneme-pronunciation-or-fluency-score"},conditionAttribution:{policyVersion:"learner-attributed-language-vs-device-v1",category:"both",factors:["vocabulary","noise"],attribution:"learner-reported-not-automatically-diagnosed"},contentFollowUp:{policyVersion:"content-grounded-follow-up-v1",source:"typed-transcript",sourceCue:"Berlin",cueCategory:"ai-grounded",questionDe:"Was möchten Sie in Berlin zuerst machen?",provider:"gemini",model:"gemini-2.5-flash",consent:"explicit",evaluationBoundary:"text-grounded-question-no-stt-no-language-score"}});
  await page.getByRole("button", { name:/ابدأ محاولة محسنة/ }).click();
  await expect(page.getByText(/تدرّب دون ضغط زمني/)).toBeVisible();

  const infoGap=page.locator('[data-info-gap-policy="two-party-information-gap-v1"]');
  await infoGap.getByRole("checkbox",{name:/يوجد معي شخص ثان/}).check();
  await infoGap.getByRole("button",{name:/افتح بطاقة الشخص A/}).click();
  await expect(infoGap).toContainText("Kurs Alpha");
  await expect(infoGap).not.toContainText("Du kannst nur am Samstag lernen.");
  await infoGap.getByRole("button",{name:/أخفِ البطاقة/}).click();
  await infoGap.getByRole("button",{name:/استلم الشخص B/}).click();
  await expect(infoGap).toContainText("Du kannst nur am Samstag lernen.");
  await expect(infoGap).not.toContainText("Kurs Alpha: Dienstag");
  await infoGap.getByRole("button",{name:/أخفِ البطاقة/}).click();
  await infoGap.getByRole("button",{name:/ابدآ التبادل/}).click();
  for(const checkbox of await infoGap.locator('.info-gap-exchange>div input[type="checkbox"]').all())await checkbox.check();
  await infoGap.getByRole("button",{name:"Kurs Beta"}).click();
  await infoGap.getByRole("button",{name:/قرار مشترك/}).click();
  await expect(infoGap).toContainText("السبت، 95 يورو");
  await infoGap.getByRole("button",{name:/احفظ دليل التبادل/}).click();
  await expect(infoGap).toContainText("حُفظ تبادل ثنائي");

  await page.goto("/settings");
  await waitForLearningReady(page);
  await expect(page.getByText(/1 ملفًا و1 مقتطفات/)).toBeVisible();
  await page.getByRole("button",{name:"حذف الصوت والنص المصدر"}).click();
  await page.getByRole("button",{name:"نعم، احذف الصوت والنص"}).click();
  await expect.poll(() => page.evaluate(() => new Promise<unknown>((resolve,reject)=>{const open=indexedDB.open("der-weg-nach-berlin",4);open.onerror=()=>reject(open.error);open.onsuccess=()=>{const request=open.result.transaction("learning-state","readonly").objectStore("learning-state").get("primary");request.onerror=()=>reject(request.error);request.onsuccess=()=>{const attempt=request.result.speakingAttempts.find((item:{id:string})=>item.id.startsWith("attempt-"));resolve({mediaId:attempt?.mediaId,sourceExcerpt:attempt?.contentFollowUp?.sourceExcerpt,hash:attempt?.contentFollowUp?.sourceTextSha256,question:attempt?.contentFollowUp?.questionDe})}}}))).toMatchObject({mediaId:undefined,sourceExcerpt:undefined,hash:expect.stringMatching(/^[a-f0-9]{64}$/),question:"Was möchten Sie in Berlin zuerst machen?"});
});

test("P0 mediation lab enforces source analysis, transfer, self-check, comparison, and revision", async ({ page }) => {
  await page.goto("/mediation?lesson=a1-01");
  await waitForLearningReady(page);
  await expect(page.locator(".mediation-workflow > span")).toHaveCount(5);
  await expect(page.locator(".mediation-goal")).toContainText("تساعد صديقك على الرد");
  await expect(page.getByLabel("من الذي ستساعده؟")).toHaveValue(/صديق/);
  await expect(page.getByLabel("ماذا يجب أن يعرف أو يفعل بعد شرحك؟")).toHaveValue(/اسمه/);
  await expect(page.getByPlaceholder("المعلومة المهمة 1")).not.toHaveValue("");
  await page.getByRole("button", { name:/ابدأ شرحك الأول/ }).click();
  const firstTransfer="المعلمة تسأل عن الاسم بصيغة رسمية، ثم تطلب من صديقي أن يكتب اسمه في المكان المحدد.";
  await page.getByLabel("اشرح لصديقك بالعربية").fill(firstTransfer);
  const germanResponse=page.getByLabel(/الرد الألماني القصير/);
  await germanResponse.fill("Ich hei");
  const characterDock=page.locator('[data-german-keyboard-policy="virtual-german-character-keyboard-v1"]');
  await expect(characterDock).toBeVisible();
  await characterDock.getByRole("button",{name:"إظهار لوحة الحروف الألمانية"}).click();
  await characterDock.getByRole("button",{name:"إدخال الحرف الألماني ß"}).click();
  await expect(germanResponse).toHaveValue("Ich heiß");
  await germanResponse.fill("Ich heiße Nadia. Danke schön.");
  await page.getByRole("button", { name:/احفظ ثم راجع إجابتك/ }).click();
  for(const checkbox of await page.locator(".mediation-self-check input").all())await checkbox.check();
  await page.getByRole("button", { name:/افحص ما نقلته/ }).click();
  await expect(page.locator(".mediation-dimensions article")).toHaveCount(5);
  await expect(page.getByText(/اقتراح للمقارنة بعد المحاولة/)).toBeVisible();
  await page.getByRole("button", { name:/ابدأ صياغة محسنة/ }).click();
  await page.getByLabel("اشرح لصديقك بالعربية").fill(`${firstTransfer} ويمكنه أن يجيب باسمه مباشرة.`);
  await page.getByRole("button", { name:/احفظ الإجابة المحسنة/ }).click();
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
  await item.getByRole("button", { name:"0.75×" }).click();
  expect(await audio.evaluate((element:HTMLAudioElement)=>({rate:element.playbackRate,preservesPitch:element.preservesPitch}))).toEqual({rate:0.75,preservesPitch:true});
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
  const examSpeed = page.locator('.targeted-exam > [data-speed-policy="learning-playback-speed-v1"]');
  await examSpeed.getByRole("button", { name:"0.75×" }).click();
  await expect(examSpeed).toHaveAttribute("data-playback-rate", "0.75");
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
  const noteControl=page.locator('[data-content-note-policy="local-content-note-v1"]');
  await noteControl.locator("summary").click();
  await noteControl.getByRole("button",{name:"احفظ كعلامة"}).click();
  await noteControl.getByLabel("Meine Notiz · ملاحظتي").fill("راجع ترتيب السؤال قبل الاختبار.");
  await noteControl.getByRole("button",{name:/حفظ الملاحظة/}).click();
  await expect(noteControl.getByRole("status")).toContainText("حُفظت الملاحظة محليًا");
  await expect.poll(()=>page.evaluate(()=>new Promise<unknown>((resolve,reject)=>{const open=indexedDB.open("der-weg-nach-berlin",4);open.onerror=()=>reject(open.error);open.onsuccess=()=>{const request=open.result.transaction("learning-state","readonly").objectStore("learning-state").get("primary");request.onerror=()=>reject(request.error);request.onsuccess=()=>resolve(request.result.contentNotes[0])}}))).toMatchObject({policyVersion:"local-content-note-v1",kind:"lesson",contentId:"a1-01",bookmarked:true,note:"راجع ترتيب السؤال قبل الاختبار.",evidenceBoundary:"personal-note-no-answer-key-mastery-or-ai"});
  const errorControl=page.locator('[data-error-report-policy="local-content-error-report-v1"]');
  await errorControl.locator("summary").click();
  await errorControl.getByLabel("وصف المشكلة").fill("الشرح العربي في هذا الموضع يحتاج مراجعة لغوية.");
  await errorControl.getByLabel("التصحيح المقترح — اختياري").fill("أقترح تبسيط الجملة العربية.");
  await errorControl.getByRole("button",{name:/معاينة البلاغ دون إرسال/}).click();
  await expect(errorControl).toContainText("مسودة محلية غير مرسلة");
  expect(await page.evaluate(()=>new Promise<number>((resolve,reject)=>{const open=indexedDB.open("der-weg-nach-berlin",4);open.onerror=()=>reject(open.error);open.onsuccess=()=>{const request=open.result.transaction("learning-state","readonly").objectStore("learning-state").get("primary");request.onsuccess=()=>resolve(request.result.contentErrorReports.length)}}))).toBe(0);
  await errorControl.getByRole("button",{name:/حفظ البلاغ محليًا/}).click();
  await expect(errorControl.getByRole("status")).toContainText("غير مُرسل");
  await expect.poll(()=>page.evaluate(()=>new Promise<unknown>((resolve,reject)=>{const open=indexedDB.open("der-weg-nach-berlin",4);open.onerror=()=>reject(open.error);open.onsuccess=()=>{const request=open.result.transaction("learning-state","readonly").objectStore("learning-state").get("primary");request.onerror=()=>reject(request.error);request.onsuccess=()=>resolve(request.result.contentErrorReports[0])}}))).toMatchObject({policyVersion:"local-content-error-report-v1",kind:"lesson",contentId:"a1-01",route:"/lernen/a1-01",status:"local-draft-not-submitted",evidenceBoundary:"report-metadata-only-no-answer-key-progress-or-network"});
  await page.goto("/settings");await waitForLearningReady(page);
  const reportManager=page.locator('[data-error-report-manager="local-content-error-report-v1"]');
  await expect(reportManager).toContainText("يحتاج مراجعة لغوية");
  const reportDownloadPromise=page.waitForEvent("download");
  await reportManager.getByRole("button",{name:"تنزيل"}).click();
  expect((await reportDownloadPromise).suggestedFilename()).toBe("dwnb-error-lesson-a1-01.json");
  const noteManager=page.locator('[data-content-note-manager="local-content-note-v1"]');
  await expect(noteManager).toContainText("راجع ترتيب السؤال قبل الاختبار");
  await noteManager.getByRole("link",{name:/Hallo Berlin/}).click();
  await waitForLearningReady(page);
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
      await expect(lexicalPanel.locator(".baseline-nouns > article")).toHaveCount(4);
      await expect(lexicalPanel).toContainText("der Name");
      await expect(lexicalPanel).toContainText("die Namen");
      await expect(lexicalPanel).toContainText("nach dem Namen fragen");
      const additionalNouns = lexicalPanel.locator(".additional-noun-anchors");
      await expect(additionalNouns).not.toHaveAttribute("open", "");
      await additionalNouns.getByText("Weitere Zielnomen").click();
      await expect(additionalNouns).toHaveAttribute("open", "");
      await expect(additionalNouns.locator(".noun-grammar-grid > article")).toHaveCount(1);
      await expect(additionalNouns).toContainText("die Karte");
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
    if(index===4){
      const progression=page.locator('[data-rule-progression-policy="grammar-progression-map-v1"]');
      await expect(progression).toBeVisible();await expect(progression).toContainText("Grenzen und Transfer");await expect(progression).toContainText("أين تتوقف القاعدة؟");await expect(progression).toContainText("استثناء شائع");await expect(progression).toContainText("تدريب مضبوط");await expect(progression).toContainText("نقل حر");await expect(progression).not.toContainText("a1-01-e1");
      const boundary=page.locator('[data-claim-boundary-policy="practice-law-language-boundary-v1"]');
      await expect(boundary).toBeVisible();
      await expect(boundary.locator("[data-claim-kind]")).toHaveCount(3);
      await expect(boundary.locator('[data-claim-kind="language-rule"]')).toContainText("Sprachregel");
      await expect(boundary.locator('[data-claim-kind="common-practice"]')).toContainText("Übliche Praxis");
      await expect(boundary.locator('[data-claim-kind="official-requirement"]')).toContainText("Offizielle Vorgabe / Gesetz");
      await expect(boundary).toContainText("ليس استشارة قانونية");
    }
    if (index === 6) {
      await expect(page.locator(".reading-support-lock")).toContainText("القاموس والترجمة مؤجلان");
      await expect(page.locator(".glossary-strip")).toHaveCount(0);
      const readingQuestion = page.locator(".question-stack .quiz-item").first();
      await expect(readingQuestion.locator("[data-question-category]")).toBeVisible();await expect(readingQuestion.locator("h3[lang=de]")).toHaveText(lesson.reading.questions[0].promptDe);await expect(readingQuestion.locator("h3[lang=de]+p")).toHaveText(lesson.reading.questions[0].promptAr);
      await readingQuestion.getByRole("button", { name: "تلميح قبل الإجابة" }).click();
      await expect(readingQuestion.locator(".hint-panel")).toContainText("فكرة عامة أم تفصيلًا أم سببًا");
      await readingQuestion.locator(".quiz-options button").filter({ hasText: lesson.reading.questions[0].options[lesson.reading.questions[0].correctIndex] }).click();
      await readingQuestion.getByRole("button", { name: "تحقق" }).click();
      await expect(readingQuestion.locator(".question-evidence q")).toBeVisible();
      await expect(page.locator(".glossary-strip")).toBeVisible();
      await expect(page.locator(".reading-support-lock")).toHaveCount(0);
    }
    if (index === 7) {
      const sequence=page.locator('[data-listening-sequence="three-pass-listening-sequence-v1"]');
      await expect(sequence).toBeVisible();
      await expect(sequence.locator(".listening-phase-map").getByText("Vor dem Hören",{exact:true})).toBeVisible();
      await expect(sequence.locator(".lesson-listening-player")).toHaveCount(0);
      await sequence.getByRole("button",{name:/Personen und Rollen/}).click();
      const lessonAudio = page.getByLabel(`استماع درس ${lesson.titleAr}`, { exact:true });
      await expect(lessonAudio).toHaveAttribute("src", "/audio/lessons/a1-01.mp3");
      await page.locator(".lesson-listening-player").getByRole("button", { name:"1.15×" }).click();
      expect(await lessonAudio.evaluate((audio:HTMLAudioElement)=>({rate:audio.playbackRate,preservesPitch:audio.preservesPitch}))).toEqual({rate:1.15,preservesPitch:true});
      const ttsButton=page.getByRole("button", { name: /بديل Browser TTS/ });
      await expect(ttsButton).toBeVisible();
      await ttsButton.click();
      const gist=sequence.locator(".listening-phase-card.during .quiz-item");
      await expect(gist).toBeVisible();await expect(gist.locator('[data-question-category="gist"]')).toContainText("Hauptaussage");
      const gistQuestion=lesson.listening.questions[0];
      const gistWrong=(gistQuestion.correctIndex+1)%4;
      await gist.locator(".quiz-options button").filter({hasText:gistQuestion.options[gistWrong]}).click();
      await gist.getByRole("button",{name:"تحقق"}).click();
      const detailCards=sequence.locator(".listening-phase-card.after .quiz-item");
      await expect(detailCards).toHaveCount(lesson.listening.questions.length-1);
      for(let detailIndex=1;detailIndex<lesson.listening.questions.length;detailIndex+=1){const question=lesson.listening.questions[detailIndex];const wrong=(question.correctIndex+1)%4;const card=detailCards.nth(detailIndex-1);await card.locator(".quiz-options button").filter({hasText:question.options[wrong]}).click();await card.getByRole("button",{name:"تحقق"}).click();}
      const transcriptButton=sequence.getByRole("button",{name:/إظهار النص بعد تثبيت الأجوبة/});
      await expect(transcriptButton).toBeEnabled();
      await transcriptButton.click();
      await expect(sequence.locator(".transcript-box")).toContainText(lesson.listening.transcriptDe.slice(0,25));
    }
    if(index===8){
      const prosody=page.locator('[data-prosody-policy="prosody-rhythm-progression-v1"]');await expect(prosody).toBeVisible();await expect(prosody.locator("nav button")).toHaveCount(4);await expect(prosody).toContainText("لا يستمع التطبيق");
      const lab=page.locator('[data-pronunciation-policy="articulation-contrast-practice-v1"]');
      await expect(lab.locator("svg[role=img]")).toBeVisible();
      await expect(lab.locator("[data-minimal-pair]")).toHaveCount(2);
      const firstPair=lab.locator("[data-minimal-pair]").first();
      await firstPair.getByRole("button",{name:/Hörprobe starten/}).click();
      await firstPair.locator(".contrast-challenge>div:nth-child(2)>button").first().click();
      await expect(firstPair.locator(".contrast-challenge aside.correct")).toBeVisible();
    }
    if (index < stageNames.length - 1) {
      await page.getByRole("button", { name: /أكملت هذه الخطوة/ }).click();
    }
  }

  await expect.poll(()=>page.evaluate((lessonId)=>new Promise<unknown>((resolve,reject)=>{const open=indexedDB.open("der-weg-nach-berlin",4);open.onerror=()=>reject(open.error);open.onsuccess=()=>{const request=open.result.transaction("learning-state","readonly").objectStore("learning-state").get("primary");request.onerror=()=>reject(request.error);request.onsuccess=()=>resolve({listening:request.result.listeningProcessEvents.filter((event:{lessonId:string})=>event.lessonId===lessonId),pronunciation:request.result.pronunciationContrastAttempts.filter((attempt:{lessonId:string})=>attempt.lessonId===lessonId),usage:request.result.listeningUsageEvents.filter((event:{surface:string;contentId:string})=>event.surface==="lesson"&&event.contentId===lessonId),mastery:request.result.mastery})}}),lesson.id)).toMatchObject({
    listening:[
      {event:"focus-committed",phase:"before",evidenceBoundary:"listening-process-only-no-score-or-mastery"},
      {event:"playback-started",phase:"during",evidenceBoundary:"listening-process-only-no-score-or-mastery"},
      {event:"gist-committed",phase:"during"},
      {event:"detail-committed",phase:"after"},
      {event:"detail-committed",phase:"after"},
    ],
    pronunciation:[{stimulusSource:"browser-tts-synthetic",correct:true,evidenceBoundary:"synthetic-discrimination-only-no-pronunciation-or-mastery-score"}],
    usage:[{event:"playback",playbackSource:"browser-tts",playOrdinal:1,evidenceBoundary:"process-evidence-no-comprehension-pronunciation-or-mastery-score"},{event:"transcript-revealed",playOrdinal:1,revealAfterAnswerCommit:true,evidenceBoundary:"process-evidence-no-comprehension-pronunciation-or-mastery-score"}],
    mastery:defaultState.mastery,
  });
  await expect(page.getByRole("button", { name: /أكمل الخطوة التالية أولًا/ })).toBeDisabled();
  await expect(page.locator(".lesson-evidence-gate")).toContainText("1/4");
  await expect(page.locator(".lesson-evidence-gate")).toContainText("خطوتك التالية");
  await expect(page.locator(".lesson-evidence-gate")).not.toContainText("0/1 مطلوب");

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
  await expect.poll(()=>page.evaluate(()=>new Promise<unknown>((resolve,reject)=>{const open=indexedDB.open("der-weg-nach-berlin",4);open.onerror=()=>reject(open.error);open.onsuccess=()=>{const request=open.result.transaction("learning-state","readonly").objectStore("learning-state").get("primary");request.onerror=()=>reject(request.error);request.onsuccess=()=>resolve(request.result.masteryEvidenceEvents?.find((event:{key:string})=>event.key==="a1-01"))}}))).toMatchObject({policyVersion:"event-derived-mastery-v1",key:"a1-01",operation:"set",source:"lesson-evidence",evidenceBoundary:"event-log-authoritative-for-new-mutations-legacy-snapshot-fallback-explicit"});

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
  expect(dueBefore).toBeLessThanOrEqual(25); // up to 24 authored cards plus one deduplicated confirmed-error card
  await expect(page.locator(".review-card-meta")).toContainText("مرحبًا برلين!");
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
  await expect(page.locator(".review-card-meta")).toContainText("مرحبًا برلين!");
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
    const open=indexedDB.open("der-weg-nach-berlin",4);open.onerror=()=>reject(open.error);open.onsuccess=()=>{const request=open.result.transaction("learning-state","readonly").objectStore("learning-state").get("primary");request.onerror=()=>reject(request.error);request.onsuccess=()=>{const state=request.result;const event=state.reviewEvents.at(-1);const masteryEvent=state.masteryEvidenceEvents.at(-1);resolve({kind:event.evidenceKind,delta:event.masteryDelta,mastery:state.mastery["a1-01"],masteryOperation:masteryEvent.operation,masterySource:masteryEvent.source});};};
  }))).toEqual({kind:"delayed",delta:4,mastery:Math.min(100,masteryBeforeFirstReview+4),masteryOperation:"increment",masterySource:"lesson-evidence"});
});

test("settings exports an encrypted DWNB archive and imports it as an isolated profile", async ({ page }) => {
  test.setTimeout(60_000);
  await page.goto("/settings");
  await waitForLearningReady(page);
  await expect(page.getByRole("heading", { name: /الإعدادات/ })).toBeVisible();
  await expect(page.locator('[data-dwnb-deprecation-policy="dwnb-deprecation-policy-v1"]')).toContainText("v1 قديم ومدعوم للاستيراد حتى 2027-03-31");
  const governance=page.locator('[data-content-governance-policy="content-accountability-lifecycle-v1"]');
  await expect(governance).toContainText("dwnb-a1-b2-2026.09-v1");
  await expect(governance).toContainText("3020");
  await governance.locator(":scope > details > summary").click();
  await expect(governance.locator(".content-family-lifecycle article")).toHaveCount(16);
  await expect(governance.locator(".content-family-lifecycle article").first()).toContainText("Draft");
  await expect(governance.locator(".content-family-lifecycle article").first()).toContainText("Validated");
  await expect(governance.locator(".content-family-lifecycle article").first()).toContainText("Published");
  await expect(governance).toContainText("18 بند نطق محتمل للعرب");
  await expect(page.getByText("تضمين التسجيلات الصوتية في ملف النسخة")).toBeVisible();
  await expect(page.getByText(/حارس التكلفة: 0 USD مسموح/)).toBeVisible();
  await expect(page.getByRole("button", { name: /استعادة ما قبل آخر استيراد/ })).toBeVisible();
  const vocabulary=page.locator('[data-vocabulary-import-policy="personal-vocabulary-import-v1"]');
  await vocabulary.locator('input[type="file"]').setInputFiles({name:"meine-woerter.tsv",mimeType:"text/tab-separated-values",buffer:Buffer.from("German\tArabic\tExample\tTags\nTermin\tموعد\tIch brauche einen Termin.\tarbeit,a1\n=BAD\tسيئ\t\tbad","utf8")});
  await expect(vocabulary.locator(".vocabulary-import-preview")).toContainText("1 مقبولة");
  await expect(vocabulary.locator(".vocabulary-import-preview")).toContainText("مرفوضة 1");
  expect(await page.evaluate(()=>new Promise<number>((resolve,reject)=>{const open=indexedDB.open("der-weg-nach-berlin",4);open.onerror=()=>reject(open.error);open.onsuccess=()=>{const request=open.result.transaction("learning-state","readonly").objectStore("learning-state").get("primary");request.onerror=()=>reject(request.error);request.onsuccess=()=>resolve(request.result?.personalVocabulary?.length??0)}}))).toBe(0);
  await vocabulary.getByRole("button",{name:"تأكيد استيراد المقبول فقط"}).click();
  await expect(vocabulary.locator(".personal-vocabulary-list")).toContainText("Termin");
  await expect.poll(()=>page.evaluate(()=>new Promise<unknown>((resolve,reject)=>{const open=indexedDB.open("der-weg-nach-berlin",4);open.onerror=()=>reject(open.error);open.onsuccess=()=>{const request=open.result.transaction("learning-state","readonly").objectStore("learning-state").get("primary");request.onerror=()=>reject(request.error);request.onsuccess=()=>resolve({vocabulary:request.result.personalVocabulary[0],reviews:request.result.reviewItems.length,mastery:request.result.mastery})}}))).toMatchObject({vocabulary:{policyVersion:"personal-vocabulary-import-v1",german:"Termin",arabic:"موعد",source:"user-tsv",evidenceBoundary:"personal-vocabulary-no-srs-mastery-or-cefr"},reviews:0,mastery:defaultState.mastery});

  const passphrase = page.getByPlaceholder("8 أحرف على الأقل — لا تُحفظ");
  await passphrase.fill("Berlin-2026!");
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: /تصدير \.dwnb/ }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toMatch(/^der-weg-backup-\d{4}-\d{2}-\d{2}\.dwnb$/);
  const archivePath = await download.path();
  expect(archivePath).toBeTruthy();

  await page.locator('input[type="file"][accept=".dwnb"]').setInputFiles(archivePath!);
  const preview = page.locator(".import-preview");
  await expect(preview.getByText("معاينة النسخة قبل التنفيذ")).toBeVisible();
  await expect(preview).toContainText("مشفرة · DWNB v3");
  await expect(preview).toContainText("Curriculum dwnb-a1-b2-2026.09-v1");
  await preview.getByRole("button", { name: /ملف جديد/ }).click();
  await preview.getByRole("button", { name: "تأكيد إنشاء الملف" }).click();

  await expect(page.locator('.status-announcement > span:not(.sr-only)').filter({hasText:/تم إنشاء ملف شخصي مستقل/})).toBeVisible();
  await expect(page.locator(".profile-row")).toHaveCount(2);
  await expect.poll(() => readActiveProfileId(page)).toMatch(/^profile-/);
  await expect.poll(()=>page.evaluate(()=>new Promise<unknown>((resolve,reject)=>{const open=indexedDB.open("der-weg-nach-berlin",4);open.onerror=()=>reject(open.error);open.onsuccess=()=>{const request=open.result.transaction("learning-state","readonly").objectStore("learning-state").get("primary");request.onerror=()=>reject(request.error);request.onsuccess=()=>resolve(request.result.personalVocabulary[0])}}))).toMatchObject({german:"Termin",arabic:"موعد",policyVersion:"personal-vocabulary-import-v1"});
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
  test.setTimeout(420_000);
  await page.goto("/settings");
  await waitForLearningReady(page);
  const packCard = page.locator(".offline-pack-card");
  await expect(packCard.locator(".offline-pack-picker button")).toHaveCount(5);
  await packCard.getByRole("button",{name:"A1 دروس ووحدات وبوابة A1",exact:true}).click();
  await expect(packCard.locator(".pack-size-preview")).toContainText("58 مسارًا",{timeout:30_000});
  await expect(packCard.locator('[data-pack-diff-policy="pre-update-curriculum-pack-diff-v2"]')).toContainText("مقارنة الحزمة قبل التحديث");
  await expect(packCard.locator(".pack-size-preview")).toContainText("40 ملفًا");
  await packCard.getByRole("button",{name:"تنزيل A1",exact:true}).click();
  await expect(packCard.getByText(/اكتمل تثبيت A1 دون الصوت/)).toBeVisible({timeout:180_000});
  const isolatedA1=await page.evaluate(async()=>{const cache=await caches.open("dwnb-full-pack-v119");const meta=await cache.match("/__dwnb_offline_pack_meta__");return{metadata:meta?await meta.json():null,a1:Boolean(await cache.match("/lernen/a1-24")),a2:Boolean(await cache.match("/lernen/a2-01")),exam:Boolean(await cache.match("/exams/goethe-b2/goethe-b2-reading-01"))}});
  expect(isolatedA1).toMatchObject({metadata:{packId:"a1",routeCount:58,includesAudio:false},a1:true,a2:false,exam:false});
  await packCard.getByRole("button",{name:/^B2 \+ Prüfung/}).click();
  await expect(packCard.locator(".pack-size-preview")).toContainText("207 مسارًا",{timeout:30_000});
  await expect(packCard.locator(".pack-size-preview")).toContainText("124 ملفًا");
  await packCard.getByRole("button",{name:/^A1–B2 komplett/}).click();
  await expect(packCard.locator(".pack-size-preview")).toContainText("306 مسارًا",{timeout:30_000});
  await expect(packCard.locator(".pack-size-preview")).toContainText("260 ملفًا");
  await expect(packCard.locator(".pack-size-preview")).toContainText("Gzip مبني مسبقًا");
  await packCard.getByRole("checkbox", { name: /تضمين صوت A1–B2 komplett/ }).check();
  const downloadButton = packCard.getByRole("button", { name: /تحديث A1–B2 komplett وإضافة الصوت/ });
  await expect(downloadButton).toBeEnabled({ timeout: 30_000 });
  await downloadButton.click();
  await expect(packCard.getByText(/اكتمل تثبيت A1–B2 komplett مع الصوت/)).toBeVisible({ timeout: 360_000 });
  await expect(packCard).toContainText("306 مسارًا");
  const todayReadiness=await page.evaluate(async()=>{const worker=navigator.serviceWorker.controller;if(!worker)throw new Error("Service Worker must control the settings page");return new Promise<{type:string;missingRoutes:string[];missingAudioAssets:string[]}>((resolve,reject)=>{const channel=new MessageChannel();const timeout=setTimeout(()=>reject(new Error("readiness timeout")),10_000);channel.port1.onmessage=(event)=>{clearTimeout(timeout);resolve(event.data)};worker.postMessage({type:"DWNB_TODAY_READINESS_CHECK",policyVersion:"today-session-offline-readiness-v1",routes:["/today","/lernen/a1-01","/practice","/speaking"],audioAssets:["/audio/lessons/a1-01.mp3"]},[channel.port2])})});
  expect(todayReadiness).toMatchObject({type:"DWNB_TODAY_READINESS_RESULT",missingRoutes:[],missingAudioAssets:[]});

  const packEvidence = await page.evaluate(async () => {
    const cache = await caches.open("dwnb-full-pack-v119");
    const response = await cache.match("/__dwnb_offline_pack_meta__");
    const metadata = response ? await response.json() as { packId:string;routeCount:number;assetCount:number;entryCount:number;includesAudio:boolean;audioEntryCount:number;byteSize:number;compressedPageByteSize:number;sizeManifestFingerprint:string } : null;
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
  expect(packEvidence.metadata?.packId).toBe("full");
  expect(packEvidence.metadata?.routeCount).toBe(306);
  expect(packEvidence.metadata?.compressedPageByteSize).toBeGreaterThan(1_000_000);
  expect(packEvidence.metadata?.sizeManifestFingerprint).toMatch(/^[a-f0-9]{64}$/);
  expect(packEvidence.metadata?.assetCount).toBeGreaterThan(90);
  expect(packEvidence.metadata?.entryCount).toBeGreaterThan(298);
  expect(packEvidence.metadata?.includesAudio).toBe(true);
  expect(packEvidence.metadata?.audioEntryCount).toBeGreaterThan(200);
  expect(packEvidence.metadata?.byteSize).toBeGreaterThan(10_000_000);
  expect(packEvidence.generatedAudioCached).toBe(true);

  try {
    await context.setOffline(true);
    await page.goto("/offline", { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("heading",{name:/الدراسة دون اتصال/})).toBeVisible();
    await expect(page.locator(".offline-recovery-page")).toContainText("إصلاح Offline لا يحذف أدلة التعلم");
    await page.goto("/path", { waitUntil: "domcontentloaded" });
    await page.locator('a[href="/lernen/b2-12"]').click();
    await expect(page).toHaveURL(/\/lernen\/b2-12$/);
    await waitForLearningReady(page);
    await expect(page.locator(".lesson-workspace h1")).toContainText("أهداف اليوم");
    await page.getByRole("button", { name: /أكملت هذه الخطوة/ }).click();
    await expect(page.getByText("المرحلة 2 من 14", { exact: false })).toBeVisible();

    await page.goto("/mediation", { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("heading", { name:/افهم الرسالة/ })).toBeVisible();

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
    const cache = await caches.open("dwnb-full-pack-v119");
    const audio = await cache.match("/audio/library/lib-l-a1-01.mp3");
    const lessonRoute = await cache.match("/lernen/b2-12");
    const response = await cache.match("/__dwnb_offline_pack_meta__");
    return { audio: Boolean(audio), lessonRoute: Boolean(lessonRoute), metadata: response ? await response.json() : null };
  });
  expect(afterAudioRemoval.audio).toBe(false);
  expect(afterAudioRemoval.lessonRoute).toBe(true);
  expect(afterAudioRemoval.metadata).toMatchObject({ packId:"full",includesAudio:false,audioEntryCount:0 });
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
  await expect(page.locator('.continuous-task-submitted [data-status-policy="status-announcement-v1"]')).toBeVisible();
  await expect(page.locator('.continuous-task-submitted [role="status"]')).toHaveAttribute("aria-live","polite");
  await expect(page.getByText("ثُبّت التسليم دون كشف التصحيح")).toBeVisible();
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
  await expect(page.locator('.targeted-speaking .status-announcement > span:not(.sr-only)').filter({hasText:/استُعيد التسجيل المؤقت محليًا/})).toBeVisible();
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
        state.writingSubmissions=[
          {id:"progress-writing-1",taskId:"a1-01",text:"Hallo.",wordCount:1,version:1,status:"submitted",feedback:[],createdAt:now.toISOString(),updatedAt:now.toISOString()},
          {id:"progress-writing-2",taskId:"a1-01",text:"Hallo! Ich lerne Deutsch.",wordCount:4,version:2,status:"revised",sourceVersion:1,feedback:[],createdAt:now.toISOString(),updatedAt:now.toISOString()},
        ];
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
  await expect(page.locator(".evidence-overview-stats")).toContainText("2 أيام دراسة ضمن استمرارية");
  const achievements=page.locator('[data-achievement-policy="evidence-derived-achievement-v1"]');
  await expect(achievements).toBeVisible();
  await expect(achievements.locator('[data-achievement="writing-revision"]')).toHaveClass(/unlocked/);
  await expect(achievements).toContainText("1/6");
  const masteryDerivation=page.locator('[data-mastery-derivation-policy="event-derived-mastery-v1"]');
  await expect(masteryDerivation).toBeVisible();
  await expect(masteryDerivation).toContainText("3 مفاتيح قديمة بلا Event بعد");
  await expect(masteryDerivation).toContainText("لا يأخذ أعلى رقم تلقائيًا");

  await page.goto("/today");
  await waitForLearningReady(page);
  await expect(page.locator(".coach-note")).toContainText("الاستماع");
  await expect(page.locator(".stat-pair").first()).toContainText("2");
  const timeComparison=page.locator('[data-time-comparison-policy="weekly-planned-actual-no-blame-v1"]');
  await expect(timeComparison).toBeVisible();
  await expect(timeComparison).toContainText("المخطط والمسجل — بلا لوم");
  await expect(timeComparison).toContainText("لا يغيّر الإتقان أو البوابة");
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

test("Arabic shell and every tested German or technical fragment keep explicit Bidi boundaries", async ({ page }) => {
  await page.goto("/library");
  await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
  await expect(page.locator("html")).toHaveAttribute("lang", "ar");
  await page.locator(".library-list>details>summary").filter({hasText:"Das kleine Café"}).click();
  await expect(page.locator('[lang="de"][dir="ltr"]').first()).toBeVisible();
  await expect(page.locator("bdi[lang],bdi[data-bidi-scope]").first()).toBeVisible();
  await assertLanguageBoundaries(page,"library");
  for(const route of ["/diagnostic","/assessment/a1","/lernen/a1-14","/exams/goethe-b2/goethe-b2-reading-01"]){await page.goto(route);await waitForLearningReady(page);await expect(page.locator("main")).toBeVisible();await assertLanguageBoundaries(page,route)}
  await page.goto("/settings");
  const technical=page.locator('[dir="ltr"][data-bidi-scope]');
  await expect(technical.first()).toBeAttached();
  expect(await technical.evaluateAll((elements)=>elements.every((element)=>getComputedStyle(element).unicodeBidi==="isolate"))).toBe(true);
});

test("high-confidence errors route through prerequisite repair into deduplicated no-mastery SRS", async ({ page }) => {
  await page.clock.setFixedTime(new Date("2026-09-07T10:00:00Z"));
  const lesson = academicLessons["a1-01"];
  const exercise = lesson.exercises.find((item)=>item.type==="multiple-choice")!;
  const wrongIndex = exercise.correctIndex === 0 ? 1 : 0;
  const wrong = exercise.options[wrongIndex];
  const correct = exercise.options[exercise.correctIndex];
  await page.goto("/lernen/a1-01");
  await waitForLearningReady(page);
  await page.evaluate((baseState) => new Promise<void>((resolve,reject)=>{
    const state=structuredClone(baseState);state.currentLessonId="a1-01";state.currentStage=5;state.lessonProgress={"a1-01":5};
    const open=indexedDB.open("der-weg-nach-berlin",4);open.onerror=()=>reject(open.error);open.onsuccess=()=>{const tx=open.result.transaction("learning-state","readwrite");tx.objectStore("learning-state").put(state,"primary");tx.oncomplete=()=>resolve();tx.onerror=()=>reject(tx.error)};
  }),structuredClone(defaultState));
  await page.reload();
  await waitForLearningReady(page);

  const card=page.locator(`[data-exercise-id="${exercise.id}"]`);
  await card.locator(`[data-original-index="${wrongIndex}"]`).click();
  await card.getByRole("button",{name:/Sehr sicher/}).click();
  await card.getByRole("button",{name:"تحقق"}).click();
  await expect.poll(()=>page.evaluate(()=>new Promise<unknown>((resolve,reject)=>{const open=indexedDB.open("der-weg-nach-berlin",4);open.onerror=()=>reject(open.error);open.onsuccess=()=>{const request=open.result.transaction("learning-state","readonly").objectStore("learning-state").get("primary");request.onerror=()=>reject(request.error);request.onsuccess=()=>resolve(request.result.errors[0])}}))).toMatchObject({sourceLessonId:"a1-01",sourceExerciseId:exercise.id,lastConfidence:"high",highConfidenceWrongCount:1,patternClassification:"misconception-risk"});

  await page.goto("/progress");
  await expect(page.getByText("خطأ مع ثقة عالية",{exact:true})).toBeVisible();
  await expect(page.getByText("ابدأ بالخطأ عالي الثقة",{exact:true})).toBeVisible();
  await page.goto("/errors");
  const error=page.locator(".personal-errors article").filter({hasText:wrong});
  await expect(error).toContainText("خطر تصور خاطئ");
  await expect(error).toContainText("ثقة عالية + خطأ");

  const repair=error.getByRole("textbox",{name:`تصحيح ${wrong}`});
  for(const failed of ["noch falsch","weiter falsch"]){await repair.fill(failed);await error.getByRole("button",{name:/تحقق من العلاج/}).click()}
  await expect(error.locator(".error-prerequisite")).toContainText("فشل العلاج 2 مرات");
  await error.getByRole("link",{name:"افتح شرح القاعدة"}).click();
  await expect(page).toHaveURL(/\/lernen\/a1-01$/);
  await expect(page.getByRole("heading",{name:/القاعدة والمقارنة/})).toBeVisible();

  await page.goto("/errors");
  let currentError=page.locator(".personal-errors article").filter({hasText:wrong});
  await currentError.getByRole("textbox",{name:`تصحيح ${wrong}`}).fill(correct);
  await currentError.getByRole("button",{name:/تحقق من العلاج/}).click();
  await expect(currentError).toContainText("ينتظر اختبارًا مؤجلًا");
  await page.clock.setFixedTime(new Date("2026-09-08T09:00:00Z"));
  await page.reload();
  currentError=page.locator(".personal-errors article").filter({hasText:wrong});
  await currentError.getByRole("textbox",{name:`تصحيح ${wrong}`}).fill(correct);
  await currentError.getByRole("button",{name:/تحقق من العلاج/}).click();
  await expect(currentError.locator(".personal-error-srs")).toContainText("دخلت بطاقة علاج شخصية إلى SRS");

  await currentError.getByRole("link",{name:"افتح المراجعة"}).click();
  await expect(page.locator(".review-card-meta")).toContainText("بطاقة علاج شخصية جديدة · بلا mastery");
  const shortcutGuide=page.locator('[data-review-shortcut-policy="review-keyboard-shortcuts-v1"]');
  await expect(shortcutGuide).toContainText("Space");
  await page.locator("body").focus();
  await page.keyboard.press("5");
  await expect(page.locator(".grade-grid")).toHaveCount(0);
  await page.keyboard.press("Space");
  await expect(page.locator(".flashcard")).toHaveClass(/flipped/);
  await page.keyboard.press("5");
  await expect.poll(()=>page.evaluate(()=>new Promise<unknown>((resolve,reject)=>{const open=indexedDB.open("der-weg-nach-berlin",4);open.onerror=()=>reject(open.error);open.onsuccess=()=>{const request=open.result.transaction("learning-state","readonly").objectStore("learning-state").get("primary");request.onerror=()=>reject(request.error);request.onsuccess=()=>resolve({events:request.result.reviewEvents,mastery:request.result.mastery,errors:request.result.errors})}}))).toMatchObject({events:[{evidenceScope:"personal-error-remediation",masteryDelta:0}],mastery:defaultState.mastery,errors:[{resolved:true,failedRepairCount:2}]});

  await page.goto("/errors");await waitForLearningReady(page);
  await expect(page.locator('[data-error-trend-policy="actual-attempt-weekly-error-trend-v1"]')).toBeVisible();
  await expect(page.locator('[data-intervention-timeline-policy="derived-error-intervention-timeline-v1"]')).toContainText("مراجعة بطاقة علاج شخصية");
  const historicalError=page.locator(".personal-errors article").filter({hasText:wrong});
  await historicalError.getByRole("button",{name:/أفهم القاعدة لكن لا أطبقها تحت الوقت/}).click();
  await historicalError.getByRole("button",{name:/إخفاء هذا الخطأ من الطباعة/}).click();
  await expect(historicalError).toContainText("مخفي من التقارير المطبوعة");
  await expect.poll(()=>page.evaluate(()=>new Promise<unknown>((resolve,reject)=>{const open=indexedDB.open("der-weg-nach-berlin",4);open.onerror=()=>reject(open.error);open.onsuccess=()=>{const request=open.result.transaction("learning-state","readonly").objectStore("learning-state").get("primary");request.onerror=()=>reject(request.error);request.onsuccess=()=>resolve(request.result.errors[0])}}))).toMatchObject({learnerContextTags:["knows-rule-under-time-pressure"],sensitiveInPrint:true,learnerMetadataUpdatedAt:expect.any(String)});
  await page.emulateMedia({media:"print"});
  await expect(historicalError).toBeHidden();
  await expect(page.locator(".error-intervention-timeline .sensitive-in-print").first()).toBeHidden();
  await page.emulateMedia({media:"screen"});
  await expect(historicalError).toBeVisible();
});

test("support use is logged without penalty and old evidence lowers confidence without deleting attempts", async ({ page }) => {
  await page.clock.setFixedTime(new Date("2026-09-07T12:00:00Z"));
  const oldReadingAttempts = Object.values(academicLessons).flatMap((lesson) => lesson.reading.questions.slice(0, 1).map((question) => ({
    id:`old-${question.id}`, lessonId:lesson.id, exerciseId:question.id, answer:question.options[question.correctIndex], correct:true, createdAt:"2025-01-01T10:00:00Z",
  }))).slice(0, 15);
  await page.goto("/lernen/a1-01");
  await waitForLearningReady(page);
  await page.evaluate(({ baseState, attempts }) => new Promise<void>((resolve, reject) => {
    const state = structuredClone(baseState);
    state.currentLessonId = "a1-01";
    state.currentStage = 5;
    state.lessonProgress = { "a1-01":5 };
    state.exerciseAttempts = attempts;
    const open = indexedDB.open("der-weg-nach-berlin", 4);
    open.onerror = () => reject(open.error);
    open.onsuccess = () => {
      const transaction = open.result.transaction("learning-state", "readwrite");
      transaction.objectStore("learning-state").put(state, "primary");
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    };
  }), { baseState:structuredClone(defaultState), attempts:oldReadingAttempts });
  await page.reload();
  await waitForLearningReady(page);

  const firstExercise = page.locator(".exercise-card").first();
  await firstExercise.getByRole("button", { name:"تلميح" }).click();
  await expect(firstExercise.getByRole("status")).toContainText("تلميح 1/2");
  await firstExercise.getByRole("button",{name:/Ich rate/}).click();
  await firstExercise.locator(".exercise-options button").first().click();
  await firstExercise.getByRole("button",{name:"تحقق"}).click();
  await page.getByRole("button", { name:/أكملت هذه الخطوة/ }).click();
  await page.getByText("افتح المعنى العربي بعد المحاولة", { exact:true }).click();

  await expect.poll(() => page.evaluate(() => new Promise<unknown>((resolve, reject) => {
    const open = indexedDB.open("der-weg-nach-berlin", 4);
    open.onerror = () => reject(open.error);
    open.onsuccess = () => {
      const request = open.result.transaction("learning-state", "readonly").objectStore("learning-state").get("primary");
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve({ support:request.result.supportUsageEvents, mastery:request.result.mastery, attempts:request.result.exerciseAttempts.length, process:request.result.exerciseAttempts.at(-1) });
    };
  }))).toMatchObject({ support:[{ kind:"hint", supportLevel:1, afterCommit:false }, { kind:"reading-translation", afterCommit:true }], mastery:defaultState.mastery, attempts:16, process:{processPolicyVersion:"bounded-attempt-process-v1",uncertaintyKind:"guess",answerChangeCount:0,responseTimeMs:expect.any(Number)} });

  await page.goto("/progress");
  const supportCard = page.locator('[data-support-policy="support-usage-v1"][data-freshness-policy="evidence-freshness-v1"]');
  await expect(supportCard).toContainText("2");
  await expect(supportCard).toContainText("1 تلميحات");
  await expect(supportCard).toContainText("1 ترجمات قراءة");
  const separationCard=page.locator('[data-assistance-separation-policy="guided-independent-support-separation-v1"]');
  await expect(separationCard).toContainText("1 تدريب موجّه");
  await expect(separationCard).toContainText("15 نقل مستقل");
  await expect(separationCard).toContainText("0 نقل مع دعم");
  await expect(separationCard).toContainText("1 كل المحاولات المدعومة");
  const processCard=page.locator('[data-attempt-process-summary="bounded-attempt-process-v1"]');
  await expect(processCard).toContainText("1 تخمينات مصرّح بها");
  await expect(processCard).toContainText("1 محاولات بدعم مباشر");
  await expect(processCard).toContainText("لا نسجل ضغطات المفاتيح");
  const readingSkill = page.locator(".evidence-skill").filter({ hasText:"القراءة" });
  await expect(readingSkill).toContainText("100%");
  await expect(readingSkill).toContainText("عينة أولية");
  await expect(readingSkill).toContainText("دليل قديم جدًا");
  await expect(readingSkill).toContainText("وزن ثقة 40%");

  await page.goto("/settings");
  await page.getByRole("button", { name:"حذف سجل الدعم" }).click();
  await expect(page.getByRole("dialog").getByRole("heading", { name:"حذف سجل استعمال الدعم الآن؟" })).toBeVisible();
  await page.getByRole("button", { name:"نعم، احذف سجل الدعم" }).click();
  await expect(page.locator(".status-announcement > span:not(.sr-only)").filter({ hasText:/حُذف فورًا سجل استعمال الدعم/ })).toBeVisible();
});

test("fourteen-day contract, quiet hours, and one-skill diagnostic stay planning-only", async ({ page }) => {
  await page.clock.setFixedTime(new Date("2026-09-07T23:00:00Z"));
  await page.goto("/settings");await waitForLearningReady(page);
  await page.evaluate((baseState)=>new Promise<void>((resolve,reject)=>{const state=structuredClone(baseState);state.profile={name:"Nadia",targetExam:"goethe-b2",dailyMinutes:45,arabicSupport:"modern-standard-arabic",currentLevel:"A1",goals:["work"],createdAt:"2026-08-01T00:00:00Z"};state.diagnosticResult={estimatedLevel:"A1",score:3,maxScore:4,levelScores:{A1:3,A2:0,B1:0,B2:0},formId:"A",completedAt:"2026-09-01T10:00:00Z"};const open=indexedDB.open("der-weg-nach-berlin",4);open.onerror=()=>reject(open.error);open.onsuccess=()=>{const tx=open.result.transaction("learning-state","readwrite");tx.objectStore("learning-state").put(state,"primary");tx.oncomplete=()=>resolve();tx.onerror=()=>reject(tx.error)}}),structuredClone(defaultState));
  await page.reload();await waitForLearningReady(page);
  const planning=page.locator('[data-contract-policy="fourteen-day-learning-contract-v1"]');
  await planning.getByLabel("الهدف").selectOption("work");await planning.getByLabel("دقائق يوم الدراسة").selectOption("20");await planning.getByRole("button",{name:"أنشئ العقد"}).click();
  await expect(planning).toContainText("2026-09-07 إلى 2026-09-20");
  await planning.getByRole("checkbox",{name:/تفعيل/}).check();
  await expect(page.locator(".app-frame")).toHaveAttribute("data-quiet-hours-active","true");
  await planning.getByLabel("دقائق يوم الدراسة").selectOption("30");await planning.getByRole("button",{name:"احفظ مراجعة جديدة"}).click();
  await expect(planning).toContainText("المراجعة 2");
  const intensity=planning.locator('[data-intensity-policy="learner-selected-intensity-presets-v1"]');
  await intensity.getByRole("button",{name:/مكثفة/}).click();
  await expect(intensity).toContainText("الأساس 30 دقيقة · النتيجة 45 دقيقة");
  await page.goto("/today");await expect(page.locator('[data-contract-policy="fourteen-day-learning-contract-v1"]')).toContainText("المراجعة 2");await expect(page.getByText("نحو 45 دقيقة")).toBeVisible();await expect(page.locator(".side-coach-card")).toHaveCount(0);

  await page.goto("/diagnostic");
  await page.getByRole("button",{name:/Grammatik/}).click();
  const questions=diagnosticForms.B.filter(question=>question.skill==="grammar");
  for(let index=0;index<questions.length;index+=1){await page.locator(".question-card .option-list button").nth(questions[index].correctIndex).click();await page.getByRole("button",{name:index===3?"احفظ عينة المهارة":/السؤال التالي/}).click()}
  await expect(page.locator('[data-skill-diagnostic-policy="single-skill-diagnostic-v1"]')).toContainText("4/4");
  await expect(page.getByText(/لم يتغير المستوى العام/)).toBeVisible();
  await expect.poll(()=>page.evaluate(()=>new Promise<unknown>((resolve,reject)=>{const open=indexedDB.open("der-weg-nach-berlin",4);open.onerror=()=>reject(open.error);open.onsuccess=()=>{const request=open.result.transaction("learning-state","readonly").objectStore("learning-state").get("primary");request.onerror=()=>reject(request.error);request.onsuccess=()=>resolve({contracts:request.result.learningContracts,retests:request.result.skillDiagnosticAttempts,diagnostic:request.result.diagnosticResult,level:request.result.profile.currentLevel,quiet:request.result.quietHours,intensity:request.result.planningIntensity,mastery:request.result.mastery})}}))).toMatchObject({contracts:[{revision:1},{revision:2,previousContractId:expect.any(String)}],retests:[{skill:"grammar",formId:"B",correctCount:4,recommendedFocusLevel:"B2",evidenceBoundary:"skill-sample-planning-only-no-level-change"}],diagnostic:{completedAt:"2026-09-01T10:00:00Z"},level:"A1",quiet:{enabled:true,notificationBoundary:"no-push-no-notification-api-in-app-nudges-only"},intensity:{preset:"intensive",policyVersion:"learner-selected-intensity-presets-v1",evidenceBoundary:"learner-selected-session-budget-no-automatic-increase-mastery-or-penalty"},mastery:defaultState.mastery});
});

test("local study exports preview and download ICS, printable PDF, and safe Anki TSV", async ({ page }) => {
  await page.clock.setFixedTime(new Date("2026-09-07T10:00:00Z"));
  await page.goto("/settings");
  await waitForLearningReady(page);
  await page.evaluate((baseState)=>new Promise<void>((resolve,reject)=>{const state=structuredClone(baseState);state.profile={name:"Nadia",targetExam:"goethe-b2",dailyMinutes:45,arabicSupport:"modern-standard-arabic",currentLevel:"A1",createdAt:"2026-08-01T00:00:00Z"};state.completedLessonIds=["a1-01"];state.studyHistory=[{date:"2026-09-07",minutes:30,evidenceCount:4}];const open=indexedDB.open("der-weg-nach-berlin",4);open.onerror=()=>reject(open.error);open.onsuccess=()=>{const tx=open.result.transaction("learning-state","readwrite");tx.objectStore("learning-state").put(state,"primary");tx.oncomplete=()=>resolve();tx.onerror=()=>reject(tx.error)}}),structuredClone(defaultState));
  await page.reload();await waitForLearningReady(page);
  const card=page.locator('[data-export-policy="local-study-exports-v1"]');
  await expect(card).toContainText("معاينة قبل التنزيل");
  await expect(card.locator(".study-export-preview")).toContainText("الاسم غير مضمّن");
  await expect(card.locator(".study-export-summary")).toContainText("30");

  const [icsDownload]=await Promise.all([page.waitForEvent("download"),card.getByRole("button",{name:/تنزيل ICS/}).click()]);
  expect(icsDownload.suggestedFilename()).toBe("dwnb-plan-2026-09-07.ics");
  const icsPath=await icsDownload.path();if(!icsPath)throw new Error("missing ICS path");const ics=await readFile(icsPath,"utf8");
  expect(ics).toContain("BEGIN:VCALENDAR\r\nVERSION:2.0");expect(ics).toContain("X-DWNB-POLICY:local-study-exports-v1");expect(ics).not.toContain("Nadia");

  await page.evaluate(()=>{window.print=()=>sessionStorage.setItem("dwnb-print-called","yes")});
  await card.getByRole("button",{name:/طباعة المعاينة/}).click();
  expect(await page.evaluate(()=>sessionStorage.getItem("dwnb-print-called"))).toBe("yes");

  const [pdfDownload]=await Promise.all([page.waitForEvent("download"),card.getByRole("button",{name:/تنزيل PDF/}).click()]);
  expect(pdfDownload.suggestedFilename()).toBe("dwnb-week-2026-09-07.pdf");const pdfPath=await pdfDownload.path();if(!pdfPath)throw new Error("missing PDF path");const pdf=await readFile(pdfPath);const pdfText=pdf.toString("latin1");expect(pdfText.startsWith("%PDF-1.4")).toBe(true);expect(pdfText).toContain("/DCTDecode");expect(pdfText.trimEnd().endsWith("%%EOF")).toBe(true);

  const [tsvDownload]=await Promise.all([page.waitForEvent("download"),card.getByRole("button",{name:/Anki TSV/}).click()]);
  expect(tsvDownload.suggestedFilename()).toBe("dwnb-anki-2026-09-07.tsv");const tsvPath=await tsvDownload.path();if(!tsvPath)throw new Error("missing TSV path");const tsv=await readFile(tsvPath,"utf8");expect(tsv.startsWith("﻿Front\tBack\tHint\tTags\tCardId")).toBe(true);expect(tsv).not.toContain("Nadia");
  const partial=page.locator('[data-partial-export-policy="partial-study-sections-export-v1"]');
  const [partialDownload]=await Promise.all([page.waitForEvent("download"),partial.getByRole("button",{name:/تنزيل JSON انتقائي/}).click()]);
  expect(partialDownload.suggestedFilename()).toBe("dwnb-partial-2026-09-07.json");const partialPath=await partialDownload.path();if(!partialPath)throw new Error("missing partial JSON path");const partialPayload=JSON.parse(await readFile(partialPath,"utf8"));expect(partialPayload).toMatchObject({format:"dwnb-partial-study-export",policyVersion:"partial-study-sections-export-v1",restorable:false,includesSecrets:false,selectedSections:["progress"]});expect(partialPayload.data.progress.completedLessonIds).toEqual(["a1-01"]);
  await card.getByRole("checkbox",{name:/تضمين الاسم/}).check();await expect(card.locator(".study-export-preview")).toContainText("Nadia");
});

test("adaptive dictation moves from partial A1 to full A2 and stores summary only", async ({ page }) => {
  await page.addInitScript(() => {
    class StubUtterance {
      text: string;
      lang = "";
      rate = 1;
      pitch = 1;
      voice: SpeechSynthesisVoice | null = null;
      onstart: (() => void) | null = null;
      onend: (() => void) | null = null;
      onerror: (() => void) | null = null;
      constructor(text: string) { this.text = text; }
    }
    Object.defineProperty(window, "SpeechSynthesisUtterance", { configurable: true, value: StubUtterance });
    Object.defineProperty(window, "speechSynthesis", { configurable: true, value: {
      cancel() {}, getVoices() { return []; },
      speak(utterance: StubUtterance) { utterance.onstart?.(); utterance.onend?.(); },
    } });
  });
  await page.goto("/practice");
  await waitForLearningReady(page);
  await expect(page.getByRole("link", { name: /مختبر الإملاء المتكيف/ })).toContainText("16 مهمة");
  await page.goto("/practice/dictation");
  await waitForLearningReady(page);
  const lab = page.locator('[data-dictation-policy="adaptive-partial-full-dictation-v1"]');
  await expect(lab).toContainText("16 مهمة أصلية");
  await expect(lab.locator(".dictation-task-nav>button")).toHaveCount(4);
  await lab.getByRole("button", { name: /Jetzt hören/ }).click();
  await expect(lab.getByRole("textbox", { name: /Lücke 1/ })).toBeVisible();
  await lab.getByRole("textbox", { name: /Lücke 1/ }).fill("Tag");
  await lab.getByRole("textbox", { name: /Lücke 2/ }).fill("heisse");
  await lab.getByRole("button", { name: "Vergleichen · قارن", exact: true }).click();
  await expect(lab.getByRole("heading", { name: "قارن ثم أعد المحاولة" })).toBeFocused();
  await expect(lab.locator(".dictation-result")).toContainText("50%");
  await expect(lab.locator(".dictation-model")).toContainText("Guten Tag, ich heiße Salma.");
  await lab.getByRole("button", { name: /أخفِ النموذج وأعد/ }).click();
  await expect(lab.locator(".dictation-result")).toHaveCount(0);

  await lab.getByRole("button", { name: /A2 جزئي ثم كامل/ }).click();
  await lab.getByRole("button", { name: /خطأ في الفاتورة/ }).click();
  await lab.getByRole("button", { name: /Jetzt hören/ }).click();
  const full = lab.getByRole("textbox", { name: /Schreiben Sie den gehörten Satz/ });
  await full.fill("Ich habe die Rechnung geprüft, aber die Adresse war falsch.");
  await lab.getByRole("button", { name: "Vergleichen · قارن", exact: true }).click();
  await expect(lab.getByRole("heading", { name: "مطابقة كاملة لهذه المحاولة" })).toBeFocused();
  await expect(lab.locator(".dictation-result")).toContainText("100%");
  await expect.poll(() => page.evaluate(() => new Promise<unknown>((resolve, reject) => {
    const open = indexedDB.open("der-weg-nach-berlin", 4);
    open.onerror = () => reject(open.error);
    open.onsuccess = () => {
      const request = open.result.transaction("learning-state", "readonly").objectStore("learning-state").get("primary");
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result.dictationAttempts);
    };
  }))).toEqual(expect.arrayContaining([
    expect.objectContaining({ policyVersion: "adaptive-partial-full-dictation-v1", level: "A1", mode: "partial", exact: false, wordAccuracyPercent: 50 }),
    expect.objectContaining({ policyVersion: "adaptive-partial-full-dictation-v1", level: "A2", mode: "full", exact: true, wordAccuracyPercent: 100 }),
  ]));
  const stored = await page.evaluate(() => new Promise<unknown[]>((resolve, reject) => {
    const open = indexedDB.open("der-weg-nach-berlin", 4);
    open.onerror = () => reject(open.error);
    open.onsuccess = () => {
      const request = open.result.transaction("learning-state", "readonly").objectStore("learning-state").get("primary");
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result.dictationAttempts);
    };
  }));
  expect(JSON.stringify(stored)).not.toMatch(/Guten Tag|Rechnung geprüft|answerText|canonicalText/);
  await lab.getByRole("button", { name: /B2 إملاء كامل/ }).click();
  await expect(lab.locator(".dictation-task-nav")).toContainText("كامل");
  await page.setViewportSize({ width: 320, height: 568 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(await page.evaluate(() => document.documentElement.clientWidth + 1));
});

test("offline branching conversations change consequences and persist structured summaries only", async ({ page }) => {
  await page.addInitScript(() => {
    class StubUtterance { text:string;lang="";rate=1;pitch=1;voice:SpeechSynthesisVoice|null=null;onstart:(()=>void)|null=null;onend:(()=>void)|null=null;onerror:(()=>void)|null=null;constructor(text:string){this.text=text} }
    Object.defineProperty(window,"SpeechSynthesisUtterance",{configurable:true,value:StubUtterance});
    Object.defineProperty(window,"speechSynthesis",{configurable:true,value:{cancel(){},getVoices(){return[]},speak(utterance:StubUtterance){utterance.onstart?.();utterance.onend?.()}}});
  });
  await page.goto("/practice");await waitForLearningReady(page);
  await expect(page.getByRole("link",{name:/مسارات المحادثة/})).toContainText("8 سيناريوهات");
  await page.goto("/practice/conversation-paths");await waitForLearningReady(page);
  const lab=page.locator('[data-branching-conversation-policy="offline-branching-conversation-v1"]');
  await expect(lab).toContainText("8 سيناريوهات أصلية");
  await expect(lab.locator(".branching-scenario-tabs>button")).toHaveCount(2);
  await expect(lab.locator(".branching-mission")).toContainText("اطلب قطعتين واسأل عن السعر");
  const branchingAxe=await new AxeBuilder({page}).include("main").withTags(["wcag2a","wcag2aa"]).analyze();
  expect(branchingAxe.violations.filter((item)=>item.impact==="serious"||item.impact==="critical")).toEqual([]);
  await lab.locator(".branching-choices>button").first().click();
  await expect(lab.locator(".branching-feedback")).toContainText("فهمت البائعة الشيء والعدد مباشرة");
  await expect(lab.locator(".branching-partner-bubble")).toContainText("Möchten Sie sonst noch etwas?");
  await lab.locator(".branching-choices>button").first().click();
  await expect(lab.getByRole("heading",{name:"تحقق الهدف التواصلي"})).toBeFocused();
  await expect(lab.locator(".branching-outcome")).toContainText("اكتمل الطلب");
  await expect(lab.locator(".branching-outcome .transfer")).toContainText("Bestellen Sie jetzt ein Getränk");

  await lab.locator(".branching-outcome footer .secondary-button").click();
  await lab.getByRole("button",{name:/تحدٍ/}).click();
  await expect(lab.locator(".branching-choices>button small")).toHaveCount(0);
  await lab.locator(".branching-choices>button").nth(2).click();
  await expect(lab.getByRole("heading",{name:"الأفضل إعادة المسار"})).toBeFocused();
  await expect(lab.locator(".branching-outcome")).toContainText("أعد بهدف أوضح");
  await expect.poll(()=>page.evaluate(()=>new Promise<unknown>((resolve,reject)=>{const open=indexedDB.open("der-weg-nach-berlin",4);open.onerror=()=>reject(open.error);open.onsuccess=()=>{const request=open.result.transaction("learning-state","readonly").objectStore("learning-state").get("primary");request.onerror=()=>reject(request.error);request.onsuccess=()=>resolve(request.result.branchingConversationAttempts)}}))).toEqual(expect.arrayContaining([
    expect.objectContaining({policyVersion:"offline-branching-conversation-v1",level:"A1",mode:"guided",outcome:"goal-reached",completedTurns:2,engine:"deterministic-local-tree"}),
    expect.objectContaining({policyVersion:"offline-branching-conversation-v1",level:"A1",mode:"challenge",outcome:"restart-recommended",completedTurns:1}),
  ]));
  const stored=await page.evaluate(()=>new Promise<unknown[]>((resolve,reject)=>{const open=indexedDB.open("der-weg-nach-berlin",4);open.onerror=()=>reject(open.error);open.onsuccess=()=>{const request=open.result.transaction("learning-state","readonly").objectStore("learning-state").get("primary");request.onerror=()=>reject(request.error);request.onsuccess=()=>resolve(request.result.branchingConversationAttempts)}}));
  expect(JSON.stringify(stored)).not.toMatch(/Brötchen|responseDe|freeText|utteranceDe/);
  await lab.getByRole("button",{name:/B2 تفاوض وحجة/}).click();
  await expect(lab.locator(".branching-scenario-tabs>button")).toHaveCount(2);
  await expect(lab.locator(".branching-mission")).toContainText("اقترح تجربة محدودة بمعايير متابعة");
  await page.setViewportSize({width:320,height:568});
  expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(await page.evaluate(()=>document.documentElement.clientWidth+1));
});

test("contextual collocation networks require exploration and match communicative intent",async({page})=>{
  await page.goto("/practice");await waitForLearningReady(page);await expect(page.getByRole("link",{name:/شبكات التراكيب/})).toContainText("48 تركيبًا");
  await page.goto("/practice/collocations");await waitForLearningReady(page);const lab=page.locator('[data-collocation-network-policy="contextual-collocation-network-v1"]');await expect(lab).toContainText("16 شبكة · 48 تركيبًا");await expect(lab.locator(".collocation-tabs>button")).toHaveCount(4);
  const start=lab.getByRole("button",{name:/ابدأ اختبار السياق/});await expect(start).toBeDisabled();const mapButtons=lab.locator(".collocation-map>button");await expect(mapButtons).toHaveCount(3);for(let index=0;index<3;index+=1)await mapButtons.nth(index).click();await expect(start).toBeEnabled();
  const axe=await new AxeBuilder({page}).include("main").withTags(["wcag2a","wcag2aa"]).analyze();expect(axe.violations.filter(item=>item.impact==="serious"||item.impact==="critical")).toEqual([]);
  await start.click();await expect(lab.locator(".collocation-quiz")).toContainText("Sie brauchen einen neuen Termin.");await lab.locator(".collocation-quiz>div>button").nth(1).click();await expect(lab.locator(".collocation-quiz>aside")).toContainText("راجع الفرق");await lab.locator(".collocation-quiz>footer button").click();await lab.locator(".collocation-quiz>div>button").nth(1).click();await lab.locator(".collocation-quiz>footer button").click();await lab.locator(".collocation-quiz>div>button").nth(2).click();await lab.locator(".collocation-quiz>footer button").click();
  await expect(lab.getByRole("heading",{name:"أكملت وصلات هذه الشبكة"})).toBeFocused();await expect(lab.locator(".collocation-result")).toContainText("2 من 3");await expect.poll(()=>page.evaluate(()=>new Promise<unknown>((resolve,reject)=>{const open=indexedDB.open("der-weg-nach-berlin",4);open.onerror=()=>reject(open.error);open.onsuccess=()=>{const request=open.result.transaction("learning-state","readonly").objectStore("learning-state").get("primary");request.onerror=()=>reject(request.error);request.onsuccess=()=>resolve(request.result.collocationNetworkAttempts)}}))).toEqual(expect.arrayContaining([expect.objectContaining({policyVersion:"contextual-collocation-network-v1",level:"A1",mode:"guided",correctCount:2,total:3,engine:"deterministic-context-match"})]));
  const stored=await page.evaluate(()=>new Promise<unknown[]>((resolve,reject)=>{const open=indexedDB.open("der-weg-nach-berlin",4);open.onerror=()=>reject(open.error);open.onsuccess=()=>{const request=open.result.transaction("learning-state","readonly").objectStore("learning-state").get("primary");request.onerror=()=>reject(request.error);request.onsuccess=()=>resolve(request.result.collocationNetworkAttempts)}}));expect(JSON.stringify(stored)).not.toMatch(/Termin vereinbaren|phraseDe|freeText/);
  await lab.getByRole("button",{name:/B2 حجة وتحليل/}).click();await expect(lab.locator(".collocation-tabs>button")).toHaveCount(4);await expect(lab.locator(".collocation-stage>header")).toContainText("Risiko");await page.setViewportSize({width:320,height:568});expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(await page.evaluate(()=>document.documentElement.clientWidth+1));
});

test("representative 320–1920 px viewports avoid document-level horizontal overflow", async ({ page }) => {
  test.setTimeout(120_000);
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
  for (const route of ["/path", "/library", "/search", "/settings", "/shadowing", "/practice/dictation", "/practice/conversation-paths", "/practice/collocations", "/progress", "/tutor", "/errors"]) {
    await page.goto(route);
    await expect(page.locator("main")).toBeVisible();
    const dimensions = await page.evaluate(() => ({ width: document.documentElement.clientWidth, scrollWidth: document.documentElement.scrollWidth }));
    expect(dimensions.scrollWidth, `${route} at 320×568`).toBeLessThanOrEqual(dimensions.width + 1);
  }
  await page.goto("/today");await waitForLearningReady(page);
  const bottom=page.getByRole("navigation",{name:"التنقل على الهاتف"});
  await expect(bottom.locator(":scope > *")).toHaveCount(5);
  await bottom.getByRole("button",{name:/المزيد/}).click();
  const destinationSheet=page.getByRole("dialog",{name:"كل أقسام المنصة"});
  await expect(destinationSheet).toBeVisible();
  await expect(destinationSheet.getByRole("link",{name:/مختبرات المهارة/})).toBeVisible();
  await expect(destinationSheet.getByRole("link",{name:/مركز الامتحان/})).toBeVisible();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(await page.evaluate(()=>document.documentElement.clientWidth+1));
  await destinationSheet.getByRole("link",{name:/الإعدادات/}).click();
  await expect(page).toHaveURL(/\/settings$/);
  await expect(page.getByRole("dialog")).toHaveCount(0);
});


test("completed four-skill vocabulary progress is terminal, persisted, and continues to discovery", async ({ page }) => {
  const lesson = academicLessons["a1-01"];
  await page.goto(`/lernen/${lesson.id}`);
  await waitForLearningReady(page);
  await page.evaluate(({ baseState, lessonId, phraseCount }) => new Promise<void>((resolve, reject) => {
    const open = indexedDB.open("der-weg-nach-berlin", 4);
    open.onerror = () => reject(open.error);
    open.onsuccess = () => {
      const state = structuredClone(baseState);
      state.currentLessonId = lessonId;
      state.currentStage = 2;
      state.lessonProgress = { [lessonId]: 2 };
      state.exerciseAttempts = Array.from({ length: phraseCount }, (_, index) => ({
        id: `four-skill-e2e-${index + 1}`,
        lessonId,
        exerciseId: `${lessonId}:four-skill-phrase:${index + 1}`,
        answer: "local-word-match-confirmed",
        correct: true,
        createdAt: new Date(1_757_680_000_000 + index * 1000).toISOString(),
      }));
      const tx = open.result.transaction("learning-state", "readwrite");
      tx.objectStore("learning-state").put(state, "primary");
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    };
  }), { baseState: structuredClone(defaultState), lessonId: lesson.id, phraseCount: lesson.phrases.length });
  await page.reload();
  await waitForLearningReady(page);
  const cycle = page.locator('[data-vocabulary-cycle-policy="adaptive-four-skill-cycle-v2"]');
  await expect(cycle).toContainText(`${lesson.phrases.length}/${lesson.phrases.length}`);
  await expect(cycle).toContainText("لن تعود الدورة إلى العبارة الأولى");
  await expect(cycle).not.toContainText(`0/${lesson.phrases.length}`);
  await cycle.getByRole("button", { name: /اكتشف النمط/ }).click();
  await expect(page.getByRole("heading", { name: /اكتشف النمط/ })).toBeVisible();
  await expect(page.locator(".lesson-progress-bar")).toHaveAttribute("aria-valuenow", "4");
});

test("route × font-scale × compact-viewport matrix keeps context visible without text clipping or sibling overlap", async ({ page }) => {
  test.setTimeout(360_000);
  const scales = ["compact", "default", "large"] as const;
  const viewports = [
    { width: 320, height: 568 },
    { width: 360, height: 800 },
    { width: 768, height: 1024 },
  ];
  const routes = ["/today", "/practice", "/lernen/a1-01"];

  for (const scale of scales) {
    await page.setViewportSize(viewports[0]);
    await page.goto("/today");
    await waitForLearningReady(page);
    const sizeControl = page.getByRole("group", { name: "تغيير حجم النص" });
    const buttonName = scale === "compact" ? "أصغر" : scale === "default" ? "مريح" : "أكبر";
    await sizeControl.getByRole("button", { name: buttonName }).click();
    await expect(page.locator(".app-frame")).toHaveAttribute("data-font-scale", scale);

    for (const viewport of viewports) {
      await page.setViewportSize(viewport);
      for (const route of routes) {
        await page.goto(route);
        await waitForLearningReady(page);
        await expect(page.locator(".topbar-copy")).toBeVisible();
        const audit = await page.evaluate(() => {
          const visible = (element: Element) => {
            const style = getComputedStyle(element);
            const rect = element.getBoundingClientRect();
            return style.display !== "none" && style.visibility !== "hidden" && rect.width > 0 && rect.height > 0;
          };
          const candidates = [...document.querySelectorAll<HTMLElement>(".page-content h1,.page-content h2,.page-content h3,.page-content p,.page-content li,.page-content blockquote,.page-content label,.page-content small,.page-content strong")].filter(visible);
          const outside = candidates.filter((element) => {
            const rect = element.getBoundingClientRect();
            return rect.left < -1 || rect.right > window.innerWidth + 1;
          }).slice(0, 8).map((element) => element.textContent?.trim().slice(0, 70));
          const clipped = candidates.filter((element) => {
            const style = getComputedStyle(element);
            const clips = style.overflow === "hidden" || style.overflowX === "hidden" || style.overflowY === "hidden" || style.textOverflow === "ellipsis";
            return clips && (element.scrollHeight > element.clientHeight + 1 || element.scrollWidth > element.clientWidth + 1);
          }).slice(0, 8).map((element) => element.textContent?.trim().slice(0, 70));
          const siblings = [...document.querySelectorAll<HTMLElement>(".topbar > .mobile-brand,.topbar > .topbar-copy,.topbar > .topbar-actions")].filter(visible);
          const overlap: string[] = [];
          for (let left = 0; left < siblings.length; left += 1) for (let right = left + 1; right < siblings.length; right += 1) {
            const a = siblings[left].getBoundingClientRect();
            const b = siblings[right].getBoundingClientRect();
            const width = Math.min(a.right, b.right) - Math.max(a.left, b.left);
            const height = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top);
            if (width > 1 && height > 1) overlap.push(`${siblings[left].className} ↔ ${siblings[right].className}`);
          }
          return { documentOverflow: document.documentElement.scrollWidth - document.documentElement.clientWidth, outside, clipped, overlap };
        });
        expect(audit.documentOverflow, `${route} ${scale} ${viewport.width} document overflow`).toBeLessThanOrEqual(1);
        expect(audit.outside, `${route} ${scale} ${viewport.width} off-screen educational text`).toEqual([]);
        expect(audit.clipped, `${route} ${scale} ${viewport.width} clipped educational text`).toEqual([]);
        expect(audit.overlap, `${route} ${scale} ${viewport.width} topbar sibling overlap`).toEqual([]);
        if (route === "/practice") await expect(page.locator(".bottom-nav > button")).toHaveClass(/active/);
      }
    }
  }
});

test("review reminders use due SRS evidence, persist daily dismissal, and respect quiet hours", async ({ page }) => {
  await page.goto("/today");
  await waitForLearningReady(page);
  await page.evaluate(({baseState})=>new Promise<void>((resolve,reject)=>{
    const open=indexedDB.open("der-weg-nach-berlin",4);
    open.onerror=()=>reject(open.error);
    open.onsuccess=()=>{
      const state=structuredClone(baseState);
      state.profile={name:"Nadia",targetExam:"goethe-b2",dailyMinutes:20,arabicSupport:"modern-standard-arabic",currentLevel:"A1",createdAt:new Date().toISOString()};
      state.completedLessonIds=["a1-01"];
      state.reviewReminderSettings={policyVersion:"local-review-reminder-v1",enabled:true,hourLocal:"00:00",timeZone:"Africa/Tunis",deliveryBoundary:"in-app-and-notification-api-while-open-no-push-background-guarantee-mastery-or-penalty"};
      const tx=open.result.transaction("learning-state","readwrite");tx.objectStore("learning-state").put(state,"primary");tx.oncomplete=()=>resolve();tx.onerror=()=>reject(tx.error);
    };
  }),{baseState:structuredClone(defaultState)});
  await page.reload();await waitForLearningReady(page);
  const reminder=page.locator('[data-review-reminder="local-review-reminder-v1"]');
  await expect(reminder).toBeVisible();
  await expect(reminder).toContainText("بطاقة مستحقة");
  await reminder.getByRole("button",{name:"إخفاء تذكير المراجعة اليوم"}).click();
  await expect(reminder).toHaveCount(0);
  await page.reload();await waitForLearningReady(page);await expect(reminder).toHaveCount(0);
  await page.evaluate(()=>new Promise<void>((resolve,reject)=>{const open=indexedDB.open("der-weg-nach-berlin",4);open.onerror=()=>reject(open.error);open.onsuccess=()=>{const store=open.result.transaction("learning-state","readwrite").objectStore("learning-state");const request=store.get("primary");request.onerror=()=>reject(request.error);request.onsuccess=()=>{const state=request.result;state.reviewReminderSettings.dismissedInAppDate=undefined;state.quietHours={...state.quietHours,enabled:true,startLocal:"00:00",endLocal:"23:59",timeZone:"Africa/Tunis"};const put=store.put(state,"primary");put.onerror=()=>reject(put.error);put.onsuccess=()=>resolve()}}}));
  await page.reload();await waitForLearningReady(page);await expect(reminder).toHaveCount(0);
});
