import { readFile, writeFile, readdir } from "node:fs/promises";
import path from "node:path";
import ts from "typescript";
import { academicLessonList } from "../src/data/academic-lessons";
import { selectReadingEvidence } from "../src/core/lesson/support";

/** Authoring operation, never run by prebuild. Restores preserved authored A2 payloads,
 * then supplies item-specific target/evidence/rule/next-action context to thin feedback.
 * Independent semantic review remains pending; text length is not a quality certificate. */
const apply = process.argv.includes("--apply");
const explanations = new Map<string,string>();
let restored = 0, expanded = 0;
const saved = new Map<string,string>();
const payloadDir = "docs/run-logs/a2-explanations-payloads";
const order = (name:string) => { const match=/a2e(\d+)(?:-fix(\d+))?\.json$/u.exec(name); return match?Number(match[1])*100+Number(match[2]??0):0; };
for (const name of (await readdir(payloadDir)).filter(name=>/^a2e\d+(?:-fix\d+)?\.json$/u.test(name)).sort((a,b)=>order(a)-order(b))) {
  const payload=JSON.parse(await readFile(path.join(payloadDir,name),"utf8")) as Record<string,string|{explanationAr:string}>;
  for(const [id,value] of Object.entries(payload)) saved.set(id,typeof value==="string"?value:value.explanationAr);
}
const tokens=(text:string)=>new Set(text.toLocaleLowerCase("de-DE").match(/[\p{L}]+/gu)??[]);
for(const lesson of academicLessonList){
  const items=[...lesson.exercises,...lesson.reading.questions,...lesson.listening.questions,...lesson.miniTest];
  for(const item of items){
    const recovered=saved.get(item.id);
    const previous=recovered??item.explanationAr;
    if(recovered&&recovered!==item.explanationAr){ explanations.set(item.id,recovered);restored+=1; }
    if(previous.trim().length>=60)continue;
    const target="options" in item?item.options[item.correctIndex]:"acceptedAnswers" in item?item.acceptedAnswers[0]:"pairs" in item?item.pairs.map(pair=>`${pair.left} ↔ ${pair.right}`).join("؛ "):"";
    let text=previous.trim();
    if(lesson.reading.questions.some(question=>question.id===item.id)){
      const evidence=selectReadingEvidence(lesson.reading.textDe,item as typeof lesson.reading.questions[number]);
      text+=` الجواب الموافق للمعلومة هو «${target}». ارجع إلى «${evidence}» وقارن الفاعل والفعل والتفصيل بالسؤال؛ لا يكفي تشابه كلمة في الخيار. موضع الرجوع آلي ويحتاج مراجعة دلالية مستقلة.`;
    }else if(lesson.listening.questions.some(question=>question.id===item.id)){
      text+=` المطلوب في هذا السؤال هو «${target}». أعد سماع موضع المعلومة وحدّد من يتكلم وما يقصده؛ لا تختَر تفصيلًا سمعته إذا كان يخص شخصًا أو وقتًا آخر. بعد الفهم قل المعلومة بكلماتك دون قراءة النص.`;
    }else{
      const targetTokens=tokens(target);
      const block=lesson.theory.map(block=>({block,overlap:[...tokens(block.examples.map(example=>example.de).join(" "))].filter(token=>token.length>3&&targetTokens.has(token)).length})).sort((a,b)=>b.overlap-a.overlap)[0];
      const firstSentence=block?.overlap?block.block.explanationAr.split(/(?<=[.!؟])\s+/u)[0]:"";
      const safeRule=firstSentence&&!/\b(?:Nominativ|Akkusativ|Dativ|Genitiv)\b/u.test(firstSentence)?firstSentence:"";
      text+=` الصيغة المطلوبة هنا هي «${target}». ${safeRule?`${safeRule} `:""}افحص المعنى وترتيب الكلمات في سياق السؤال قبل تثبيت جوابك، ثم كوّن استعمالًا جديدًا للهدف بدل تكرار المفتاح فقط.`;
    }
    explanations.set(item.id,text);expanded+=1;
  }
}
const found=new Set<string>();
let fields=0,files=0;
for(const name of (await readdir("src/data")).filter(name=>/^lessons-[ab][12]-module\d+\.ts$/u.test(name))){
  const filename=path.join("src/data",name),source=await readFile(filename,"utf8"),tree=ts.createSourceFile(filename,source,ts.ScriptTarget.Latest,true);
  const edits:{start:number;end:number;text:string}[]=[];
  const visit=(node:ts.Node)=>{
    if(ts.isObjectLiteralExpression(node)){
      const prop=(key:string)=>node.properties.find((property):property is ts.PropertyAssignment=>ts.isPropertyAssignment(property)&&property.name.getText(tree)===key);
      const id=prop("id"),feedback=prop("explanationAr");
      if(id&&ts.isStringLiteral(id.initializer)&&feedback&&ts.isStringLiteral(feedback.initializer)){
        const wanted=explanations.get(id.initializer.text);
        if(wanted){found.add(id.initializer.text);if(wanted!==feedback.initializer.text)edits.push({start:feedback.initializer.getStart(tree),end:feedback.initializer.end,text:JSON.stringify(wanted)});}
      }
    }
    ts.forEachChild(node,visit);
  };
  visit(tree);
  if(edits.length){let updated=source;for(const edit of edits.sort((a,b)=>b.start-a.start))updated=updated.slice(0,edit.start)+edit.text+updated.slice(edit.end);if(apply)await writeFile(filename,updated);fields+=edits.length;files+=1;}
}
const missing=[...explanations.keys()].filter(id=>!found.has(id));
if(missing.length)throw new Error(`Missing feedback owners: ${missing.join(", ")}`);
console.log(JSON.stringify({operation:apply?"authored-context-repair-applied":"dry-run",restoredPayloads:restored,expandedThinFeedback:expanded,changedFields:fields,changedFiles:files,missing,reviewStatus:"independent-semantic-review-pending"},null,2));
