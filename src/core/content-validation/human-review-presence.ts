import { hasNonEmptyCsvFields, parseCsv } from "./safe-csv";

/** حقول التوقيع الأربعة في أوراق حزمة المراجعة البشرية؛ مصدر واحد مع حارس إعادة التوليد. */
export const REVIEW_PACKET_SIGNATURE_FIELDS = ["decision", "reviewerName", "reviewDate", "note"] as const;
export const REVIEW_PACKET_SIGNATURE_CELLS = REVIEW_PACKET_SIGNATURE_FIELDS.length;

export type ReviewPacketSheet = { name: string; content: string };

export type ReviewPacketSheetPresence = {
  name: string;
  rows: number;
  fullySignedRows: number;
  unsignedRows: number;
};

export type ReviewPacketDecisionPresence = {
  sheetCount: number;
  rowCount: number;
  fullySignedRowCount: number;
  unsignedRowCount: number;
  signedSignatureCells: number;
  signatureCellsExpected: number;
  sheets: ReviewPacketSheetPresence[];
  evidenceContentsInspected: false;
  reviewDecisionContentsInterpreted: false;
  humanReviewClosureAsserted: false;
};

const sheetNumber = (name: string) => {
  const match = name.match(/^review-sheet-(\d+)\.csv$/u);
  if (!match) throw new Error(`Review packet presence requires review-sheet-N.csv names; found ${name}.`);
  return Number(match[1]);
};

function requiredColumnIndex(header: readonly string[], columnName: string) {
  const indexes = header.flatMap((column, index) => column === columnName ? [index] : []);
  if (indexes.length !== 1) throw new Error(`Review packet presence requires exactly one ${columnName} column.`);
  return indexes[0];
}

/**
 * جرد حضور التوقيع في أوراق المراجعة الكاملة (3,277 سجلًا): حضور فقط.
 * لا يفتح محتوى قرار ولا يفسّره؛ صفٌّ بتوقيع ناقص يوقف الفحص لأنه مراجعة غير مكتملة لا يجوز أن تُقرأ كمكتملة.
 */
export function auditReviewPacketDecisionPresence(
  files: readonly ReviewPacketSheet[],
  options: { expectedRowCount: number; expectedSignatureCellsPerRow?: number },
): ReviewPacketDecisionPresence {
  if (files.length === 0) throw new Error("Review packet presence requires at least one sheet.");
  const sorted = [...files].sort((left, right) => sheetNumber(left.name) - sheetNumber(right.name));
  const numbers = sorted.map((file) => sheetNumber(file.name));
  if (new Set(numbers).size !== numbers.length) throw new Error("Review packet presence found duplicate sheet numbers.");
  if (numbers.some((number, index) => number !== index + 1)) throw new Error("Review packet sheets are not numbered contiguously from 1.");

  const expectedCellsPerRow = options.expectedSignatureCellsPerRow ?? REVIEW_PACKET_SIGNATURE_CELLS;
  if (expectedCellsPerRow !== REVIEW_PACKET_SIGNATURE_CELLS) {
    throw new Error(`Review packet presence tracks exactly ${REVIEW_PACKET_SIGNATURE_CELLS} signature fields.`);
  }

  const seenContentIds = new Set<string>();
  const sheets: ReviewPacketSheetPresence[] = [];
  let rowCount = 0;
  let fullySignedRowCount = 0;
  let signedSignatureCells = 0;

  for (const file of sorted) {
    const rows = parseCsv(file.content);
    if (rows.length === 0) throw new Error(`Review packet sheet ${file.name} has no header row.`);
    const [header, ...dataRows] = rows;
    const sheetIndex = requiredColumnIndex(header, "sheet");
    const contentIdIndex = requiredColumnIndex(header, "contentId");
    const signatureIndexes = REVIEW_PACKET_SIGNATURE_FIELDS.map((field) => requiredColumnIndex(header, field));
    if (dataRows.length === 0) throw new Error(`Review packet sheet ${file.name} has no data rows.`);
    if (dataRows.some((row) => row.length !== header.length)) throw new Error(`Review packet sheet ${file.name} contains a row with the wrong width.`);

    let fullySignedRows = 0;
    for (const row of dataRows) {
      const contentId = row[contentIdIndex].trim();
      if (!contentId) throw new Error(`Review packet sheet ${file.name} contains a row without a content ID.`);
      if (seenContentIds.has(contentId)) throw new Error(`Review packet presence found a duplicate content ID (${contentId}); every governed record must appear once.`);
      seenContentIds.add(contentId);
      const expectedSheetCell = `sheet-${sheetNumber(file.name)}`;
      if (row[sheetIndex].trim() !== expectedSheetCell) throw new Error(`Review packet sheet ${file.name} contains a row labelled ${row[sheetIndex].trim() || "empty"} instead of ${expectedSheetCell}.`);

      const filledCells = signatureIndexes.filter((index) => row[index].trim()).length;
      signedSignatureCells += filledCells;
      if (filledCells === 0) continue;
      if (filledCells !== REVIEW_PACKET_SIGNATURE_CELLS) {
        throw new Error(`Review packet sheet ${file.name} contains a partial signature (${filledCells}/${REVIEW_PACKET_SIGNATURE_CELLS} fields) on record ${contentId}. A record is either unsigned or fully signed by a named reviewer.`);
      }
      if (!hasNonEmptyCsvFields(file.content, [...REVIEW_PACKET_SIGNATURE_FIELDS])) {
        throw new Error(`Review packet sheet ${file.name} could not be safely inspected for signature fields.`);
      }
      fullySignedRows += 1;
    }
    rowCount += dataRows.length;
    fullySignedRowCount += fullySignedRows;
    sheets.push({ name: file.name, rows: dataRows.length, fullySignedRows, unsignedRows: dataRows.length - fullySignedRows });
  }

  if (rowCount !== options.expectedRowCount) {
    throw new Error(`Review packet presence expected ${options.expectedRowCount} governed rows; found ${rowCount}.`);
  }

  return {
    sheetCount: sheets.length,
    rowCount,
    fullySignedRowCount,
    unsignedRowCount: rowCount - fullySignedRowCount,
    signedSignatureCells,
    signatureCellsExpected: rowCount * REVIEW_PACKET_SIGNATURE_CELLS,
    sheets,
    evidenceContentsInspected: false,
    reviewDecisionContentsInterpreted: false,
    humanReviewClosureAsserted: false,
  };
}

export type GeneratedArtifactSignatureScan = {
  path: string;
  rows: number;
  columns: readonly string[];
  filledCells: number;
  filledRowIds: string[];
};

export type GeneratedArtifactSignatureReport = {
  artifactCount: number;
  rowCount: number;
  filledCellCount: number;
  expectedCellCount: number;
  artifacts: GeneratedArtifactSignatureScan[];
  humanReviewClosureAsserted: false;
};

/**
 * يتحقق أن الملفات المولَّدة ما زالت خالية تمامًا من أي إدخال مراجع (اسم دليل أو قرار أو هوية أو تاريخ أو ملاحظة).
 * عمل المراجع يبقى في نسخة محفوظة خارج الملفات المولَّدة، ثم يُسجَّل في السجل المعتمد بقرار صريح من المالك.
 */
export function auditGeneratedArtifactSignatures(
  files: readonly { path: string; content: string; columns: readonly string[] }[],
): GeneratedArtifactSignatureReport {
  if (files.length === 0) throw new Error("Generated-artifact signature scan requires at least one artifact.");

  const artifacts: GeneratedArtifactSignatureScan[] = files.map((file) => {
    const rows = parseCsv(file.content);
    if (rows.length === 0) throw new Error(`Generated artifact ${file.path} has no header row.`);
    const [header, ...dataRows] = rows;
    if (dataRows.some((row) => row.length !== header.length)) throw new Error(`Generated artifact ${file.path} contains a row with the wrong width.`);
    const idIndex = header.indexOf("contentId") >= 0 ? header.indexOf("contentId") : header.indexOf("decisionId") >= 0 ? header.indexOf("decisionId") : header.indexOf("anchorId") >= 0 ? header.indexOf("anchorId") : 0;
    const indexes = file.columns.map((column) => {
      const found = header.flatMap((name, index) => name === column ? [index] : []);
      if (found.length !== 1) throw new Error(`Generated artifact ${file.path} requires exactly one ${column} column.`);
      return found[0];
    });
    const filledRowIds: string[] = [];
    let filledCells = 0;
    for (const row of dataRows) {
      const filled = indexes.filter((index) => row[index].trim()).length;
      filledCells += filled;
      if (filled > 0) filledRowIds.push(row[idIndex]?.trim() || "unknown-row");
    }
    return { path: file.path, rows: dataRows.length, columns: file.columns, filledCells, filledRowIds };
  });

  return {
    artifactCount: artifacts.length,
    rowCount: artifacts.reduce((total, artifact) => total + artifact.rows, 0),
    filledCellCount: artifacts.reduce((total, artifact) => total + artifact.filledCells, 0),
    expectedCellCount: artifacts.reduce((total, artifact) => total + artifact.rows * artifact.columns.length, 0),
    artifacts,
    humanReviewClosureAsserted: false,
  };
}
