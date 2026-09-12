import { getContentReference } from "@/core/notes/content-notes";
import type { ContentErrorCategory,ContentErrorReport,ContentNoteKind } from "@/types/learning";

export const CONTENT_ERROR_REPORT_POLICY="local-content-error-report-v1" as const;
export const CONTENT_ERROR_REPORT_BOUNDARY="report-metadata-only-no-answer-key-progress-or-network" as const;
export const CONTENT_ERROR_REPORT_APP_VERSION="0.1.0" as const;
export const MAX_ERROR_DESCRIPTION_LENGTH=1000;
export const MAX_ERROR_SUGGESTION_LENGTH=600;

export const contentErrorCategoryLabels:Record<ContentErrorCategory,{de:string;ar:string}>={
  german:{de:"Deutsch",ar:"خطأ ألماني"},arabic:{de:"Arabisch",ar:"خطأ عربي"},answer:{de:"Aufgabe oder Lösung",ar:"مشكلة في السؤال أو الحل"},audio:{de:"Audio",ar:"مشكلة صوت"},accessibility:{de:"Barrierefreiheit",ar:"مشكلة وصول"},other:{de:"Sonstiges",ar:"أخرى"},
};

export type ContentErrorReportDraft=Omit<ContentErrorReport,"id"|"createdAt">;

function cleanReportText(value:string,max:number){return value.normalize("NFC").replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F\u202A-\u202E\u2066-\u2069]/gu,"").replace(/\r\n?/gu,"\n").replace(/[\t ]+/gu," ").replace(/\n{3,}/gu,"\n\n").trim().slice(0,max);}

export function buildContentErrorReportDraft(input:{kind:ContentNoteKind;contentId:string;category:ContentErrorCategory;description:string;suggestedCorrection?:string}):ContentErrorReportDraft{
  const reference=getContentReference(input.kind,input.contentId);
  const description=cleanReportText(input.description,MAX_ERROR_DESCRIPTION_LENGTH);
  const suggestedCorrection=cleanReportText(input.suggestedCorrection??"",MAX_ERROR_SUGGESTION_LENGTH);
  if(description.length<10)throw new Error("اكتب وصفًا من عشرة أحرف على الأقل قبل المعاينة.");
  return{policyVersion:CONTENT_ERROR_REPORT_POLICY,kind:input.kind,contentId:input.contentId,route:reference.href,titleDe:reference.titleDe,titleAr:reference.titleAr,category:input.category,description,suggestedCorrection:suggestedCorrection||undefined,appVersion:CONTENT_ERROR_REPORT_APP_VERSION,status:"local-draft-not-submitted",evidenceBoundary:CONTENT_ERROR_REPORT_BOUNDARY};
}

export function saveContentErrorReport(reports:ContentErrorReport[],draft:ContentErrorReportDraft,now=new Date()){
  const report:ContentErrorReport={...draft,id:`content-error-report:${crypto.randomUUID()}`,createdAt:now.toISOString()};
  return{reports:[...reports,report],report};
}
export function deleteContentErrorReport(reports:ContentErrorReport[],id:string){return reports.filter((report)=>report.id!==id);}
export function mergeContentErrorReports(left:ContentErrorReport[],right:ContentErrorReport[]){return[...new Map([...left,...right].map((report)=>[report.id,report])).values()];}
export function contentErrorReportExport(report:ContentErrorReport){return JSON.stringify({format:"dwnb-content-error-report",version:1,exportedAt:new Date().toISOString(),submissionStatus:"not-submitted-send-manually",report},null,2);}
export function contentErrorReportFileName(report:ContentErrorReport){return`dwnb-error-${report.kind}-${report.contentId.replace(/[^a-z0-9-]/giu,"-")}.json`;}
