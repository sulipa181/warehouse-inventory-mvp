import { NextRequest, NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { isAdminRequest } from "@/lib/auth";
import { getDb } from "@/lib/db";

type ImportRow = Record<string, unknown>;

const headerAliases: Record<string, string[]> = {
  sku: ["sku", "商品編號", "品號", "料號", "item", "item_no"],
  barcode: ["barcode", "條碼", "國際條碼"],
  name: ["name", "品名", "商品名稱", "名稱"],
  spec: ["spec", "規格"],
  unit: ["unit", "單位"],
  category: ["category", "分類", "類別"],
  systemQty: ["system_qty", "systemqty", "庫存", "系統庫存", "數量", "庫存數量"],
};

function normalize(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, "").replace(/-/g, "_");
}

function pick(row: ImportRow, key: keyof typeof headerAliases) {
  const aliases = headerAliases[key].map(normalize);
  const foundKey = Object.keys(row).find((rowKey) => aliases.includes(normalize(rowKey)));
  const value = foundKey ? row[foundKey] : "";
  return String(value ?? "").trim();
}

function toInt(value: string) {
  const normalized = Number(String(value).replace(/,/g, ""));
  return Number.isFinite(normalized) ? Math.round(normalized) : 0;
}

export async function POST(request: NextRequest) {
  if (!isAdminRequest(request)) {
    return NextResponse.json({ error: "未登入後台" }, { status: 401 });
  }

  const formData = await request.formData();
  const sessionId = Number(formData.get("sessionId"));
  const file = formData.get("file");

  if (!sessionId || !(file instanceof File)) {
    return NextResponse.json({ error: "缺少盤點單或 Excel 檔案" }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const workbook = XLSX.read(buffer, { type: "buffer" });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json<ImportRow>(sheet, { defval: "" });
  const db = getDb();
  let imported = 0;

  for (const row of rows) {
    const sku = pick(row, "sku");
    const barcode = pick(row, "barcode");
    const name = pick(row, "name") || sku;
    const systemQty = toInt(pick(row, "systemQty"));

    if (!sku) continue;

    await db.product.upsert({
      where: { sku },
      update: {
        barcode: barcode || null,
        name,
        spec: pick(row, "spec") || null,
        unit: pick(row, "unit") || null,
        category: pick(row, "category") || null,
      },
      create: {
        sku,
        barcode: barcode || null,
        name,
        spec: pick(row, "spec") || null,
        unit: pick(row, "unit") || null,
        category: pick(row, "category") || null,
      },
    });

    await db.systemStock.upsert({
      where: { sessionId_sku: { sessionId, sku } },
      update: { barcode: barcode || null, systemQty },
      create: { sessionId, sku, barcode: barcode || null, systemQty },
    });

    imported += 1;
  }

  return NextResponse.redirect(new URL(`/admin?sessionId=${sessionId}&imported=${imported}`, request.url));
}
