import { isolateSegments } from "@/core/a11y/bidi";

/**
 * P0-254: يعرض نصًا عربيًا مؤلفًا مع عزل اتجاهي (Bidi isolation) لكل Runs لاتينية
 * داخله، ووسم `lang="de"` للألمانية منها. لا يستخدم `dangerouslySetInnerHTML`:
 * النص يُقسَّم إلى عناصر React، فيبقى المحتوى المؤلف نصًا لا HTML.
 */
export function BidiText({ text }: { text: string }) {
  const segments = isolateSegments(text);
  if (segments.length === 1) return <>{text}</>;
  return <>{segments.map((segment, index) => segment.isolate
    ? <span key={index} dir="ltr" lang={segment.german ? "de" : undefined}>{segment.text}</span>
    : <span key={index}>{segment.text}</span>)}</>;
}
