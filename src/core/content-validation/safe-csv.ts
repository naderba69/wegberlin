const SPREADSHEET_FORMULA_PREFIX = /^[\s\u0000-\u001f\u007f]*[=+\-@]/u;

/** Encodes one spreadsheet-safe CSV cell without allowing formula evaluation. */
export function encodeCsvCell(value: unknown) {
  const normalized = String(value ?? "").replace(/[\r\n\t]+/g, " ");
  const safe = SPREADSHEET_FORMULA_PREFIX.test(normalized) ? `'${normalized}` : normalized;
  return `"${safe.replace(/"/g, '""')}"`;
}

export function encodeCsvRow(cells: readonly unknown[]) {
  return cells.map(encodeCsvCell).join(",");
}

export function serializeCsv(headers: readonly unknown[], rows: readonly (readonly unknown[])[]) {
  return [headers, ...rows].map(encodeCsvRow).join("\n") + "\n";
}

export function parseCsv(content: string) {
  type State = "field-start" | "unquoted" | "quoted" | "after-quote";

  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let state: State = "field-start";

  const finishField = () => {
    row.push(cell);
    cell = "";
    state = "field-start";
  };
  const finishRow = () => {
    finishField();
    rows.push(row);
    row = [];
  };

  for (let index = 0; index < content.length; index += 1) {
    const character = content[index];
    const isRecordBreak = character === "\n" || character === "\r";

    if (state === "field-start") {
      if (character === '"') {
        state = "quoted";
      } else if (character === ",") {
        finishField();
      } else if (isRecordBreak) {
        finishRow();
        if (character === "\r" && content[index + 1] === "\n") index += 1;
      } else {
        cell += character;
        state = "unquoted";
      }
    } else if (state === "unquoted") {
      if (character === '"') {
        throw new Error("CSV is malformed: a quote appears inside an unquoted field.");
      } else if (character === ",") {
        finishField();
      } else if (isRecordBreak) {
        finishRow();
        if (character === "\r" && content[index + 1] === "\n") index += 1;
      } else {
        cell += character;
      }
    } else if (state === "quoted") {
      if (character === '"' && content[index + 1] === '"') {
        cell += '"';
        index += 1;
      } else if (character === '"') {
        state = "after-quote";
      } else {
        cell += character;
      }
    } else if (character === ",") {
      finishField();
    } else if (isRecordBreak) {
      finishRow();
      if (character === "\r" && content[index + 1] === "\n") index += 1;
    } else {
      throw new Error("CSV is malformed: unexpected content after a closing quote.");
    }
  }

  if (state === "quoted") throw new Error("CSV is malformed: an opening quote is not closed.");
  if (state !== "field-start" || row.length > 0) {
    row.push(cell);
    rows.push(row);
  }
  return rows;
}

export function hasNonEmptyCsvFields(content: string, fieldNames: readonly string[]) {
  const rows = parseCsv(content);
  if (rows.length === 0) throw new Error("CSV is malformed: the header row is missing.");
  const [header, ...dataRows] = rows;
  const fieldIndices = fieldNames.map((fieldName) => {
    const indices = header.flatMap((column, index) => column === fieldName ? [index] : []);
    if (indices.length !== 1) {
      throw new Error(`CSV is malformed: required field ${fieldName} must appear exactly once.`);
    }
    return indices[0];
  });
  const malformedRow = dataRows.find((dataRow) => dataRow.length !== header.length);
  if (malformedRow) throw new Error("CSV is malformed: a data row does not match the header width.");
  return dataRows.some((dataRow) => fieldIndices.some((index) => dataRow[index].trim().length > 0));
}
