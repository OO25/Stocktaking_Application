import { after, before, beforeEach, test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";
import express from "express";
import jwt from "jsonwebtoken";

process.env.NODE_ENV = "test";
process.env.JWT_SECRET = "regression-test-secret";
const { default: pool } = await import("../src/config/db.js");
const { default: router } = await import("../src/routes/index.js");
const db = new PGlite();
let server;
let baseUrl;

before(async () => {
  for (const file of ["001_create-enums.sql", "002_create-reference-tables.sql", "003_create-products.sql", "004_create-stocktake.sql", "007_create-users.sql", "009_unique-reference-names.sql"]) {
    await db.exec(await readFile(new URL(`../src/db/migrations/${file}`, import.meta.url), "utf8"));
  }
  pool.query = (sql, params) => db.query(sql, params);
  pool.connect = async () => ({ query: pool.query, release() {} });
  const app = express();
  app.use(express.json());
  app.use("/api", router);
  server = app.listen(0, "127.0.0.1");
  await new Promise((resolve) => server.once("listening", resolve));
  baseUrl = `http://127.0.0.1:${server.address().port}/api`;
});

beforeEach(async () => {
  await db.exec(`
    TRUNCATE users, outlets, food_groups, packaging_types, units_of_measure, suppliers, products, stocktake_periods RESTART IDENTITY CASCADE;
    INSERT INTO users (username, password_hash, role) VALUES ('manager', 'unused', 'manager');
    INSERT INTO outlets (name, cost_centre) VALUES ('Groove', '1'), ('Refuel', '2');
    INSERT INTO user_outlets (user_id, outlet_id) VALUES (1, 1);
    INSERT INTO food_groups (name) VALUES ('Meat'), ('apple');
    INSERT INTO packaging_types (name) VALUES ('Bags');
    INSERT INTO units_of_measure (name) VALUES ('kg'), ('Box');
    INSERT INTO products (name, food_group_id, uom_id, price) VALUES ('Shared product', 1, 1, 5), ('Other outlet product', 2, 2, 10);
    INSERT INTO outlet_products (outlet_id, product_id) VALUES (1, 1), (2, 1), (2, 2);
    INSERT INTO stocktake_periods (month, year) VALUES (10, 2026);
    INSERT INTO stocktake_sessions (period_id, outlet_id, status) VALUES (1, 1, 'submitted');
    INSERT INTO stocktake_entries (session_id, product_id, quantity, unit_price) VALUES (1, 1, 3, 5);
  `);
});

after(async () => {
  if (server) await new Promise((resolve) => server.close(resolve));
  await db.close();
  await pool.end();
});

async function request(path, { role = "admin", method = "GET", body } = {}) {
  const headers = { "Content-Type": "application/json" };
  if (role) headers.Authorization = `Bearer ${jwt.sign({ id: 1, role, username: role }, process.env.JWT_SECRET)}`;
  const response = await fetch(`${baseUrl}${path}`, { method, headers, body: body ? JSON.stringify(body) : undefined });
  return { status: response.status, body: await response.json() };
}

test("management mutations reject managers, viewers, and unauthenticated requests", async () => {
  for (const resource of ["categories", "outlets", "products", "suppliers", "uom", "users"]) {
    for (const method of ["POST", "PUT", "DELETE"]) {
      const suffix = method === "POST" ? "" : resource === "categories" ? "/food_group/1" : "/1";
      for (const role of ["manager", "viewer", null]) {
        const result = await request(`/${resource}${suffix}`, { role, method, body: { name: "Changed" } });
        assert.equal(result.status, role ? 403 : 401, `${role} ${method} ${resource}`);
      }
    }
  }
  assert.equal((await db.query("SELECT name FROM outlets WHERE id = 1")).rows[0].name, "Groove");
});

test("outlet filtering retains the complete product outlet list and count", async () => {
  const result = await request("/products?outlet=Groove");
  assert.equal(result.status, 200);
  assert.equal(result.body.totalCount, 1);
  assert.deepEqual(result.body.rows[0].outlet_names, ["Groove", "Refuel"]);
  assert.deepEqual(result.body.rows[0].outlet_ids.sort(), [1, 2]);
  assert.equal(result.body.rows[0].in_use, true);
});

test("non-admin reads expose only assigned outlets and their products", async () => {
  const outlets = await request("/outlets", { role: "manager" });
  assert.deepEqual(outlets.body.map((outlet) => outlet.name), ["Groove"]);
  const products = await request("/products", { role: "manager" });
  assert.equal(products.body.totalCount, 1);
  assert.deepEqual(products.body.rows[0].outlet_names, ["Groove"]);
  await db.exec("DELETE FROM user_outlets");
  assert.deepEqual((await request("/outlets", { role: "manager" })).body, []);
  assert.equal((await request("/products", { role: "manager" })).body.totalCount, 0);
});

test("failed product deletion preserves all outlet assignments", async () => {
  assert.equal((await request("/products/1", { method: "DELETE" })).status, 400);
  assert.equal((await db.query("SELECT * FROM outlet_products WHERE product_id = 1")).rows.length, 2);
  assert.equal((await request("/products/2", { method: "DELETE" })).status, 200);
  assert.equal((await db.query("SELECT * FROM outlet_products WHERE product_id = 2")).rows.length, 0);
});

test("category and unit duplicates are validated case-insensitively on create and update", async () => {
  for (const [path, body] of [
    ["/categories", { type: "food_group", name: " meat " }],
    ["/categories", { type: "packaging_type", name: " BAGS " }],
    ["/uom", { name: " KG " }],
  ]) {
    const result = await request(path, { method: "POST", body });
    assert.equal(result.status, 409);
    assert.match(result.body.error, /already exists/);
    assert.doesNotMatch(result.body.error, /constraint|duplicate key/);
  }
  assert.equal((await request("/uom/2", { method: "PUT", body: { name: "KG" } })).status, 409);
  assert.equal((await request("/categories/food_group/2", { method: "PUT", body: { name: "Meat" } })).status, 409);
  assert.equal((await request("/uom/1", { method: "PUT", body: { name: "kg", description: "Kilogram" } })).status, 200);
  assert.equal((await request("/uom", { method: "POST", body: { name: "  " } })).status, 400);
});

test("database constraints prevent duplicates even when application validation is bypassed", async () => {
  for (const [table, name] of [["food_groups", " MEAT "], ["packaging_types", " bags "], ["units_of_measure", " KG "]]) {
    await assert.rejects(db.query(`INSERT INTO ${table} (name) VALUES ($1)`, [name]), { code: "23505" });
  }
});

test("reference lists sort alphabetically and count temporary-item usage", async () => {
  await db.exec("INSERT INTO stocktake_new_items (session_id, food_group_id, uom_id, description, price) VALUES (1, 2, 2, 'Temporary', 1)");
  const categories = (await request("/categories")).body;
  assert.deepEqual(categories.foodGroups.map((row) => row.name), ["apple", "Meat"]);
  assert.equal(categories.foodGroups[0].allocated_product_count, 2);
  const units = (await request("/uom")).body;
  assert.deepEqual(units.map((row) => row.name), ["Box", "kg"]);
  assert.equal(units[0].allocated_product_count, 2);
});

test("only admins can reopen submitted stocktakes, preserving entries", async () => {
  assert.equal((await request("/stocktake/sessions/1/status", { role: "manager", method: "PATCH", body: { status: "in_progress" } })).status, 403);
  assert.equal((await request("/stocktake/sessions/1/status", { method: "PATCH", body: { status: "in_progress" } })).status, 200);
  assert.equal((await db.query("SELECT quantity FROM stocktake_entries WHERE session_id = 1")).rows[0].quantity, "3.00");
  assert.equal((await request("/stocktake/sessions/1/status", { method: "PATCH", body: { status: "draft" } })).body.session.status, "draft");
});

test("viewers cannot write stocktake entries, temporary items, or submissions", async () => {
  for (const [method, path] of [
    ["PUT", "/stocktake/sessions/1/entries"],
    ["POST", "/stocktake/sessions/1/new-items"],
    ["PATCH", "/stocktake/sessions/1/new-items/1"],
    ["DELETE", "/stocktake/sessions/1/new-items/1"],
    ["POST", "/stocktake/sessions/1/submit"],
  ]) {
    assert.equal((await request(path, { role: "viewer", method, body: {} })).status, 403);
  }
});

test("outlet sorting applies before pagination", async () => {
  const result = await request("/outlets?page=1&limit=1&sort=za");
  assert.equal(result.body.totalCount, 2);
  assert.equal(result.body.rows[0].name, "Refuel");
});
