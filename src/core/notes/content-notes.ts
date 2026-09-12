import { academicLessonList } from "@/data/academic-lessons";
import { listeningLibrary,readingLibrary } from "@/data/library-registry";
import { allPublishedExamTasks } from "@/data/exam-simulation-registry";
import type { ContentNote,ContentNoteKind } from "@/types/learning";

export const CONTENT_NOTE_POLICY = "local-content-note-v1" as const;
export const CONTENT_NOTE_BOUNDARY = "personal-note-no-answer-key-mastery-or-ai" as const;
export const MAX_CONTENT_NOTE_LENGTH = 600;

export type ContentReference={kind:ContentNoteKind;contentId:string;titleDe:string;titleAr:string;href:string};

const references:ContentReference[]=[
  ...academicLessonList.map((lesson)=>({kind:"lesson" as const,contentId:lesson.id,titleDe:lesson.titleDe,titleAr:lesson.titleAr,href:`/lernen/${lesson.id}`})),
  ...[...readingLibrary,...listeningLibrary].map((item)=>({kind:"library" as const,contentId:item.id,titleDe:item.titleDe,titleAr:item.titleAr,href:`/library#${item.id}`})),
  ...allPublishedExamTasks.map((task)=>({kind:"exam-task" as const,contentId:task.id,titleDe:task.titleDe,titleAr:task.titleAr,href:`/exams/${task.provider}/${task.id}`})),
];
const referenceMap=new Map(references.map((reference)=>[`${reference.kind}:${reference.contentId}`,reference]));

export const contentReferenceCount=references.length;

export function getContentReference(kind:ContentNoteKind,contentId:string){
  const reference=referenceMap.get(`${kind}:${contentId}`);
  if(!reference)throw new Error("معرف المحتوى غير معروف؛ لم تُحفظ الملاحظة خارج محتوى منشور.");
  return reference;
}

export function cleanContentNote(value:string){return value.normalize("NFC").replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F\u202A-\u202E\u2066-\u2069]/gu,"").replace(/\r\n?/gu,"\n").replace(/[\t ]+/gu," ").replace(/\n{3,}/gu,"\n\n").trim().slice(0,MAX_CONTENT_NOTE_LENGTH);}

export function saveContentNote(notes:ContentNote[],input:{kind:ContentNoteKind;contentId:string;bookmarked:boolean;note:string;now?:Date}){
  getContentReference(input.kind,input.contentId);
  const clean=cleanContentNote(input.note);
  const id=`content-note:${input.kind}:${input.contentId}`;
  const existing=notes.find((note)=>note.id===id);
  if(!input.bookmarked&&!clean)return notes.filter((note)=>note.id!==id);
  const now=(input.now??new Date()).toISOString();
  const next:ContentNote={id,policyVersion:CONTENT_NOTE_POLICY,kind:input.kind,contentId:input.contentId,bookmarked:input.bookmarked,note:clean,evidenceBoundary:CONTENT_NOTE_BOUNDARY,createdAt:existing?.createdAt??now,updatedAt:now};
  return existing?notes.map((note)=>note.id===id?next:note):[...notes,next];
}

export function deleteContentNote(notes:ContentNote[],id:string){return notes.filter((note)=>note.id!==id);}

export function mergeContentNotes(left:ContentNote[],right:ContentNote[]){
  const ids=new Set([...left,...right].map((note)=>note.id));
  return [...ids].map((id)=>{const a=left.find((note)=>note.id===id),b=right.find((note)=>note.id===id);if(!a)return b!;if(!b)return a;return Date.parse(b.updatedAt)>=Date.parse(a.updatedAt)?b:a;});
}

export function listResolvedContentNotes(notes:ContentNote[]){return notes.flatMap((note)=>{try{return[{note,reference:getContentReference(note.kind,note.contentId)}]}catch{return[]}}).sort((a,b)=>Date.parse(b.note.updatedAt)-Date.parse(a.note.updatedAt));}
