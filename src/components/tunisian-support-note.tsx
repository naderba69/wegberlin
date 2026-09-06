import { tunisianNotesFor, TUNISIAN_SUPPORT_VERSION } from "@/core/arabic/tunisian-support";
import type { TheoryBlock } from "@/types/lesson-content";

/**
 * P0-373 + P0-376: لوحة الدعم التونسي داخل بطاقة القاعدة.
 * لا تظهر إلا لمن اختار `arabicSupport === "tunisian-supported"`، وحينها تُعرض
 * فقط الملاحظات التي يطابق عنوانها البنية المعروضة فعلًا.
 */
export function TunisianSupportNote({
  block,
}: {
  block: Pick<TheoryBlock, "titleDe" | "titleAr" | "formula" | "explanationAr">;
}) {
  const notes = tunisianNotesFor(block);
  if (notes.length === 0) return null;
  return (
    <div className="tunisian-support" data-support-version={TUNISIAN_SUPPORT_VERSION}>
      <b>باللهجة التونسية</b>
      {notes.map((note) => (
        <article key={note.id} data-note-id={note.id}>
          <strong>{note.titleAr}</strong>
          <p>
            <span className="support-label">الفصحى:</span> {note.standardAr}
          </p>
          <p>
            <span className="support-label">التونسي:</span> {note.tunisianAr}
          </p>
          <p className="support-why">{note.whyAr}</p>
        </article>
      ))}
    </div>
  );
}
