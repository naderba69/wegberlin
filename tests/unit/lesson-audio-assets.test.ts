import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { lessonAudioManifest } from "@/data/lesson-audio-assets";
import { academicLessons } from "@/data/academic-lessons";

describe("generated lesson listening audio", () => {
  it("publishes a transparent complete 84-of-84 lesson set", () => {
    expect(lessonAudioManifest.format).toBe("dwnb-lesson-audio");
    expect(lessonAudioManifest.generatedAssetCount).toBe(84);
    expect(lessonAudioManifest.totalLessonCount).toBe(84);
    expect(lessonAudioManifest.humanRecordedAssetCount).toBe(0);
    expect(lessonAudioManifest.usageNoteAr).toContain("ليس تسجيلًا بشريًا");
  });

  it("maps uniquely to every published A1-B2 lesson", () => {
    const expected = [...Array.from({length:24},(_,index)=>`a1-${String(index+1).padStart(2,"0")}`),...Array.from({length:24},(_,index)=>`a2-${String(index+1).padStart(2,"0")}`),...Array.from({length:24},(_,index)=>`b1-${String(index+1).padStart(2,"0")}`),...Array.from({length:12},(_,index)=>`b2-${String(index+1).padStart(2,"0")}`)];
    expect(lessonAudioManifest.assets.map((asset)=>asset.lessonId)).toEqual(expected);
    expect(new Set(lessonAudioManifest.assets.map((asset)=>asset.lessonId)).size).toBe(84);
    expect(new Set(lessonAudioManifest.assets.map((asset)=>asset.lessonId))).toEqual(new Set(Object.keys(academicLessons)));
    for(const asset of lessonAudioManifest.assets) expect(academicLessons[asset.lessonId]?.listening.transcriptDe.length).toBeGreaterThan(80);
  });

  it("verifies every committed lesson MP3 size and checksum", () => {
    for(const asset of lessonAudioManifest.assets){
      const bytes=readFileSync(join(process.cwd(),"public",asset.path));
      expect(bytes.length).toBe(asset.bytes);
      expect(createHash("sha256").update(bytes).digest("hex")).toBe(asset.sha256);
      expect(bytes.subarray(0,3).toString("ascii")).toBe("ID3");
    }
  });

  it("keeps generated lesson audio explicitly single-speaker and non-exam-grade", () => {
    for(const asset of lessonAudioManifest.assets){expect(asset.durationMs).toBeGreaterThan(10_000);expect(asset.speakerCount).toBe(1);expect(asset.examGrade).toBe(false);expect(asset.rightsStatus).toBe("generated-for-project-review-required");}
  });
});
