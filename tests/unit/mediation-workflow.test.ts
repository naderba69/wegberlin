import { describe,expect,it } from "vitest";
import { analyzeMediation,MEDIATION_SELF_CHECKS } from "@/core/mediation/analyze";
import { defaultState } from "@/core/portability/db";
import { learningStateSchema } from "@/core/portability/schema";

const base={sourceDe:"Der Termin ist nur am Freitag möglich. Ohne Ausweis können Sie sich nicht anmelden.",taskAr:"اشرح لصديقك المطلوب ثم اكتب ردًا ألمانيًا قصيرًا.",audience:"صديق يريد التسجيل",purpose:"معرفة الموعد والوثيقة",keyFacts:["الموعد الجمعة فقط","الهوية مطلوبة"],transferAr:"الموعد متاح يوم الجمعة فقط، ولا يمكن التسجيل من دون بطاقة الهوية.",responseDe:"Danke, ich bringe meinen Ausweis mit.",selfChecklist:[...MEDIATION_SELF_CHECKS]};

describe("P0 mediation workflow",()=>{
  it("reports five distinct meaning-transfer dimensions",()=>{const result=analyzeMediation(base);expect(result.requiresGermanResponse).toBe(true);expect(result.dimensions.map(item=>item.key)).toEqual(["intent","completeness","audience","constraints","response"])});
  it("rejects copying the German source as Arabic mediation",()=>{const result=analyzeMediation({...base,transferAr:base.sourceDe});expect(result.dimensions.find(item=>item.key==="intent")?.passed).toBe(false)});
  it("requires two extracted facts and a defined audience purpose",()=>{const weak=analyzeMediation({...base,keyFacts:["الموعد"],audience:""});expect(weak.dimensions.find(item=>item.key==="completeness")?.passed).toBe(false);expect(weak.dimensions.find(item=>item.key==="audience")?.passed).toBe(false)});
  it("keeps source limits and anti-invention checks explicit",()=>{const unchecked=analyzeMediation({...base,selfChecklist:MEDIATION_SELF_CHECKS.filter((_,index)=>![2,4].includes(index))});expect(unchecked.dimensions.find(item=>item.key==="constraints")?.passed).toBe(false);expect(analyzeMediation(base).dimensions.find(item=>item.key==="constraints")?.passed).toBe(true)});
  it("requires a short German response only when the task asks for one",()=>{expect(analyzeMediation({...base,responseDe:""}).dimensions.find(item=>item.key==="response")?.passed).toBe(false);const arabicOnly=analyzeMediation({...base,taskAr:"اشرح المطلوب بالعربية فقط.",responseDe:""});expect(arabicOnly.requiresGermanResponse).toBe(false);expect(arabicOnly.dimensions.find(item=>item.key==="response")?.passed).toBe(true)});
  it("validates saved dimensions and revision provenance",()=>{const result=analyzeMediation(base);const parsed=learningStateSchema.parse({...defaultState,mediationSubmissions:[{id:"m2",taskId:"a1-01",audience:base.audience,purpose:base.purpose,keyFacts:base.keyFacts,transferAr:base.transferAr,responseDe:base.responseDe,version:2,status:"revised",selfChecklist:[...MEDIATION_SELF_CHECKS],dimensions:result.dimensions,feedback:result.feedback,sourceVersion:1,createdAt:"2026-08-31T12:00:00Z",updatedAt:"2026-08-31T12:10:00Z"}]});expect(parsed.mediationSubmissions[0].dimensions).toHaveLength(5);expect(parsed.mediationSubmissions[0].sourceVersion).toBe(1)});
});
