// @vitest-environment node
import { readFileSync } from "node:fs";
import { describe,expect,it } from "vitest";
import { commitPersonalVocabulary,deletePersonalVocabularyItem,MAX_PERSONAL_VOCABULARY_ROWS,mergePersonalVocabulary,parsePersonalVocabularyTsv,PERSONAL_VOCABULARY_BOUNDARY,PERSONAL_VOCABULARY_HEADER,PERSONAL_VOCABULARY_POLICY,personalVocabularySampleTsv } from "@/core/vocabulary/personal-import";
import { buildContentErrorReportDraft,contentErrorReportExport,contentErrorReportFileName,CONTENT_ERROR_REPORT_BOUNDARY,CONTENT_ERROR_REPORT_POLICY,deleteContentErrorReport,mergeContentErrorReports,saveContentErrorReport } from "@/core/reports/content-error-report";
import { defaultState } from "@/core/portability/db";
import { learningStateSchema } from "@/core/portability/schema";
import { mergeLearningStates } from "@/core/portability/merge";
import { exportArchive,importArchive } from "@/core/portability/backup";

describe("P1 safe personal vocabulary import",()=>{
  const parse=(rows:string,existing=defaultState.personalVocabulary)=>parsePersonalVocabularyTsv(`${PERSONAL_VOCABULARY_HEADER}\n${rows}`,{fileName:"liste.tsv",batchId:"batch-1",existing,now:new Date("2026-09-08T12:00:00Z")});

  it("parses the exact four-column TSV contract into a preview without state mutation",()=>{
    const preview=parse("Termin\tموعد\tIch brauche einen Termin.\tarbeit,a1\nWohnung\tشقة\tDie Wohnung ist klein.\talltag");
    expect(preview).toMatchObject({policyVersion:PERSONAL_VOCABULARY_POLICY,fileName:"liste.tsv",batchId:"batch-1",totalRows:2,rejectedRows:0,duplicateRows:0,evidenceBoundary:PERSONAL_VOCABULARY_BOUNDARY});
    expect(preview.accepted).toHaveLength(2);
    expect(preview.accepted[0]).toMatchObject({german:"Termin",arabic:"موعد",exampleDe:"Ich brauche einen Termin.",tags:["arbeit","a1"],source:"user-tsv",importBatchId:"batch-1"});
    expect(defaultState.personalVocabulary).toEqual([]);
  });

  it("rejects a wrong header, too many rows, and malformed column counts",()=>{
    expect(()=>parsePersonalVocabularyTsv("Deutsch\tArabisch\nHaus\tبيت",{batchId:"b"})).toThrow("رأس TSV غير صالح");
    const tooMany=Array.from({length:MAX_PERSONAL_VOCABULARY_ROWS+1},(_,index)=>`Wort${index}\tكلمة\t\ttag`).join("\n");
    expect(()=>parsePersonalVocabularyTsv(`${PERSONAL_VOCABULARY_HEADER}\n${tooMany}`,{batchId:"b"})).toThrow("الحد 500");
    expect(parse("Haus\tبيت\tBeispiel").issues[0]).toMatchObject({code:"columns",severity:"rejected"});
  });

  it("blocks spreadsheet formulas and HTML-like cells instead of storing them",()=>{
    const preview=parse("=HYPERLINK(x)\tرابط\t\ttag\nHaus\t<بيت>\tDas ist ein Haus.\ttag");
    expect(preview.accepted).toEqual([]);
    expect(preview.issues.map((issue)=>issue.code)).toEqual(["formula","html"]);
  });

  it("enforces German, Arabic, example, and tag language boundaries",()=>{
    const preview=parse("بيت\tبيت\t\ttag\nHaus\thouse\t\ttag\nHaus\tبيت\tهذا مثال\ttag\nHaus\tبيت\tDas ist ein Haus.\tbad tag!");
    expect(preview.accepted).toEqual([]);
    expect(preview.issues.every((issue)=>issue.code==="language")).toBe(true);
  });

  it("cleans Bidi/control characters with a visible warning",()=>{
    const preview=parse("Ha\u202Eus\tبي\u0000ت\tDas ist ein Haus.\talltag");
    expect(preview.accepted[0]).toMatchObject({german:"Haus",arabic:"بيت"});
    expect(preview.issues).toContainEqual(expect.objectContaining({code:"controls-cleaned",severity:"warning"}));
  });

  it("rejects duplicates inside the file and against existing personal vocabulary",()=>{
    const first=parse("Haus\tبيت\t\talltag");
    const duplicate=parse("Haus\tبيت\t\tneu\nhaus\tبيت\t\tneu",first.accepted);
    expect(duplicate.accepted).toEqual([]);
    expect(duplicate.duplicateRows).toBe(2);
  });

  it("commits only accepted rows and supports individual, full, and merge deduplication",()=>{
    const first=parse("Haus\tبيت\tDas ist ein Haus.\talltag");
    const committed=commitPersonalVocabulary([],first);
    expect(committed).toHaveLength(1);
    expect(commitPersonalVocabulary(committed,first)).toHaveLength(1);
    expect(mergePersonalVocabulary(committed,committed)).toHaveLength(1);
    expect(deletePersonalVocabularyItem(committed,committed[0].id)).toEqual([]);
  });

  it("ships a valid downloadable sample and keeps imports outside SRS and mastery",()=>{
    const preview=parsePersonalVocabularyTsv(personalVocabularySampleTsv(),{batchId:"sample"});
    const state={...defaultState,personalVocabulary:preview.accepted};
    expect(state.personalVocabulary).toHaveLength(1);
    expect(state.reviewItems).toEqual([]);expect(state.reviewEvents).toEqual([]);expect(state.mastery).toEqual(defaultState.mastery);
    expect(JSON.stringify(state.personalVocabulary)).not.toMatch(/review|masteryDelta|cefrScore/iu);
  });

  it("uses strict old-v3, DWNB, and merge portability",async()=>{
    const item=parse("Termin\tموعد\tIch brauche einen Termin.\ta1").accepted[0];
    const old=structuredClone(defaultState) as unknown as Record<string,unknown>;delete old.personalVocabulary;
    expect(learningStateSchema.parse(old).personalVocabulary).toEqual([]);
    expect(learningStateSchema.parse({...defaultState,personalVocabulary:[item]}).personalVocabulary).toEqual([item]);
    const archive=await exportArchive({...defaultState,personalVocabulary:[item]},{includeMedia:false});
    expect((await importArchive(archive)).state.personalVocabulary).toEqual([item]);
    expect(mergeLearningStates(defaultState,{...defaultState,personalVocabulary:[item]}).personalVocabulary).toEqual([item]);
  });
});

describe("P1 local content error report",()=>{
  it("builds a metadata-only preview from a canonical content reference",()=>{
    const draft=buildContentErrorReportDraft({kind:"lesson",contentId:"a1-01",category:"german",description:"الفعل في المثال يحتاج مراجعة.",suggestedCorrection:"اقتراحي هو تغيير الصيغة."});
    expect(draft).toMatchObject({policyVersion:CONTENT_ERROR_REPORT_POLICY,kind:"lesson",contentId:"a1-01",route:"/lernen/a1-01",titleDe:"Hallo Berlin!",category:"german",appVersion:"0.1.0",status:"local-draft-not-submitted",evidenceBoundary:CONTENT_ERROR_REPORT_BOUNDARY});
    expect(Object.keys(draft)).not.toContain("answerKey");expect(Object.keys(draft)).not.toContain("learningState");
  });

  it("rejects unknown content and short descriptions before local save",()=>{
    expect(()=>buildContentErrorReportDraft({kind:"lesson",contentId:"unknown",category:"other",description:"هذا وصف كاف للمشكلة"})).toThrow("معرف المحتوى غير معروف");
    expect(()=>buildContentErrorReportDraft({kind:"lesson",contentId:"a1-01",category:"other",description:"قصير"})).toThrow("عشرة أحرف");
  });

  it("strips Bidi controls and bounds description/suggestion",()=>{
    const draft=buildContentErrorReportDraft({kind:"library",contentId:"lib-r-a1-01",category:"arabic",description:"وصف\u202E طويل "+"x".repeat(1100),suggestedCorrection:"تصحيح "+"y".repeat(700)});
    expect(draft.description).not.toContain("\u202E");expect(draft.description.length).toBeLessThanOrEqual(1000);expect(draft.suggestedCorrection?.length).toBeLessThanOrEqual(600);
  });

  it("saves as explicitly unsubmitted and exports only a safe standalone report",()=>{
    const draft=buildContentErrorReportDraft({kind:"lesson",contentId:"a1-01",category:"audio",description:"الصوت ينقطع قبل نهاية الجملة."});
    const{reports,report}=saveContentErrorReport([],draft,new Date("2026-09-08T12:00:00Z"));
    expect(reports).toEqual([report]);expect(report.createdAt).toBe("2026-09-08T12:00:00.000Z");
    const exported=JSON.parse(contentErrorReportExport(report));
    expect(exported).toMatchObject({format:"dwnb-content-error-report",version:1,submissionStatus:"not-submitted-send-manually",report:{id:report.id,status:"local-draft-not-submitted"}});
    expect(JSON.stringify(exported)).not.toMatch(/apiKey|mastery|diagnosticResult|answerKey/);
    expect(contentErrorReportFileName(report)).toBe("dwnb-error-lesson-a1-01.json");
  });

  it("supports deletion, merge, strict old-v3 defaults, DWNB, and unchanged learning evidence",async()=>{
    const draft=buildContentErrorReportDraft({kind:"lesson",contentId:"a1-01",category:"answer",description:"أحد الخيارات يحتاج مراجعة لغوية."});
    const{report}=saveContentErrorReport([],draft,new Date("2026-09-08T12:00:00Z"));
    expect(deleteContentErrorReport([report],report.id)).toEqual([]);
    expect(mergeContentErrorReports([report],[report])).toEqual([report]);
    const old=structuredClone(defaultState) as unknown as Record<string,unknown>;delete old.contentErrorReports;
    expect(learningStateSchema.parse(old).contentErrorReports).toEqual([]);
    const archive=await exportArchive({...defaultState,contentErrorReports:[report]},{includeMedia:false});
    const imported=await importArchive(archive);expect(imported.state.contentErrorReports).toEqual([report]);expect(imported.state.mastery).toEqual(defaultState.mastery);
  });

  it("contains no network submission path and exposes preview, manual copy/download, and local managers",()=>{
    const core=readFileSync("src/core/reports/content-error-report.ts","utf8");const control=readFileSync("src/components/content-error-report-control.tsx","utf8");const manager=readFileSync("src/components/content-error-reports-manager.tsx","utf8");const vocab=readFileSync("src/components/personal-vocabulary-import.tsx","utf8");
    expect(core).not.toContain("fetch(");expect(control).not.toContain("fetch(");expect(manager).not.toContain("fetch(");
    for(const marker of ["معاينة البلاغ دون إرسال","مسودة محلية غير مرسلة","نسخ JSON الآمن","تنزيل JSON"])expect(control).toContain(marker);
    for(const marker of ["محلية غير مرسلة","لا توجد مزامنة أو إرسال تلقائي","حذف جميع مسودات البلاغات"])expect(manager).toContain(marker);
    for(const marker of ["data-vocabulary-import-policy","معاينة قبل الاستيراد","تأكيد استيراد المقبول فقط","لا يضيف بطاقات مراجعة تلقائيًا"])expect(vocab).toContain(marker);
  });
});
