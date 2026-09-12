// @vitest-environment node
import { readFileSync } from "node:fs";
import { describe,expect,it } from "vitest";
import { resolveReviewShortcut,REVIEW_SHORTCUT_POLICY } from "@/core/review/shortcuts";
import { cleanContentNote,contentReferenceCount,CONTENT_NOTE_BOUNDARY,CONTENT_NOTE_POLICY,deleteContentNote,getContentReference,listResolvedContentNotes,MAX_CONTENT_NOTE_LENGTH,mergeContentNotes,saveContentNote } from "@/core/notes/content-notes";
import { defaultState } from "@/core/portability/db";
import { learningStateSchema } from "@/core/portability/schema";
import { mergeLearningStates } from "@/core/portability/merge";
import { exportArchive,importArchive } from "@/core/portability/backup";

describe("P1 review keyboard shortcuts",()=>{
  it("maps Space to reveal and allows only grades 1, 3, 4, and 5 after reveal",()=>{
    expect(REVIEW_SHORTCUT_POLICY).toBe("review-keyboard-shortcuts-v1");
    expect(resolveReviewShortcut({key:" "},{cardAvailable:true,revealed:false})).toEqual({type:"toggle-reveal"});
    expect(resolveReviewShortcut({key:"5"},{cardAvailable:true,revealed:false})).toBeNull();
    expect(["1","3","4","5"].map((key)=>resolveReviewShortcut({key},{cardAvailable:true,revealed:true}))).toEqual([{type:"grade",grade:1},{type:"grade",grade:3},{type:"grade",grade:4},{type:"grade",grade:5}]);
    expect(resolveReviewShortcut({key:"2"},{cardAvailable:true,revealed:true})).toBeNull();
  });

  it("ignores repeat, modifiers, missing cards, links, buttons, and editable fields",()=>{
    const base={key:"5",cardAvailable:true,revealed:true};
    expect(resolveReviewShortcut({key:"5",repeat:true},{cardAvailable:true,revealed:true})).toBeNull();
    for(const modifier of ["ctrlKey","altKey","metaKey"] as const)expect(resolveReviewShortcut({key:"5",[modifier]:true},{cardAvailable:true,revealed:true})).toBeNull();
    for(const targetTag of ["input","textarea","select","button","a"])expect(resolveReviewShortcut({key:"5",targetTag},{cardAvailable:true,revealed:true})).toBeNull();
    expect(resolveReviewShortcut({key:" ",contentEditable:true},{cardAvailable:true,revealed:false})).toBeNull();
    expect(resolveReviewShortcut({key:base.key},{cardAvailable:false,revealed:true})).toBeNull();
  });

  it("publishes visible shortcut help and ARIA key hints while sharing the normal grade path",()=>{
    const source=readFileSync("src/app/review/page.tsx","utf8");
    for(const marker of ["data-review-shortcut-policy","Space","aria-keyshortcuts=\"1\"","aria-keyshortcuts=\"3\"","aria-keyshortcuts=\"4\"","aria-keyshortcuts=\"5\"","resolveReviewShortcut","else grade(action.grade)","gradingRef"])expect(source).toContain(marker);
  });
});

describe("P1 local bookmarks and personal content notes",()=>{
  it("resolves exactly the published lesson, library, and exam-task registry",()=>{
    expect(contentReferenceCount).toBe(394);
    expect(getContentReference("lesson","a1-01")).toMatchObject({titleDe:"Hallo Berlin!",href:"/lernen/a1-01"});
    expect(getContentReference("library","lib-r-a1-01").href).toBe("/library#lib-r-a1-01");
    expect(getContentReference("exam-task","goethe-b2-reading-01").href).toBe("/exams/goethe-b2/goethe-b2-reading-01");
    expect(()=>getContentReference("lesson","unknown-answer-key")).toThrow("معرف المحتوى غير معروف");
  });

  it("normalizes length and strips control and Bidi override characters",()=>{
    const dirty=`  أول\u202E سطر\t هنا\n\n\nثان\u0000  `+"x".repeat(700);
    const clean=cleanContentNote(dirty);
    expect(clean).not.toMatch(/[\u0000\u202E]/u);
    expect(clean).toContain("أول سطر هنا\n\nثان");
    expect(clean.length).toBeLessThanOrEqual(MAX_CONTENT_NOTE_LENGTH);
  });

  it("stores a bookmark-only record without auto-populating an answer or note",()=>{
    const notes=saveContentNote([],{kind:"lesson",contentId:"a1-01",bookmarked:true,note:"",now:new Date("2026-09-08T10:00:00Z")});
    expect(notes).toEqual([{id:"content-note:lesson:a1-01",policyVersion:CONTENT_NOTE_POLICY,kind:"lesson",contentId:"a1-01",bookmarked:true,note:"",evidenceBoundary:CONTENT_NOTE_BOUNDARY,createdAt:"2026-09-08T10:00:00.000Z",updatedAt:"2026-09-08T10:00:00.000Z"}]);
    expect(JSON.stringify(notes)).not.toMatch(/answerKey|correctAnswer|masteryDelta|provider/);
  });

  it("preserves createdAt while updating note text and bookmark state",()=>{
    const first=saveContentNote([],{kind:"lesson",contentId:"a1-01",bookmarked:true,note:"alt",now:new Date("2026-09-08T10:00:00Z")});
    const next=saveContentNote(first,{kind:"lesson",contentId:"a1-01",bookmarked:false,note:"  neu  ",now:new Date("2026-09-08T11:00:00Z")});
    expect(next[0]).toMatchObject({createdAt:"2026-09-08T10:00:00.000Z",updatedAt:"2026-09-08T11:00:00.000Z",bookmarked:false,note:"neu"});
  });

  it("removes an empty unbookmarked record and supports explicit deletion",()=>{
    const first=saveContentNote([],{kind:"library",contentId:"lib-r-a1-01",bookmarked:true,note:"lesen"});
    expect(saveContentNote(first,{kind:"library",contentId:"lib-r-a1-01",bookmarked:false,note:""})).toEqual([]);
    expect(deleteContentNote(first,first[0].id)).toEqual([]);
  });

  it("uses the latest per-content update during merge and drops unresolved imported IDs from display",()=>{
    const older=saveContentNote([],{kind:"lesson",contentId:"a1-01",bookmarked:true,note:"alt",now:new Date("2026-09-08T10:00:00Z")});
    const newer=saveContentNote([],{kind:"lesson",contentId:"a1-01",bookmarked:false,note:"neu",now:new Date("2026-09-08T11:00:00Z")});
    expect(mergeContentNotes(older,newer)).toEqual(newer);
    const unknown={...newer[0],id:"content-note:lesson:gone",contentId:"gone"};
    expect(listResolvedContentNotes([unknown])).toEqual([]);
  });

  it("keeps strict schema, DWNB, and LearningState merge provenance without mastery",async()=>{
    const note=saveContentNote([],{kind:"lesson",contentId:"a1-01",bookmarked:true,note:"راجع السؤال",now:new Date("2026-09-08T10:00:00Z")})[0];
    expect(learningStateSchema.parse({...defaultState,contentNotes:[note]}).contentNotes).toEqual([note]);
    const archive=await exportArchive({...defaultState,contentNotes:[note]},{includeMedia:false});
    expect((await importArchive(archive)).state.contentNotes).toEqual([note]);
    const merged=mergeLearningStates(defaultState,{...defaultState,contentNotes:[note],updatedAt:"2026-09-08T12:00:00Z"});
    expect(merged.contentNotes).toEqual([note]);expect(merged.mastery).toEqual(defaultState.mastery);
  });

  it("defaults old schema-v3 state to no notes and rejects oversized or invalid kinds",()=>{
    const old=structuredClone(defaultState) as unknown as Record<string,unknown>;delete old.contentNotes;
    expect(learningStateSchema.parse(old).contentNotes).toEqual([]);
    const valid=saveContentNote([],{kind:"lesson",contentId:"a1-01",bookmarked:true,note:"x"})[0];
    expect(()=>learningStateSchema.parse({...defaultState,contentNotes:[{...valid,note:"x".repeat(601)}]})).toThrow();
    expect(()=>learningStateSchema.parse({...defaultState,contentNotes:[{...valid,kind:"answer"}]})).toThrow();
  });

  it("renders note controls in lessons/library and a local manager with individual and full deletion",()=>{
    const control=readFileSync("src/components/content-note-control.tsx","utf8");const manager=readFileSync("src/components/content-notes-manager.tsx","utf8");const lesson=readFileSync("src/components/lesson-runner.tsx","utf8");const library=readFileSync("src/components/library-view.tsx","utf8");
    for(const marker of ["data-content-note-policy","Meine Notiz · ملاحظتي","محلي فقط، لا يدخل AI أو الإتقان","احفظ كعلامة"])expect(control).toContain(marker);
    for(const marker of ["data-content-note-manager","لا تدخل البحث أو AI أو الإتقان","حذف جميع العلامات والملاحظات"])expect(manager).toContain(marker);
    expect(lesson).toContain('<ContentNoteControl kind="lesson"');expect(library).toContain('<ContentNoteControl kind="library"');
  });
});
