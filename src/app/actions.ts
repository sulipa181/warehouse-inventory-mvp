"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { assertAdminAuthenticated, checkAdminPassword, clearAdminSession, setAdminSession } from "@/lib/auth";
import { getDb } from "@/lib/db";

function requiredText(formData: FormData, key: string) {
  const value = String(formData.get(key) ?? "").trim();
  if (!value) throw new Error(`${key} is required`);
  return value;
}

function intValue(formData: FormData, key: string) {
  const value = Number(formData.get(key));
  if (!Number.isInteger(value) || value < 0) throw new Error(`${key} must be a positive integer`);
  return value;
}

export async function createProduct(formData: FormData) {
  await assertAdminAuthenticated();
  const db = getDb();
  const sku = requiredText(formData, "sku");

  await db.product.upsert({
    where: { sku },
    update: {
      barcode: String(formData.get("barcode") ?? "").trim() || null,
      name: requiredText(formData, "name"),
      spec: String(formData.get("spec") ?? "").trim() || null,
      unit: String(formData.get("unit") ?? "").trim() || null,
      category: String(formData.get("category") ?? "").trim() || null,
    },
    create: {
      sku,
      barcode: String(formData.get("barcode") ?? "").trim() || null,
      name: requiredText(formData, "name"),
      spec: String(formData.get("spec") ?? "").trim() || null,
      unit: String(formData.get("unit") ?? "").trim() || null,
      category: String(formData.get("category") ?? "").trim() || null,
    },
  });

  revalidatePath("/admin");
  redirect("/admin");
}

export async function createSession(formData: FormData) {
  await assertAdminAuthenticated();
  const db = getDb();

  await db.inventorySession.create({
    data: {
      title: requiredText(formData, "title"),
      month: requiredText(formData, "month"),
      status: String(formData.get("status") ?? "open"),
    },
  });

  revalidatePath("/admin");
  redirect("/admin");
}

export async function updateSessionStatus(formData: FormData) {
  await assertAdminAuthenticated();
  const db = getDb();
  const id = Number(formData.get("sessionId"));
  const status = String(formData.get("status") ?? "open");

  await db.inventorySession.update({
    where: { id },
    data: { status },
  });

  revalidatePath("/admin");
  redirect("/admin");
}

export async function saveCount(formData: FormData) {
  const db = getDb();
  const sessionId = Number(formData.get("sessionId"));
  const sku = requiredText(formData, "sku");
  const countedQty = intValue(formData, "countedQty");
  const countedBy = requiredText(formData, "countedBy");
  const note = String(formData.get("note") ?? "").trim() || null;

  await db.countedStock.upsert({
    where: { sessionId_sku: { sessionId, sku } },
    update: { countedQty, countedBy, note },
    create: { sessionId, sku, countedQty, countedBy, note },
  });

  revalidatePath("/mobile");
  revalidatePath("/admin");
  redirect(`/mobile?sessionId=${sessionId}&countedBy=${encodeURIComponent(countedBy)}&saved=${sku}`);
}

export async function adminLogin(formData: FormData) {
  const password = String(formData.get("password") ?? "");

  if (!checkAdminPassword(password)) {
    redirect("/admin?login=failed");
  }

  await setAdminSession();
  redirect("/admin");
}

export async function adminLogout() {
  await clearAdminSession();
  redirect("/admin");
}
