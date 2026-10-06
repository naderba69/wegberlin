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
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;

  for (let index = 0; index < content.length; index += 1) {
    const character = content[index];
    if (quoted && character === '"' && content[index + 1] === '"') {
      cell += '"';
      index += 1;
    } else if (character === '"') {
      quoted = !quoted;
    } else if (!quoted && character === ",") {
      row.push(cell);
      cell = "";
    } else if (!quoted && (character === "\n" || character === "\r")) {
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
      if (character === "\r" && content[index + 1] === "\n") index += 1;
    } else {
      cell += character;
    }
  }

  if (quoted) throw new Error("CSV is malformed: an opening quote is not closed.");
  if (cell.length || row.length) {
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
    const index = header.indexOf(fieldName);
    if (index < 0) throw new Error(`CSV is malformed: required field ${fieldName} is missing.`);
    return index;
  });
  const malformedRow = dataRows.find((dataRow) => dataRow.length !== header.length);
  if (malformedRow) throw new Error("CSV is malformed: a data row does not match the header width.");
  return dataRows.some((dataRow) => fieldIndices.some((index) => dataRow[index].trim().length > 0));
}
