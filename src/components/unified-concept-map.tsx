"use client";

import { useState } from "react";
import Link from "next/link";
import { GitBranch, Network } from "lucide-react";
import type { CEFRLevel } from "@/types/learning";
import { academicLessons } from "@/data/academic-lessons";
import { buildUnifiedConceptMap } from "@/core/content-validation/unified-concept-map";

function lessonLinkLabel(lessonId: string) {
  const lesson = academicLessons[lessonId];
  return lesson ? `${lesson.level} · ${lesson.titleAr}` : "افتح الدرس المرتبط";
}

export function UnifiedConceptMap() {
  const [level, setLevel] = useState<CEFRLevel>("A1");
  const [selected, setSelected] = useState("");
  const map = buildUnifiedConceptMap(level);
  const selectedNode = map.nodes.find((node) => node.id === selected);
  const connectedIds = new Set(map.edges.flatMap((edge) => edge.from === selected ? [edge.to] : edge.to === selected ? [edge.from] : []));
  const connected = map.nodes.filter((node) => connectedIds.has(node.id));

  return (
    <details className="unified-concept-map" data-concept-map-policy={map.policyVersion}>
      <summary>
        <Network size={18} />
        <span>
          <small lang="de" dir="ltr">Grammatik und Wortschatz verbinden</small>
          <strong>خريطة مفاهيم تفاعلية موحدة</strong>
        </span>
        <b>{map.nodes.length} عقدة · {map.edges.length} رابط</b>
      </summary>
      <nav>
        {(["A1", "A2", "B1", "B2"] as const).map((item) => (
          <button type="button" key={item} className={level === item ? "active" : ""} onClick={() => { setLevel(item); setSelected(""); }}>{item}</button>
        ))}
      </nav>
      <div className="concept-map-columns">
        <section>
          <h3>Grammatik · القواعد</h3>
          {map.nodes.filter((node) => node.kind === "grammar").map((node) => (
            <button type="button" key={node.id} className={selected === node.id ? "active" : connectedIds.has(node.id) ? "connected" : ""} onClick={() => setSelected(node.id)}>
              <span lang="de" dir="ltr">{node.titleDe}</span><small>{node.titleAr}</small>
            </button>
          ))}
        </section>
        <i><GitBranch /></i>
        <section>
          <h3>Wortschatz · المفردات</h3>
          {map.nodes.filter((node) => node.kind === "vocabulary").map((node) => (
            <button type="button" key={node.id} className={selected === node.id ? "active" : connectedIds.has(node.id) ? "connected" : ""} onClick={() => setSelected(node.id)}>
              <span lang="de" dir="ltr">{node.titleDe}</span><small>{node.titleAr}</small>
            </button>
          ))}
        </section>
      </div>
      {selectedNode && (
        <footer>
          <strong>{selectedNode.titleAr}</strong>
          <p>{connected.length ? `يرتبط بـ${connected.length} مفهوم عبر درس مشترك: ${connected.map((node) => node.titleAr).join("، ")}.` : "لا يوجد رابط درس مشترك مسجل لهذه العقدة ضمن المستوى الحالي."}</p>
          <div>{selectedNode.lessonIds.map((lessonId) => <Link key={lessonId} href={`/lernen/${lessonId}`}>{lessonLinkLabel(lessonId)}</Link>)}</div>
          <small>الرابط يشرح بنية المنهج ولا يثبت سببًا تعلميًا أو إتقانًا.</small>
        </footer>
      )}
    </details>
  );
}
