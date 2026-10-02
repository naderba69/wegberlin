import type { PersonalVocabularyItem } from "@/types/learning";

export const PERSONAL_VOCABULARY_POLICY="personal-vocabulary-import-v1" as const;
export const PERSONAL_VOCABULARY_BOUNDARY="personal-vocabulary-no-srs-mastery-or-cefr" as const;
export const PERSONAL_VOCABULARY_HEADER="German\tArabic\tExample\tTags";
export const MAX_PERSONAL_VOCABULARY_FILE_BYTES=262_144;
export const MAX_PERSONAL_VOCABULARY_ROWS=500;

export type PersonalVocabularyIssue={row:number;code:"columns"|"empty"|"language"|"length"|"formula"|"html"|"duplicate"|"controls-cleaned";severity:"warning"|"rejected";messageAr:string};
export type PersonalVocabularyPreview={policyVersion:typeof PERSONAL_VOCABULARY_POLICY;fileName:string;batchId:string;accepted:PersonalVocabularyItem[];issues:PersonalVocabularyIssue[];totalRows:number;rejectedRows:number;duplicateRows:number;evidenceBoundary:typeof PERSONAL_VOCABULARY_BOUNDARY};

function normalize(value:string){return value.normalize("NFC").replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F\u202A-\u202E\u2066-\u2069]/gu,"").replace(/\s+/gu," ").trim();}
function key(german:string,arabic:string){return`${german.toLocaleLowerCase("de-DE")}|${arabic}`;}
function hash(value:string){let result=2166136261;for(const character of value){result^=character.codePointAt(0)??0;result=Math.imul(result,16777619)}return(result>>>0).toString(36);}
function unsafeFormula(value:string){return/^[=+\-@]/u.test(value.trim());}
function unsafeHtml(value:string){return/[<>]/u.test(value);}
function sanitizeFileName(value:string){return normalize(value).replace(/[\\/]/gu,"-").slice(0,120)||"personal-vocabulary.tsv";}

export function parsePersonalVocabularyTsv(raw:string,options:{fileName?:string;batchId:string;existing?:PersonalVocabularyItem[];now?:Date}):PersonalVocabularyPreview{
  const byteSize=new TextEncoder().encode(raw).byteLength;
  if(byteSize>MAX_PERSONAL_VOCABULARY_FILE_BYTES)throw new Error(`ملف المفردات أكبر من ${MAX_PERSONAL_VOCABULARY_FILE_BYTES} بايت.`);
  const lines=raw.replace(/^\uFEFF/u,"").replace(/\r\n?/gu,"\n").split("\n");
  if(lines[0]!==PERSONAL_VOCABULARY_HEADER)throw new Error(`رأس TSV غير صالح. المطلوب حرفيًا: ${PERSONAL_VOCABULARY_HEADER}`);
  const rows=lines.slice(1).filter((line,index,array)=>line.length>0||index<array.length-1);
  if(rows.length>MAX_PERSONAL_VOCABULARY_ROWS)throw new Error(`الملف يحتوي ${rows.length} صفًا؛ الحد ${MAX_PERSONAL_VOCABULARY_ROWS}.`);
  const importedAt=(options.now??new Date()).toISOString();
  const existingKeys=new Set((options.existing??[]).map((item)=>key(item.german,item.arabic)));
  const seen=new Set<string>();
  const accepted:PersonalVocabularyItem[]=[];
  const issues:PersonalVocabularyIssue[]=[];
  let duplicateRows=0;
  rows.forEach((line,index)=>{
    const row=index+2;
    const cells=line.split("\t");
    const reject=(code:PersonalVocabularyIssue["code"],messageAr:string)=>issues.push({row,code,severity:"rejected",messageAr});
    if(cells.length!==4){reject("columns",`الصف ${row} لا يحتوي أربعة أعمدة.`);return;}
    if(cells.some(unsafeFormula)){reject("formula",`الصف ${row} يبدأ بمحرف Formula غير مسموح.`);return;}
    if(cells.some(unsafeHtml)){reject("html",`الصف ${row} يحتوي أقواس HTML غير مسموحة.`);return;}
    const cleaned=cells.map(normalize);
    if(cleaned.some((value,cell)=>value!==cells[cell].replace(/\s+/gu," ").trim()))issues.push({row,code:"controls-cleaned",severity:"warning",messageAr:`نُظفت محارف تحكم أو اتجاه في الصف ${row}.`});
    const[german,arabic,exampleDe,tagsRaw]=cleaned;
    if(!german||!arabic){reject("empty",`الصف ${row} يحتاج كلمة ألمانية ومعنى عربيًا.`);return;}
    if(german.length>80||arabic.length>120||exampleDe.length>240||tagsRaw.length>120){reject("length",`الصف ${row} تجاوز حد طول أحد الحقول.`);return;}
    if(!/[A-Za-zÄÖÜäöüß]/u.test(german)||/\p{Script=Arabic}/u.test(german)||!/\p{Script=Arabic}/u.test(arabic)||exampleDe&&(!/[A-Za-zÄÖÜäöüß]/u.test(exampleDe)||/\p{Script=Arabic}/u.test(exampleDe))){reject("language",`الصف ${row} لا يحترم عمود الألمانية/العربية.`);return;}
    const itemKey=key(german,arabic);
    if(existingKeys.has(itemKey)||seen.has(itemKey)){duplicateRows+=1;reject("duplicate",`الصف ${row} مكرر ولن يُستورد.`);return;}
    const tags=[...new Set(tagsRaw.split(",").map((tag)=>tag.trim().toLocaleLowerCase("de-DE")).filter(Boolean))];
    if(tags.length>6||tags.some((tag)=>tag.length>24||!/^[a-z0-9äöüß-]+$/iu.test(tag))){reject("language",`وسوم الصف ${row} يجب أن تكون كلمات قصيرة مفصولة بفواصل.`);return;}
    seen.add(itemKey);
    accepted.push({id:`personal-vocab:${hash(itemKey)}`,policyVersion:PERSONAL_VOCABULARY_POLICY,german,arabic,exampleDe:exampleDe||undefined,tags,source:"user-tsv",importBatchId:options.batchId,importedAt,evidenceBoundary:PERSONAL_VOCABULARY_BOUNDARY});
  });
  return{policyVersion:PERSONAL_VOCABULARY_POLICY,fileName:sanitizeFileName(options.fileName??"personal-vocabulary.tsv"),batchId:options.batchId,accepted,issues,totalRows:rows.length,rejectedRows:issues.filter((issue)=>issue.severity==="rejected").length,duplicateRows,evidenceBoundary:PERSONAL_VOCABULARY_BOUNDARY};
}

export async function previewPersonalVocabularyFile(file:File,existing:PersonalVocabularyItem[],batchId=`vocab-batch-${crypto.randomUUID()}`){
  if(file.size>MAX_PERSONAL_VOCABULARY_FILE_BYTES)throw new Error(`ملف المفردات أكبر من ${MAX_PERSONAL_VOCABULARY_FILE_BYTES} بايت.`);
  let raw:string;try{raw=new TextDecoder("utf-8",{fatal:true}).decode(await file.arrayBuffer())}catch{throw new Error("ملف المفردات ليس UTF-8 صالحًا.")}
  return parsePersonalVocabularyTsv(raw,{fileName:file.name,batchId,existing});
}

export function commitPersonalVocabulary(existing:PersonalVocabularyItem[],preview:PersonalVocabularyPreview){const map=new Map(existing.map((item)=>[item.id,item]));for(const item of preview.accepted)if(!map.has(item.id))map.set(item.id,item);return[...map.values()];}
export function deletePersonalVocabularyItem(items:PersonalVocabularyItem[],id:string){return items.filter((item)=>item.id!==id);}
export function mergePersonalVocabulary(left:PersonalVocabularyItem[],right:PersonalVocabularyItem[]){return commitPersonalVocabulary(left,{policyVersion:PERSONAL_VOCABULARY_POLICY,fileName:"merge",batchId:"merge",accepted:right,issues:[],totalRows:right.length,rejectedRows:0,duplicateRows:0,evidenceBoundary:PERSONAL_VOCABULARY_BOUNDARY});}
export function personalVocabularySampleTsv(){return`${PERSONAL_VOCABULARY_HEADER}\nTermin\tموعد\tIch brauche einen neuen Termin.\tarbeit,a1\n`}
