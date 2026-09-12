"use client";

import Link from "next/link";
import { BookmarkCheck,NotebookPen,Trash2 } from "lucide-react";
import { CONTENT_NOTE_POLICY,deleteContentNote,listResolvedContentNotes } from "@/core/notes/content-notes";
import { useLearning } from "./learning-provider";

export function ContentNotesManager(){
  const{state,update}=useLearning();
  const resolved=listResolvedContentNotes(state.contentNotes);
  const bookmarked=resolved.filter((item)=>item.note.bookmarked).length;
  const written=resolved.filter((item)=>item.note.note).length;
  function remove(id:string){update((current)=>({...current,contentNotes:deleteContentNote(current.contentNotes,id)}))}
  function clear(){if(!window.confirm("حذف جميع العلامات والملاحظات الشخصية في هذا الملف؟"))return;update((current)=>({...current,contentNotes:[]}))}
  return <section className="settings-card content-notes-manager" data-content-note-manager={CONTENT_NOTE_POLICY}>
    <div className="settings-title"><span><NotebookPen size={20}/></span><div><h2>العلامات والملاحظات المحلية</h2><p>{bookmarked} علامات · {written} ملاحظات · لا تدخل البحث أو AI أو الإتقان.</p></div></div>
    {resolved.length?<div className="content-note-list">{resolved.map(({note,reference})=><article key={note.id}><span>{note.bookmarked?<BookmarkCheck size={16}/>:<NotebookPen size={16}/>}</span><div><Link href={reference.href}><strong lang="de" dir="ltr">{reference.titleDe}</strong><small>{reference.titleAr}</small></Link>{note.note&&<p>{note.note}</p>}<em>{note.kind==="lesson"?"درس":note.kind==="library"?"مكتبة":"مهمة امتحان"} · حُدّث {new Date(note.updatedAt).toLocaleDateString("ar-TN")}</em></div><button aria-label={`حذف ملاحظة ${reference.titleAr}`} onClick={()=>remove(note.id)}><Trash2 size={14}/></button></article>)}</div>:<div className="content-notes-empty"><BookmarkCheck size={22}/><p>لا توجد علامة أو ملاحظة بعد. افتح درسًا أو مادة مكتبة واحفظ سياقًا تريد العودة إليه.</p></div>}
    <footer><p>DWNB ينقل هذه السجلات مع ملفك. لا نحفظ جواب التمرين تلقائيًا ولا نرسل النص إلى مزود.</p><button className="secondary-button" disabled={!resolved.length} onClick={clear}><Trash2 size={14}/> حذف جميع العلامات والملاحظات</button></footer>
  </section>;
}
