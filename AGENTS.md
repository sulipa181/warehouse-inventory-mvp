# 小倉庫手機盤點系統

## 目標

建立手機盤點系統，取代紙本盤點。可用手機輸入實際庫存，後台匯入公司 Excel 庫存報表，自動比對差異，並匯出 Excel 差異表。

## 角色

管理者：

* 商品管理
* 建立盤點單
* 匯入系統庫存 Excel
* 查看盤點結果
* 比對差異
* 匯出 Excel

盤點人員：

* 手機登入
* 選擇盤點單
* 搜尋商品
* 輸入實際數量
* 儲存盤點資料

## 第一版功能

* 登入
* 商品管理
* 盤點單管理
* 手機盤點頁
* Excel 匯入
* 庫存差異比對
* Excel 匯出

## 技術

使用 Next.js、TypeScript、Tailwind CSS、Prisma、SQLite、xlsx。
第一版以簡單可用為主，不要過度設計。

## 主要資料

商品：
sku、barcode、name、spec、unit、category

盤點單：
title、month、status

系統庫存：
session_id、sku、system_qty

實際盤點：
session_id、sku、counted_qty、counted_by、note

## 比對規則

以 sku 商品編號為主要比對欄位，barcode 為輔助。不要只用品名比對。

差異 = 實際盤點數量 - 系統庫存數量

狀態：

* 正常：差異 = 0
* 短少：差異 < 0
* 溢出：差異 > 0
* 未盤點：系統有，實點無
* 多出商品：實點有，系統無

## 不做

第一版不做 ERP 串接、拍照、離線模式、多倉庫、批號、效期、原生 App。
