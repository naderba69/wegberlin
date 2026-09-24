import{describe,expect,it}from"vitest";import{compareCurriculumPacks,CURRICULUM_PACK_DIFF_POLICY}from"@/core/offline/curriculum-pack-diff";
const candidate={curriculumVersion:"v2",buildFingerprint:"b",packId:"full",routeCount:306,includesAudio:false};
describe("P2 pre-update curriculum pack diff",()=>{
 it("labels first install",()=>expect(compareCurriculumPacks(null,candidate)).toMatchObject({status:"first-install",routeDelta:306}));
 it("separates curriculum from build update",()=>expect(compareCurriculumPacks({...candidate,curriculumVersion:"v1",buildFingerprint:"a"},candidate)).toMatchObject({policyVersion:"pre-update-curriculum-pack-diff-v2",status:"curriculum-update",versionChanged:true}));
 it("fails safely when an older installed pack has no curriculum identity",()=>expect(compareCurriculumPacks({buildFingerprint:"a",packId:"full",routeCount:300},candidate)).toMatchObject({policyVersion:CURRICULUM_PACK_DIFF_POLICY,status:"unknown-installed-curriculum",versionChanged:true,buildChanged:true}));
 it("labels same-version build",()=>expect(compareCurriculumPacks({...candidate,buildFingerprint:"a"},candidate)).toMatchObject({status:"build-update",versionChanged:false,buildChanged:true}));
 it("labels scope and route delta",()=>expect(compareCurriculumPacks({...candidate,packId:"a1",routeCount:58},candidate)).toMatchObject({status:"scope-change",scopeChanged:true,routeDelta:248}));
 it("keeps metadata-only boundary visible",()=>{const result=compareCurriculumPacks(candidate,candidate);expect(result.status).toBe("same-build");expect(result.evidenceBoundary).toContain("no-semantic-content-diff")});
});
