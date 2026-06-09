"use client";

import { useMemo, useRef, useState } from "react";
import type { Product } from "@prisma/client";

type BarcodeDetectorConstructor = new (options?: { formats?: string[] }) => {
  detect(source: CanvasImageSource): Promise<Array<{ rawValue: string }>>;
};

function normalizeCode(value: string) {
  return value.trim().replace(/\s+/g, "");
}

export function MobileSearch({ products }: { products: Product[] }) {
  const [query, setQuery] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [scannerMessage, setScannerMessage] = useState("");
  const [isScanning, setIsScanning] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationRef = useRef<number | null>(null);

  const barcodeMap = useMemo(() => {
    const map = new Map<string, Product>();
    for (const product of products) {
      if (product.barcode) map.set(normalizeCode(product.barcode), product);
    }
    return map;
  }, [products]);

  const matches = useMemo(() => {
    const value = query.trim().toLowerCase();
    if (!value) return products.slice(0, 8);

    return products
      .filter((product) =>
        [product.sku, product.barcode, product.name, product.spec, product.category]
          .filter(Boolean)
          .some((field) => String(field).toLowerCase().includes(value)),
      )
      .slice(0, 12);
  }, [products, query]);

  function focusQuantity() {
    window.setTimeout(() => {
      const input = document.getElementById("countedQtyInput") as HTMLInputElement | null;
      input?.focus();
    }, 50);
  }

  function pickProduct(product: Product) {
    const input = document.getElementById("skuInput") as HTMLInputElement | null;
    if (input) input.value = product.sku;
    setSelectedProduct(product);
    setQuery(product.barcode || product.sku);
    focusQuantity();
  }

  function pickSku(sku: string) {
    const product = products.find((item) => item.sku === sku);
    if (product) pickProduct(product);
  }

  function stopScanner() {
    if (animationRef.current) {
      window.cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }

    for (const track of streamRef.current?.getTracks() ?? []) {
      track.stop();
    }

    streamRef.current = null;
    setIsScanning(false);
    setScannerOpen(false);
  }

  async function startScanner() {
    const BarcodeDetector = (window as unknown as { BarcodeDetector?: BarcodeDetectorConstructor }).BarcodeDetector;

    if (!BarcodeDetector) {
      setScannerMessage("此瀏覽器不支援即時條碼辨識，請改用下方搜尋或手動輸入 SKU。");
      return;
    }

    try {
      setScannerMessage("正在開啟相機...");
      setScannerOpen(true);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" } },
        audio: false,
      });
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      const detector = new BarcodeDetector({
        formats: ["ean_13", "ean_8", "code_128", "code_39", "upc_a", "upc_e"],
      });
      setIsScanning(true);
      setScannerMessage("請將商品條碼放在畫面中央。");

      const scan = async () => {
        if (!videoRef.current || !streamRef.current) return;

        try {
          const codes = await detector.detect(videoRef.current);
          const barcode = normalizeCode(codes[0]?.rawValue ?? "");

          if (barcode) {
            const product = barcodeMap.get(barcode);

            if (product) {
              pickProduct(product);
              setScannerMessage(`已掃到條碼 ${barcode}，商品已帶入。`);
              stopScanner();
              return;
            }

            setScannerMessage(`掃到條碼 ${barcode}，但商品主檔找不到。`);
          }
        } catch {
          setScannerMessage("辨識中，請稍微調整距離或光線。");
        }

        animationRef.current = window.requestAnimationFrame(scan);
      };

      animationRef.current = window.requestAnimationFrame(scan);
    } catch {
      setScannerMessage("相機開啟失敗，請確認瀏覽器相機權限後再試。");
      stopScanner();
    }
  }

  return (
    <div>
      <div className="rounded-md border border-emerald-200 bg-emerald-50 p-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-emerald-900">條碼掃描</p>
            <p className="text-xs text-emerald-800">用手機相機掃商品條碼，自動帶入 SKU。</p>
          </div>
          <button
            type="button"
            onClick={scannerOpen ? stopScanner : startScanner}
            className="shrink-0 rounded-md bg-emerald-700 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-800"
          >
            {scannerOpen ? "停止" : "掃描"}
          </button>
        </div>

        {scannerOpen ? (
          <video
            ref={videoRef}
            muted
            playsInline
            className="mt-3 aspect-video w-full rounded-md bg-black object-cover"
          />
        ) : null}

        {scannerMessage ? (
          <p className={`mt-2 text-sm ${isScanning ? "text-emerald-800" : "text-stone-600"}`}>{scannerMessage}</p>
        ) : null}
      </div>

      <label className="mt-4 block text-sm font-semibold" htmlFor="searchProduct">
        搜尋商品
      </label>
      <input
        id="searchProduct"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="輸入 SKU、條碼或品名"
        className="mt-2 w-full rounded-md border border-stone-300 px-3 py-3"
      />

      {selectedProduct ? (
        <div className="mt-3 rounded-md border border-emerald-200 bg-white p-3 text-sm">
          <p className="font-semibold text-emerald-900">
            已選擇：{selectedProduct.sku} {selectedProduct.name}
          </p>
          <p className="mt-1 text-stone-600">
            條碼 {selectedProduct.barcode || "無"} {selectedProduct.spec || ""}
          </p>
        </div>
      ) : null}

      <div className="mt-3 max-h-64 overflow-auto rounded-md border border-stone-200">
        {matches.map((product) => (
          <button
            key={product.id}
            type="button"
            onClick={() => pickSku(product.sku)}
            className="block w-full border-b border-stone-100 px-3 py-3 text-left last:border-0 hover:bg-emerald-50"
          >
            <span className="block font-semibold">
              {product.sku} {product.name}
            </span>
            <span className="block text-sm text-stone-500">
              {product.barcode || "無條碼"} {product.spec || ""}
            </span>
          </button>
        ))}
        {matches.length === 0 ? (
          <p className="px-3 py-4 text-sm text-stone-500">找不到商品，可直接輸入 SKU 盤點為多出商品。</p>
        ) : null}
      </div>
    </div>
  );
}
