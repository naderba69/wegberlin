import { isolateSegments } from "@/core/a11y/bidi";

/**
 * P0-254: يعرض نصًا عربيًا مؤلفًا مع عزل اتجاهي (Bidi isolation) لكل Runs لاتينية
 * داخله، ووسم `lang="de"` للألمانية و`lang="en"` للإنجليزية منها. لا يستخدم `dangerouslySetInnerHTML`:
 * النص يُقسَّم إلى عناصر React، فيبقى المحتوى المؤلف نصًا لا HTML.
 */
export function BidiText({ text }: { text: string }) {
  const segments = isolateSegments(text);
  // نص عربي خالص يبقى نصًا مباشرًا. أما النص اللاتيني الخالص (اسم جهة امتحان
  // مثل `Goethe-Zertifikat B2`) فهو أولى بالعزل من نص عربي يحوي كلمة ألمانية.
  if (!segments.some((segment) => segment.isolate)) return <>{text}</>;
  return <>{segments.map((segment, index) => segment.isolate
    ? <span key={index} dir="ltr" lang={segment.lang ?? undefined}>{segment.text}</span>
    : <span key={index}>{segment.text}</span>)}</>;
}
