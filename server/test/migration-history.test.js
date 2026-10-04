import { test } from "node:test";
import assert from "node:assert/strict";
import { readdirSync } from "node:fs";
import { getPendingMigrations } from "../src/db/migrationHistory.js";

const files = readdirSync(new URL("../src/db/migrations/", import.meta.url))
  .filter((filename) => filename.endsWith(".sql"))
  .sort();

test("legacy migration history skips renamed migrations but keeps new uniqueness migration", () => {
  const applied = [
    "001_create_enums.sql", "002_create_reference_tables.sql",
    "003_create_products.sql", "004_create_stocktake.sql",
    "005_seed_reference_data.sql", "006_add_product_indexes.sql",
    "006_create_users.sql", "007_create_users.sql", "007_enable_trgm.sql",
    "008_create_uom_table.sql", "009_add_supplier_phone.sql",
  ];
  assert.deepEqual(getPendingMigrations(files, applied), ["009_unique-reference-names.sql"]);
});

test("fresh and current databases retain their normal migration behavior", () => {
  assert.deepEqual(getPendingMigrations(files, []), files);
  assert.deepEqual(getPendingMigrations(files, files), []);
});

test("unrelated historical migrations cannot suppress current migrations by number", () => {
  assert.deepEqual(getPendingMigrations(files, ["008_create_uom_table.sql", "009_add_supplier_phone.sql"]), files);
});
