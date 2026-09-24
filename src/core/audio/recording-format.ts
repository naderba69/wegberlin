export const RECORDING_FORMAT_POLICY_VERSION="opus-first-recording-format-v1" as const;
export const RECORDING_MIME_CANDIDATES=["audio/webm;codecs=opus","audio/ogg;codecs=opus","audio/webm","audio/mpeg","audio/mp4"]as const;
type RecorderConstructor={new(stream:MediaStream,options?:MediaRecorderOptions):MediaRecorder;isTypeSupported?:(mime:string)=>boolean};
export function selectRecordingMimeType(Recorder:RecorderConstructor=MediaRecorder){return RECORDING_MIME_CANDIDATES.find((mime)=>Recorder.isTypeSupported?.(mime))??""}
export function createRecordingMediaRecorder(stream:MediaStream,Recorder:RecorderConstructor=MediaRecorder){const mimeType=selectRecordingMimeType(Recorder);return{recorder:mimeType?new Recorder(stream,{mimeType}):new Recorder(stream),mimeType,policyVersion:RECORDING_FORMAT_POLICY_VERSION,fallbackUsed:!mimeType||!mimeType.includes("opus")}}
