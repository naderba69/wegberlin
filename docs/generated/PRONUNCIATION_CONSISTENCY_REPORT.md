# Pronunciation Transcription Consistency Audit

Policy `ch-grapheme-ipa-consistency-v1`. Content SHA-256: `727db37c198766f16adf6ea793f600d59600baf7cd266a1e20ebd809d2d86233`

Boundary: grapheme-to-transcription-spot-check-no-acoustic-verification-of-tabulated-ipa

| Metric | Value |
| --- | --- |
| Lessons | 96 |
| Pronunciation items | 576 |
| Word-aligned items checked | 350 |
| Items skipped (placeholder ellipsis or token mismatch) | 226 |
| Issues | 0 |

The check applies the German rule to the transcribed text itself: after a front vowel (i, e, ä, ö, ü, ei, eu, äu) `ch` is [ç]; after a back vowel (a, o, u, au) it is [x]; after s/l/n/r it is [ç]; a diminutive `-chen` is not the `sch` digraph. It verifies spelling against the tabulated transcription only and does not listen to any audio.

## Issues

None.
