export const CURRICULUM_PACK_DIFF_POLICY="pre-update-curriculum-pack-diff-v2"as const;
export const CURRICULUM_PACK_DIFF_BOUNDARY="manifest-metadata-only-no-semantic-content-diff-progress-mutation-or-automatic-install"as const;
export type PackSnapshot={curriculumVersion?:string;buildFingerprint?:string;packId?:string;routeCount?:number;includesAudio?:boolean};

export function compareCurriculumPacks(installed:PackSnapshot|null,candidate:Required<PackSnapshot>){
 if(!installed?.buildFingerprint)return{policyVersion:CURRICULUM_PACK_DIFF_POLICY,status:"first-install"as const,versionChanged:false,buildChanged:false,scopeChanged:false,routeDelta:candidate.routeCount,summaryAr:"لا توجد حزمة مكتملة مثبتة؛ ستكون هذه أول عملية تثبيت.",evidenceBoundary:CURRICULUM_PACK_DIFF_BOUNDARY};
 const unknownInstalledCurriculum=!installed.curriculumVersion;
 const versionChanged=unknownInstalledCurriculum||installed.curriculumVersion!==candidate.curriculumVersion;
 const buildChanged=installed.buildFingerprint!==candidate.buildFingerprint;
 const scopeChanged=Boolean(installed.packId&&installed.packId!==candidate.packId);
 const routeDelta=candidate.routeCount-(installed.routeCount??0);
 const status=unknownInstalledCurriculum?"unknown-installed-curriculum"as const:versionChanged?"curriculum-update"as const:scopeChanged?"scope-change"as const:buildChanged?"build-update"as const:"same-build"as const;
 const summaryAr=unknownInstalledCurriculum?"نسخة المنهج في الحزمة القديمة غير مسجلة؛ تعامل معها كتحديث منهج وراجع النطاق قبل الاستبدال.":versionChanged?"نسخة المنهج ستتغير؛ راجع النطاق وعدد المسارات قبل التثبيت.":scopeChanged?"أنت تغيّر نطاق الحزمة، لا تقدمك المحفوظ.":buildChanged?"هذه بنية تطبيق أحدث ضمن نسخة المنهج نفسها.":"الحزمة المرشحة مطابقة للبنية المثبتة.";
 return{policyVersion:CURRICULUM_PACK_DIFF_POLICY,status,versionChanged,buildChanged,scopeChanged,routeDelta,summaryAr,evidenceBoundary:CURRICULUM_PACK_DIFF_BOUNDARY};
}
