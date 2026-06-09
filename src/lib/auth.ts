import crypto from "node:crypto";
import { cookies } from "next/headers";
import type { NextRequest } from "next/server";

const COOKIE_NAME = "admin_session";

function getAdminPassword() {
  return process.env.ADMIN_PASSWORD || "admin123";
}

function getAdminToken() {
  return crypto.createHash("sha256").update(`warehouse-inventory:${getAdminPassword()}`).digest("hex");
}

export async function isAdminAuthenticated() {
  const cookieStore = await cookies();
  return cookieStore.get(COOKIE_NAME)?.value === getAdminToken();
}

export async function assertAdminAuthenticated() {
  if (!(await isAdminAuthenticated())) {
    throw new Error("Admin authentication required.");
  }
}

export function isAdminRequest(request: NextRequest) {
  return request.cookies.get(COOKIE_NAME)?.value === getAdminToken();
}

export async function setAdminSession() {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, getAdminToken(), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 12,
  });
}

export async function clearAdminSession() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

export function checkAdminPassword(password: string) {
  return password === getAdminPassword();
}
