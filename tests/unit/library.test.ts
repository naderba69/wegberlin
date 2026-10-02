import {describe,expect,it} from "vitest";
import {listeningLibrary,readingLibrary} from "@/data/library-registry";
describe("extended library batch 1",()=>{
 it("publishes ten original readings and ten listening scripts",()=>{expect(readingLibrary).toHaveLength(80);expect(listeningLibrary).toHaveLength(80);expect([...readingLibrary,...listeningLibrary].every(x=>x.originalContent&&x.contentStatus==="published")).toBe(true)});
 it("has globally unique item and question ids",()=>{const all=[...readingLibrary,...listeningLibrary];const ids=all.flatMap(x=>[x.id,...x.questions.map(q=>q.id)]);expect(new Set(ids).size).toBe(ids.length)});
 it("covers every course level in both skills",()=>{for(const level of ["A1","A2","B1","B2"]){expect(readingLibrary.some(x=>x.level===level)).toBe(true);expect(listeningLibrary.some(x=>x.level===level)).toBe(true)}});
 it("keeps every question deterministic with four unique choices",()=>{for(const item of [...readingLibrary,...listeningLibrary]){expect(item.questions.length).toBeGreaterThanOrEqual(2);for(const question of item.questions){expect(question.options).toHaveLength(4);expect(new Set(question.options).size).toBe(4);expect(question.correctIndex).toBeGreaterThanOrEqual(0);expect(question.correctIndex).toBeLessThan(4)}}});
 it("labels every listening item with generated MP3 and Browser TTS fallback",()=>expect(listeningLibrary.every(x=>x.audioStatus==="generated-file-with-browser-tts-fallback")).toBe(true));
});
