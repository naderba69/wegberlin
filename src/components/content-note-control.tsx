"use client";

import { useState } from "react";
import { Bookmark,BookmarkCheck,NotebookPen,Save,Trash2 } from "lucide-react";
import type { ContentNoteKind } from "@/types/learning";
import { CONTENT_NOTE_POLICY,deleteContentNote,getContentReference,MAX_CONTENT_NOTE_LENGTH,saveContentNote } from "@/core/notes/content-notes";
import { useLearning } from "./learning-provider";

export function ContentNoteControl({kind,contentId}:{kind:ContentNoteKind;contentId:string}){
  const{state,update}=useLearning();
  const reference=getContentReference(kind,contentId);
  const existing=state.contentNotes.find((note)=>note.kind===kind&&note.contentId===contentId);
  const[text,setText]=useState(existing?.note??"");
  const[message,setMessage]=useState("");

  function toggleBookmark(){const next=!existing?.bookmarked;update((current)=>({...current,contentNotes:saveContentNote(current.contentNotes,{kind,contentId,bookmarked:next,note:text})}));setMessage(next?"حُفظت العلامة محليًا.":text.trim()?"أزيلت العلامة وبقيت الملاحظة.":"أزيلت العلامة والسجل الفارغ.")}
  function save(){update((current)=>({...current,contentNotes:saveContentNote(current.contentNotes,{kind,contentId,bookmarked:Boolean(existing?.bookmarked),note:text})}));setMessage(text.trim()?"حُفظت الملاحظة محليًا دون إرسال أو تغيير التقدم.":existing?.bookmarked?"أُفرغت الملاحظة وبقيت العلامة.":"لا توجد ملاحظة أو علامة للحفظ.")}
  function remove(){if(!existing)return;update((current)=>({...current,contentNotes:deleteContentNote(current.contentNotes,existing.id)}));setText("");setMessage("حُذفت العلامة والملاحظة من هذا المحتوى.")}

  return <details className="content-note-control" data-content-note-policy={CONTENT_NOTE_POLICY}>
    <summary><span>{existing?.bookmarked?<BookmarkCheck size={16}/>:<Bookmark size={16}/>}</span><div><strong>علامة وملاحظة شخصية</strong><small lang="de" dir="ltr">{reference.titleDe}</small></div>{existing&&<b>{existing.note?"ملاحظة محفوظة":"محفوظ"}</b>}</summary>
    <div><button className={existing?.bookmarked?"bookmarked":""} aria-pressed={Boolean(existing?.bookmarked)} onClick={toggleBookmark}>{existing?.bookmarked?<BookmarkCheck size={15}/>:<Bookmark size={15}/>} {existing?.bookmarked?"إزالة العلامة":"احفظ كعلامة"}</button><label>Meine Notiz · ملاحظتي<textarea maxLength={MAX_CONTENT_NOTE_LENGTH} value={text} onChange={(event)=>setText(event.target.value)} placeholder="اكتب تذكيرك الشخصي هنا…"/></label><footer><small>{text.length}/{MAX_CONTENT_NOTE_LENGTH} · محلي فقط، لا يدخل AI أو الإتقان.</small><button onClick={save} disabled={!text.trim()&&!existing}><Save size={14}/> حفظ الملاحظة</button>{existing&&<button className="delete" onClick={remove}><Trash2 size={14}/> حذف الكل</button>}</footer>{message&&<p role="status" aria-live="polite"><NotebookPen size={14}/>{message}</p>}</div>
  </details>;
}
