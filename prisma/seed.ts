import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

async function main() {
  const session = await db.inventorySession.upsert({
    where: { id: 1 },
    update: {},
    create: {
      title: "2026-06 小倉庫盤點",
      month: "2026-06",
      status: "open",
    },
  });

  const products = [
    { sku: "A001", barcode: "4710000000011", name: "充電線", spec: "USB-C 1m", unit: "條", category: "配件", systemQty: 20 },
    { sku: "A002", barcode: "4710000000028", name: "保護殼", spec: "透明", unit: "個", category: "配件", systemQty: 12 },
    { sku: "B001", barcode: "4710000000035", name: "行動電源", spec: "10000mAh", unit: "台", category: "3C", systemQty: 6 },
  ];

  for (const product of products) {
    const { systemQty, ...productData } = product;

    await db.product.upsert({
      where: { sku: product.sku },
      update: productData,
      create: productData,
    });

    await db.systemStock.upsert({
      where: { sessionId_sku: { sessionId: session.id, sku: product.sku } },
      update: { barcode: product.barcode, systemQty },
      create: {
        sessionId: session.id,
        sku: product.sku,
        barcode: product.barcode,
        systemQty,
      },
    });
  }
}

main()
  .finally(async () => {
    await db.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await db.$disconnect();
    process.exit(1);
  });
