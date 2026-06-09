import { readFileSync } from "node:fs";
import { PrismaClient } from "@prisma/client";
import * as XLSX from "xlsx";

const inputPath = process.argv[2];

if (!inputPath) {
  console.error("Usage: node prisma/import-products.mjs <workbook-path>");
  process.exit(1);
}

const db = new PrismaClient();

function cleanText(value) {
  return String(value ?? "").replace(/\s+/g, " ").trim();
}

function parseProductWorkbook(buffer) {
  const workbook = XLSX.read(buffer, { type: "buffer" });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "" });
  const products = [];
  let category = null;

  for (const row of rows) {
    const first = cleanText(row[0]);
    const barcode = cleanText(row[1]);
    const name = cleanText(row[2]);

    if (!first || first === "產品編號" || first === "附件1" || first.startsWith("日期")) {
      continue;
    }

    if (!(first && name && /^\d+$/.test(first))) {
      category = first;
      continue;
    }

    products.push({
      sku: first,
      barcode: barcode || null,
      name,
      spec: cleanText(row[3]) || null,
      unit: cleanText(row[4]) || null,
      category,
    });
  }

  return products;
}

const products = parseProductWorkbook(readFileSync(inputPath));

await db.$transaction([
  db.countedStock.deleteMany(),
  db.systemStock.deleteMany(),
  db.product.deleteMany(),
  ...products.map((product) => db.product.create({ data: product })),
]);

await db.$disconnect();
console.log(`Imported ${products.length} products from ${inputPath}`);
