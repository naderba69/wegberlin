import{CURRENT_APP_VERSION,CURRENT_CURRICULUM_VERSION}from"@/config/curriculum-version";
export const MIGRATION_MATRIX_POLICY_VERSION="supported-pairwise-migration-matrix-v1"as const;
export const supportedMigrationMatrix=[
 {archiveFormat:1,stateSchema:1,targetSchema:3,encrypted:false},{archiveFormat:1,stateSchema:2,targetSchema:3,encrypted:false},{archiveFormat:1,stateSchema:3,targetSchema:3,encrypted:false},
 {archiveFormat:2,stateSchema:1,targetSchema:3,encrypted:false},{archiveFormat:2,stateSchema:2,targetSchema:3,encrypted:false},{archiveFormat:2,stateSchema:3,targetSchema:3,encrypted:false},
 {archiveFormat:3,stateSchema:3,targetSchema:3,encrypted:true},
]as const;
export const migrationMatrixMetadata={policyVersion:MIGRATION_MATRIX_POLICY_VERSION,currentAppVersion:CURRENT_APP_VERSION,currentCurriculumVersion:CURRENT_CURRICULUM_VERSION,supportedStateSchemas:[1,2,3],supportedArchiveFormats:[1,2,3],pairCount:supportedMigrationMatrix.length,boundary:"all-supported-archive-state-pairs-current-encrypted-format-never-claims-legacy-encrypted-schema"as const};
