/**
 * Minimal CSV writer — client-side use, builds a string, no streaming.
 * Quotes fields that contain commas, quotes, or newlines per RFC 4180, and
 * neutralizes spreadsheet formula injection (=, +, -, @, leading tab/CR).
 */
export function toCsv(headers: string[], rows: (string | number | null | undefined)[][]): string {
  const escape = (val: string | number | null | undefined): string => {
    if (val === null || val === undefined) return "";
    let s = String(val);
    // CSV formula-injection guard: a cell starting with = + - @ (or a
    // leading tab / CR) is evaluated as a formula by Excel/Sheets. Prefix a
    // single quote so it's read as text. Only the FIRST char matters, so
    // mid-string chars (e.g. "A-B Corp") are untouched. Done BEFORE the
    // RFC-4180 quoting below, so a value that is both formula-dangerous AND
    // contains commas/quotes is prefixed first, then quoted correctly.
    if (/^[=+\-@\t\r]/.test(s)) {
      s = `'${s}`;
    }
    if (/[",\r\n]/.test(s)) {
      return `"${s.replace(/"/g, '""')}"`;
    }
    return s;
  };
  const lines = [headers.map(escape).join(",")];
  for (const row of rows) {
    lines.push(row.map(escape).join(","));
  }
  return lines.join("\r\n");
}

/** Trigger a browser download of a CSV blob. Client-only. */
export function downloadCsv(filename: string, csv: string): void {
  // Prepend BOM so Excel opens UTF-8 correctly.
  const blob = new Blob(["﻿" + csv], {
    type: "text/csv;charset=utf-8;",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
