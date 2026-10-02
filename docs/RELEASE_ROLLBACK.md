# Release tags, changelog, and rollback

Policy: `tagged-release-changelog-rollback-v1`.

Only immutable semantic tags `vMAJOR.MINOR.PATCH` create a GitHub Release. The workflow runs history-secret audit and the full quality gate, generates commit-derived notes, and records the previous tag.

Rollback means redeploying the previous immutable tag through the hosting dashboard, then running Deployment Smoke against its exact HTTPS URL. Never move/delete the bad tag, force-push `main`, rewrite history, or import an older DWNB over learner data. Offline users retain the previous complete cache via the separate atomic pack rollback. A remote tag/release/rollback is not claimed until its GitHub run and deployment are observed.
