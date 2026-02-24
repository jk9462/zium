import { NextResponse } from "next/server";

const AIRTABLE_URL = process.env.AIRTABLE_WEBHOOK_URL;

const bucket = new Map<string, { count: number; ts: number }>();
const WINDOW_MS = 60_000;
const MAX_PER_WINDOW = 20;

function rateLimit(key: string) {
  const now = Date.now();
  const item = bucket.get(key);
  if (!item || now - item.ts > WINDOW_MS) {
    bucket.set(key, { count: 1, ts: now });
    return true;
  }
  if (item.count >= MAX_PER_WINDOW) return false;
  item.count += 1;
  return true;
}

export async function POST(req: Request) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (!rateLimit(ip)) {
    return NextResponse.json({ ok: false, error: "rate_limited" }, { status: 429 });
  }

  let body: any = {};
  try { body = await req.json(); } catch { body = {}; }
  const { email, plan, leakCount } = body;

  if (typeof email !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ ok: false, error: "invalid_email" }, { status: 400 });
  }

  const allowed = new Set(["annual", "monthly", "onetime"]);
  const safePlan = allowed.has(plan) ? plan : "annual";
  const safeLeakCount = typeof leakCount === "number" && leakCount >= 0 && leakCount <= 200 ? leakCount : null;

  if (AIRTABLE_URL) {
    const payload = {
      email: email,
      plan: safePlan,
      leakCount: safeLeakCount,
      timestamp: new Date().toISOString(),
      source: "beta_landing"
    };
    try {
      const res = await fetch(AIRTABLE_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (!res.ok) {
        return NextResponse.json({ ok: false, error: "upstream_failed" }, { status: 502 });
      }
    } catch {
      return NextResponse.json({ ok: false, error: "upstream_failed" }, { status: 502 });
    }
  }

  return NextResponse.json({ ok: true });
}
