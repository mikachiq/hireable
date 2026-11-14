"use client";

export type StoredApplication = { id: string; company: string; role: string; status: "Saved" | "Preparing" | "Applied" | "Interview"; updatedAt: string };
const key = "hireable-applications";

export function getApplications(): StoredApplication[] {
  if (typeof window === "undefined") return [];
  try { return JSON.parse(window.localStorage.getItem(key) ?? "[]"); } catch { return []; }
}

export function saveApplication(application: StoredApplication) {
  const items = getApplications().filter((item) => item.id !== application.id);
  window.localStorage.setItem(key, JSON.stringify([application, ...items]));
}
