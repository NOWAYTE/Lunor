import { NextResponse } from "next/server";
import { authClient } from "~/lib/auth-client";
import { client } from "~/lib/prisma";

const META_API_TOKEN = process.env.META_API_ACCESS_TOKEN;
const META_API_URL = process.env.META_API_URL;
const META_API_PROVISIONING_URL = process.env.META_API_PROVISIONING_URL;

// GET: search brokers & servers
export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const q = (url.searchParams.get("q") || "").trim();
    console.log("/api/broker GET q=", q);
    if (!q) return NextResponse.json({ ok: true, brokers: [], servers: [], platform: null });
    if (!META_API_TOKEN) return NextResponse.json({ ok: false, error: "META_API_CONFIG_MISSING" });
    // Known MT servers (auto-detect MT5 then MT4)
    for (const version of ["5", "4"]) {
      try {
        const endpoint = `${META_API_PROVISIONING_URL}/known-mt-servers/${version}/search?query=${encodeURIComponent(q)}`;
        console.log("Known servers request", { version, endpoint });
        const res = await fetch(endpoint, {
          headers: { "auth-token": META_API_TOKEN, Accept: "application/json" },
          cache: "no-store",
        });
        console.log("Known servers response", { version, status: res.status, ok: res.ok });
        if (!res.ok) continue;
        const json = await res.json();
        console.log("Known servers json typeof", typeof json);
        const brokers: string[] = [];
        const servers: string[] = [];

        if (Array.isArray(json)) {
          // Array of strings or objects
          for (const item of json) {
            if (typeof item === "string") {
              servers.push(item);
              continue;
            }
            if (item && typeof item === "object") {
              const srv = (item.server || item.serverName || item.name);
              const brk = (item.broker || item.brokerName || item.name);
              if (typeof srv === "string") servers.push(srv);
              if (typeof brk === "string") brokers.push(brk);
            }
          }
        } else if (json && typeof json === "object") {
          // Object keyed by broker names -> array of server strings
          for (const name in json as Record<string, unknown>) {
            if (name) brokers.push(name);
            const arr = Array.isArray((json as any)[name]) ? (json as any)[name] : [];
            for (const s of arr) {
              if (typeof s === "string") servers.push(s);
              else if (s && typeof s === "object") {
                const val = (s.server || s.serverName || s.name);
                if (typeof val === "string") servers.push(val);
              }
            }
          }
        }

        const platform = version === "5" ? "mt5" : "mt4";
        console.log("Parsed known servers", { version, platform, brokersCount: brokers.length, serversCount: servers.length });
        return NextResponse.json({ ok: true, brokers, servers, platform });
      } catch (e) { console.error("Known servers fetch error", { version, error: String(e) }); }
    }

    return NextResponse.json({ ok: true, brokers: [], servers: [], platform: null });
  } catch {
    return NextResponse.json({ ok: false, error: "BROKER_SEARCH_EXCEPTION" }, { status: 500 });
  }
}

// POST: connect account to MetaApi
export async function POST(request: Request) {
  try {
    const { accountNumber, brokerName, platform, server, password } = await request.json();

    if (!META_API_PROVISIONING_URL || !META_API_TOKEN) {
      return NextResponse.json({ ok: false, error: "MetaAPI config missing on server" }, { status: 500 });
    }

    const payload = {
      login: accountNumber,
      password,
      name: brokerName,
      server,
      platform: String(platform || '').toLowerCase(),
      magic: 123456,
      keywords: brokerName ? [brokerName] : [],
    };

    const res = await fetch(`${META_API_PROVISIONING_URL}/users/current/accounts`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        "auth-token": `${META_API_TOKEN}`,
      },
      body: JSON.stringify(payload),
      cache: "no-store",
    });

    const data = await res.json();

    // If provisioning returns 'in progress', treat as pending success so client can poll
    const isPending = res.status === 202 || data?.error === 'AcceptedError' || /in progress/i.test(String(data?.message || ''));
    if (!res.ok && !isPending) {
      const code = data?.details as string | undefined;
      let friendly = data?.message || "CONNECT_FAILED";
      if (code === 'E_SRV_NOT_FOUND') friendly = 'Server file not found for specified broker/server';
      else if (code === 'E_AUTH') friendly = 'Authentication failed. Please check login/password/server';
      else if (code === 'E_SERVER_TIMEZONE') friendly = 'Settings detection in progress or failed. Please retry later';
      return NextResponse.json({
        ok: false,
        status: res.status,
        error: data?.error || 'MetaApiError',
        message: data?.message || friendly,
        details: data?.details,
        friendly,
      }, { status: res.status });
    }

    // Persist to DB if user is authenticated; otherwise, return minimal payload
    let userId: string | undefined;
    try {
      const session = await authClient.getSession();
      userId = session?.data?.user?.id;
    } catch {}

    let brokerAccount: any;
    if (userId) {
      brokerAccount = await client.brokeraccount.upsert({
        where: { metaApiAccountId: data.id },
        create: {
          userId,
          metaApiAccountId: data.id,
          brokerName,
          platform,
          server,
          accountNumber,
          status: "INITIALIZING",
        },
        update: {
          brokerName,
          platform,
          server,
          accountNumber,
          status: "INITIALIZING",
        },
      });
    } else {
      // Minimal shape so client can proceed
      brokerAccount = {
        metaApiAccountId: data.id,
        brokerName,
        platform,
        server,
        accountNumber,
        status: "INITIALIZING",
      };
    }

    const retryAfter = res.headers.get("Retry-After") || null;
    return NextResponse.json({ ok: true, brokerAccount, pending: isPending, retryAfter, message: data?.message || null });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message || "CONNECT_EXCEPTION" }, { status: 500 });
  }
}
