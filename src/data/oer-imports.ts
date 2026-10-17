import { importOerReferences, type OerReferenceImportRequest } from "@/core/oer/importer";
import { OER_REGISTER } from "./oer-register";

// P2-357 bounded import (ADR-119): Grimm Grammar topic pages linked from the bilingual grammar glossary.
// Titles are copied from the official site index (https://coerll.utexas.edu/gg/gr/index.html, fetched 2026-10-17).
// Mapping decision by the agent under the owner's explicit delegation; Nominalisierung, Partizipialattribut and
// Funktionsverbgefüge have no matching Grimm Grammar page and are deliberately left without a link.
const pages = [
  { topicId: "artikel", page: "det_01", title: "articles • Bestimmte und Unbestimmte Artikel" },
  { topicId: "nomen", page: "no_01", title: "nouns overview • Substantive" },
  { topicId: "verb", page: "v_01", title: "verbs overview • Verben - Überblick" },
  { topicId: "subjekt", page: "cas_02", title: "nominative case • Der Nominativ" },
  { topicId: "praedikat", page: "con_06", title: "word order • Wortstellung" },
  { topicId: "fragewort", page: "con_05", title: "interrogatives • Fragen" },
  { topicId: "akkusativ", page: "cas_03", title: "accusative case • Der Akkusativ" },
  { topicId: "dativ", page: "cas_07", title: "dative • Der Dativ" },
  { topicId: "modalverb", page: "vm_01", title: "modal verbs - present tense • Modalverben" },
  { topicId: "trennbares-verb", page: "v_04", title: "separable prefix verbs • Präsens - Trennbare Verben" },
  { topicId: "perfekt", page: "vcp_01", title: "conversational past • Das Perfekt - Einführung" },
  { topicId: "nebensatz", page: "con_04", title: "subordinating conjunctions • Subordinierende Konjunktionen" },
  { topicId: "relativsatz", page: "pro_05", title: "relative pronouns • Relativpronomen" },
  { topicId: "passiv", page: "vpass_01", title: "passive voice present tense • Das Passiv im Präsens" },
  { topicId: "konjunktiv-zwei", page: "vsub_02", title: "present subjunctive • Konjunktiv II im Präsens" },
  { topicId: "praeteritum", page: "vsp_01", title: "simple past regular verbs • Das Imperfekt - Regelmäßige Verben" },
  { topicId: "genitiv", page: "cas_08", title: "genitive • Der Genitiv" },
  { topicId: "infinitiv-mit-zu", page: "vinf_01", title: "infinitive constructions • Der Infinitivsatz" },
  { topicId: "indirekte-rede", page: "vsub_04", title: "reported speech • Konjunktiv I" },
  { topicId: "konnektor", page: "con_01", title: "conjunctions overview • Konjunktionen" },
  { topicId: "satzklammer", page: "con_06", title: "word order • Wortstellung" },
] as const;

const review = {
  decidedBy: "source-verified-agent",
  decidedOn: "2026-10-17",
  evidence: "Licence CC BY 4.0 read from the Grimm Grammar footer badge; URL and title taken from the official site index; topic match checked against the glossary definition (spot-checked pages: con_06, vsub_04).",
} as const;

export const OER_IMPORT_REQUESTS: OerReferenceImportRequest[] = pages.map((page) => ({
  itemId: `gg-${page.page}-${page.topicId}`,
  candidateId: "OER-02",
  topicId: page.topicId,
  title: page.title,
  url: `https://coerll.utexas.edu/gg/gr/${page.page}.html`,
  language: "en",
  review,
}));

/** Throws at build time if any request fails the licence gate or the attribution rules. */
export const importedOerReferences = importOerReferences(OER_REGISTER, OER_IMPORT_REQUESTS);
export const OER_GRIMM_GRAMMAR_ATTRIBUTION = importedOerReferences[0].attributionLine;
