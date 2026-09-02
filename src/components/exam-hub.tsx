"use client";

import Link from "next/link";
import {
  ArrowLeft,
  BookOpenCheck,
  CheckCircle2,
  Clock3,
  ExternalLink,
  FileCheck2,
  GraduationCap,
  Headphones,
  Languages,
  Mic2,
  PenLine,
  Play,
  ShieldAlert,
} from "lucide-react";
import { examProfiles, examSourceById } from "@/data/exam-profiles";
import { publishedTargetedExamSimulations } from "@/data/exam-simulation-registry";
import { fullExamSimulations } from "@/data/full-exam-simulations";
import { examAudioManifest, examAudioTaskCoverageById } from "@/data/exam-audio-assets";
import { buildExamReadiness } from "@/core/exams/readiness";
import type { ExamProvider } from "@/types/learning";
import { useLearning } from "./learning-provider";

const moduleIcons = {
  lesen: BookOpenCheck,
  hoeren: Headphones,
  schreiben: PenLine,
  sprechen: Mic2,
  sprachbausteine: Languages,
};
const simulationIcons = { reading: BookOpenCheck, listening: Headphones, writing: PenLine, speaking: Mic2, "language-elements": Languages };

export function ExamHub() {
  const { state, update } = useLearning();
  const exam = state.profile?.targetExam ?? "goethe-b2";
  const profile = examProfiles[exam];
  const simulations = publishedTargetedExamSimulations.filter((simulation) => simulation.provider === exam);
  const fullSimulations = fullExamSimulations.filter((simulation) => simulation.provider === exam);
  const providerFullAudioCoverage = examAudioManifest.taskCoverage.filter((coverage) => coverage.provider === exam && coverage.scope === "full-simulation");
  const providerFullAudioComplete = providerFullAudioCoverage.filter((coverage) => coverage.status === "complete").length;
  const readiness = buildExamReadiness(state, exam);
  const readinessByModule = Object.fromEntries(readiness.modules.map((module) => [module.moduleId, module]));
  const b2Ready = (state.mastery["level-b2-ready"] ?? 0) >= 100;

  function choose(value: ExamProvider) {
    update((current) => ({
      ...current,
      profile: current.profile ? { ...current.profile, targetExam: value } : null,
    }));
  }

  return (
    <div className="wide-page">
      <header className="page-heading">
        <div>
          <span className="eyebrow"><GraduationCap size={15} /> مركز الاستعداد</span>
          <h1>تدرّب على امتحانك، <em>لا على امتحان هجين.</em></h1>
          <p>ملفا Goethe وtelc منفصلان في البنية والتوقيت والنقاط وقاعدة النجاح. كل تدريب مرتبط بمصدر رسمي وإصدار تحقق.</p>
        </div>
        <div className="path-summary"><strong>{simulations.length}</strong><span>تدريب موجّه منشور<br />لهذه الجهة</span></div>
      </header>

      <div className="exam-switch">
        <button className={exam === "goethe-b2" ? "active" : ""} onClick={() => choose("goethe-b2")}>
          <strong>Goethe-Zertifikat B2</strong><span>أربع وحدات مستقلة · قاعدة نقاط منفصلة</span>
        </button>
        <button className={exam === "telc-deutsch-b2" ? "active" : ""} onClick={() => choose("telc-deutsch-b2")}>
          <strong>telc Deutsch B2</strong><span>قسم كتابي وقسم شفهي · نقاط مستقلة</span>
        </button>
      </div>

      <section className="exam-profile-banner">
        <div><FileCheck2 size={20} /><span><strong>ملف الصيغة موثّق</strong><small>آخر تحقق: {profile.verifiedAt} · {profile.specificationVersion}</small></span></div>
        <p>{profile.structureAr} {profile.passingRuleAr}</p>
      </section>

      <div className="exam-module-grid">
        {profile.modules.map((module) => {
          const Icon = moduleIcons[module.id as keyof typeof moduleIcons] ?? BookOpenCheck;
          const moduleReadiness = readinessByModule[module.id];
          return (
            <article key={module.id}>
              <span><Icon size={21} /></span>
              <small lang="de">{module.titleDe}</small>
              <h3>{module.titleAr}</h3>
              <div className="exam-spec-line"><b>{module.parts}</b><small>أجزاء</small><b>{module.minutes}</b><small>دقيقة</small>{module.maxPoints && <><b>{module.maxPoints}</b><small>نقطة قصوى</small></>}</div>
              <div className="readiness-line"><i><b style={{width:`${moduleReadiness.coveragePercent}%`}}/></i><strong>{moduleReadiness.statusAr}</strong></div>
              <small className="readiness-sample">{moduleReadiness.attemptedTasks}/{moduleReadiness.requiredSamples} عينة دنيا · {moduleReadiness.totalTasks} مهمة متاحة</small>
              <p>{module.noteAr}</p>
            </article>
          );
        })}
      </div>

      <section className="exam-readiness-board">
        <header><div><span className="eyebrow">جاهزية الأدلة حسب الوحدة</span><h2>لا يوجد متوسط يخفي فجوة مهارة.</h2></div><strong>{readiness.readyModuleCount}/{readiness.totalModules} وحدات بدليل قوي</strong></header>
        <div>{readiness.modules.map((module)=><article key={module.moduleId} className={module.status}><header><div><small lang="de" dir="ltr">{module.titleDe}</small><h3>{module.titleAr}</h3></div><span>{module.statusAr}</span></header><div className="readiness-metrics"><span><b>{module.attemptedTasks}</b> مهام بدليل</span><span><b>{module.coveragePercent}%</b> تغطية البنك</span><span><b>{module.accuracyPercent===null?"—":`${module.accuracyPercent}%`}</b> {module.accuracyPercent===null?"لا درجة للإنتاج":"أحدث متوسط داخلي"}</span></div><p>{module.detailAr}</p><footer><small>العينة الدنيا قبل قوة الدليل: {module.requiredSamples}</small><Link href={module.nextHref}>{module.nextTaskId?"ابدأ مهمة غير مجرّبة":"راجع الوحدة"}<ArrowLeft size={13}/></Link></footer></article>)}</div>
        <p className="exam-readiness-boundary"><ShieldAlert size={15}/>{readiness.boundaryAr}</p>
      </section>

      <div className="exam-notice">
        <ShieldAlert size={19} />
        <div>
          <strong>المحاكاة الكاملة: {fullSimulations.length}/6 · صوت MP3 الإضافي: {providerFullAudioComplete}/{providerFullAudioCoverage.length}</strong>
          <p>بيان الصوت يدقق كل مهمة وكل مقطع؛ غير المغطى يعمل عبر Browser TTS. المحاكاة موجهة ومحفوظة محليًا، وليست جلسة مراقبة أو نتيجة رسمية.</p>
        </div>
      </div>

      <section className="full-exam-catalog">
        <header><div><span className="eyebrow">محاكاة كاملة أصلية</span><h2>{profile.displayName}</h2></div><strong>{fullSimulations.length}/6</strong></header>
        {fullSimulations.map((simulation) => {
          const taskCount = simulation.modules.reduce((sum, module) => sum + module.taskIds.length, 0);
          const listeningCoverage = simulation.modules
            .flatMap((module) => module.taskIds)
            .map((taskId) => examAudioTaskCoverageById[taskId])
            .filter((coverage) => coverage !== undefined);
          const listeningAudioComplete = listeningCoverage.filter((coverage) => coverage.status === "complete").length;
          const completed = (state.mastery[`full-exam-${simulation.id}-completed`] ?? 0) >= 100;
          return <article key={simulation.id}><span><GraduationCap size={24} /></span><div><small lang="de" dir="ltr">{simulation.titleDe}</small><h3>{simulation.titleAr}</h3><p>{simulation.descriptionAr}</p><footer><b>{simulation.modules.length} وحدات</b><b>{taskCount} مهمة</b><b>MP3: {listeningAudioComplete}/{listeningCoverage.length} استماع</b><b>{completed ? "منجزة داخليًا" : "قابلة للاستئناف"}</b></footer></div><Link aria-label={`افتح ${simulation.titleAr}`} href={`/exams/${simulation.provider}/full/${simulation.id}`}><Play size={18} /></Link></article>;
        })}
      </section>

      <section className="targeted-catalog">
        <header><div><span className="eyebrow">تدريبات المهارة المنشورة</span><h2>{profile.displayName}</h2></div><strong>{simulations.length}/12</strong></header>
        <div>
          {simulations.map((simulation) => {
            const result = state.mastery[`exam-target-${simulation.id}`];
            const writingDone = simulation.kind === "writing" && state.writingSubmissions.some((submission) => submission.taskId === simulation.id && submission.status !== "draft");
            const speakingDone = simulation.kind === "speaking" && state.speakingAttempts.some((attempt) => attempt.taskId === simulation.id);
            const audioCoverage = simulation.kind === "listening" ? examAudioTaskCoverageById[simulation.id] : undefined;
            const Icon = simulationIcons[simulation.skill];
            return (
              <article key={simulation.id}>
                <span><Icon size={20} /></span>
                <div>
                  <small lang="de" dir="ltr">{simulation.officialPartLabel}</small>
                  <h3>{simulation.titleAr}</h3>
                  <p>{simulation.descriptionAr}</p>
                  <footer><span><Clock3 size={13} /> {simulation.practiceMinutes} دقيقة</span>{audioCoverage && <b>{audioCoverage.status === "complete" ? "MP3 مولّد" : audioCoverage.status === "partial" ? "MP3 جزئي + TTS" : "Browser TTS"}</b>}{typeof result === "number" && <b>آخر نتيجة: {result}%</b>}{writingDone && <b>نسخة كتابية مسلّمة</b>}{speakingDone && <b>تسجيل محفوظ محليًا</b>}</footer>
                </div>
                <Link href={`/exams/${simulation.provider}/${simulation.id}`} aria-label={`ابدأ ${simulation.titleAr}`}><Play size={17} /></Link>
              </article>
            );
          })}
        </div>
      </section>

      <section className="exam-gate">
        <div><CheckCircle2 size={20} /><span><strong>بوابة B2 الداخلية</strong><p>{b2Ready ? "مكتملة؛ ابدأ التدريب الامتحاني المحدد مع إبقاء النتائج غير رسمية." : "غير مكتملة بعد؛ التدريب متاح، لكن المدرب سيبقي فجوات المنهج والإنتاج أولوية."}</p></span></div>
        <div><Clock3 size={20} /><span><strong>قاعدة الفصل</strong><p>{profile.separationWarningAr}</p></span></div>
      </section>

      <section className="exam-source-strip">
        <strong>المصادر الرسمية للملف</strong>
        <div>
          {profile.sourceRefs.map((sourceId) => {
            const source = examSourceById[sourceId];
            return <a key={source.id} href={source.url} target="_blank" rel="noreferrer">{source.organization} · {source.title}<ExternalLink size={12} /></a>;
          })}
        </div>
      </section>
    </div>
  );
}
