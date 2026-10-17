import type { OerCandidate } from "@/core/oer/import-policy";

// P2-357 — machine-readable copy of docs/OER_LICENSE_REGISTER.md. Licences are read from each source's own page.
// 2026-10-17 (ADR-119): Grimm Grammar and Deutsch im Blick show a CC BY 4.0 badge linking to
// creativecommons.org/licenses/by/4.0 on their own pages (home, credits, site index, topic pages), which settles
// the version that was unverified on 2026-10-08. G-FOL's own pages show no version and quote DWDS example
// sentences (third-party rights), so it stays rejected.
const CC_BY_4 = "https://creativecommons.org/licenses/by/4.0/";

export const OER_REGISTER: OerCandidate[] = [
  { id: "OER-01", sourceName: "COERLL / UT Austin", sourceUrl: "https://frames.coerll.utexas.edu/", licenseIds: ["CC-BY"], checkedOn: "2026-10-17",
    attribution: { authors: "Hans Boas", title: "German Frame-semantic Online Lexicon (G-FOL)", licenseUrl: "https://coerll.utexas.edu/coerll/materials/license/cc-by/" }, shareAlikeAccepted: false },
  { id: "OER-02", sourceName: "COERLL / The University of Texas at Austin", sourceUrl: "https://coerll.utexas.edu/gg/", licenseIds: ["CC-BY-4.0"], checkedOn: "2026-10-17",
    attribution: { authors: "Zsuzsanna Abrams", title: "Grimm Grammar", licenseUrl: CC_BY_4 }, shareAlikeAccepted: false },
  { id: "OER-03", sourceName: "COERLL / The University of Texas at Austin", sourceUrl: "https://coerll.utexas.edu/dib/", licenseIds: ["CC-BY-4.0"], checkedOn: "2026-10-17",
    attribution: { authors: "Zsuzsanna Abrams", title: "Deutsch im Blick", licenseUrl: CC_BY_4 }, shareAlikeAccepted: false },
  { id: "OER-04", sourceName: "Wiktionary", sourceUrl: "https://en.wiktionary.org/wiki/Wiktionary:Copyrights", licenseIds: ["CC-BY-SA-4.0", "GFDL-1.1"], checkedOn: "2026-10-08",
    attribution: { authors: "Wiktionary contributors", title: "Wiktionary entries", licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0/" }, shareAlikeAccepted: false },
  { id: "OER-05", sourceName: "OER Commons listing", sourceUrl: "https://oercommons.org/browse?f.keyword=german-language", licenseIds: ["CC-BY-NC-SA"], checkedOn: "2026-10-08",
    attribution: { authors: "unknown", title: "Grenzenlos Deutsch", licenseUrl: "https://creativecommons.org/licenses/by-nc-sa/4.0/" }, shareAlikeAccepted: false },
  { id: "OER-06", sourceName: "NKU LibGuide listing", sourceUrl: "https://nku.libguides.com/c.php?g=1241432&p=10871937", licenseIds: ["CC-BY"], checkedOn: "2026-10-08",
    attribution: { authors: "Rebecca Linem", title: "German 101 / German 102", licenseUrl: "https://creativecommons.org/licenses/" }, shareAlikeAccepted: false },
  { id: "OER-07", sourceName: "OER Commons listing", sourceUrl: "https://oercommons.org/browse?f.keyword=german", licenseIds: ["CC-BY-NC-SA"], checkedOn: "2026-10-08",
    attribution: { authors: "Crandall et al.", title: "Let's Chat German", licenseUrl: "https://creativecommons.org/licenses/by-nc-sa/4.0/" }, shareAlikeAccepted: false },
  { id: "OER-08", sourceName: "OER Commons listing", sourceUrl: "https://oercommons.org/browse?f.keyword=german", licenseIds: ["CC-BY-SA"], checkedOn: "2026-10-08",
    attribution: { authors: "", title: "Kennlernenphrasen auf Deutsch", licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0/" }, shareAlikeAccepted: false },
];
