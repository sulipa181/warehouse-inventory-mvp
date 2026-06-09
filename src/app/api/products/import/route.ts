import { NextRequest, NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { parseProductWorkbook } from "@/lib/productImport";

export async function POST(request: NextRequest) {
  if (!isAdminRequest(request)) {
    return NextResponse.json({ error: "未登入後台" }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "缺少商品主檔" }, { status: 400 });
  }

  const db = getDb();
  const products = parseProductWorkbook(Buffer.from(await file.arrayBuffer()));

  await db.$transaction([
    db.countedStock.deleteMany(),
    db.systemStock.deleteMany(),
    db.product.deleteMany(),
    ...products.map((product) => db.product.create({ data: product })),
  ]);

  return NextResponse.redirect(new URL(`/admin?productsImported=${products.length}`, request.url));
}
