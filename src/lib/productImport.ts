import * as XLSX from "xlsx";

export type ImportedProduct = {
  sku: string;
  barcode: string | null;
  name: string;
  spec: string | null;
  unit: string | null;
  category: string | null;
};

function cleanText(value: unknown) {
  return String(value ?? "").replace(/\s+/g, " ").trim();
}

function looksLikeProduct(row: unknown[]) {
  const sku = cleanText(row[0]);
  const name = cleanText(row[2]);
  return Boolean(sku && name && /^\d+$/.test(sku));
}

export function parseProductWorkbook(buffer: Buffer): ImportedProduct[] {
  const workbook = XLSX.read(buffer, { type: "buffer" });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, defval: "" });
  const products: ImportedProduct[] = [];
  let category: string | null = null;

  for (const row of rows) {
    const first = cleanText(row[0]);
    const barcode = cleanText(row[1]);
    const name = cleanText(row[2]);

    if (!first || first === "產品編號" || first === "附件1" || first.startsWith("日期")) {
      continue;
    }

    if (!looksLikeProduct(row)) {
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
