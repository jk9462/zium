import { NextResponse } from "next/server";

const HIBP_API_KEY = process.env.HIBP_API_KEY;
const HIBP_BASE = "https://haveibeenpwned.com/api/v3";

const bucket = new Map();
const WINDOW_MS = 60000;
const MAX_PER_WINDOW = 10;

function rateLimit(key) {
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

export async function POST(req) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (!rateLimit(ip)) {
    return NextResponse.json({ ok: false, error: "rate_limited" }, { status: 429 });
  }

  if (!HIBP_API_KEY) {
    return NextResponse.json({ ok: false, error: "api_key_missing" }, { status: 500 });
  }

  let body = {};
  try { body = await req.json(); } catch { body = {}; }
  const { email, phone } = body;
  const account = email || phone;

  if (!account || typeof account !== "string") {
    return NextResponse.json({ ok: false, error: "invalid_input" }, { status: 400 });
  }

  try {
    const hibpRes = await fetch(
      `${HIBP_BASE}/breachedaccount/${encodeURIComponent(account)}?truncateResponse=false`,
      {
        headers: {
          "hibp-api-key": HIBP_API_KEY,
          "user-agent": "Zium-Privacy-Service",
        },
      }
    );

    if (hibpRes.status === 404) {
      return NextResponse.json({
        ok: true, breaches: [], totalBreaches: 0,
        dataClasses: [], summary: { sites: 0, records: 0, dataTypes: 0, critical: 0 }
      });
    }

    if (!hibpRes.ok) {
      return NextResponse.json({ ok: false, error: "hibp_api_error" }, { status: 502 });
    }

    const breaches = await hibpRes.json();
    const allDataClasses = new Set();
    let totalRecords = 0;
    let criticalCount = 0;

    const processedBreaches = breaches.map((b) => {
      (b.DataClasses || []).forEach((dc) => allDataClasses.add(dc));
      totalRecords += b.PwnCount || 0;
      const hasPwd = (b.DataClasses || []).some((dc) =>
        dc.toLowerCase().includes("password") || dc.toLowerCase().includes("credential")
      );
      const hasFinancial = (b.DataClasses || []).some((dc) =>
        dc.toLowerCase().includes("credit") || dc.toLowerCase().includes("bank")
      );
      if (hasPwd || hasFinancial) criticalCount++;
      return {
        name: b.Name, title: b.Title, domain: b.Domain,
        breachDate: b.BreachDate, pwnCount: b.PwnCount,
        dataClasses: b.DataClasses || [], isVerified: b.IsVerified,
        severity: hasPwd || hasFinancial ? "critical" : "high",
      };
    });

    processedBreaches.sort((a, b) => new Date(b.breachDate).getTime() - new Date(a.breachDate).getTime());

    return NextResponse.json({
      ok: true, breaches: processedBreaches,
      totalBreaches: processedBreaches.length,
      dataClasses: Array.from(allDataClasses),
      summary: { sites: processedBreaches.length, records: totalRecords, dataTypes: allDataClasses.size, critical: criticalCount }
    });
  } catch (err) {
    return NextResponse.json({ ok: false, error: "scan_failed" }, { status: 500 });
  }
}
