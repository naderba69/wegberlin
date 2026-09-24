export const GERMAN_CHARACTER_KEYBOARD_POLICY="virtual-german-character-keyboard-v1" as const;
export const GERMAN_CHARACTERS=["ä","ö","ü","ß","Ä","Ö","Ü"] as const;
export type GermanCharacter=(typeof GERMAN_CHARACTERS)[number];

export function insertGermanCharacter(value:string,start:number|null,end:number|null,character:GermanCharacter){
  const safeStart=Math.max(0,Math.min(value.length,start??value.length));const safeEnd=Math.max(safeStart,Math.min(value.length,end??safeStart));const next=`${value.slice(0,safeStart)}${character}${value.slice(safeEnd)}`;const cursor=safeStart+character.length;return{value:next,selectionStart:cursor,selectionEnd:cursor};
}

export function isGermanTextEntry(element:EventTarget|null):element is HTMLInputElement|HTMLTextAreaElement{
  if(!(element instanceof HTMLInputElement||element instanceof HTMLTextAreaElement))return false;
  return element.lang.toLocaleLowerCase().startsWith("de")&&!element.disabled&&!element.readOnly&&element.type!=="hidden";
}
