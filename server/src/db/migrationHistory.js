// Known historical filenames only: migration numbers alone are not identities.
const LEGACY_FILENAMES = new Map([
  ["001_create-enums.sql", ["001_create_enums.sql"]],
  ["002_create-reference-tables.sql", ["002_create_reference_tables.sql"]],
  ["003_create-products.sql", ["003_create_products.sql"]],
  ["004_create-stocktake.sql", ["004_create_stocktake.sql"]],
  ["005_seed-reference-data.sql", ["005_seed_reference_data.sql"]],
  ["006_add-product-indexes.sql", ["006_add_product_indexes.sql"]],
  ["007_create-users.sql", ["007_create_users.sql"]],
  ["008_enable-fuzzy-search.sql", ["007_enable_trgm.sql"]],
]);

export function getPendingMigrations(files, appliedFilenames) {
  const applied = new Set(appliedFilenames);
  return files.filter((filename) => {
    if (applied.has(filename)) return false;
    return !(LEGACY_FILENAMES.get(filename) ?? []).some((alias) => applied.has(alias));
  });
}
