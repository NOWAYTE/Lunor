import { NextResponse } from "next/server";

const META_API_TOKEN = process.env.META_API_ACCESS_TOKEN;
const META_API_URL = process.env.META_API_URL; // e.g. https://mt-client-api-v1.agiliumtrade.agiliumtrade.ai

export async function GET(
  _request: Request,
  { params }: { params: { id: string } } // destructure params per Next.js requirement
) {
  try {
    const id = params.id;
    if (!id)
      return NextResponse.json({ ok: false, error: "MISSING_ID" }, { status: 400 });

    if (!META_API_URL || !META_API_TOKEN) {
      return NextResponse.json(
        { ok: false, error: "META_API_CLIENT_CONFIG_MISSING" },
        { status: 500 }
      );
    }

    const res = await fetch(
      `${META_API_URL}/users/current/accounts/${encodeURIComponent(id)}`,
      {
        method: "GET",
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${META_API_TOKEN}`,
        },
        cache: "no-store",
      }
    );

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      return NextResponse.json(
        {
          ok: false,
          statusCode: res.status,
          error: data?.message || "STATUS_FETCH_FAILED",
          details: data?.details ?? null,
        },
        { status: res.status }
      );
    }

    // Normalize status for client
    const rawState: string = String(data?.state || "");
    let status: string = rawState || "UNKNOWN";

    return NextResponse.json({ ok: true, status, rawState });
  } catch (e: any) {
    console.error("GET /api/broker/status/[id] exception:", e);
    return NextResponse.json(
      { ok: false, error: e?.message || "STATUS_ROUTE_EXCEPTION" },
      { status: 500 }
    );
  }
}
