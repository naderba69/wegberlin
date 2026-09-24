export const LOCAL_MICROPHONE_SIGNAL_POLICY = "local-microphone-signal-check-v1" as const;

export type MicrophoneSignalStatus = "usable" | "too-quiet" | "mostly-silence" | "clipping";
export type MicrophoneSignalAnalysis = {
  policyVersion: typeof LOCAL_MICROPHONE_SIGNAL_POLICY;
  status: MicrophoneSignalStatus;
  durationSeconds: number;
  peakAmplitude: number;
  rmsAmplitude: number;
  activeFrameRatio: number;
  clippingSampleRatio: number;
  waveform: number[];
  messageAr: string;
  actionAr: string;
  evidenceBoundary: "signal-quality-only-no-noise-source-speech-word-phoneme-pronunciation-or-fluency-diagnosis";
};

function clamp01(value:number){return Math.max(0,Math.min(1,value))}

export function waveformEnvelope(samples:Float32Array,barCount=48):number[]{
  const count=Math.max(8,Math.min(96,Math.round(barCount)));
  if(samples.length===0)return Array.from({length:count},()=>0);
  return Array.from({length:count},(_,bar)=>{
    const start=Math.floor(bar*samples.length/count);const end=Math.max(start+1,Math.floor((bar+1)*samples.length/count));let peak=0;
    for(let index=start;index<Math.min(samples.length,end);index+=1)peak=Math.max(peak,Math.abs(samples[index]));
    return Number(clamp01(peak).toFixed(4));
  });
}

export function analyzeMicrophoneSignal(samples:Float32Array,sampleRate:number):MicrophoneSignalAnalysis{
  if(!Number.isFinite(sampleRate)||sampleRate<=0||samples.length===0)throw new Error("عينة الميكروفون غير صالحة.");
  let squareSum=0,peak=0,clipped=0;
  for(const sample of samples){const absolute=Math.abs(sample);squareSum+=sample*sample;peak=Math.max(peak,absolute);if(absolute>=.985)clipped+=1}
  const rms=Math.sqrt(squareSum/samples.length);const frameSize=Math.max(1,Math.round(sampleRate*.02));let activeFrames=0,totalFrames=0;
  for(let start=0;start<samples.length;start+=frameSize){let frameSquares=0,count=0;for(let index=start;index<Math.min(samples.length,start+frameSize);index+=1){frameSquares+=samples[index]*samples[index];count+=1}if(Math.sqrt(frameSquares/Math.max(1,count))>=.015)activeFrames+=1;totalFrames+=1}
  const activeFrameRatio=activeFrames/Math.max(1,totalFrames);const clippingSampleRatio=clipped/samples.length;
  let status:MicrophoneSignalStatus="usable",messageAr="مستوى الإشارة مناسب مبدئيًا لمطابقة الكلمات.",actionAr="تابع إلى مطابقة الكلمات";
  if(clippingSampleRatio>=.005){status="clipping";messageAr="الصوت مرتفع أو قريب جدًا من الميكروفون، وظهرت أجزاء مقصوصة قد تربك التعرف.";actionAr="ابتعد قليلًا وخفّض صوتك ثم أعد التسجيل"}
  else if(peak<.003||(activeFrameRatio<.08&&peak>=.05)){status="mostly-silence";messageAr="معظم التسجيل صامت أو لم يصل صوت واضح إلى الميكروفون.";actionAr="تحقق من الإذن والميكروفون ثم سجّل من جديد"}
  else if(rms<.012){status="too-quiet";messageAr="وصل الصوت، لكنه منخفض وقد يصعب على النموذج تأكيد الكلمات.";actionAr="اقترب قليلًا وتحدث بصوت طبيعي ثم أعد التسجيل"}
  else if(activeFrameRatio<.08){status="mostly-silence";messageAr="معظم التسجيل صامت أو لم يصل صوت واضح إلى الميكروفون.";actionAr="تحقق من الإذن والميكروفون ثم سجّل من جديد"}
  return{policyVersion:LOCAL_MICROPHONE_SIGNAL_POLICY,status,durationSeconds:Number((samples.length/sampleRate).toFixed(2)),peakAmplitude:Number(clamp01(peak).toFixed(4)),rmsAmplitude:Number(clamp01(rms).toFixed(4)),activeFrameRatio:Number(clamp01(activeFrameRatio).toFixed(4)),clippingSampleRatio:Number(clamp01(clippingSampleRatio).toFixed(6)),waveform:waveformEnvelope(samples),messageAr,actionAr,evidenceBoundary:"signal-quality-only-no-noise-source-speech-word-phoneme-pronunciation-or-fluency-diagnosis"};
}
