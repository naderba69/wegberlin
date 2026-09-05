/**
 * P0-99: قاموس تكافؤ فعل + حرف جر + حالة (Valenzwörterbuch) لمستويات A1–B2.
 *
 * كل مدخل يمثل **فعلًا ذا متمم جرّي واحد**: الفعل، حرف الجر، الحالة التي يفرضها،
 * Chunk جاهز للحفظ، معنى عربي، مثال ألماني، ومقارنة عربية تشرح الفرق أو الفخ.
 * الحقول الثلاثة الأخيرة هي أشكال البحث التي يستخدمها جرد التغطية لا محتوى تعليمي.
 *
 * القاموس ليس قائمة نظرية لكل الألمانية: هو قائمة الأزواج التي يستهدفها منهج هذا
 * المشروع. الجرد (`src/data/verb-preposition-coverage.ts`) يحسب أي مدخل يظهر فعليًا
 * في محتوى كل درس، والمدقق يطالب بتغطية كل مدخل مقاس بهذا الشكل.
 */
import { a1VerbPrepositionFrames } from "./lexical-grammar-a1";
import { a2VerbPrepositionFrames } from "./lexical-grammar-a2";
import { b1VerbPrepositionFrames } from "./lexical-grammar-b1";
import { b2VerbPrepositionFrames } from "./lexical-grammar-b2";
import type { GovernedCase } from "@/types/lexical-grammar";

/**
 * [infinitive, preposition, governedCase, chunkDe, meaningAr, exampleDe, contrastAr, stemForms, separablePrefix?]
 * stemForms: صيغ تصريفية تُطابق بحدود كلمات (حساسة للحالة لا للإعراب).
 * separablePrefix: للفعل المنفصل؛ يجب أن يظهر حرف الجر/البادئة أيضًا في الدرس حتى يُعدّ الفعل هدفًا.
 */
export type ValencySeed = readonly [
  infinitive: string,
  preposition: string,
  governedCase: GovernedCase,
  chunkDe: string,
  meaningAr: string,
  exampleDe: string,
  contrastAr: string,
  stemForms: string,
  separablePrefix?: string,
  requireToken?: string,
  measured?: boolean,
];

export type ValencyEntry = {
  id: string;
  infinitive: string;
  preposition: string;
  governedCase: GovernedCase;
  chunkDe: string;
  meaningAr: string;
  exampleDe: string;
  contrastAr: string;
  searchForms: string[];
  separablePrefix: string | null;
  /** كلمة يجب أن تظهر مع الفعل في الجملة نفسها (مثل krank مع krankmelden). */
  requireToken: string | null;
  /** هل يُقاس هذا المدخل في جرد التغطية؟ المتممات الظرفية/الزمنية تُصرَّح ولا تُقاس. */
  measured: boolean;
  /** مصدر المدخل: بذرة مؤلفة في القاموس، أم إطار مؤلف في درس أُدرج في القاموس. */
  dictionaryOrigin: "seed" | "authored-frame";
};

const seeds: readonly ValencySeed[] = [
  // ——— حروف الجر مع Akkusativ ———
  ["bitten", "um", "accusative", "um Wiederholung bitten", "يطلب الإعادة", "Ich bitte um eine Wiederholung.", "bitten um يأخذ Akkusativ: um eine Wiederholung، لا um einer.", "bitte|bittest|bittet|bitten|bat|gebeten"],
  ["warten", "auf", "accusative", "auf die Antwort warten", "ينتظر الجواب", "Wir warten auf die Antwort.", "warten auf يطلب Akkusativ دائمًا: auf die Antwort.", "warte|wartest|wartet|warten|wartete|gewartet"],
  ["sich freuen", "auf", "accusative", "sich auf das Wochenende freuen", "يتطلع إلى (شيء قادم)", "Ich freue mich auf das Wochenende.", "auf لشيء قادم، وüber لشيء حدث: فرّق بينهما بالزمن لا بالحفظ.", "freue|freust|freut|freuen|freute|gefreut", "mich"],
  ["sich freuen", "über", "accusative", "sich über das Geschenk freuen", "يفرح بـ (شيء حدث)", "Sie freut sich über das Geschenk.", "über لشيء وقع، وauf لشيء منتظر.", "freue|freust|freut|freuen|freute|gefreut", "mich"],
  ["sprechen", "über", "accusative", "über das Wetter sprechen", "يتحدث عن", "Wir sprechen über das Wetter.", "über بمعنى «حول موضوع» تأخذ Akkusativ.", "spreche|sprichst|spricht|sprechen|sprach|gesprochen"],
  ["diskutieren", "über", "accusative", "über den Vorschlag diskutieren", "يناقش", "Das Team diskutiert über den Vorschlag.", "diskutieren über تأخذ Akkusativ، أما mit فيتبعها Dativ للشريك.", "diskutiere|diskutierst|diskutiert|diskutieren|diskutierte|diskutiert"],
  ["berichten", "über", "accusative", "über das Ergebnis berichten", "يُبلّغ / يكتب تقريرًا عن", "Sie berichtet über das Ergebnis.", "berichten über Akkusativ للموضوع، وvon Dativ للمصدر.", "berichte|berichtest|berichtet|berichten|berichtete|berichtet"],
  ["sich beschweren", "über", "accusative", "sich über den Lärm beschweren", "يشتكي من", "Wir beschweren uns über den Lärm.", "über للسبب (Akkusativ)، وbei للجهة (Dativ).", "beschwere|beschwerst|beschwert|beschweren|beschwerte|beschwert", "mich"],
  ["sich ärgern", "über", "accusative", "sich über die Verspätung ärgern", "ينزعج من", "Er ärgert sich über die Verspätung.", "السبب بعد über يبقى Akkusativ.", "ärgere|ärgerst|ärgert|ärgern|ärgerte|geärgert", "mich"],
  ["sich wundern", "über", "accusative", "sich über die Frage wundern", "يتعجب من", "Ich wundere mich über die Frage.", "wundern über تأخذ Akkusativ، لا Dativ.", "wundere|wunderst|wundert|wundern|wunderte|gewundert", "mich"],
  ["lachen", "über", "accusative", "über den Witz lachen", "يضحك على", "Alle lachen über den Witz.", "lachen über تأخذ Akkusativ.", "lache|lachst|lacht|lachen|lachte|gelacht"],
  ["sich informieren", "über", "accusative", "sich über die Fristen informieren", "يستعلم عن", "Ich informiere mich über die Fristen.", "informieren über (Akkusativ) للموضوع، وbei (Dativ) للجهة.", "informiere|informierst|informiert|informieren|informierte|informiert", "mich"],
  ["informieren", "über", "accusative", "über die Änderung informieren", "يُعلم بـ", "Wir informieren über die Änderung.", "المفعول الأول شخص، والموضوع بعد über يبقى Akkusativ.", "informiere|informierst|informiert|informieren|informierte|informiert"],
  ["sich unterhalten", "über", "accusative", "sich über den Plan unterhalten", "يتحادث عن", "Wir unterhalten uns über den Plan.", "über للموضوع، وmit للشريك.", "unterhalte|unterhältst|unterhält|unterhalten|unterhielt|unterhalten", "mich"],
  ["verhandeln", "über", "accusative", "über den Preis verhandeln", "يتفاوض على", "Sie verhandeln über den Preis.", "verhandeln über (Akkusativ) للموضوع، وmit (Dativ) للطرف الآخر.", "verhandle|verhandelst|verhandelt|verhandeln|verhandelte|verhandelt"],
  ["streiten", "über", "accusative", "über die Lösung streiten", "يتشاجر/يختلف على", "Sie streiten über die Lösung.", "streiten über Akkusativ للموضوع، وum للهدف، وmit للخصم.", "streite|streitest|streitet|streiten|stritt|gestritten"],
  ["streiten", "um", "accusative", "um einen Platz streiten", "يتنازع على", "Die Kinder streiten um einen Platz.", "um تحدد الشيء المتنازع عليه وهي Akkusativ.", "streite|streitest|streitet|streiten|stritt|gestritten"],
  ["sich verlassen", "auf", "accusative", "sich auf die Zusage verlassen", "يعتمد على", "Ich verlasse mich auf die Zusage.", "استثناء شائع: verlassen auf تأخذ Akkusativ، بخلاف beruhen auf وbasieren auf.", "verlasse|verlässt|verlässt|verlassen|verließ|verlassen", "mich"],
  ["sich konzentrieren", "auf", "accusative", "sich auf eine Aufgabe konzentrieren", "يركّز على", "Ich konzentriere mich auf eine Aufgabe.", "konzentrieren auf تأخذ Akkusativ.", "konzentriere|konzentrierst|konzentriert|konzentrieren|konzentrierte|konzentriert", "mich"],
  ["sich vorbereiten", "auf", "accusative", "sich auf die Prüfung vorbereiten", "يستعد لـ", "Wir bereiten uns auf die Prüfung vor.", "vorbereiten auf تأخذ Akkusativ.", "bereite|bereitest|bereitet|bereiten|bereitete|bereitet", "vor"],
  ["achten", "auf", "accusative", "auf die Details achten", "ينتبه إلى", "Achte auf die Details!", "achten auf تأخذ Akkusativ، لا Dativ.", "achte|achtest|achtet|achten|achtete|geachtet"],
  ["aufpassen", "auf", "accusative", "auf die Kinder aufpassen", "يرعى / ينتبه لـ", "Sie passt auf die Kinder auf.", "aufpassen auf تأخذ Akkusativ.", "passe|passt|passen|passte|gepasst", "auf"],
  ["antworten", "auf", "accusative", "auf die E-Mail antworten", "يرد على", "Ich antworte auf die E-Mail.", "antworten auf تأخذ Akkusativ: auf die E-Mail.", "antworte|antwortest|antwortet|antworten|antwortete|geantwortet"],
  ["reagieren", "auf", "accusative", "auf die Nachricht reagieren", "يتفاعل مع", "Er reagiert auf die Nachricht.", "reagieren auf تأخذ Akkusativ.", "reagiere|reagierst|reagiert|reagieren|reagierte|reagiert"],
  ["hoffen", "auf", "accusative", "auf eine Chance hoffen", "يأمل في", "Wir hoffen auf eine Chance.", "hoffen auf تأخذ Akkusativ.", "hoffe|hoffst|hofft|hoffen|hoffte|gehofft"],
  ["verzichten", "auf", "accusative", "auf das Auto verzichten", "يتنازل عن", "Ich verzichte auf das Auto.", "verzichten auf تأخذ Akkusativ.", "verzichte|verzichtest|verzichtet|verzichten|verzichtete|verzichtet"],
  ["hinweisen", "auf", "accusative", "auf den Fehler hinweisen", "ينبّه إلى", "Sie weist auf den Fehler hin.", "hinweisen auf Akkusativ، والبادئة منفصلة.", "weise|weist|weisen|wies|gewiesen", "hin"],
  ["sich einigen", "auf", "accusative", "sich auf einen Termin einigen", "يتفق على", "Wir einigen uns auf einen Termin.", "auf للنتيجة (Akkusativ)، وmit للشركاء (Dativ).", "einige|einigst|einigt|einigen|einigte|geeinigt", "mich"],
  ["sich einstellen", "auf", "accusative", "sich auf die Änderung einstellen", "يتأقلم مع", "Wir stellen uns auf die Änderung ein.", "einstellen auf تأخذ Akkusativ.", "stelle|stellst|stellt|stellen|stellte|gestellt", "ein"],
  ["sich bewerben", "um", "accusative", "sich um die Stelle bewerben", "يتقدّم لـ (وظيفة)", "Ich bewerbe mich um die Stelle.", "um للهدف (Akkusativ)، وbei للجهة (Dativ).", "bewerbe|bewirbst|bewirbt|bewerben|bewarb|beworben", "mich"],
  ["sich kümmern", "um", "accusative", "sich um die Gäste kümmern", "يهتم بـ", "Er kümmert sich um die Gäste.", "kümmern um تأخذ Akkusativ.", "kümmere|kümmerst|kümmert|kümmern|kümmerte|gekümmert", "mich"],
  ["sich sorgen", "um", "accusative", "sich um die Noten sorgen", "يقلق على", "Sie sorgt sich um die Noten.", "um للشيء المقلِق (Akkusativ)، وfür لمن نرعاه.", "sorge|sorgst|sorgt|sorgen|sorgte|gesorgt", "mich"],
  ["sich bemühen", "um", "accusative", "sich um einen Platz bemühen", "يسعى لـ", "Ich bemühe mich um einen Platz.", "bemühen um تأخذ Akkusativ.", "bemühe|bemühst|bemüht|bemühen|bemühte|bemüht", "mich"],
  ["sich handeln", "um", "accusative", "es handelt sich um ein Problem", "الأمر يتعلق بـ", "Es handelt sich um ein Problem.", "es handelt sich um ثابتة وتأخذ Akkusativ.", "handelt|handeln|handelte|gehandelt", "mich"],
  ["gehen", "um", "accusative", "es geht um die Frist", "الأمر يتعلق بـ", "Es geht um die Frist.", "es geht um تأخذ Akkusativ دائمًا.", "geht|gehen|ging|gegangen"],
  ["sich interessieren", "für", "accusative", "sich für Geschichte interessieren", "يهتم بـ", "Ich interessiere mich für Geschichte.", "interessieren für تأخذ Akkusativ.", "interessiere|interessierst|interessiert|interessieren|interessierte|interessiert", "mich"],
  ["sich entscheiden", "für", "accusative", "sich für den Kurs entscheiden", "يختار", "Ich entscheide mich für den Kurs.", "für للاختيار، وgegen للرفض، وكلتاهما Akkusativ.", "entscheide|entscheidest|entscheidet|entscheiden|entschied|entschieden", "mich"],
  ["sich entscheiden", "gegen", "accusative", "sich gegen den Vorschlag entscheiden", "يقرر ضد", "Wir entscheiden uns gegen den Vorschlag.", "gegen تحدد المرفوض وهي Akkusativ.", "entscheide|entscheidest|entscheidet|entscheiden|entschied|entschieden", "mich"],
  ["sich einsetzen", "für", "accusative", "sich für die Kollegin einsetzen", "يدافع عن / يساند", "Er setzt sich für die Kollegin ein.", "einsetzen für تأخذ Akkusativ.", "setze|setzt|setzen|setzte|gesetzt", "ein"],
  ["sorgen", "für", "accusative", "für Ordnung sorgen", "يهيّئ / يوفّر", "Wir sorgen für Ordnung.", "sorgen für Akkusativ لمن نرعاه، وsich sorgen um للقلق.", "sorge|sorgst|sorgt|sorgen|sorgte|gesorgt"],
  ["kämpfen", "für", "accusative", "für eine Lösung kämpfen", "يناضل من أجل", "Sie kämpfen für eine Lösung.", "für للهدف، وgegen للخصم، وكلتاهما Akkusativ.", "kämpfe|kämpfst|kämpft|kämpfen|kämpfte|gekämpft"],
  ["kämpfen", "gegen", "accusative", "gegen Vorurteile kämpfen", "يكافح ضد", "Sie kämpfen gegen Vorurteile.", "gegen تأخذ Akkusativ.", "kämpfe|kämpfst|kämpft|kämpfen|kämpfte|gekämpft"],
  ["stimmen", "für", "accusative", "für den Vorschlag stimmen", "يصوّت لصالح", "Wir stimmen für den Vorschlag.", "stimmen für/gegen تأخذ Akkusativ.", "stimme|stimmst|stimmt|stimmen|stimmte|gestimmt"],
  ["stimmen", "gegen", "accusative", "gegen den Plan stimmen", "يصوّت ضد", "Sie stimmen gegen den Plan.", "gegen تأخذ Akkusativ.", "stimme|stimmst|stimmt|stimmen|stimmte|gestimmt"],
  ["protestieren", "gegen", "accusative", "gegen die Kürzung protestieren", "يحتج على", "Sie protestieren gegen die Kürzung.", "protestieren gegen تأخذ Akkusativ.", "protestiere|protestierst|protestiert|protestieren|protestierte|protestiert"],
  ["sich wehren", "gegen", "accusative", "sich gegen die Entscheidung wehren", "يقاوم / يعترض على", "Wir wehren uns gegen die Entscheidung.", "wehren gegen تأخذ Akkusativ.", "wehre|wehrst|wehrt|wehren|wehrte|gewehrt", "mich"],
  ["verstoßen", "gegen", "accusative", "gegen die Regel verstoßen", "يخالف", "Wer gegen die Regel verstoßt, zahlt.", "verstoßen gegen تأخذ Akkusativ.", "verstoße|verstößt|verstoßen|verstieß|verstoßen"],
  ["sich entschuldigen", "für", "accusative", "sich für die Verspätung entschuldigen", "يعتذر عن", "Ich entschuldige mich für die Verspätung.", "für للسبب (Akkusativ)، وbei للشخص (Dativ).", "entschuldige|entschuldigst|entschuldigt|entschuldigen|entschuldigte|entschuldigt", "mich"],
  ["sich bedanken", "für", "accusative", "sich für die Hilfe bedanken", "يشكر على", "Ich bedanke mich für die Hilfe.", "für للشيء (Akkusativ)، وbei للشخص (Dativ).", "bedanke|bedankst|bedankt|bedanken|bedankte|bedankt", "mich"],
  ["ausgeben", "für", "accusative", "Geld für Bücher ausgeben", "ينفق على", "Sie gibt Geld für Bücher aus.", "ausgeben für تأخذ Akkusativ.", "gebe|gibst|gibt|geben|gab|gegeben", "aus"],
  ["sich eignen", "für", "accusative", "sich für den Zweck eignen", "يصلح لـ", "Das eignet sich für den Zweck.", "eignen für تأخذ Akkusativ.", "eigne|eignest|eignet|eignen|eignete|geeignet", "mich"],
  ["verfügen", "über", "accusative", "über Erfahrung verfügen", "يتوفر على / يملك", "Sie verfügt über Erfahrung.", "استثناء مهم: verfügen über تأخذ Akkusativ، لا Dativ.", "verfüge|verfügst|verfügt|verfügen|verfügte|verfügt"],
  ["denken", "an", "accusative", "an die Prüfung denken", "يفكّر في", "Ich denke an die Prüfung.", "denken an تأخذ Akkusativ.", "denke|denkst|denkt|denken|dachte|gedacht"],
  ["sich erinnern", "an", "accusative", "sich an den Termin erinnern", "يتذكّر", "Erinnern Sie sich an den Termin?", "erinnern an تأخذ Akkusativ.", "erinnere|erinnerst|erinnert|erinnern|erinnerte|erinnert", "mich"],
  ["glauben", "an", "accusative", "an den Erfolg glauben", "يؤمن بـ", "Wir glauben an den Erfolg.", "glauben an (الإيمان) تأخذ Akkusativ، وglauben + Dativ معنى تصديق شخص.", "glaube|glaubst|glaubt|glauben|glaubte|geglaubt"],
  ["sich gewöhnen", "an", "accusative", "sich an den Rhythmus gewöhnen", "يتعوّد على", "Ich gewöhne mich an den Rhythmus.", "gewöhnen an تأخذ Akkusativ.", "gewöhne|gewöhnst|gewöhnt|gewöhnen|gewöhnte|gewöhnt", "mich"],
  ["sich wenden", "an", "accusative", "sich an das Amt wenden", "يلجأ إلى", "Wenden Sie sich an das Amt.", "wenden an تأخذ Akkusativ.", "wende|wendest|wendet|wenden|wandte|gewandt", "mich"],
  ["grenzen", "an", "accusative", "an den Park grenzen", "يحاذي", "Das Haus grenzt an den Park.", "grenzen an تأخذ Akkusativ.", "grenze|grenzt|grenzen|grenzte|gegrenzt"],
  ["appellieren", "an", "accusative", "an die Vernunft appellieren", "يناشد", "Sie appelliert an die Vernunft.", "appellieren an تأخذ Akkusativ.", "appelliere|appellierst|appelliert|appellieren|appellierte|appelliert"],

  // ——— حروف الجر مع Dativ ———
  ["fragen", "nach", "dative", "nach dem Weg fragen", "يسأل عن", "Ich frage nach dem Weg.", "nach + Dativ يحدد الشيء المطلوب: nach dem Weg.", "frage|fragst|fragt|fragen|fragte|gefragt"],
  ["suchen", "nach", "dative", "nach dem Schlüssel suchen", "يبحث عن", "Ich suche nach dem Schlüssel.", "suchen nach تأخذ Dativ، ولو كان المفعول مباشرًا فتبقى Akkusativ.", "suche|suchst|sucht|suchen|suchte|gesucht"],
  ["kommen", "aus", "dative", "aus einem Land kommen", "يأتي من", "Ich komme aus einem Land in Nordafrika.", "aus تأخذ Dativ دائمًا.", "komme|kommst|kommt|kommen|kam|gekommen"],
  ["bestehen", "aus", "dative", "aus drei Teilen bestehen", "يتكوّن من", "Die Prüfung besteht aus drei Teilen.", "bestehen aus Dativ للتركيب، وbestehen auf Dativ للإصرار.", "bestehe|bestehst|besteht|bestehen|bestand|bestanden"],
  ["bestehen", "auf", "dative", "auf einer Erstattung bestehen", "يصرّ على", "Sie besteht auf einer Erstattung.", "استثناء حقيقي: bestehen auf تأخذ Dativ، لا Akkusativ مثل verlassen auf.", "bestehe|bestehst|besteht|bestehen|bestand|bestanden"],
  ["beruhen", "auf", "dative", "auf einem Missverständnis beruhen", "يقوم على / يرتكز على", "Der Streit beruht auf einem Missverständnis.", "استثناء: beruhen auf تأخذ Dativ، بخلاف sich verlassen auf.", "beruhe|beruhst|beruht|beruhen|beruhte|beruht"],
  ["basieren", "auf", "dative", "auf Zahlen basieren", "يستند إلى", "Der Bericht basiert auf Zahlen.", "basieren auf تأخذ Dativ.", "basiere|basierst|basiert|basieren|basierte|basiert"],
  ["fußen", "auf", "dative", "auf Erfahrung fußen", "يرتكز على", "Die Empfehlung fußt auf Erfahrung.", "fußen auf تأخذ Dativ.", "fuße|fußt|fußen|fußte|gefußt"],
  ["arbeiten", "bei", "dative", "bei einer Firma arbeiten", "يعمل لدى", "Er arbeitet bei einer Firma.", "bei تأخذ Dativ.", "arbeite|arbeitest|arbeitet|arbeiten|arbeitete|gearbeitet"],
  ["helfen", "bei", "dative", "bei den Hausaufgaben helfen", "يساعد في", "Sie hilft bei den Hausaufgaben.", "helfen bei Dativ للعمل، وhelfen + Dativ للشخص مباشرة.", "helfe|hilfst|hilft|helfen|half|geholfen"],
  ["sprechen", "mit", "dative", "mit der Lehrerin sprechen", "يتحدث مع", "Ich spreche mit der Lehrerin.", "mit تأخذ Dativ دائمًا.", "spreche|sprichst|spricht|sprechen|sprach|gesprochen"],
  ["telefonieren", "mit", "dative", "mit dem Amt telefonieren", "يتصل بـ", "Er telefoniert mit dem Amt.", "telefonieren mit تأخذ Dativ.", "telefoniere|telefonierst|telefoniert|telefonieren|telefonierte|telefoniert"],
  ["sich treffen", "mit", "dative", "sich mit Freunden treffen", "يلتقي بـ", "Ich treffe mich mit Freunden.", "mit تأخذ Dativ.", "treffe|triffst|trifft|treffen|traf|getroffen", "mich"],
  ["sich verabreden", "mit", "dative", "sich mit der Gruppe verabreden", "يتواعد مع", "Wir verabreden uns mit der Gruppe.", "verabreden mit تأخذ Dativ.", "verabrede|verabredest|verabredet|verabreden|verabredete|verabredet", "mich"],
  ["sich unterhalten", "mit", "dative", "sich mit dem Kollegen unterhalten", "يتحادث مع", "Ich unterhalte mich mit dem Kollegen.", "mit للشريك (Dativ)، وüber للموضوع (Akkusativ).", "unterhalte|unterhältst|unterhält|unterhalten|unterhielt|unterhalten", "mich"],
  ["diskutieren", "mit", "dative", "mit dem Team diskutieren", "يناقش مع", "Wir diskutieren mit dem Team.", "mit تأخذ Dativ.", "diskutiere|diskutierst|diskutiert|diskutieren|diskutierte|diskutiert"],
  ["streiten", "mit", "dative", "mit dem Nachbarn streiten", "يتشاجر مع", "Er streitet mit dem Nachbarn.", "mit تأخذ Dativ.", "streite|streitest|streitet|streiten|stritt|gestritten"],
  ["verhandeln", "mit", "dative", "mit dem Vermieter verhandeln", "يتفاوض مع", "Wir verhandeln mit dem Vermieter.", "mit تأخذ Dativ.", "verhandle|verhandelst|verhandelt|verhandeln|verhandelte|verhandelt"],
  ["sich verstehen", "mit", "dative", "sich mit den Kollegen verstehen", "يتفاهم مع", "Sie versteht sich mit den Kollegen.", "verstehen mit تأخذ Dativ.", "verstehe|verstehst|versteht|verstehen|verstand|verstanden", "mich"],
  ["sich beschweren", "bei", "dative", "sich bei der Verwaltung beschweren", "يشتكي لدى", "Wir beschweren uns bei der Verwaltung.", "bei للجهة (Dativ)، وüber للسبب (Akkusativ).", "beschwere|beschwerst|beschwert|beschweren|beschwerte|beschwert", "mich"],
  ["sich bedanken", "bei", "dative", "sich bei den Helfern bedanken", "يشكر (شخصًا)", "Ich bedanke mich bei den Helfern.", "bei تأخذ Dativ.", "bedanke|bedankst|bedankt|bedanken|bedankte|bedankt", "mich"],
  ["sich entschuldigen", "bei", "dative", "sich bei der Lehrerin entschuldigen", "يعتذر من (شخص)", "Ich entschuldige mich bei der Lehrerin.", "bei تأخذ Dativ.", "entschuldige|entschuldigst|entschuldigt|entschuldigen|entschuldigte|entschuldigt", "mich"],
  ["sich bewerben", "bei", "dative", "sich bei der Firma bewerben", "يتقدّم لدى", "Ich bewerbe mich bei der Firma.", "bei للجهة (Dativ)، وum للهدف (Akkusativ).", "bewerbe|bewirbst|bewirbt|bewerben|bewarb|beworben", "mich"],
  ["beginnen", "mit", "dative", "mit der Arbeit beginnen", "يبدأ بـ", "Wir beginnen mit der Arbeit.", "beginnen mit تأخذ Dativ.", "beginne|beginnst|beginnt|beginnen|begann|begonnen"],
  ["anfangen", "mit", "dative", "mit dem Kurs anfangen", "يبدأ بـ", "Wir fangen mit dem Kurs an.", "anfangen mit تأخذ Dativ.", "fange|fängst|fängt|fangen|fing|gefangen", "an"],
  ["aufhören", "mit", "dative", "mit dem Rauchen aufhören", "يتوقف عن", "Er hört mit dem Rauchen auf.", "aufhören mit تأخذ Dativ.", "höre|hörst|hört|hören|hörte|gehört", "auf"],
  ["enden", "mit", "dative", "mit einer Frage enden", "ينتهي بـ", "Das Gespräch endet mit einer Frage.", "enden mit تأخذ Dativ.", "ende|endest|endet|enden|endete|geendet"],
  ["sich beschäftigen", "mit", "dative", "sich mit dem Thema beschäftigen", "ينشغل بـ", "Wir beschäftigen uns mit dem Thema.", "beschäftigen mit تأخذ Dativ.", "beschäftige|beschäftigst|beschäftigt|beschäftigen|beschäftigte|beschäftigt", "mich"],
  ["sich befassen", "mit", "dative", "sich mit den Daten befassen", "يتناول / يدرس", "Sie befasst sich mit den Daten.", "befassen mit تأخذ Dativ.", "befasse|befasst|befassen|befasste|befasst", "mich"],
  ["sich auseinandersetzen", "mit", "dative", "sich mit der Kritik auseinandersetzen", "يتعامل مع / يناقش", "Wir setzen uns mit der Kritik auseinander.", "auseinandersetzen mit تأخذ Dativ.", "setze|setzt|setzen|setzte|gesetzt", "auseinander"],
  ["rechnen", "mit", "dative", "mit Verspätung rechnen", "يتوقّع / يحسب حساب", "Wir rechnen mit Verspätung.", "rechnen mit تأخذ Dativ.", "rechne|rechnest|rechnet|rechnen|rechnete|gerechnet"],
  ["vergleichen", "mit", "dative", "mit dem Vorjahr vergleichen", "يقارن بـ", "Wir vergleichen mit dem Vorjahr.", "vergleichen mit تأخذ Dativ.", "vergleiche|vergleichst|vergleicht|vergleichen|verglich|verglichen"],
  ["auskommen", "mit", "dative", "mit wenig Geld auskommen", "يكفيه / يتدبر بـ", "Sie kommt mit wenig Geld aus.", "auskommen mit تأخذ Dativ.", "komme|kommst|kommt|kommen|kam|gekommen", "aus"],
  ["sich abfinden", "mit", "dative", "sich mit der Entscheidung abfinden", "يتقبّل / يرضى بـ", "Er findet sich mit der Entscheidung ab.", "abfinden mit تأخذ Dativ.", "finde|findest|findet|finden|fand|gefunden", "ab"],
  ["zusammenhängen", "mit", "dative", "mit dem Stress zusammenhängen", "يرتبط بـ", "Die Fehler hängen mit dem Stress zusammen.", "zusammenhängen mit تأخذ Dativ.", "hänge|hängst|hängt|hängen|hing|gehangen", "zusammen"],
  ["fahren", "mit", "dative", "mit dem Bus fahren", "يسافر بـ", "Ich fahre mit dem Bus.", "mit لوسيلة النقل تأخذ Dativ، وتختلف عن fahren nach (الوجهة).", "fahre|fährst|fährt|fahren|fuhr|gefahren"],
  ["fahren", "nach", "dative", "nach Berlin fahren", "يسافر إلى", "Wir fahren nach Berlin.", "nach مع المدن والدول بلا أداة، وهي Dativ.", "fahre|fährst|fährt|fahren|fuhr|gefahren"],
  ["gehen", "zu", "dative", "zum Unterricht gehen", "يذهب إلى", "Wir gehen zum Unterricht.", "zu تأخذ Dativ دائمًا.", "gehe|gehst|geht|gehen|ging|gegangen"],
  ["einladen", "zu", "dative", "zum Essen einladen", "يدعو إلى", "Ich lade dich zum Essen ein.", "einladen zu تأخذ Dativ.", "lade|lädst|lädt|einladen|lud|geladen", "ein"],
  ["gratulieren", "zu", "dative", "zum Geburtstag gratulieren", "يهنئ بـ", "Wir gratulieren zum Geburtstag.", "gratulieren zu تأخذ Dativ.", "gratuliere|gratulierst|gratuliert|gratulieren|gratulierte|gratuliert"],
  ["gehören", "zu", "dative", "zum Kurs gehören", "ينتمي إلى", "Das gehört zum Kurs.", "gehören zu تأخذ Dativ.", "gehöre|gehörst|gehört|gehören|gehörte|gehört"],
  ["passen", "zu", "dative", "zum Plan passen", "يناسب", "Das passt zum Plan.", "passen zu تأخذ Dativ.", "passe|passt|passen|passte|gepasst"],
  ["beitragen", "zu", "dative", "zum Erfolg beitragen", "يساهم في", "Das trägt zum Erfolg bei.", "beitragen zu تأخذ Dativ.", "trage|trägst|trägt|tragen|trug|getragen", "bei"],
  ["führen", "zu", "dative", "zu Verzögerungen führen", "يؤدي إلى", "Das führt zu Verzögerungen.", "führen zu تأخذ Dativ.", "führe|führst|führt|führen|führte|geführt"],
  ["sich äußern", "zu", "dative", "sich zu dem Vorschlag äußern", "يبدي رأيه في", "Sie äußert sich zu dem Vorschlag.", "äußern zu تأخذ Dativ.", "äußere|äußerst|äußert|äußern|äußerte|geäußert", "mich"],
  ["Stellung nehmen", "zu", "dative", "zu dem Bericht Stellung nehmen", "يبدي موقفًا من", "Wir nehmen zu dem Bericht Stellung.", "Stellung nehmen zu تأخذ Dativ.", "nehme|nimmst|nimmt|nehmen|nahm|genommen", "Stellung"],
  ["teilnehmen", "an", "dative", "an dem Kurs teilnehmen", "يشارك في", "Ich nehme an dem Kurs teil.", "teilnehmen an تأخذ Dativ.", "nehme|nimmst|nimmt|nehmen|nahm|genommen", "teil"],
  ["sich beteiligen", "an", "dative", "sich an der Diskussion beteiligen", "يساهم في", "Sie beteiligt sich an der Diskussion.", "beteiligen an تأخذ Dativ.", "beteilige|beteiligst|beteiligt|beteiligen|beteiligte|beteiligt", "mich"],
  ["arbeiten", "an", "dative", "an dem Projekt arbeiten", "يعمل على", "Wir arbeiten an dem Projekt.", "arbeiten an Dativ للمشروع، وbei Dativ لجهة العمل.", "arbeite|arbeitest|arbeitet|arbeiten|arbeitete|gearbeitet"],
  ["leiden", "an", "dative", "an Kopfschmerzen leiden", "يعاني من (مرض)", "Er leidet an Kopfschmerzen.", "leiden an Dativ للمرض، وunter Dativ للظرف.", "leide|leidest|leidet|leiden|litt|gelitten"],
  ["leiden", "unter", "dative", "unter dem Lärm leiden", "يعاني من (ظرف)", "Wir leiden unter dem Lärm.", "استثناء: leiden unter تأخذ Dativ.", "leide|leidest|leidet|leiden|litt|gelitten"],
  ["sterben", "an", "dative", "an einer Krankheit sterben", "يموت بـ", "Er starb an einer Krankheit.", "sterben an تأخذ Dativ.", "sterbe|stirbst|stirbt|sterben|starb|gestorben"],
  ["zweifeln", "an", "dative", "an der Aussage zweifeln", "يشكّ في", "Ich zweifle an der Aussage.", "zweifeln an تأخذ Dativ، بخلاف glauben an (Akkusativ).", "zweifle|zweifelst|zweifelt|zweifeln|zweifelte|gezweifelt"],
  // هذان المدخلان يُصرَّحان ولا يُقاسان: الاستعمال المكاني (Das Bild hängt an der Wand،
  // das Zimmer liegt an der Straße) يسبق المعنى المجازي في نصوص A1–A2، ولا يمكن للجرد
  // تمييزه دون مُعلّم صرفي. تركهما مقيسين كان سيضيف أهدافًا وهمية، فآثرنا التصريح بلا قياس.
  ["hängen", "an", "dative", "an dem alten Auto hängen", "يتعلّق بـ (عاطفيًا)", "Sie hängt an dem alten Auto.", "hängen an بالمجاز تأخذ Dativ.", "hänge|hängst|hängt|hängen|hing|gehangen", undefined, undefined, false],
  ["liegen", "an", "dative", "an dem Stress liegen", "يعود سببه إلى", "Das liegt an dem Stress.", "liegen an تأخذ Dativ.", "liege|liegst|liegt|liegen|lag|gelegen", undefined, undefined, false],
  ["scheitern", "an", "dative", "an der Frist scheitern", "يفشل بسبب", "Das Projekt scheitert an der Frist.", "scheitern an تأخذ Dativ.", "scheitere|scheiterst|scheitert|scheitern|scheiterte|gescheitert"],
  ["erkennen", "an", "dative", "an der Stimme erkennen", "يتعرّف على من خلال", "Ich erkenne sie an der Stimme.", "erkennen an تأخذ Dativ.", "erkenne|erkennst|erkennt|erkennen|erkannte|erkannt"],
  ["sich orientieren", "an", "dative", "sich an den Regeln orientieren", "يسترشد بـ", "Wir orientieren uns an den Regeln.", "orientieren an تأخذ Dativ.", "orientiere|orientierst|orientiert|orientieren|orientierte|orientiert", "mich"],
  ["teilhaben", "an", "dative", "an der Entscheidung teilhaben", "يشارك في", "Alle haben an der Entscheidung teil.", "teilhaben an تأخذ Dativ.", "habe|hast|hat|haben|hatte|gehabt", "teil"],
  ["hindern", "an", "dative", "an der Arbeit hindern", "يعيق عن", "Der Lärm hindert sie an der Arbeit.", "استثناء: hindern an تأخذ Dativ.", "hindere|hinderst|hindert|hindern|hinderte|gehindert"],
  ["warnen", "vor", "dative", "vor dem Risiko warnen", "يحذّر من", "Wir warnen vor dem Risiko.", "warnen vor تأخذ Dativ.", "warne|warnst|warnt|warnen|warnte|gewarnt"],
  ["schützen", "vor", "dative", "vor der Sonne schützen", "يحمي من", "Die Creme schützt vor der Sonne.", "schützen vor تأخذ Dativ.", "schütze|schützt|schützen|schützte|geschützt"],
  ["sich fürchten", "vor", "dative", "sich vor der Prüfung fürchten", "يخاف من", "Er fürchtet sich vor der Prüfung.", "fürchten vor تأخذ Dativ.", "fürchte|fürchtest|fürchtet|fürchten|fürchtete|gefürchtet", "mich"],
  ["fliehen", "vor", "dative", "vor dem Lärm fliehen", "يهرب من", "Sie fliehen vor dem Lärm.", "fliehen vor تأخذ Dativ.", "fliehe|fliehst|flieht|fliehen|floh|geflohen"],
  ["erzählen", "von", "dative", "von der Reise erzählen", "يحكي عن", "Sie erzählt von der Reise.", "erzählen von Dativ للموضوع، وüber Akkusativ للتفصيل.", "erzähle|erzählst|erzählt|erzählen|erzählte|erzählt"],
  ["sprechen", "von", "dative", "von den Problemen sprechen", "يتحدث عن", "Wir sprechen von den Problemen.", "von تأخذ Dativ.", "spreche|sprichst|spricht|sprechen|sprach|gesprochen"],
  ["berichten", "von", "dative", "von der Sitzung berichten", "يخبر عن", "Er berichtet von der Sitzung.", "berichten von Dativ للمصدر، وüber Akkusativ للموضوع.", "berichte|berichtest|berichtet|berichten|berichtete|berichtet"],
  ["träumen", "von", "dative", "von der Zukunft träumen", "يحلم بـ", "Ich träume von der Zukunft.", "träumen von تأخذ Dativ.", "träume|träumst|träumt|träumen|träumte|geträumt"],
  ["wissen", "von", "dative", "von dem Plan wissen", "يعلم عن", "Wir wissen von dem Plan.", "wissen von تأخذ Dativ.", "weiß|weißt|wissen|wusste|gewusst"],
  ["hören", "von", "dative", "von dem Angebot hören", "يسمع عن", "Ich habe von dem Angebot gehört.", "hören von تأخذ Dativ.", "höre|hörst|hört|hören|hörte|gehört"],
  ["abhängen", "von", "dative", "von der Entscheidung abhängen", "يعتمد على", "Das hängt von der Entscheidung ab.", "abhängen von تأخذ Dativ.", "hänge|hängst|hängt|hängen|hing|gehangen", "ab"],
  ["leben", "von", "dative", "von der Kunst leben", "يعيش من", "Sie lebt von der Kunst.", "leben von تأخذ Dativ.", "lebe|lebst|lebt|leben|lebte|gelebt"],
  ["handeln", "von", "dative", "von Freundschaft handeln", "يتناول موضوع", "Der Text handelt von Freundschaft.", "handeln von Dativ للموضوع، وes handelt sich um Akkusativ للتعريف.", "handle|handelst|handelt|handeln|handelte|gehandelt"],
  ["profitieren", "von", "dative", "von dem Kurs profitieren", "يستفيد من", "Ich profitiere von dem Kurs.", "profitieren von تأخذ Dativ.", "profitiere|profitierst|profitiert|profitieren|profitierte|profitiert"],
  ["sich erholen", "von", "dative", "sich von der Arbeit erholen", "يستريح من", "Er erholt sich von der Arbeit.", "erholen von تأخذ Dativ.", "erhole|erholst|erholt|erholen|erholte|erholt", "mich"],
  ["sich verabschieden", "von", "dative", "sich von den Gästen verabschieden", "يودّع", "Wir verabschieden uns von den Gästen.", "verabschieden von تأخذ Dativ.", "verabschiede|verabschiedest|verabschiedet|verabschieden|verabschiedete|verabschiedet", "mich"],
  ["sich unterscheiden", "von", "dative", "sich von der Quelle unterscheiden", "يختلف عن", "Die Zahl unterscheidet sich von der Quelle.", "unterscheiden von تأخذ Dativ.", "unterscheide|unterscheidest|unterscheidet|unterscheiden|unterschied|unterschieden", "mich"],
  ["sich trennen", "von", "dative", "sich von dem Gerät trennen", "يتخلى عن", "Sie trennt sich von dem Gerät.", "trennen von تأخذ Dativ.", "trenne|trennst|trennt|trennen|trennte|getrennt", "mich"],
  ["sich entfernen", "von", "dative", "sich von dem Thema entfernen", "يبتعد عن", "Wir entfernen uns von dem Thema.", "entfernen von تأخذ Dativ.", "entferne|entfernst|entfernt|entfernen|entfernte|entfernt", "mich"],
  ["ausgehen", "von", "dative", "von steigenden Kosten ausgehen", "يفترض / ينطلق من", "Wir gehen von steigenden Kosten aus.", "ausgehen von تأخذ Dativ.", "gehe|gehst|geht|gehen|ging|gegangen", "aus"],
  ["überzeugen", "von", "dative", "von der Idee überzeugen", "يقنع بـ", "Wir überzeugen sie von der Idee.", "überzeugen von تأخذ Dativ.", "überzeuge|überzeugst|überzeugt|überzeugen|überzeugte|überzeugt"],
  ["sich überzeugen", "von", "dative", "sich von der Qualität überzeugen", "يتأكد من", "Ich überzeuge mich von der Qualität.", "überzeugen von تأخذ Dativ.", "überzeuge|überzeugst|überzeugt|überzeugen|überzeugte|überzeugt", "mich"],

  // ——— حروف الجر مع Genitiv (صيغة رسمية، مستوى B2 أساسًا) ———
  ["verfügen", "angesichts", "genitive", "angesichts der Frist entscheiden", "يقرّر في ضوء المهلة", "Angesichts der Frist entscheiden wir uns jetzt.", "angesichts حرف جر رسمي يطلب Genitiv: der Frist.", "verfüge|verfügst|verfügt|verfügen|verfügte|verfügt"],
  ["priorisieren", "hinsichtlich", "genitive", "hinsichtlich des Umfangs priorisieren", "يرتّب أولويةً من حيث الحجم", "Wir priorisieren hinsichtlich des Umfangs.", "hinsichtlich يطلب Genitiv: des Umfangs.", "priorisiere|priorisierst|priorisiert|priorisieren|priorisierte|priorisiert"],
  ["entscheiden", "trotz", "genitive", "trotz der Fachbegriffe entscheiden", "يقرّر رغم المصطلحات", "Wir entscheiden trotz der Fachbegriffe.", "trotz يطلب Genitiv: der Fachbegriffe.", "entscheide|entscheidest|entscheidet|entscheiden|entschied|entschieden"],
  ["verzichten", "während", "genitive", "während der Prüfung verzichten", "يتنازل أثناء الامتحان", "Wir verzichten während der Prüfung darauf.", "während يطلب Genitiv: der Prüfung.", "verzichte|verzichtest|verzichtet|verzichten|verzichtete|verzichtet"],
  ["berichten", "anhand", "genitive", "anhand der Daten berichten", "يُبلّغ استنادًا إلى البيانات", "Wir berichten anhand der Daten.", "anhand يطلب Genitiv: der Daten.", "berichte|berichtest|berichtet|berichten|berichtete|berichtet"],
  ["prüfen", "mittels", "genitive", "mittels einer Liste prüfen", "يفحص بواسطة قائمة", "Wir prüfen mittels einer Liste.", "mittels يطلب Genitiv: einer Liste.", "prüfe|prüfst|prüft|prüfen|prüfte|geprüft"],
];

const slug = (value: string) =>
  value
    .toLowerCase()
    .replace(/ä/g, "ae")
    .replace(/ö/g, "oe")
    .replace(/ü/g, "ue")
    .replace(/ß/g, "ss")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

const seedEntries: ValencyEntry[] = seeds.map(
  ([infinitive, preposition, governedCase, chunkDe, meaningAr, exampleDe, contrastAr, stemForms, separablePrefix, requireToken, measured]) => ({
    id: `${slug(infinitive)}-${slug(preposition)}-${governedCase}`,
    infinitive,
    preposition,
    governedCase,
    chunkDe,
    meaningAr,
    exampleDe,
    contrastAr,
    searchForms: stemForms.split("|").map((form) => form.trim()).filter(Boolean),
    separablePrefix: separablePrefix ?? null,
    requireToken: requireToken ?? null,
    measured: measured ?? true,
    dictionaryOrigin: "seed",
  }),
);

/**
 * الأشكال التصريفية للأفعال المؤطّرة في الدروس قبل هذا الجرد.
 * القاموس يجب أن يعرف كل فعل يملك إطارًا مؤلفًا، وإلا صار الجرد أعمى عنه في الدروس الأخرى.
 */
const authoredVerbForms: Record<string, string> = {
  "beginnen um": "beginne|beginnst|beginnt|beginnen|begann|begonnen",
  "bezahlen für": "bezahle|bezahlst|bezahlt|bezahlen|bezahlte|bezahlt",
  "bezahlen mit": "bezahle|bezahlst|bezahlt|bezahlen|bezahlte|bezahlt",
  "wohnen in": "wohne|wohnst|wohnt|wohnen|wohnte|gewohnt",
  "stehen auf": "stehe|stehst|steht|stehen|stand|standen|gestanden",
  "ankommen in": "komme|kommst|kommt|kommen|kam|kamen|gekommen|angekommen",
  "zuständig sein für": "bin|bist|ist|sind|war|waren|wäre|wären",
  "verbinden mit": "verbinde|verbindest|verbindet|verbinden|verband|verbunden",
  "sich melden bei": "melde|meldest|meldet|melden|meldete|gemeldet",
  "buchen für": "buche|buchst|bucht|buchen|buchte|gebucht",
  "sich erkundigen nach": "erkundige|erkundigst|erkundigt|erkundigen|erkundigte|erkundigt",
  "sich krankmelden bei": "melde|meldest|meldet|melden|meldete|gemeldet|krankgemeldet",
  "einnehmen gegen": "nehme|nimmst|nimmt|nehmen|nahm|eingenommen",
  "unterscheiden zwischen": "unterscheide|unterscheidest|unterscheidet|unterscheiden|unterschied|unterschieden",
  "sich schützen vor": "schütze|schützt|schützen|schützte|geschützt",
  "teilen mit": "teile|teilst|teilt|teilen|teilte|geteilt",
  "halten von": "halte|hältst|hält|halten|hielt|gehalten",
  "sich anmelden zu": "melde|meldest|meldet|melden|meldete|angemeldet",
  "danken für": "danke|dankst|dankt|danken|dankte|gedankt",
  "sich engagieren für": "engagiere|engagierst|engagiert|engagieren|engagierte|engagiert",
  "sammeln für": "sammle|sammelst|sammelt|sammeln|sammelte|gesammelt",
  "abstimmen über": "stimme|stimmst|stimmt|stimmen|stimmte|abgestimmt",
  "sich entscheiden zwischen": "entscheide|entscheidest|entscheidet|entscheiden|entschied|entschieden",
  "nachdenken über": "denke|denkst|denkt|denken|dachte|nachgedacht",
  "sich abstimmen mit": "stimme|stimmst|stimmt|stimmen|stimmte|abgestimmt",
  "verantwortlich sein für": "bin|bist|ist|sind|war|waren|wäre|wären",
  "überzeugen durch": "überzeuge|überzeugst|überzeugt|überzeugen|überzeugte|überzeugt",
  "klagen über": "klage|klagst|klagt|klagen|klagte|geklagt",
  "mitwirken an": "wirke|wirkst|wirkt|wirken|wirkte|mitgewirkt",
  "sich lohnen für": "lohne|lohnst|lohnt|lohnen|lohnte|gelohnt",
  "umsteigen auf": "steige|steigst|steigt|steigen|stieg|umgestiegen",
  "lernen aus": "lerne|lernst|lernt|lernen|lernte|gelernt",
  "sich qualifizieren für": "qualifiziere|qualifizierst|qualifiziert|qualifizieren|qualifizierte|qualifiziert",
  "eingehen auf": "gehe|gehst|geht|gehen|ging|eingegangen",
  "schließen mit": "schließe|schließt|schließen|schloss|geschlossen",
  "ablenken von": "lenke|lenkst|lenkt|lenken|lenkte|abgelenkt",
  "sich beschränken auf": "beschränke|beschränkst|beschränkt|beschränken|beschränkte|beschränkt",
  "sich berufen auf": "berufe|berufst|beruft|berufen|berief|berufen",
  "anknüpfen an": "knüpfe|knüpfst|knüpft|knüpfen|knüpfte|angeknüpft",
  "abraten von": "rate|rätst|rät|raten|riet|abgeraten",
  "raten zu": "rate|rätst|rät|raten|riet|geraten",
  "anfordern bei": "fordere|forderst|fordert|fordern|forderte|angefordert",
  "weiterleiten an": "leite|leitest|leitet|leiten|leitete|weitergeleitet",
  "messen an": "messe|misst|messen|maß|gemessen",
  "sich absichern gegen": "sichere|sicherst|sichert|sichern|sicherte|abgesichert",
  "zugreifen auf": "greife|greifst|greift|greifen|griff|zugegriffen",
  "sich stützen auf": "stütze|stützt|stützen|stützte|gestützt",
  "zurückgehen auf": "gehe|gehst|geht|gehen|ging|zurückgegangen",
  "hinausgehen über": "gehe|gehst|geht|gehen|ging|hinausgegangen",
  "sich abgrenzen von": "grenze|grenzt|grenzen|grenzte|abgegrenzt",
  "einwenden gegen": "wende|wendest|wendet|wenden|wandte|eingewandt",
  "sich auswirken auf": "wirke|wirkst|wirkt|wirken|wirkte|ausgewirkt",
  "einhergehen mit": "gehe|gehst|geht|gehen|ging|einhergegangen",
  "entscheiden angesichts": "entscheide|entscheidest|entscheidet|entscheiden|entschied|entschieden",
  "schließen aus": "schließe|schließt|schließen|schloss|geschlossen",
  "verwechseln mit": "verwechsle|verwechselst|verwechselt|verwechseln|verwechselte|verwechselt",
  "verstehen unter": "verstehe|verstehst|versteht|verstehen|verstand|verstanden",
  "erklären trotz": "erkläre|erklärst|erklärt|erklären|erklärte|erklärt",
  "einwirken auf": "wirke|wirkst|wirkt|wirken|wirkte|eingewirkt",
  "absehen von": "sehe|siehst|sieht|sehen|sah|abgesehen",
  "urteilen über": "urteile|urteilst|urteilt|urteilen|urteilte|geurteilt",
  "zurückführen auf": "führe|führst|führt|führen|führte|zurückgeführt",
  "sich richten nach": "richte|richtest|richtet|richten|richtete|gerichtet",
  "sich aussprechen für": "spreche|sprichst|spricht|sprechen|sprach|ausgesprochen",
  "sich beziehen auf": "beziehe|beziehst|bezieht|beziehen|bezog|bezogen",
  "priorisieren nach": "priorisiere|priorisierst|priorisiert|priorisieren|priorisierte|priorisiert",
  "ableiten aus": "leite|leitest|leitet|leiten|leitete|abgeleitet",
};

/** كلمات لازمة: الفعل وحده عام جدًا (sein، melden) فيشترط الجرد ظهور الكلمة معه. */
const authoredRequireToken: Record<string, string> = {
  "zuständig sein für": "zuständig",
  "verantwortlich sein für": "verantwortlich",
  "sich krankmelden bei": "krank",
};

/**
 * إطارات مؤلفة لا تمثل متممًا جرّيًا للفعل بل ظرفًا مكانيًا أو زمنيًا أو حرف جر رسميًا منفصلًا.
 * تُصرَّح في القاموس (حتى لا يرفضها المدقق) لكنها لا تُقاس في جرد التغطية، لأن قياسها
 * سيعدّ كل جملة مكانية أو زمنية فجوة، وهذا تضخيم لا معنى تعليميًا له.
 */
const adverbialAuthoredFrames = new Set([
  "wohnen in",
  "stehen auf",
  "ankommen in",
  "beginnen um",
  "entscheiden angesichts",
  "erklären trotz",
]);

/** بادئات منفصلة يقبلها الجرد كشرط للظهور مع الفعل في الجملة نفسها. */
const SEPARABLE_PREFIXES = [
  "ab", "an", "auf", "aus", "bei", "ein", "einher", "fest", "her", "hin", "hinaus",
  "los", "mit", "nach", "vor", "weg", "weiter", "zu", "zurück", "zusammen", "um",
];

/**
 * يكتشف البادئة المنفصلة من صيغة المصدر. الأفعال الانعكاسية تُعامل بمعيار الضمير
 * الانعكاسي في الجرد، فتبقى بادئتها المنفصلة إن وُجدت (sich anmelden → an).
 */
function detectSeparablePrefix(infinitive: string): string | null {
  const base = infinitive.replace(/^sich\s+/, "");
  if (/\bsein\b/.test(base)) return null;
  const verb = base.split(" ")[0];
  for (const prefix of SEPARABLE_PREFIXES) {
    if (verb.startsWith(prefix) && verb.length - prefix.length >= 4) return prefix;
  }
  return null;
}

const authoredFrameSeeds: ValencySeed[] = [];
const authoredSeedKeys = new Set<string>();
for (const frame of [
  ...a1VerbPrepositionFrames,
  ...a2VerbPrepositionFrames,
  ...b1VerbPrepositionFrames,
  ...b2VerbPrepositionFrames,
]) {
  const forms = authoredVerbForms[`${frame.infinitive} ${frame.preposition}`];
  if (!forms) continue;
  const seedKey = `${slug(frame.infinitive)}-${slug(frame.preposition)}-${frame.governedCase}`;
  if (authoredSeedKeys.has(seedKey)) continue;
  authoredSeedKeys.add(seedKey);


  authoredFrameSeeds.push([
    frame.infinitive,
    frame.preposition,
    frame.governedCase,
    frame.chunkDe,
    frame.meaningAr,
    frame.exampleDe,
    frame.contrastAr,
    forms,
    detectSeparablePrefix(frame.infinitive) ?? undefined,
    authoredRequireToken[`${frame.infinitive} ${frame.preposition}`],
    !adverbialAuthoredFrames.has(`${frame.infinitive} ${frame.preposition}`),
  ]);
}

const seedKeys = new Set(seedEntries.map((entry) => entry.id));

export const valencyEntries: ValencyEntry[] = [
  ...seedEntries,
  ...authoredFrameSeeds
    .map(
      ([infinitive, preposition, governedCase, chunkDe, meaningAr, exampleDe, contrastAr, stemForms, separablePrefix, requireToken, measured]) => ({
        id: `${slug(infinitive)}-${slug(preposition)}-${governedCase}`,
        infinitive,
        preposition,
        governedCase,
        chunkDe,
        meaningAr,
        exampleDe,
        contrastAr,
        searchForms: stemForms.split("|").map((form) => form.trim()).filter(Boolean),
        separablePrefix: separablePrefix ?? null,
        requireToken: requireToken ?? null,
        measured: measured ?? true,
        dictionaryOrigin: "authored-frame" as const,
      }),
    )
    .filter((entry) => !seedKeys.has(entry.id)),
];

/** المدخلات التي يقيسها الجرد فعليًا (المتممات الجرّية لا الظرفية/الزمنية). */
export const measuredValencyEntries = valencyEntries.filter((entry) => entry.measured);

export const dictionarySizeByOrigin = {
  seeds: seedEntries.length,
  authoredFrames: valencyEntries.filter((entry) => entry.dictionaryOrigin === "authored-frame").length,
  measured: measuredValencyEntries.length,
  declaredOnly: valencyEntries.filter((entry) => !entry.measured).length,
};

export const valencyEntriesById = Object.fromEntries(valencyEntries.map((entry) => [entry.id, entry]));

/** مفتاح المقارنة بين إطار درس ومدخل قاموس: الفعل + حرف الجر + الحالة. */
export const frameKeyOf = (infinitive: string, preposition: string, governedCase: string) =>
  `${slug(infinitive)}-${slug(preposition)}-${governedCase}`;
