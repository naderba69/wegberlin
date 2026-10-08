import { createHash } from "node:crypto";
import { mkdir,readFile,writeFile } from "node:fs/promises";
import { z } from "zod";
import { academicLessonList } from "../src/data/academic-lessons";
import { curriculum } from "../src/data/curriculum";
import { academicQuestionSchema } from "../src/core/content-validation/schemas";
import { levelAssessmentQuestions,LEVEL_ASSESSMENT_BANK_VERSION } from "../src/data/level-assessment-bank";
import { independentProductionTasks } from "../src/data/independent-production-tasks";
import { extendedComprehensionTasks,extendedTaskText } from "../src/data/extended-comprehension";
import { evaluateExercise } from "../src/core/lesson/evaluate";
import { buildObjectiveCoverageReport } from "../src/core/content-validation/objective-coverage";

const REPORT="reports/learning-integrity-audit.json",MD="docs/generated/LEARNING_INTEGRITY_REPORT.md";
const write=process.argv.includes("--write");
const issues:string[]=[];
const lessons=new Map(academicLessonList.map(lesson=>[lesson.id,lesson]));
const qSchema=academicQuestionSchema.extend({level:z.enum(["A1","A2","B1","B2"]),formId:z.enum(["A","B"]),domainId:z.string().min(1),domainAr:z.string().min(1),familyId:z.string().min(1),reviewStatus:z.literal("authored-independent-review-pending")}).strict();
const bank=[];
const oldItems=new Set(academicLessonList.flatMap(lesson=>lesson.miniTest.map(question=>JSON.stringify([question.promptDe,question.options]))));
const forms:{level:string;formId:string;questions:number;required:number;domains:number;domainSizes:number[]}[]=[];
for(const level of ["A1","A2","B1","B2"] as const)for(const formId of ["A","B"] as const){
  const questions=levelAssessmentQuestions(level,formId),domains=[...new Set(questions.map(question=>question.domainId))];
  forms.push({level,formId,questions:questions.length,required:Math.ceil(questions.length*.8),domains:domains.length,domainSizes:domains.map(id=>questions.filter(question=>question.domainId===id).length)});
  if(questions.length!==48||domains.length!==6||domains.some(id=>questions.filter(question=>question.domainId===id).length!==8))issues.push(`${level}/${formId}: unbalanced assessment blueprint`);
  for(const question of questions){qSchema.parse(question);if(new Set(question.options).size!==4)issues.push(`${question.id}: duplicate options`);if(oldItems.has(JSON.stringify([question.promptDe,question.options])))issues.push(`${question.id}: reused lesson Mini-Test`);bank.push(question);}
}
if(new Set(bank.map(question=>question.id)).size!==bank.length)issues.push("assessment IDs are not unique");
const b2ModuleCounts=Array.from({length:6},(_,index)=>academicLessonList.filter(lesson=>lesson.level==="B2"&&lesson.module===index+1).length);
if(b2ModuleCounts.some(count=>count!==4))issues.push("B2 modules are not 6 × 4");
for(const meta of curriculum){const lesson=lessons.get(meta.id);if(!lesson||lesson.module!==meta.module||lesson.level!==meta.level||lesson.estimatedMinutes!==meta.estimatedMinutes)issues.push(`${meta.id}: metadata/content drift`);}
for(const task of independentProductionTasks){if(!lessons.has(task.sourceLessonId)||lessons.get(task.sourceLessonId)?.level!==task.level)issues.push(`${task.id}: invalid production source`);if(task.speaking.usefulPhrases.length)issues.push(`${task.id}: independent speaking exposes a model`);if(task.writing.promptDe===lessons.get(task.sourceLessonId)?.writing.promptDe)issues.push(`${task.id}: reused writing prompt`);}
const minWords={A1:80,A2:160,B1:260,B2:350};
const extended=extendedComprehensionTasks.map(task=>{
  const words=extendedTaskText(task).trim().split(/\s+/u).length;
  if(words<minWords[task.level])issues.push(`${task.id}: input shorter than its declared endurance tier`);
  if(task.examGrade||task.audioStatus!=="device-tts-only-human-audio-pending")issues.push(`${task.id}: dishonest audio/format claim`);
  for(const question of task.questions){academicQuestionSchema.parse(question);if(new Set(question.options).size!==4)issues.push(`${question.id}: duplicate options`);}
  return{id:task.id,level:task.level,words,questions:task.questions.length,audioStatus:task.audioStatus,reviewStatus:task.reviewStatus};
});
for(const lesson of academicLessonList)for(const exercise of lesson.exercises)if(exercise.type==="error-correction"&&evaluateExercise(exercise,exercise.sentence))issues.push(`${exercise.id}: unchanged error accepted`);
const objectiveCoverage=buildObjectiveCoverageReport();
const semanticPending=objectiveCoverage.rows.filter(row=>row.semanticReviewStatus==="pending-independent-item-alignment").length;
const sourceSha256=createHash("sha256").update(JSON.stringify({lessons:academicLessonList,bank,production:independentProductionTasks,extended:extendedComprehensionTasks,coverage:objectiveCoverage.rows})).digest("hex");
const report={format:"dwnb-learning-integrity-audit",version:"learning-integrity-v1",definitionDate:"2026-10-02",ok:issues.length===0,sourceSha256,assessmentBankVersion:LEVEL_ASSESSMENT_BANK_VERSION,assessmentTemplateInstances:bank.length,competencyFamilies:new Set(bank.map(question=>question.familyId)).size,forms,b2ModuleCounts,independentProductionTasks:independentProductionTasks.length,extendedInputs:extended,objectiveSemanticReviewPending:semanticPending,independentHumanReviews:0,qualityBoundary:"automated-contract-checks-not-independent-german-arabic-cefr-rights-or-acoustic-review",issues};
const json=JSON.stringify(report,null,2)+"\n";
const markdown=`# Learning Integrity Report\n\nDefinition: 2026-10-02 · learning-integrity-v1\n\nSource SHA-256: \`${sourceSha256}\`\n\nResult: **${report.ok?"PASS":"FAIL"}** — ${issues.length} contract issues. This is not academic or acoustic certification.\n\n- ${bank.length} authored assessment template instances across 8 parallel forms; 48 items/form, knowledge threshold 39/48, 6 × 8 domain balance. Templates are not 384 unrelated skills or psychometrically calibrated items.\n- B2 modules: ${b2ModuleCounts.join(" / ")} lessons, IDs preserved.\n- ${independentProductionTasks.length} new independent production situations, without ready-made speaking phrases or German writing models.\n- Objective/item semantic alignment still pending independent review: ${semanticPending}.\n- Independent human reviews for new material: 0.\n\n| Extended input | Level | Actual words | Audio |\n|---|---|---:|---|\n${extended.map(row=>`| ${row.id} | ${row.level} | ${row.words} | device TTS only; human audio pending |`).join("\n")}\n\n## Boundaries\n\nNo new physical audio is claimed. No ASR phoneme/fluency score, official exam score, causal feature-effect result, or fixed-month B1/B2 guarantee is inferred. Lesson quality also has its own fresh-content checksum gate. Original reports and historical run logs are not substitutes for a current measurement.\n`;
await mkdir("reports",{recursive:true});await mkdir("docs/generated",{recursive:true});
if(write){await writeFile(REPORT,json);await writeFile(MD,markdown);console.log(`Wrote ${REPORT} and ${MD}.`);}else{
  if(await readFile(REPORT,"utf8").catch(()=>"")!==json||await readFile(MD,"utf8").catch(()=>"")!==markdown)throw new Error("Learning integrity artifacts are stale; regenerate from source, never edit counts.");
}
if(issues.length)throw new Error(issues.join("\n"));
console.log(`Learning integrity: ${bank.length} template instances · 8 x 48 forms · B2 6 x 4 · ${independentProductionTasks.length} production tasks · ${extended.length} longer inputs · 0 contract issues; human review pending.`);
