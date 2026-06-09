import Link from "next/link";
import { adminLogin, adminLogout, createProduct, createSession, updateSessionStatus } from "@/app/actions";
import { getDifferenceRows } from "@/lib/compare";
import { isAdminAuthenticated } from "@/lib/auth";
import { getDb } from "@/lib/db";

const statusClass: Record<string, string> = {
  正常: "bg-emerald-100 text-emerald-800",
  短少: "bg-red-100 text-red-800",
  溢出: "bg-amber-100 text-amber-800",
  未盤點: "bg-stone-200 text-stone-800",
  多出商品: "bg-sky-100 text-sky-800",
};

function AdminLogin({ failed }: { failed: boolean }) {
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-5">
      <div className="rounded-lg border border-stone-300 bg-white p-6 shadow-sm">
        <Link href="/" className="text-sm text-stone-500 hover:text-stone-800">
          回首頁
        </Link>
        <h1 className="mt-3 text-2xl font-bold">後台登入</h1>
        <p className="mt-1 text-sm text-stone-600">請輸入管理者密碼後再使用盤點後台。</p>
        {failed ? (
          <p className="mt-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">密碼錯誤，請再試一次。</p>
        ) : null}
        <form action={adminLogin} className="mt-4 grid gap-3">
          <input
            name="password"
            required
            type="password"
            placeholder="管理者密碼"
            className="rounded-md border border-stone-300 px-3 py-3"
          />
          <button className="rounded-md bg-stone-900 px-4 py-3 font-semibold text-white hover:bg-stone-700">登入後台</button>
        </form>
      </div>
    </main>
  );
}

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ sessionId?: string; imported?: string; productsImported?: string; login?: string }>;
}) {
  const params = await searchParams;

  if (!(await isAdminAuthenticated())) {
    return <AdminLogin failed={params.login === "failed"} />;
  }

  const db = getDb();
  const [sessions, products] = await Promise.all([
    db.inventorySession.findMany({ orderBy: { createdAt: "desc" } }),
    db.product.findMany({ orderBy: { sku: "asc" }, take: 50 }),
  ]);
  const selectedSessionId = Number(params.sessionId ?? sessions[0]?.id ?? 0);
  const selectedSession = sessions.find((session) => session.id === selectedSessionId);
  const rows = selectedSessionId ? await getDifferenceRows(selectedSessionId) : [];
  const summary = rows.reduce<Record<string, number>>((acc, row) => {
    acc[row.status] = (acc[row.status] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <main className="mx-auto max-w-7xl px-4 py-5 sm:px-6">
      <header className="flex flex-col gap-3 border-b border-stone-300 pb-4 md:flex-row md:items-end md:justify-between">
        <div>
          <Link href="/" className="text-sm text-stone-500 hover:text-stone-800">
            回首頁
          </Link>
          <h1 className="mt-2 text-2xl font-bold">後台管理</h1>
          <p className="mt-1 text-sm text-stone-600">建立盤點單、匯入 Excel、查看差異並匯出報表。</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {selectedSession ? (
            <a
              href={`/api/export/${selectedSession.id}`}
              className="inline-flex h-11 items-center justify-center rounded-md bg-emerald-700 px-4 text-sm font-semibold text-white hover:bg-emerald-800"
            >
              匯出 Excel 差異表
            </a>
          ) : null}
          <form action={adminLogout}>
            <button className="h-11 rounded-md border border-stone-300 px-4 text-sm font-semibold hover:bg-stone-100">登出</button>
          </form>
        </div>
      </header>

      {params.imported ? (
        <div className="mt-4 rounded-md border border-emerald-300 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          已匯入 {params.imported} 筆系統庫存。
        </div>
      ) : null}
      {params.productsImported ? (
        <div className="mt-4 rounded-md border border-sky-300 bg-sky-50 px-4 py-3 text-sm text-sky-800">
          已清除原本商品，並匯入 {params.productsImported} 筆商品主檔。
        </div>
      ) : null}

      <section className="mt-5 grid gap-4 lg:grid-cols-[360px_1fr]">
        <div className="space-y-4">
          <form action={createSession} className="rounded-lg border border-stone-300 bg-white p-4 shadow-sm">
            <h2 className="text-lg font-semibold">建立盤點單</h2>
            <div className="mt-3 space-y-3">
              <input name="title" required placeholder="盤點單名稱，例如 2026/06 小倉庫" className="w-full rounded-md border border-stone-300 px-3 py-2" />
              <input name="month" required placeholder="月份，例如 2026-06" className="w-full rounded-md border border-stone-300 px-3 py-2" />
              <select name="status" className="w-full rounded-md border border-stone-300 px-3 py-2">
                <option value="open">進行中</option>
                <option value="closed">已結束</option>
              </select>
              <button className="w-full rounded-md bg-stone-900 px-4 py-2 font-semibold text-white hover:bg-stone-700">建立</button>
            </div>
          </form>

          <div className="rounded-lg border border-stone-300 bg-white p-4 shadow-sm">
            <h2 className="text-lg font-semibold">商品管理</h2>
            <form action="/api/products/import" method="post" encType="multipart/form-data" className="mt-3 grid gap-2 rounded-md border border-sky-200 bg-sky-50 p-3">
              <label className="text-sm font-semibold text-sky-900">匯入商品主檔</label>
              <input name="file" required type="file" accept=".ods,.xlsx,.xls,.csv" className="rounded-md border border-sky-200 bg-white px-3 py-2" />
              <button className="rounded-md bg-sky-700 px-4 py-2 font-semibold text-white hover:bg-sky-800">清除原商品並匯入</button>
            </form>
            <form action={createProduct} className="mt-3 grid gap-3">
              <input name="sku" required placeholder="SKU 商品編號" className="rounded-md border border-stone-300 px-3 py-2" />
              <input name="barcode" placeholder="Barcode 條碼" className="rounded-md border border-stone-300 px-3 py-2" />
              <input name="name" required placeholder="品名" className="rounded-md border border-stone-300 px-3 py-2" />
              <input name="spec" placeholder="規格" className="rounded-md border border-stone-300 px-3 py-2" />
              <div className="grid grid-cols-2 gap-3">
                <input name="unit" placeholder="單位" className="rounded-md border border-stone-300 px-3 py-2" />
                <input name="category" placeholder="分類" className="rounded-md border border-stone-300 px-3 py-2" />
              </div>
              <button className="rounded-md bg-sky-700 px-4 py-2 font-semibold text-white hover:bg-sky-800">新增或更新商品</button>
            </form>
          </div>

          <div className="rounded-lg border border-stone-300 bg-white p-4 shadow-sm">
            <h2 className="text-lg font-semibold">商品清單</h2>
            <div className="mt-3 max-h-64 overflow-auto text-sm">
              {products.map((product) => (
                <div key={product.id} className="border-b border-stone-100 py-2">
                  <p className="font-semibold">
                    {product.sku} {product.name}
                  </p>
                  <p className="text-stone-500">
                    {product.barcode || "無條碼"} {product.spec || ""}
                  </p>
                </div>
              ))}
              {products.length === 0 ? <p className="text-stone-500">尚無商品，可手動新增或由 Excel 匯入建立。</p> : null}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-lg border border-stone-300 bg-white p-4 shadow-sm">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-lg font-semibold">盤點單</h2>
                <p className="text-sm text-stone-600">選擇盤點單後匯入庫存、查看比對結果。</p>
              </div>
              <form action="/admin" className="flex gap-2">
                <select name="sessionId" defaultValue={selectedSessionId || ""} className="rounded-md border border-stone-300 px-3 py-2">
                  {sessions.map((session) => (
                    <option key={session.id} value={session.id}>
                      {session.title}
                    </option>
                  ))}
                </select>
                <button className="rounded-md border border-stone-300 px-3 py-2 font-semibold">切換</button>
              </form>
            </div>

            {selectedSession ? (
              <div className="mt-4 grid gap-3 md:grid-cols-[1fr_1fr]">
                <form action={updateSessionStatus} className="flex gap-2">
                  <input type="hidden" name="sessionId" value={selectedSession.id} />
                  <select name="status" defaultValue={selectedSession.status} className="min-w-0 flex-1 rounded-md border border-stone-300 px-3 py-2">
                    <option value="open">進行中</option>
                    <option value="closed">已結束</option>
                  </select>
                  <button className="rounded-md bg-stone-900 px-4 py-2 font-semibold text-white">更新狀態</button>
                </form>
                <form action="/api/import" method="post" encType="multipart/form-data" className="flex gap-2">
                  <input type="hidden" name="sessionId" value={selectedSession.id} />
                  <input name="file" required type="file" accept=".xlsx,.xls,.csv" className="min-w-0 flex-1 rounded-md border border-stone-300 px-3 py-2" />
                  <button className="rounded-md bg-sky-700 px-4 py-2 font-semibold text-white">匯入</button>
                </form>
              </div>
            ) : (
              <p className="mt-4 text-sm text-stone-500">請先建立盤點單。</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
            {["正常", "短少", "溢出", "未盤點", "多出商品"].map((status) => (
              <div key={status} className="rounded-lg border border-stone-300 bg-white p-3 shadow-sm">
                <p className="text-sm text-stone-500">{status}</p>
                <p className="mt-1 text-2xl font-bold">{summary[status] ?? 0}</p>
              </div>
            ))}
          </div>

          <div className="overflow-hidden rounded-lg border border-stone-300 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[980px] text-left text-sm">
                <thead className="bg-stone-100 text-stone-700">
                  <tr>
                    <th className="px-3 py-2">狀態</th>
                    <th className="px-3 py-2">SKU</th>
                    <th className="px-3 py-2">品名</th>
                    <th className="px-3 py-2">條碼</th>
                    <th className="px-3 py-2 text-right">系統數</th>
                    <th className="px-3 py-2 text-right">實盤數</th>
                    <th className="px-3 py-2 text-right">差異</th>
                    <th className="px-3 py-2">盤點人員</th>
                    <th className="px-3 py-2">備註</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr key={row.sku} className="border-t border-stone-100">
                      <td className="px-3 py-2">
                        <span className={`rounded-full px-2 py-1 text-xs font-semibold ${statusClass[row.status]}`}>{row.status}</span>
                      </td>
                      <td className="px-3 py-2 font-mono">{row.sku}</td>
                      <td className="px-3 py-2">{row.name}</td>
                      <td className="px-3 py-2">{row.barcode}</td>
                      <td className="px-3 py-2 text-right">{row.systemQty ?? "-"}</td>
                      <td className="px-3 py-2 text-right">{row.countedQty ?? "-"}</td>
                      <td className="px-3 py-2 text-right">{row.difference ?? "-"}</td>
                      <td className="px-3 py-2">{row.countedBy}</td>
                      <td className="px-3 py-2">{row.note}</td>
                    </tr>
                  ))}
                  {rows.length === 0 ? (
                    <tr>
                      <td className="px-3 py-8 text-center text-stone-500" colSpan={9}>
                        尚無比對資料，請先匯入系統庫存或由手機盤點。
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
