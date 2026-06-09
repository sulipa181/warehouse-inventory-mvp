import Link from "next/link";

export default function Home() {
  return (
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col justify-center px-5 py-10">
      <div className="grid gap-5 md:grid-cols-2">
        <Link
          href="/mobile"
          className="rounded-lg border border-stone-300 bg-white p-6 shadow-sm transition hover:border-emerald-500"
        >
          <p className="text-sm font-semibold text-emerald-700">盤點人員</p>
          <h1 className="mt-2 text-3xl font-bold">手機盤點</h1>
          <p className="mt-3 text-stone-600">登入姓名、選擇盤點單、搜尋商品並輸入實際數量。</p>
        </Link>
        <Link
          href="/admin"
          className="rounded-lg border border-stone-300 bg-white p-6 shadow-sm transition hover:border-sky-500"
        >
          <p className="text-sm font-semibold text-sky-700">管理者</p>
          <h2 className="mt-2 text-3xl font-bold">後台管理</h2>
          <p className="mt-3 text-stone-600">建立商品與盤點單、匯入 Excel、查看與匯出差異表。</p>
        </Link>
      </div>
    </main>
  );
}
