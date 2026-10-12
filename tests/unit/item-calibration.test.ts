import { describe, expect, it } from "vitest";
import { MIN_RESPONSES_PER_ITEM, calibrateItems, parseAnonymousResponseCsv } from "@/core/assessment/item-calibration";

describe("P2-350 معايرة صعوبة من ملف إجابات مجهولة (محلي فقط)", () => {
  it("يقبل الملف ذا العمودين فقط", () => {
    const result = parseAnonymousResponseCsv("itemId,correct\nb1-07-q2,1\nb1-07-q2,0\n");
    expect(result.errors).toEqual([]);
    expect(result.rows).toEqual([
      { itemId: "b1-07-q2", correct: true },
      { itemId: "b1-07-q2", correct: false },
    ]);
  });

  it("يرفض أي عمود إضافي، فلا يدخل معرّف متعلم أو وقت أو جهاز", () => {
    expect(parseAnonymousResponseCsv("itemId,correct,learner\nb1-07-q2,1,abc").errors).toEqual(["header-must-be-exactly-itemId,correct"]);
    expect(parseAnonymousResponseCsv("itemId,correct\nb1-07-q2,1,abc").errors).toEqual(["line-2-expected-two-columns"]);
  });

  it("يرفض معرّف عنصر غير صالح وقيمة غير 0 أو 1", () => {
    const result = parseAnonymousResponseCsv("itemId,correct\nbad id,1\nok-1,yes");
    expect(result.rows).toEqual([]);
    expect(result.errors).toEqual(["line-2-invalid-item-id", "line-3-correct-must-be-0-or-1"]);
  });

  it("يرفض الملف الفارغ", () => {
    expect(parseAnonymousResponseCsv("\n  \n").errors).toEqual(["file-empty"]);
  });

  it("العنصر ذو الاستجابات الأقل من الحد لا يعطي نسبة ولا علامة", () => {
    const rows = Array.from({ length: MIN_RESPONSES_PER_ITEM - 1 }, () => ({ itemId: "a-1", correct: true }));
    expect(calibrateItems(rows)).toEqual([{ itemId: "a-1", responses: MIN_RESPONSES_PER_ITEM - 1, pCorrect: null, band: "insufficient-data" }]);
  });

  it("يعلّم السهل جدًا والصعب جدًا للمراجعة فقط، والباقي بلا علامة", () => {
    const make = (itemId: string, correct: number, total: number) =>
      Array.from({ length: total }, (_, i) => ({ itemId, correct: i < correct }));
    const rows = [...make("easy", 29, 30), ...make("hard", 6, 30), ...make("mid", 15, 30)];
    const byId = Object.fromEntries(calibrateItems(rows).map((item) => [item.itemId, item]));
    expect(byId.easy).toMatchObject({ pCorrect: 0.97, band: "review-very-easy" });
    expect(byId.hard).toMatchObject({ pCorrect: 0.2, band: "review-very-hard" });
    expect(byId.mid).toMatchObject({ pCorrect: 0.5, band: "no-flag" });
  });

  it("الترتيب ثابت حسب معرّف العنصر", () => {
    const rows = [
      ...Array.from({ length: 30 }, () => ({ itemId: "z", correct: true })),
      ...Array.from({ length: 30 }, () => ({ itemId: "a", correct: true })),
    ];
    expect(calibrateItems(rows).map((item) => item.itemId)).toEqual(["a", "z"]);
  });
});
