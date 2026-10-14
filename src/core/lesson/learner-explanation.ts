import { FEEDBACK_DISCLOSURE_MARKER } from "./disclosure-marker";

/** نص الشرح كما يراه التلميذ: بلا وسم الأمانة الداخلي. البيانات لا تتغيّر. */
export function learnerExplanation(text: string | null | undefined): string {
  if (!text) return "";
  return text.split(FEEDBACK_DISCLOSURE_MARKER).join("").replace(/\s+$/u, "");
}
