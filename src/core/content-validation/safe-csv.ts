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
