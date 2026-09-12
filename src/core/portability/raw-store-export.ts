export const RAW_STORE_EXPORT_POLICY_VERSION="raw-indexeddb-store-export-v1" as const;
export const RAW_STORE_DATA_DICTIONARY={
  "learning-state":{key:"primary",value:"Validated active LearningState snapshot used by the application."},
  media:{key:"media or profile-prefixed media id",value:"Locally recorded Blob, encoded as base64 with MIME type and byte size."},
  "restore-points":{key:"latest",value:"Pre-import DWNB Blob restore point, encoded as base64."},
  profiles:{key:"local profile id",value:"Validated LearningState snapshot for one local learner profile."},
  metadata:{key:"metadata id",value:"Local registry metadata such as active-profile."},
}as const;
export type RawStoreName=keyof typeof RAW_STORE_DATA_DICTIONARY;

function bytesToBase64(bytes:Uint8Array){let binary="";const chunk=0x8000;for(let index=0;index<bytes.length;index+=chunk)binary+=String.fromCharCode(...bytes.subarray(index,index+chunk));return btoa(binary)}
export async function serializeRawStoreValue(value:unknown):Promise<unknown>{
 if(value instanceof Blob)return{type:"Blob",mimeType:value.type||"application/octet-stream",size:value.size,encoding:"base64",data:bytesToBase64(new Uint8Array(await value.arrayBuffer()))};
 if(Array.isArray(value))return Promise.all(value.map(serializeRawStoreValue));
 if(value&&typeof value==="object"){const entries=await Promise.all(Object.entries(value as Record<string,unknown>).map(async([key,item])=>[key,await serializeRawStoreValue(item)]as const));return Object.fromEntries(entries)}
 return value;
}
export async function buildRawStoreExport(readStore:(store:RawStoreName)=>Promise<Array<{key:IDBValidKey;value:unknown}>>,now=new Date()){
 const stores={}as Record<RawStoreName,Array<{key:IDBValidKey;value:unknown}>>;for(const store of Object.keys(RAW_STORE_DATA_DICTIONARY)as RawStoreName[])stores[store]=await readStore(store);
 return{format:"dwnb-raw-local-data",version:1,policyVersion:RAW_STORE_EXPORT_POLICY_VERSION,exportedAt:now.toISOString(),includesSessionStorage:false,includesApiKeys:false,restorable:false,dataDictionary:RAW_STORE_DATA_DICTIONARY,stores,evidenceBoundary:"user-readable-raw-export-not-a-restore-format-use-dwnb-for-restoration" as const};
}
