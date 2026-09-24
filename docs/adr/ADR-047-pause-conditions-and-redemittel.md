# ADR-047 — Local pause estimates, learner-attributed conditions, and central Redemittel

Accepted 2026-09-08. Closes P1-140/152/162/163.

`local-rms-pause-estimate-v1` samples microphone energy every 100 ms during the main Speaking recording. It estimates voiced-energy time, silence time, pauses of at least 300 ms, and longest pause. It performs no STT, phoneme recognition, word recognition, pronunciation score, or fluency score. Silence may be planning or noise and is displayed descriptively only.

`learner-attributed-language-vs-device-v1` lets the learner attribute difficulty to language, audio/device, both, or unclear, with explicit language/planning and device/environment factors. The app does not infer the category.

A SpeakingAttempt now keeps preparation time, total duration, optional pause metrics, and optional learner attribution together under strict Zod. DWNB and merge preserve the record.

`central-redemittel-function-register-v1` exposes the existing 32 authored register examples as one browsable Speaking bank filtered by A1–B2, eight communicative functions, and formal/neutral/colloquial/professional register. Viewing a phrase creates no evidence or mastery.

The existing study-modes prebuild audit now verifies 32 entries, eight functions, four registers, 16 prosody steps, and the prior reading/listening boundaries. Automated RMS estimates require final physical-device review and are not acoustic validation.
