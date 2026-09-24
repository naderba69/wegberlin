export const REVIEW_SHORTCUT_POLICY = "review-keyboard-shortcuts-v1" as const;
export type ReviewShortcutAction = { type:"toggle-reveal" } | { type:"grade"; grade:1|3|4|5 };
export type ReviewShortcutInput = {
  key:string;
  repeat?:boolean;
  ctrlKey?:boolean;
  altKey?:boolean;
  metaKey?:boolean;
  shiftKey?:boolean;
  targetTag?:string;
  contentEditable?:boolean;
};

const grades:Record<string,1|3|4|5>={"1":1,"3":3,"4":4,"5":5};

export function resolveReviewShortcut(input:ReviewShortcutInput,context:{cardAvailable:boolean;revealed:boolean}):ReviewShortcutAction|null{
  if(!context.cardAvailable||input.repeat||input.ctrlKey||input.altKey||input.metaKey)return null;
  const tag=(input.targetTag??"").toLocaleLowerCase("en-US");
  if(input.contentEditable||["input","textarea","select","button","a"].includes(tag))return null;
  if((input.key===" "||input.key==="Spacebar")&&!input.shiftKey)return{type:"toggle-reveal"};
  const grade=grades[input.key];
  if(grade&&context.revealed&&!input.shiftKey)return{type:"grade",grade};
  return null;
}
