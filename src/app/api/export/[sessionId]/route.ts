import { NextRequest } from "next/server";
import * as XLSX from "xlsx";
import { isAdminRequest } from "@/lib/auth";
import { getDifferenceRows } from "@/lib/compare";
import { getDb } from "@/lib/db";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> },
) {
  if (!isAdminRequest(_request)) {
    return new Response("未登入後台", { status: 401 });
  }

  const { sessionId } = await params;
  const id = Number(sessionId);
  const db = getDb();
  const session = await db.inventorySession.findUnique({ where: { id } });

  if (!session) {
    return new Response("找不到盤點單", { status: 404 });
  }

  const rows = await getDifferenceRows(id);
  const sheetRows = rows.map((row) => ({
    狀態: row.status,
    SKU: row.sku,
    條碼: row.barcode,
    品名: row.name,
    規格: row.spec,
    單位: row.unit,
    分類: row.category,
    系統庫存: row.systemQty ?? "",
    實際盤點: row.countedQty ?? "",
    差異: row.difference ?? "",
    盤點人員: row.countedBy,
    備註: row.note,
  }));

  const workbook = XLSX.utils.book_new();
  const worksheet = XLSX.utils.json_to_sheet(sheetRows);
  XLSX.utils.book_append_sheet(workbook, worksheet, "差異表");
  const output = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
  const filename = encodeURIComponent(`${session.title}-差異表.xlsx`);

  return new Response(output, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename*=UTF-8''${filename}`,
    },
  });
}
