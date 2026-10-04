import { test } from "node:test";
import assert from "node:assert/strict";
import readExcelFile from "read-excel-file/node";
import { categoriesToCsv, categoriesToWorkbook } from "../src/lib/exportCategories.js";

const categories = [
  { name: 'Meat, "fresh"', type: "Food group", code: "M", created_at: "2026-10-01" },
  { name: "=1+1", type: "Packaging type" },
];

test("CSV preserves commas and quotes and neutralizes spreadsheet formulas", () => {
  const csv = categoriesToCsv(categories);
  assert.match(csv, /"Meat, ""fresh"""/);
  assert.match(csv, /"'=1\+1"/);
  assert.equal(csv.split("\r\n").length, 3);
});

test("Excel export is a readable XLSX workbook containing literal cell values", async () => {
  const blob = await categoriesToWorkbook(categories);
  const [sheet] = await readExcelFile(Buffer.from(await blob.arrayBuffer()));
  const rows = sheet.data;
  assert.equal(sheet.sheet, "Categories");
  assert.equal(rows.length, 3);
  assert.equal(rows[0][0], "Name");
  assert.equal(rows[1][0], 'Meat, "fresh"');
  assert.equal(rows[2][0], "=1+1");
});
