"use client";

import { useDeferredValue, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, BookOpenText, GraduationCap, Languages, LibraryBig, Search, ShieldCheck } from "lucide-react";
import { bilingualSearchEntries, searchBilingual, type SearchSource } from "@/core/search/bilingual-search";
import type { CEFRLevel } from "@/types/learning";

const sourceMeta: Record<SearchSource, { label: string; icon: typeof BookOpenText }> = {
  lesson: { label: "المنهج", icon: BookOpenText },
  library: { label: "المكتبة", icon: LibraryBig },
  exam: { label: "الامتحان", icon: GraduationCap },
};

const subtypeAr = {
  lesson: "درس",
  phrase: "عبارة",
  grammar: "قاعدة",
  glossary: "مفردة من نص",
  error: "خطأ شائع",
  reading: "قراءة",
  listening: "استماع",
  "exam-task": "مهمة امتحان",
};

export function BilingualSearchView() {
  const [query, setQuery] = useState("");
  const [source, setSource] = useState<SearchSource | "all">("all");
  const [level, setLevel] = useState<CEFRLevel | "all">("all");
  const deferredQuery = useDeferredValue(query);
  const results = useMemo(() => searchBilingual(deferredQuery, { source, level }), [deferredQuery, source, level]);
  const searching = query.trim().length > 0;

  return <div className="wide-page search-page">
    <header className="search-hero">
      <div>
        <span className="eyebrow"><Languages size={16} /> بحث ألماني–عربي محلي</span>
        <h1>ابحث عن العبارة، <em>ثم ارجع إلى سياقها.</em></h1>
        <p>يفتش في الدروس والعبارات والقواعد وعيادات الأخطاء والمكتبة ومهام الامتحان. يعمل دون AI ولا يرسل ما تكتبه إلى أي خادم.</p>
      </div>
      <div className="search-index-stat"><strong>{bilingualSearchEntries.length.toLocaleString("ar-TN")}</strong><span>مدخلًا مفهرسًا<br />من A1 إلى B2</span></div>
    </header>

    <section className="search-panel" role="search">
      <label className="search-input">
        <Search size={21} />
        <span className="sr-only">كلمة البحث بالألمانية أو العربية</span>
        <input
          type="search"
          dir="auto"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="مثال: Heizung، موعد، obwohl، شكوى…"
          aria-label="البحث بالألمانية أو العربية"
          autoComplete="off"
        />
        {searching && <button type="button" onClick={() => setQuery("")}>مسح</button>}
      </label>
      <div className="search-filters">
        <div aria-label="مصدر البحث">
          <button className={source === "all" ? "active" : ""} onClick={() => setSource("all")}>الكل</button>
          {(Object.entries(sourceMeta) as Array<[SearchSource, (typeof sourceMeta)[SearchSource]]>).map(([key, meta]) => { const Icon = meta.icon; return <button key={key} className={source === key ? "active" : ""} onClick={() => setSource(key)}><Icon size={14} />{meta.label}</button>; })}
        </div>
        <select aria-label="مستوى نتائج البحث" value={level} onChange={(event) => setLevel(event.target.value as CEFRLevel | "all")}>
          <option value="all">A1–B2</option>
          {(["A1", "A2", "B1", "B2"] as CEFRLevel[]).map((item) => <option value={item} key={item}>{item}</option>)}
        </select>
      </div>
    </section>

    {!searching ? <section className="search-empty">
      <ShieldCheck size={28} />
      <h2>ابدأ من كلمة أو مقصد</h2>
      <p>يمكنك الكتابة بالألمانية أو العربية، ولا يلزم استعمال الحركات أو كتابة Umlaut بدقة.</p>
      <div>{["Termin verschieben", "التدفئة", "obwohl", "العمل الجماعي"].map((suggestion) => <button key={suggestion} dir="auto" onClick={() => setQuery(suggestion)}>{suggestion}</button>)}</div>
    </section> : <>
      <div className="search-result-heading"><strong>{results.length} نتيجة مرتبة</strong><span>{results.length === 80 ? "نعرض أفضل 80 نتيجة؛ أضف كلمة لتضييق البحث." : "الترتيب يفضّل التطابق في العنوان والعبارة."}</span></div>
      {results.length === 0 ? <section className="search-empty"><Search size={27} /><h2>لا توجد نتيجة بهذه المرشحات</h2><p>جرّب جزءًا من الكلمة، غيّر المستوى، أو اختر «الكل».</p></section> : <div className="search-results">
        {results.map(({ entry }) => {
          const meta = sourceMeta[entry.source];
          const Icon = meta.icon;
          return <Link href={entry.href} className="search-result-card" key={entry.id}>
            <span className="search-result-icon"><Icon size={18} /></span>
            <div>
              <header><span>{subtypeAr[entry.subtype]} · {entry.level}</span>{entry.provider && <small>{entry.provider === "goethe-b2" ? "Goethe B2" : "telc Deutsch B2"}</small>}</header>
              <h2 lang="de" dir="ltr">{entry.titleDe}</h2>
              <h3>{entry.titleAr}</h3>
              <p lang="de" dir="ltr">{entry.contextDe}</p>
              <small>{entry.contextAr}</small>
            </div>
            <ArrowLeft size={17} />
          </Link>;
        })}
      </div>}
    </>}
  </div>;
}
