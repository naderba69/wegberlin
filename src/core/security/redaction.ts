export const REDACTION_POLICY_VERSION="adversarial-sensitive-field-redaction-v1" as const;
const SENSITIVE_KEY=/(?:api[-_]?key|authorization|token|secret|password|passphrase|cookie|set-cookie|dwnb-ai-key)/i;
const SECRET_VALUE=/(?:gh[pousr]_[A-Za-z0-9_]{20,}|sk-or-v1-[A-Za-z0-9_-]{20,}|AIza[A-Za-z0-9_-]{20,}|Bearer\s+[^\s"']+)/gi;
export function redactSensitiveText(value:string){return value.replace(SECRET_VALUE,"[REDACTED_SECRET]").replace(/([?&](?:key|token|api_key|access_token)=)[^&\s]+/gi,"$1[REDACTED]")}
export function redactSensitiveValue(value:unknown,seen=new WeakSet<object>()):unknown{
 if(typeof value==="string")return redactSensitiveText(value);if(!value||typeof value!=="object")return value;if(seen.has(value as object))return"[REDACTED_CYCLE]";seen.add(value as object);
 if(Array.isArray(value))return value.map((item)=>redactSensitiveValue(item,seen));
 return Object.fromEntries(Object.entries(value as Record<string,unknown>).map(([key,item])=>[key,SENSITIVE_KEY.test(key)?"[REDACTED]":redactSensitiveValue(item,seen)]));
}
