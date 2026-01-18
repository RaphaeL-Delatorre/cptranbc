type CsvValue = string | number | boolean | null | undefined;

const escapeCell = (value: CsvValue) => {
  if (value === null || value === undefined) return "";
  const str = String(value);
  // Escape quotes and wrap when needed
  const needsWrap = /[";\n\r]/.test(str);
  const escaped = str.replace(/"/g, '""');
  return needsWrap ? `"${escaped}"` : escaped;
};

export const downloadCSV = (fileName: string, rows: CsvValue[][], delimiter: ";" | "," = ";") => {
  const csv = rows.map((r) => r.map(escapeCell).join(delimiter)).join("\n");
  // BOM for Excel (UTF-8)
  const blob = new Blob(["\ufeff", csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();

  URL.revokeObjectURL(url);
};
