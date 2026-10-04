import { test,expect,type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { defaultState } from "../../src/core/portability/db";
import { levelAssessmentQuestions } from "../../src/data/level-assessment-bank";
import type { LearningState } from "../../src/types/learning";

const learner:LearningState={...defaultState,profile:{name:"QA learner",targetExam:"telc-deutsch-b2",dailyMinutes:90,arabicSupport:"modern-standard-arabic",currentLevel:"A1",priorExperience:"none",createdAt:"2026-10-01T09:00:00Z"}};
async function seed(page:Page,state:LearningState){
  await page.goto("/today");
  await page.evaluate(async value=>{
    const database=await new Promise<IDBDatabase>((resolve,reject)=>{const request=indexedDB.open("der-weg-nach-berlin",4);request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(request.error);});
    await new Promise<void>((resolve,reject)=>{const transaction=database.transaction("learning-state","readwrite");transaction.objectStore("learning-state").put(value,"primary");transaction.oncomplete=()=>resolve();transaction.onerror=()=>reject(transaction.error);});database.close();
  },state);
  await page.reload();
}
async function stored(page:Page){return page.evaluate(()=>new Promise<LearningState>((resolve,reject)=>{const request=indexedDB.open("der-weg-nach-berlin",4);request.onsuccess=()=>{const get=request.result.transaction("learning-state","readonly").objectStore("learning-state").get("primary");get.onsuccess=()=>resolve(get.result);get.onerror=()=>reject(get.error);};request.onerror=()=>reject(request.error);}));}

test("B2 uses the actual 48-item parallel form and cannot pass 38 answers",async({page})=>{
  test.setTimeout(90_000);await seed(page,learner);await page.goto("/assessment/b2");
  const panel=page.locator('[data-level-assessment-policy="independent-level-transition-v3"]');await expect(panel).toBeVisible();
  await expect(panel).toContainText("39/48");await page.getByRole("button",{name:/ابدأ الصيغة/}).click();
  const qs=levelAssessmentQuestions("B2","A");await expect(page.locator("[data-assessment-question-id]")).toHaveCount(48);
  for(const [index,q] of qs.entries())await page.locator(`[data-assessment-question-id="${q.id}"] select`).selectOption(String(index<10?(q.correctIndex+1)%4:q.correctIndex));
  await page.getByRole("button",{name:/سلّم 48 جوابًا/}).click();await expect(panel).toContainText("38/48");await expect(panel).toContainText("نجاح المعرفة وحده لا يكفي");
  await expect.poll(async()=> (await stored(page)).exerciseAttempts.filter(a=>a.evidenceContext?.level==="B2").length).toBe(48);
  const state=await stored(page);expect(state.mastery["level-b2-ready"]).toBe(0);expect(state.exerciseAttempts[0].evidenceContext).toMatchObject({formId:"A",expectedItems:48,kind:"level-check"});
});

test("a nominalisation correction rejects the unchanged lowercase word in the real lesson UI",async({page})=>{
  await seed(page,{...learner,currentLessonId:"b1-13",currentStage:5,lessonProgress:{"b1-13":5}});await page.goto("/lernen/b1-13");
  const exercise=page.locator('[data-exercise-id="b1-13-e4"]');await expect(exercise).toBeVisible();
  await exercise.locator("input").fill("Beim sprechen brauche ich weniger Pausen.");await exercise.getByRole("button",{name:/تحقق|Prüfen/}).click();await expect(exercise).toHaveClass(/wrong/);
  await exercise.locator("input").fill("Beim Sprechen brauche ich weniger Pausen.");await exercise.getByRole("button",{name:/تحقق|Prüfen/}).click();await expect(exercise).toHaveClass(/correct/);
});

test("model comparison stays locked before a draft and new independent writing keeps provenance",async({page})=>{
  test.setTimeout(90_000);await seed(page,{...learner,lessonProgress:{"a1-01":9},currentStage:9});await page.goto("/lernen/a1-01");
  await expect(page.getByText("النموذج مقفول حتى حفظ مسودتك في مختبر الكتابة.")).toBeVisible();await expect(page.locator(".translation-panel")).toHaveCount(0);
  await page.goto("/writing?task=independent-a1-1");await expect(page.locator('[data-independent-production-task="independent-a1-1"]')).toBeVisible();
  await page.locator(".writing-plan label input").nth(0).fill("شخص جديد في المكتبة");await page.locator(".writing-plan label input").nth(1).fill("التعارف والسؤال عن الاسم");
  await page.locator(".writing-plan>div input").nth(0).fill("اسمي وسكني");await page.locator(".writing-plan>div input").nth(1).fill("السؤال عن الاسم");await page.getByRole("button",{name:/ابدأ المسودة/}).click();
  await page.getByRole("textbox",{name:"المسودة الألمانية"}).fill("Guten Tag, ich heiße Yara. Ich wohne jetzt in Jena und lerne Deutsch. Heute bin ich in der Bibliothek. Wie heißt du? Wo wohnst du? Ich freue mich auf deine Antwort. Viele Grüße, Yara.");
  await page.getByRole("button",{name:/حفظ المسودة والانتقال/}).click();for(const checkbox of await page.locator(".writing-self-check input[type=checkbox]").all())await checkbox.check();await page.getByRole("button",{name:/شغّل الفحص المرتبط بنصي/}).click();
  await expect(page.locator(".writing-reviewed-text")).toBeVisible();await expect(page.locator(".translation-panel")).toHaveCount(0);
  await expect.poll(async()=> (await stored(page)).writingSubmissions.filter(w=>w.status==="submitted").length).toBe(1);
  const submitted=(await stored(page)).writingSubmissions.find(w=>w.status==="submitted")!;expect(submitted.taskId).toBe("independent-a1-1-writing");expect(submitted.evidenceContext).toMatchObject({firstDraft:true,supportUsedBeforeDraft:false,taskLevel:"A1"});
});

test("longer inputs start explicitly, keep listening text delayed, and finish without a silent loop",async({page})=>{
  await page.addInitScript(()=>{
    class FakeUtterance {text:string;lang="de-DE";rate=1;pitch=1;voice:unknown;onstart:(()=>void)|null=null;onend:(()=>void)|null=null;onerror:(()=>void)|null=null;constructor(text:string){this.text=text;}}
    Object.defineProperty(window,"SpeechSynthesisUtterance",{configurable:true,value:FakeUtterance});
    Object.defineProperty(window,"speechSynthesis",{configurable:true,value:{getVoices:()=>[{voiceURI:"qa-de",name:"QA Deutsch",lang:"de-DE",localService:true}],cancel:()=>undefined,speak:(utterance:FakeUtterance)=>{window.setTimeout(()=>{utterance.onstart?.();window.setTimeout(()=>utterance.onend?.(),10);},10);},addEventListener:()=>undefined,removeEventListener:()=>undefined}});
  });
  await seed(page,learner);await page.goto("/practice/endurance?level=B2");await expect(page.getByText(/454 كلمة/)).toBeVisible();await expect(page.locator(".reading-text")).toHaveCount(0);
  await page.locator(".endurance-controls select").nth(1).selectOption("listening");await page.getByRole("button",{name:"ابدأ التدريب"}).click();await expect(page.locator(".question-stack")).toHaveCount(0);await page.getByRole("button",{name:"شغّل التسلسل الاصطناعي"}).click();
  await expect(page.locator(".quiz-item")).toHaveCount(4);await expect(page.locator(".reading-text")).toHaveCount(0);const transcript=page.getByRole("button",{name:"افتح النص بعد تثبيت جميع الأجوبة"});await expect(transcript).toBeDisabled();
  for(const item of await page.locator(".quiz-item").all()){await item.locator(".quiz-options button").first().click();await item.getByRole("button",{name:"تحقق"}).click();}
  await transcript.click();await expect(page.locator(".reading-text")).toBeVisible();await expect(page.locator(".endurance-terminal")).toBeVisible();await expect(page.getByRole("link",{name:"عد إلى مهمة اليوم"})).toBeVisible();
});

test("new assessment and input surfaces retain keyboard/axe and narrow-screen contracts",async({page})=>{
  test.setTimeout(90_000);await seed(page,learner);await page.setViewportSize({width:320,height:700});
  for(const route of ["/assessment/b2","/practice/endurance?level=B2","/progress"]){await page.goto(route);if(route.includes("assessment"))await page.getByRole("button",{name:/ابدأ الصيغة/}).click();if(route.includes("endurance"))await page.getByRole("button",{name:"ابدأ التدريب"}).click();
    const result=await new AxeBuilder({page}).include("main").withTags(["wcag2a","wcag2aa"]).analyze();expect(result.violations.filter(v=>v.impact==="serious"||v.impact==="critical"),route).toEqual([]);
    const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>window.innerWidth+1);expect(overflow,route).toBe(false);
  }
});
