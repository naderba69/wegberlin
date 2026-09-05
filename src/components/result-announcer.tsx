/**
 * P0-256: منطقة إعلان واحدة موجزة لكل نتيجة.
 *
 * تبقى في DOM فارغة قبل النتيجة حتى يلتقط قارئ الشاشة تغيّرها، وتمتلئ بملخّص
 * قصير عند وقوع النتيجة. لا تُستخدم لتكرار لوحة النتائج: اللوحة للعين، وهذه
 * الجملة للأذن، و`aria-atomic` يضمن قراءتها كاملة مرة واحدة لا مجزّأة.
 */
export function ResultAnnouncer({ message, id }: { message: string; id?: string }) {
  return <p
    id={id}
    className="result-announcer"
    role="status"
    aria-live="polite"
    aria-atomic="true"
  >{message}</p>;
}
