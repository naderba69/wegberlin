export const LANGUAGE_BOUNDARY_VERSION="language-boundary-v1" as const;
export type FragmentLanguage="ar"|"de"|"mixed"|"technical";

const arabic=/[\u0600-\u06ff\u0750-\u077f\u08a0-\u08ff]/u;
const latin=/[A-Za-zÄÖÜäöüß]/u;

export function detectFragmentLanguage(text:string):FragmentLanguage{
  const hasArabic=arabic.test(text);
  const hasLatin=latin.test(text);
  if(hasArabic&&hasLatin)return"mixed";
  if(hasArabic)return"ar";
  if(hasLatin)return"de";
  return"technical";
}

export function fragmentLanguageAttributes(text:string):{
  lang?:"ar"|"de";
  dir:"rtl"|"ltr"|"auto";
  "data-bidi-scope"?:"mixed"|"technical";
}{
  const language=detectFragmentLanguage(text);
  if(language==="ar")return{lang:"ar",dir:"rtl"};
  if(language==="de")return{lang:"de",dir:"ltr"};
  if(language==="mixed")return{dir:"auto","data-bidi-scope":"mixed"};
  return{dir:"ltr","data-bidi-scope":"technical"};
}

// Some strategy mistakes are written in Arabic. In a one-line "wrong → correct" summary the arrow must point
// from the wrong form to the correct one in the line's reading direction, which follows its first strong
// character (the same rule dir="auto" applies).
const firstStrongIsArabic=/^[^A-Za-zÄÖÜäöüß\u0600-\u06ff\u0750-\u077f\u08a0-\u08ff]*[\u0600-\u06ff\u0750-\u077f\u08a0-\u08ff]/u;
export function mistakeLine(wrong:string,correct:string):string{
  return `${wrong} ${firstStrongIsArabic.test(wrong)?"←":"→"} ${correct}`;
}
