import { getDb } from "@/lib/db";

export type DifferenceStatus = "正常" | "短少" | "溢出" | "未盤點" | "多出商品";

export type DifferenceRow = {
  sku: string;
  barcode: string;
  name: string;
  spec: string;
  unit: string;
  category: string;
  systemQty: number | null;
  countedQty: number | null;
  difference: number | null;
  countedBy: string;
  note: string;
  status: DifferenceStatus;
};

export function getDifferenceStatus(
  systemQty: number | null,
  countedQty: number | null,
): DifferenceStatus {
  if (systemQty !== null && countedQty === null) return "未盤點";
  if (systemQty === null && countedQty !== null) return "多出商品";

  const diff = (countedQty ?? 0) - (systemQty ?? 0);
  if (diff === 0) return "正常";
  return diff < 0 ? "短少" : "溢出";
}

export async function getDifferenceRows(sessionId: number): Promise<DifferenceRow[]> {
  const db = getDb();
  const [products, systemStocks, countedStocks] = await Promise.all([
    db.product.findMany(),
    db.systemStock.findMany({ where: { sessionId } }),
    db.countedStock.findMany({ where: { sessionId } }),
  ]);

  const productMap = new Map(products.map((product) => [product.sku, product]));
  const systemMap = new Map(systemStocks.map((stock) => [stock.sku, stock]));
  const countedMap = new Map(countedStocks.map((stock) => [stock.sku, stock]));
  const skus = Array.from(new Set([...systemMap.keys(), ...countedMap.keys()])).sort();

  return skus.map((sku) => {
    const product = productMap.get(sku);
    const system = systemMap.get(sku);
    const counted = countedMap.get(sku);
    const systemQty = system?.systemQty ?? null;
    const countedQty = counted?.countedQty ?? null;
    const difference = systemQty === null || countedQty === null ? null : countedQty - systemQty;

    return {
      sku,
      barcode: product?.barcode ?? system?.barcode ?? "",
      name: product?.name ?? "(未建商品)",
      spec: product?.spec ?? "",
      unit: product?.unit ?? "",
      category: product?.category ?? "",
      systemQty,
      countedQty,
      difference,
      countedBy: counted?.countedBy ?? "",
      note: counted?.note ?? "",
      status: getDifferenceStatus(systemQty, countedQty),
    };
  });
}
