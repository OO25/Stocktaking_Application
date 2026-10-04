const COLUMNS = ["Name", "Type", "Code", "Created", "Updated"];

function categoryRows(categories) {
  return categories.map((category) => [
    category.name,
    category.type,
    category.code ?? "",
    category.created_at ?? "",
    category.updated_at ?? "",
  ]);
}

export function categoriesToCsv(categories) {
  const escapeCell = (value) => {
    let text = String(value);
    // Keep spreadsheet applications from interpreting user-entered names as formulas.
    if (/^[=+\-@\t\r]/.test(text)) text = `'${text}`;
    return `"${text.replaceAll('"', '""')}"`;
  };
  return [COLUMNS, ...categoryRows(categories)]
    .map((row) => row.map(escapeCell).join(","))
    .join("\r\n");
}

export async function categoriesToWorkbook(categories) {
  const { default: writeExcelFile } = await import("write-excel-file/universal");
  const header = COLUMNS.map((value) => ({ value, fontWeight: "bold" }));
  return writeExcelFile([header, ...categoryRows(categories)], {
    sheet: "Categories",
    columns: COLUMNS.map(() => ({ width: 28 })),
    stickyRowsCount: 1,
  }).toBlob();
}

export async function downloadCategories(categories, format) {
  const isExcel = format === "xlsx";
  const content = isExcel ? await categoriesToWorkbook(categories) : `\uFEFF${categoriesToCsv(categories)}`;
  const type = isExcel
    ? "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    : "text/csv;charset=utf-8";
  const url = URL.createObjectURL(new Blob([content], { type }));
  const link = document.createElement("a");
  link.href = url;
  link.download = `categories.${format}`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
