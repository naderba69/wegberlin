import { AudioLines, Check, FileText, ListChecks, ShieldAlert, ShieldCheck } from "lucide-react";
import {
  createTranscriptDraft,
  laneSections,
  SPEAKING_REVIEW_LANES_POLICY,
  TRANSCRIPT_CONFIRMATION_POLICY,
  type SpeakingReviewLanes,
} from "@/core/speaking/review-lanes";

const LANE_ICONS = [AudioLines, FileText, ListChecks] as const;

/**
 * Read-only display of the three speaking review channels. It receives lanes,
 * never a number, and prints the boundary text that forbids reading them as one
 * score. Nothing here is persisted by this component.
 */
export function SpeakingReviewLanesPanel({ lanes }: { lanes: SpeakingReviewLanes }) {
  const sections = laneSections(lanes);
  return (
    <section className="speaking-review-lanes" data-speaking-review-lanes={SPEAKING_REVIEW_LANES_POLICY}>
      <header>
        <h3>نتائج منفصلة، لا رقم واحد</h3>
        <p>تُعرض ثلاث قنوات مستقلة حتى لا تختفي مشكلة خلف متوسط عام.</p>
      </header>
      <div className="speaking-review-lanes-grid">
        {sections.map((section, index) => {
          const Icon = LANE_ICONS[index] ?? FileText;
          return (
            <article key={section.titleAr}>
              <h4><Icon size={15} aria-hidden="true" /> {section.titleAr}</h4>
              <bdi dir="ltr" data-bidi-scope="technical">{section.statusAr}</bdi>
              <p>{section.bodyAr}</p>
              {section.excerpts.length > 0 && (
                <ul lang="de" dir="ltr" data-bidi-scope="technical">
                  {section.excerpts.slice(0, 6).map((excerpt) => <li key={excerpt}>{excerpt}</li>)}
                </ul>
              )}
            </article>
          );
        })}
      </div>
      <footer className="speaking-review-lanes-boundary">
        <ShieldAlert size={15} aria-hidden="true" />
        <p>
          لا رقم مركّب ولا درجة طلاقة ولا تقييم نطق هنا؛ الحقول المرقّمة في هذه القنوات معدودات تأكيد لا درجات.
          {lanes.linguistic.needsHumanReview && " توجد نقاط مفتوحة: راجعها مع معلم أو مراجع بشري قبل أن تبني عليها قرارًا."}
          {!lanes.linguistic.transcriptConfirmed && " لم تُرسل أي نسخة للمراجعة البعيدة قبل تأكيدك أنها مطابقة لما قلته."}
        </p>
      </footer>
    </section>
  );
}

/**
 * The learner-confirmation guard for a spoken transcript, extracted so the
 * protection is testable as behaviour instead of only as source text. A local
 * ASR result stays a draft the learner must confirm before anything is sent, and
 * the button disappears once the confirmation matches the current text.
 */
export function SpeakingTranscriptConfirmationCard({
  draft,
  currentText,
  onUseDraft,
  onConfirm,
}: {
  draft: ReturnType<typeof createTranscriptDraft>;
  currentText: string;
  onUseDraft: () => void;
  onConfirm: () => void;
}) {
  return (<div
                className="speaking-transcript-draft"
                data-transcript-policy={TRANSCRIPT_CONFIRMATION_POLICY}
              >
                <p>
                  <small>
                    {draft.source === "local-asr-draft"
                      ? "نسخة النموذج المحلي مسودة غير موثوقة: قد تكون أخطأت في سماع كلمة. صحّحها أنت."
                      : "هذا نصّك المكتوب، ولم يُستخدم تعرّف صوتي."}
                  </small>
                </p>
                <div className="speaking-transcript-draft-actions">
                  {draft.draftText &&
                    currentText !== draft.draftText && (
                      <button
                        type="button"
                        className="secondary-button"
                        onClick={onUseDraft}
                      >
                        املأ الحقل من نسخة النموذج
                      </button>
                    )}
                  <button
                    type="button"
                    disabled={
                      draft.confirmation === "learner-confirmed"
                    }
                    onClick={onConfirm}
                  >
                    {draft.confirmation === "learner-confirmed" ? (
                      <Check size={14} />
                    ) : (
                      <ShieldCheck size={14} />
                    )}{" "}
                    أؤكد أن هذه النسخة تطابق ما قلته
                  </button>
                </div>
                {draft.confirmation === "learner-confirmed" && (
                  <p>
                    <small dir="ltr" data-bidi-scope="technical">
                      {SPEAKING_REVIEW_LANES_POLICY}
                    </small>{" "}
                    {draft.editedFromDraft
                      ? "عدّلت المسودة قبل التأكيد، وستُرسل نسختك المصححة لا نسخة النموذج."
                      : "أكّدت المسودة دون تعديل."}
                  </p>
                )}
              </div>);
}
