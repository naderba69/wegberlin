"use client";

import { useEffect, useRef, useState } from "react";
import { createRecordingMediaRecorder } from "@/core/audio/recording-format";
import type { MicrophoneSignalAnalysis } from "@/core/pronunciation/microphone-signal";
import type { LocalWordMatchResult } from "@/core/pronunciation/word-matching";

/**
 * Record-then-review state machine for the single-word repair loop: one media
 * stream, one bounded timer, one blob, and one object URL that is revoked on
 * stop and on unmount. Extracted verbatim from the component so the microphone
 * lifecycle has a single owner and the view keeps only the analysis steps.
 */
export function useWordRepairRecording() {
  const recorderRef=useRef<MediaRecorder|null>(null);const timerRef=useRef<number|undefined>(undefined);const chunksRef=useRef<Blob[]>([]);
  const[phase,setPhase]=useState<"idle"|"recording"|"review"|"analyzing"|"complete">("idle");const[blob,setBlob]=useState<Blob|null>(null);const[audioUrl,setAudioUrl]=useState("");const[listened,setListened]=useState(false);const[signal,setSignal]=useState<MicrophoneSignalAnalysis|null>(null);const[result,setResult]=useState<LocalWordMatchResult|null>(null);const[message,setMessage]=useState("");
  useEffect(()=>()=>{if(timerRef.current)window.clearTimeout(timerRef.current);recorderRef.current?.stream.getTracks().forEach((track)=>track.stop());if(audioUrl)URL.revokeObjectURL(audioUrl)},[audioUrl]);
  async function start(){try{const stream=await navigator.mediaDevices.getUserMedia({audio:true});const{recorder}=createRecordingMediaRecorder(stream);chunksRef.current=[];setBlob(null);setListened(false);setSignal(null);setResult(null);setMessage("");recorder.ondataavailable=(event)=>{if(event.data.size)chunksRef.current.push(event.data)};recorder.onstop=()=>{if(timerRef.current)window.clearTimeout(timerRef.current);const next=new Blob(chunksRef.current,{type:recorder.mimeType||"audio/webm"});setBlob(next);setAudioUrl((current)=>{if(current)URL.revokeObjectURL(current);return URL.createObjectURL(next)});stream.getTracks().forEach((track)=>track.stop());setPhase("review")};recorderRef.current=recorder;recorder.start();setPhase("recording");timerRef.current=window.setTimeout(()=>{if(recorder.state==="recording")recorder.stop()},4000)}catch{setMessage("تعذر فتح الميكروفون. تحقق من الإذن ثم حاول مرة أخرى.")}}
  function stop(){if(recorderRef.current?.state==="recording")recorderRef.current.stop()}
  return { phase, setPhase, blob, setBlob, audioUrl, setAudioUrl, listened, setListened, signal, setSignal, result, setResult, message, setMessage, start, stop };
}
