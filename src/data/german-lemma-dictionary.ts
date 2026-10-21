import { nounGrammarEntries } from "@/data/lexical-grammar-registry";
import { buildLemmaDictionary } from "@/core/german/lemmatizer";

/**
 * Irregular German forms for the curriculum lemmatizer (ADR-126, P2-401).
 * The forms are standard reference morphology (strong and mixed verb principal parts,
 * modal verbs, umlaut plurals, irregular comparatives); they are not copied from any
 * dictionary text. Regular inflection is handled by rules in `src/core/german/lemmatizer.ts`.
 */

/** infinitive · 3rd person singular present ("-" = regular) · preterite stem · Partizip II */
const STRONG_AND_MIXED_VERBS = `
befehlen befiehlt befahl befohlen
beginnen - begann begonnen
beißen - biss gebissen
bieten - bot geboten
binden - band gebunden
bitten - bat gebeten
bleiben - blieb geblieben
braten brät briet gebraten
brechen bricht brach gebrochen
brennen - brannte gebrannt
bringen - brachte gebracht
denken - dachte gedacht
dürfen darf durfte gedurft
empfehlen empfiehlt empfahl empfohlen
essen isst aß gegessen
fahren fährt fuhr gefahren
fallen fällt fiel gefallen
fangen fängt fing gefangen
finden - fand gefunden
fliegen - flog geflogen
fliehen - floh geflohen
fließen - floss geflossen
frieren - fror gefroren
geben gibt gab gegeben
gehen - ging gegangen
gelingen - gelang gelungen
gelten gilt galt gegolten
genießen - genoss genossen
geschehen geschieht geschah geschehen
gewinnen - gewann gewonnen
gießen - goss gegossen
gleichen - glich geglichen
graben gräbt grub gegraben
greifen - griff gegriffen
haben hat hatte gehabt
halten hält hielt gehalten
hängen - hing gehangen
heben - hob gehoben
heißen - hieß geheißen
helfen hilft half geholfen
kennen - kannte gekannt
klingen - klang geklungen
kommen - kam gekommen
können kann konnte gekonnt
laden lädt lud geladen
lassen lässt ließ gelassen
laufen läuft lief gelaufen
leiden - litt gelitten
leihen - lieh geliehen
lesen liest las gelesen
liegen - lag gelegen
lügen - log gelogen
meiden - mied gemieden
messen misst maß gemessen
mögen mag mochte gemocht
müssen muss musste gemusst
nehmen nimmt nahm genommen
nennen - nannte genannt
raten rät riet geraten
reißen - riss gerissen
reiten - ritt geritten
rennen - rannte gerannt
riechen - roch gerochen
rufen - rief gerufen
scheiden - schied geschieden
scheinen - schien geschienen
schieben - schob geschoben
schießen - schoss geschossen
schlafen schläft schlief geschlafen
schlagen schlägt schlug geschlagen
schließen - schloss geschlossen
schneiden - schnitt geschnitten
schreiben - schrieb geschrieben
schreien - schrie geschrien
schweigen - schwieg geschwiegen
schwimmen - schwamm geschwommen
sehen sieht sah gesehen
senden - sandte gesandt
singen - sang gesungen
sinken - sank gesunken
sitzen - saß gesessen
sollen - sollte gesollt
sprechen spricht sprach gesprochen
springen - sprang gesprungen
stehen - stand gestanden
stehlen stiehlt stahl gestohlen
steigen - stieg gestiegen
sterben stirbt starb gestorben
stoßen stößt stieß gestoßen
streichen - strich gestrichen
streiten - stritt gestritten
tragen trägt trug getragen
treffen trifft traf getroffen
treiben - trieb getrieben
treten tritt trat getreten
trinken - trank getrunken
tun - tat getan
vergessen vergisst vergaß vergessen
verlieren - verlor verloren
wachsen wächst wuchs gewachsen
waschen wäscht wusch gewaschen
weisen - wies gewiesen
wenden - wandte gewandt
werben wirbt warb geworben
werden wird wurde geworden
werfen wirft warf geworfen
wiegen - wog gewogen
wissen weiß wusste gewusst
wollen will wollte gewollt
ziehen - zog gezogen
zwingen - zwang gezwungen
`;

/** Forms the principal-part expansion cannot derive (sein, subjunctive II, 2nd person). */
const OTHER_VERB_FORMS: readonly (readonly [string, string])[] = [
  ["bin", "sein"], ["bist", "sein"], ["ist", "sein"], ["sind", "sein"], ["seid", "sein"], ["sei", "sein"], ["seien", "sein"],
  ["war", "sein"], ["warst", "sein"], ["waren", "sein"], ["wart", "sein"], ["gewesen", "sein"], ["wäre", "sein"], ["wären", "sein"], ["wärst", "sein"],
  ["hast", "haben"], ["habt", "haben"], ["hätte", "haben"], ["hätten", "haben"], ["hättest", "haben"],
  ["wirst", "werden"], ["würde", "werden"], ["würden", "werden"], ["würdest", "werden"],
  ["kannst", "können"], ["könnte", "können"], ["könnten", "können"], ["müsste", "müssen"], ["müssten", "müssen"], ["musst", "müssen"],
  ["darfst", "dürfen"], ["dürfte", "dürfen"], ["dürften", "dürfen"], ["möchte", "mögen"], ["möchten", "mögen"], ["möchtest", "mögen"], ["magst", "mögen"],
  ["willst", "wollen"], ["weißt", "wissen"], ["wüsste", "wissen"], ["gäbe", "geben"], ["käme", "kommen"], ["ginge", "gehen"], ["hielte", "halten"], ["ließe", "lassen"],
  ["isst", "essen"], ["liest", "lesen"], ["lässt", "lassen"], ["misst", "messen"], ["vergisst", "vergessen"],
];

/** Umlaut and irregular plurals not already in the lexical-grammar registry. */
const IRREGULAR_PLURALS = `
Bücher Buch · Häuser Haus · Männer Mann · Länder Land · Städte Stadt · Sätze Satz · Plätze Platz · Züge Zug
Ärzte Arzt · Väter Vater · Mütter Mutter · Brüder Bruder · Töchter Tochter · Söhne Sohn · Hände Hand · Wörter Wort
Gäste Gast · Räume Raum · Bäume Baum · Träume Traum · Stühle Stuhl · Nächte Nacht · Wände Wand · Höfe Hof
Äpfel Apfel · Gärten Garten · Läden Laden · Fächer Fach · Dächer Dach · Blätter Blatt · Fälle Fall · Gründe Grund
Pläne Plan · Anträge Antrag · Verträge Vertrag · Beiträge Beitrag · Vorschläge Vorschlag · Aufträge Auftrag
Unterkünfte Unterkunft · Zugänge Zugang · Abschlüsse Abschluss · Anschlüsse Anschluss · Ausflüge Ausflug · Flüge Flug
Kosten Kosten · Gespräche Gespräch · Geschäfte Geschäft · Getränke Getränk · Geräte Gerät · Töne Ton · Böden Boden
Wünsche Wunsch · Märkte Markt · Kämme Kamm · Schränke Schrank · Bänke Bank · Würste Wurst · Füße Fuß · Grüße Gruß · Köpfe Kopf
Hüte Hut · Stöcke Stock · Dörfer Dorf · Völker Volk · Gläser Glas · Räder Rad · Bäder Bad · Fächer Fach · Ämter Amt
Vorträge Vortrag · Eindrücke Eindruck · Ausdrücke Ausdruck · Rückgänge Rückgang · Vorgänge Vorgang · Übergänge Übergang
Umzüge Umzug · Anzüge Anzug · Auszüge Auszug · Bezüge Bezug · Verluste Verlust · Zuschüsse Zuschuss · Ausschüsse Ausschuss
Museen Museum · Zentren Zentrum · Themen Thema · Firmen Firma · Daten Datum · Praktika Praktikum · Studien Studium
`;

/** Irregular comparison; regular -er/-ste endings are handled by rules. */
const IRREGULAR_COMPARISON = `
größer groß · größte groß · älter alt · älteste alt · jünger jung · jüngste jung · länger lang · längste lang
kürzer kurz · kürzeste kurz · wärmer warm · kälter kalt · stärker stark · schwächer schwach · höher hoch · höchste hoch
näher nah · nächste nah · besser gut · beste gut · meiste viel · lieber gern · liebste gern · ärmer arm · härter hart
öfter oft · klüger klug · gesünder gesund · schärfer scharf · gröbere grob · dümmer dumm · krümmer krumm
`;

function principalPartForms(): [string, string][] {
  const rows: [string, string][] = [];
  for (const line of STRONG_AND_MIXED_VERBS.trim().split("\n")) {
    const [infinitive, present, preterite, participle] = line.trim().split(/\s+/);
    if (!infinitive || !present || !preterite || !participle) throw new Error(`Bad verb row: ${line}`);
    if (present !== "-") {
      rows.push([present, infinitive]);
      // 2nd person singular: gibt → gibst, hält → hältst, weiß → weißt, kann → kannst; isst/liest are already both.
      if (present.endsWith("st")) { /* same form */ }
      else if (present.endsWith("t")) rows.push([`${present.slice(0, -1)}st`, infinitive], [`${present}st`, infinitive]);
      else if (/[sß]$/.test(present)) rows.push([`${present}t`, infinitive]);
      else rows.push([`${present}st`, infinitive]);
    }
    rows.push([preterite, infinitive], [participle, infinitive]);
    if (preterite.endsWith("e")) rows.push([`${preterite}n`, infinitive], [`${preterite}st`, infinitive], [`${preterite}t`, infinitive]);
    else rows.push([`${preterite}en`, infinitive], [`${preterite}st`, infinitive], [`${preterite}t`, infinitive]);
  }
  return rows;
}

function pairs(block: string): [string, string][] {
  return block.split(/·|\n/).map((pair) => pair.trim()).filter(Boolean).map((pair) => {
    const [form, lemma] = pair.split(/\s+/);
    if (!form || !lemma) throw new Error(`Bad lemma pair: ${pair}`);
    return [form, lemma];
  });
}

/** Registry plurals: the last hyphen part only (E-Mail-Adressen → Adresse). */
function registryPlurals(): [string, string][] {
  return nounGrammarEntries
    .filter((entry) => entry.plural.form && !entry.plural.form.includes(" "))
    .map((entry) => [entry.plural.form!.split("-").pop()!, entry.lemma.split("-").pop()!]);
}

export const germanLemmaEntries: readonly (readonly [string, string])[] = [
  ...principalPartForms(),
  ...OTHER_VERB_FORMS,
  ...pairs(IRREGULAR_PLURALS),
  ...pairs(IRREGULAR_COMPARISON),
  ...registryPlurals(),
];

export const germanLemmaDictionary = buildLemmaDictionary(germanLemmaEntries);
export const GERMAN_LEMMA_DICTIONARY_COUNTS = {
  verbs: STRONG_AND_MIXED_VERBS.trim().split("\n").length,
  otherVerbForms: OTHER_VERB_FORMS.length,
  irregularPlurals: pairs(IRREGULAR_PLURALS).length,
  irregularComparison: pairs(IRREGULAR_COMPARISON).length,
} as const;
