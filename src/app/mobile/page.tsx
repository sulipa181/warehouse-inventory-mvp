import Link from "next/link";
import { saveCount } from "@/app/actions";
import { getDb } from "@/lib/db";
import { MobileSearch } from "./search";

export default async function MobilePage({
  searchParams,
}: {
  searchParams: Promise<{ sessionId?: string; countedBy?: string; saved?: string }>;
}) {
  const params = await searchParams;
  const db = getDb();
  const [sessions, products, recentCounts] = await Promise.all([
    db.inventorySession.findMany({ where: { status: "open" }, orderBy: { createdAt: "desc" } }),
    db.product.findMany({ orderBy: { sku: "asc" } }),
    params.sessionId
      ? db.countedStock.findMany({
          where: { sessionId: Number(params.sessionId) },
          orderBy: { updatedAt: "desc" },
          take: 8,
        })
      : Promise.resolve([]),
  ]);
  const sessionId = Number(params.sessionId ?? sessions[0]?.id ?? 0);
  const countedBy = params.countedBy ?? "";

  return (
    <main className="mx-auto min-h-screen max-w-xl px-4 py-5">
      <header className="border-b border-stone-300 pb-4">
        <Link href="/" className="text-sm text-stone-500 hover:text-stone-800">
          回首頁
        </Link>
        <h1 className="mt-2 text-2xl font-bold">手機盤點</h1>
        <p className="mt-1 text-sm text-stone-600">
          輸入姓名、選擇盤點單，掃描商品條碼或搜尋商品後輸入實際數量。
        </p>
      </header>

      {params.saved ? (
        <div className="mt-4 rounded-md border border-emerald-300 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          已儲存 {params.saved} 的盤點數量。
        </div>
      ) : null}

      <form action="/mobile" className="mt-4 rounded-lg border border-stone-300 bg-white p-4 shadow-sm">
        <div className="grid gap-3">
          <input
            name="countedBy"
            required
            defaultValue={countedBy}
            placeholder="盤點人員姓名"
            className="rounded-md border border-stone-300 px-3 py-3"
          />
          <select name="sessionId" defaultValue={sessionId || ""} className="rounded-md border border-stone-300 px-3 py-3">
            {sessions.map((session) => (
              <option key={session.id} value={session.id}>
                {session.title}
              </option>
            ))}
          </select>
          <button className="rounded-md bg-stone-900 px-4 py-3 font-semibold text-white">登入 / 切換盤點單</button>
        </div>
      </form>

      {sessionId && countedBy ? (
        <section className="mt-4 rounded-lg border border-stone-300 bg-white p-4 shadow-sm">
          <MobileSearch products={products} />
          <form action={saveCount} className="mt-4 grid gap-3">
            <input type="hidden" name="sessionId" value={sessionId} />
            <input type="hidden" name="countedBy" value={countedBy} />
            <input
              id="skuInput"
              name="sku"
              required
              placeholder="SKU 商品編號"
              className="rounded-md border border-stone-300 px-3 py-3 font-mono"
            />
            <input
              id="countedQtyInput"
              name="countedQty"
              required
              type="number"
              min="0"
              inputMode="numeric"
              placeholder="實際盤點數量"
              className="rounded-md border border-stone-300 px-3 py-3"
            />
            <textarea name="note" placeholder="備註，可留空" className="min-h-20 rounded-md border border-stone-300 px-3 py-3" />
            <button className="rounded-md bg-emerald-700 px-4 py-3 font-semibold text-white">儲存盤點數量</button>
          </form>
        </section>
      ) : (
        <div className="mt-4 rounded-lg border border-stone-300 bg-white p-4 text-sm text-stone-600 shadow-sm">
          請先輸入姓名並選擇進行中的盤點單。若沒有盤點單，請到後台建立。
        </div>
      )}

      <section className="mt-4 rounded-lg border border-stone-300 bg-white p-4 shadow-sm">
        <h2 className="font-semibold">最近儲存</h2>
        <div className="mt-2 space-y-2 text-sm">
          {recentCounts.map((count) => (
            <div key={count.id} className="flex justify-between border-b border-stone-100 pb-2">
              <span className="font-mono">{count.sku}</span>
              <span>{count.countedQty}</span>
            </div>
          ))}
          {recentCounts.length === 0 ? <p className="text-stone-500">尚無盤點紀錄。</p> : null}
        </div>
      </section>
    </main>
  );
}
