import { createHash } from "node:crypto";
import { buildSimilarityCorpus } from "./content-similarity-review";
import { academicLessonList } from "@/data/academic-lessons";
import { highRiskContextClaims } from "@/data/high-risk-context-claims";
import { arabicLearnerPronunciationInventory } from "@/data/arabic-learner-pronunciation-inventory";
import { getArticulationGuide } from "@/core/pronunciation/articulation";
import { sourceVerificationRegistry } from "@/core/governance/source-freshness";
import { CURRENT_APP_VERSION,CURRENT_CURRICULUM_VERSION,CURRICULUM_VERSION_POLICY } from "@/config/curriculum-version";
import { CONTENT_GOVERNANCE_POLICY,GOVERNED_CONTENT_RECORD_COUNT,GOVERNED_SOURCE_COUNT,canTransitionContent,contentFamilyGovernance,contentGovernanceForScope,riskOwnershipRegistry } from "@/config/content-governance-registry";

const expectedRiskIds=["reviews","error-retests","high-confidence-errors","error-clinic","errors","weak-reading","weak-listening","weak-grammar","weak-writing","weak-speaking","missing-writing","missing-speaking"];

export function buildContentGovernanceAudit(){
 const issues:string[]=[];
 const corpus=buildSimilarityCorpus();
 const contentRows=corpus.map((entry)=>{const governance=contentGovernanceForScope(entry.scope);return{contentId:entry.id,scope:entry.scope,ownerId:governance.ownerId,reviewerId:governance.reviewerId,lifecycleStage:governance.currentStage,reviewStatus:governance.reviewStatus,evidenceBoundary:governance.evidenceBoundary}});
 const scopes=[...new Set(corpus.map((entry)=>entry.scope))].sort();
 const familyScopes=contentFamilyGovernance.map((item)=>item.scope).sort();
 if(JSON.stringify(scopes)!==JSON.stringify(familyScopes))issues.push("Content family registry does not exactly cover corpus scopes.");
 if(contentRows.length!==GOVERNED_CONTENT_RECORD_COUNT)issues.push(`Expected ${GOVERNED_CONTENT_RECORD_COUNT} governed content records, received ${contentRows.length}.`);
 if(contentFamilyGovernance.length!==13)issues.push("Expected 13 content lifecycle families.");
 for(const family of contentFamilyGovernance){if(family.ownerId===family.reviewerId)issues.push(`${family.scope}: owner and reviewer must differ.`);if(JSON.stringify(family.transitionOrder)!==JSON.stringify(["draft","validated","published"]))issues.push(`${family.scope}: lifecycle order drifted.`);if(!family.validationEvidence||!family.publicationEvidence)issues.push(`${family.scope}: transition evidence is missing.`)}
 if(!canTransitionContent("draft","validated")||!canTransitionContent("validated","published")||canTransitionContent("draft","published")||canTransitionContent("published","validated"))issues.push("Lifecycle transition guard is invalid.");
 const sources=sourceVerificationRegistry.records.map((record)=>({sourceId:record.id,ownerId:record.ownerId,reviewerId:record.reviewerId,reviewStatus:"scheduled-manual-semantic-review" as const}));
 if(sources.length!==GOVERNED_SOURCE_COUNT||sources.some((row)=>!row.ownerId||!row.reviewerId||String(row.ownerId)===String(row.reviewerId)))issues.push("Source ownership/reviewer coverage is incomplete.");
 const riskIds=riskOwnershipRegistry.map((item)=>item.riskId).sort();if(JSON.stringify(riskIds)!==JSON.stringify([...expectedRiskIds].sort()))issues.push("Learner-risk ownership registry drifted.");if(riskOwnershipRegistry.some((row)=>String(row.ownerId)===String(row.reviewerId)))issues.push("Risk owner and reviewer roles must differ.");
 const lessonIds=new Set(academicLessonList.map((lesson)=>lesson.id));
 const claims=highRiskContextClaims;if(claims.length!==12||new Set(claims.map((claim)=>claim.id)).size!==claims.length)issues.push("High-risk context claim inventory must contain 12 unique rows.");
 for(const context of ["consular","travel","study","work","residence","legal-referral"])if(!claims.some((claim)=>claim.context===context))issues.push(`Missing high-risk context ${context}.`);
 for(const claim of claims){if(!lessonIds.has(claim.lessonId)||claim.officialClaimStatus!=="not-claimed"||claim.sourceRefs.length!==0||claim.reviewStatus!=="specialist-review-pending"||claim.ownerId===claim.reviewerId||claim.verificationInstructionAr.length<20)issues.push(`${claim.id}: unsafe or incomplete claim governance.`)}
 const interactivePairIds=new Set(academicLessonList.flatMap((lesson)=>getArticulationGuide(lesson).pairs.map((pair)=>pair.id)));
 const pronunciation=arabicLearnerPronunciationInventory;if(pronunciation.length!==18||new Set(pronunciation.map((item)=>item.id)).size!==pronunciation.length)issues.push("Arabic-learner pronunciation inventory must contain 18 unique rows.");
 for(const category of ["consonant","vowel","cluster","prosody"])if(!pronunciation.some((item)=>item.category===category))issues.push(`Missing pronunciation category ${category}.`);
 for(const item of pronunciation){if(!item.notUniversal||item.lessonIds.length<1||item.lessonIds.some((id)=>!lessonIds.has(id))||String(item.ownerId)===String(item.reviewerId)||item.reviewStatus!=="authored-review-pending"||!item.leftIpa.startsWith("[")||!item.rightIpa.startsWith("[")||(item.interactivePairId&&!interactivePairIds.has(item.interactivePairId)))issues.push(`${item.id}: incomplete pronunciation coverage or claim boundary.`)}
 const contentSha256=createHash("sha256").update(JSON.stringify({curriculumVersion:CURRENT_CURRICULUM_VERSION,contentRows,sources,risks:riskOwnershipRegistry,claims,pronunciation})).digest("hex");
 const familyCounts=Object.fromEntries(contentFamilyGovernance.map((family)=>[family.scope,contentRows.filter((row)=>row.scope===family.scope).length]));
 return{format:"dwnb-content-governance-audit",version:"content-governance-audit-v1",policyVersion:CONTENT_GOVERNANCE_POLICY,ok:issues.length===0,contentSha256,curriculum:{policyVersion:CURRICULUM_VERSION_POLICY,appVersion:CURRENT_APP_VERSION,curriculumVersion:CURRENT_CURRICULUM_VERSION,independent:String(CURRENT_APP_VERSION)!==String(CURRENT_CURRICULUM_VERSION)},counts:{contentRecords:contentRows.length,contentFamilies:contentFamilyGovernance.length,publishedFamilies:contentFamilyGovernance.filter((item)=>item.currentStage==="published").length,sources:sources.length,ownedRiskTypes:riskOwnershipRegistry.length,highRiskContextClaims:claims.length,pronunciationInventoryItems:pronunciation.length,pronunciationInteractivePairs:pronunciation.filter((item)=>item.interactivePairId).length,pronunciationDiagramCoverage:pronunciation.filter((item)=>item.diagramProfileId).length},familyCounts,contentRows,sources,risks:riskOwnershipRegistry,claims,pronunciation,reviewBoundaries:{content:"automated-validated-independent-review-pending",claims:"specialist-review-pending",pronunciation:"authored-review-pending"},issues};
}
