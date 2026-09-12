import type { LearningState, MissionBlock } from "@/types/learning";
import type { CoachTarget } from "@/core/coach/coach";
import { lessonAudioAssetByLessonId } from "@/data/lesson-audio-assets";

export const TODAY_OFFLINE_READINESS_VERSION="today-session-offline-readiness-v1" as const;

export interface TodayOfflineRequirements {
  policyVersion:typeof TODAY_OFFLINE_READINESS_VERSION;
  routes:string[];
  audioAssets:string[];
}

export type TodayOfflineReadinessResult={
  status:"ready"|"missing"|"uncontrolled"|"unsupported"|"error";
  workerVerified:boolean;
  requiredRouteCount:number;
  requiredAudioCount:number;
  missingRoutes:string[];
  missingAudioAssets:string[];
  checkedAt:string;
  message?:string;
};

const uniquePaths=(paths:Array<string|undefined>)=>[...new Set(paths.filter((path):path is string=>Boolean(path&&path.startsWith("/")&&!path.startsWith("//"))))];

export function buildTodayOfflineRequirements(state:LearningState,mission:MissionBlock[],target:CoachTarget):TodayOfflineRequirements{
  const missionRoutes=mission.map((block)=>block.href);
  const targetLessonId=target.href.match(/^\/lernen\/([ab][12]-\d{2})$/i)?.[1];
  const currentLessonId=targetLessonId??(mission.some((block)=>block.kind==="lesson")?state.currentLessonId:undefined);
  const audio=currentLessonId?lessonAudioAssetByLessonId[currentLessonId]?.path:undefined;
  return{policyVersion:TODAY_OFFLINE_READINESS_VERSION,routes:uniquePaths(["/today",target.href,...missionRoutes]),audioAssets:uniquePaths([audio])};
}

function unavailableResult(status:"uncontrolled"|"unsupported"|"error",requirements:TodayOfflineRequirements,message:string):TodayOfflineReadinessResult{return{status,workerVerified:false,requiredRouteCount:requirements.routes.length,requiredAudioCount:requirements.audioAssets.length,missingRoutes:[...requirements.routes],missingAudioAssets:[...requirements.audioAssets],checkedAt:new Date().toISOString(),message}}

export async function checkTodayOfflineReadiness(requirements:TodayOfflineRequirements):Promise<TodayOfflineReadinessResult>{
  if(typeof navigator==="undefined"||!("serviceWorker" in navigator))return unavailableResult("unsupported",requirements,"هذا المتصفح لا يدعم Service Worker.");
  const worker=navigator.serviceWorker.controller;
  if(!worker)return unavailableResult("uncontrolled",requirements,"عامل Offline لا يتحكم في هذه الصفحة بعد. أعد تحميلها ثم افحص مجددًا.");
  return new Promise((resolve)=>{
    const channel=new MessageChannel();
    const timeout=window.setTimeout(()=>resolve(unavailableResult("error",requirements,"انتهت مهلة فحص موارد الجلسة.")),10_000);
    channel.port1.onmessage=(event:MessageEvent<unknown>)=>{
      window.clearTimeout(timeout);
      const reply=event.data as Record<string,unknown>;
      if(reply?.type!=="DWNB_TODAY_READINESS_RESULT"||reply.policyVersion!==TODAY_OFFLINE_READINESS_VERSION||!Array.isArray(reply.missingRoutes)||!Array.isArray(reply.missingAudioAssets)){
        resolve(unavailableResult("error",requirements,"أعاد عامل Offline نتيجة غير صالحة."));return;
      }
      const missingRoutes=reply.missingRoutes.filter((item):item is string=>typeof item==="string");
      const missingAudioAssets=reply.missingAudioAssets.filter((item):item is string=>typeof item==="string");
      resolve({status:missingRoutes.length||missingAudioAssets.length?"missing":"ready",workerVerified:true,requiredRouteCount:requirements.routes.length,requiredAudioCount:requirements.audioAssets.length,missingRoutes,missingAudioAssets,checkedAt:typeof reply.checkedAt==="string"?reply.checkedAt:new Date().toISOString()});
    };
    worker.postMessage({type:"DWNB_TODAY_READINESS_CHECK",policyVersion:requirements.policyVersion,routes:requirements.routes,audioAssets:requirements.audioAssets},[channel.port2]);
  });
}
