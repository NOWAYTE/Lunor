import { NextResponse } from "next/server";
import { auth } from "~/lib/auth";
import { headers } from "next/headers";
import { onSubmitBrokerDetails } from "~/actions/settings";

const META_API_ACCESS_TOKEN = process.env.META_API_ACCESS_TOKEN;
const META_API_URL = process.env.META_API_URL;
const META_API_PROVISIONING_URL = process.env.META_API_PROVISIONING_URL;

const MAIG_NUMBER = 123456;

type BrokerDetails = {
  userId: string;
  accountNumber: string;
  brokerName: string;
  platform: string;
  server: string;
  password: string;
  region: string;
  magic: number;
  transactionId: string;
};

function generateTransactionId(): string {
  return Array.from({ length: 32 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const q = (url.searchParams.get("q") || "").trim();
    console.log("/api/broker GET q=", q);

    if (!q)
      return NextResponse.json({
        ok: true,
        brokers: [],
        servers: [],
        platform: null,
      });

    if (!META_API_ACCESS_TOKEN)
      return NextResponse.json({ ok: false, error: "META_API_CONFIG_MISSING" });

    // Try MT5 then MT4
    for (const version of ["5", "4"]) {
      try {
        const endpoint = `${META_API_PROVISIONING_URL}/known-mt-servers/${version}/search?query=${encodeURIComponent(
          q
        )}`;

        console.log("Known servers request", { version, endpoint });

        const res = await fetch(endpoint, {
          headers: { "auth-token": META_API_ACCESS_TOKEN, Accept: "application/json" },
          cache: "no-store",
        });

        console.log("Known servers response", {
          version,
          status: res.status,
          ok: res.ok,
        });

        if (!res.ok) continue;

        const json = await res.json();
        const brokers: string[] = [];
        const servers: string[] = [];

        if (Array.isArray(json)) {
          for (const item of json) {
            if (typeof item === "string") {
              servers.push(item);
            } else if (item && typeof item === "object") {
              const srv = item.server || item.serverName || item.name;
              const brk = item.broker || item.brokerName || item.name;

              if (srv) servers.push(srv);
              if (brk) brokers.push(brk);
            }
          }
        } else if (json && typeof json === "object") {
          for (const name in json) {
            if (name) brokers.push(name);

            const arr = Array.isArray((json as any)[name])
              ? (json as any)[name]
              : [];

            for (const s of arr) {
              if (typeof s === "string") servers.push(s);
              else if (s && typeof s === "object") {
                const val = s.server || s.serverName || s.name;
                if (val) servers.push(val);
              }
            }
          }
        }

        const platform = version === "5" ? "mt5" : "mt4";

        console.log("Parsed known servers", {
          version,
          platform,
          brokersCount: brokers.length,
          serversCount: servers.length,
        });

        return NextResponse.json({ ok: true, brokers, servers, platform });
      } catch (e) {
        console.error("Known servers fetch error", {
          version,
          error: String(e),
        });
      }
    }

    return NextResponse.json({
      ok: true,
      brokers: [],
      servers: [],
      platform: null,
    });
  } catch {
    return NextResponse.json(
      { ok: false, error: "BROKER_SEARCH_EXCEPTION" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    // 1️⃣ Get the current session
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.id) {
      return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
    }
    const userId = session.user.id;

    // 2️⃣ Parse request body
    const body = await request.json();
    const { accountNumber, brokerName, platform, server, password } = body;

    if (!accountNumber || !brokerName || !platform || !server || !password) {
      return NextResponse.json({ ok: false, error: "MISSING_FIELDS" }, { status: 400 });
    }
    const transactionId = crypto.randomUUID().replace(/-/g, "");

    const brokerDetails: BrokerDetails = {
      userId,
      accountNumber,
      brokerName,
      platform,
      server,
      password,
      region: "london",
      magic: MAIG_NUMBER,
      transactionId,
    };

    // 3️⃣ Call MetaAPI
    const response = await fetch(`${META_API_PROVISIONING_URL}/users/current/accounts`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "auth-token": META_API_ACCESS_TOKEN!,
        "transaction-id": transactionId,
      },
      body: JSON.stringify({
        login: accountNumber,
        password,
        name: brokerName,
        server,
        platform,
        magic: MAIG_NUMBER,
        keywords: [brokerName],
      }),
    });

    // ✅ Read the body once
    const data = await response.json();

    if (!response.ok) {
      console.error("MetaAPI returned an error:", data);
      throw new Error(data.error || "META_API_ERROR");
    }

    const metaApiAccountId = data.id;
    const state = data.state;

    // 4️⃣ Insert into DB & log result
    try {
      const dbResult = await onSubmitBrokerDetails({
        ...brokerDetails,
        metaApiAccountId,
        status: state,
      });
      console.log("DB insertion successful:", dbResult);
    } catch (dbError) {
      console.error("Error inserting broker into DB:", dbError);
      throw dbError; // rethrow so the frontend sees the failure
    }

    // 5️⃣ Return to frontend
    return NextResponse.json({
      ok: true,
      brokerAccount: { metaApiAccountId, status: state, transactionId },
    });
  } catch (error: any) {
    console.error("Error submitting broker data:", error);
    return NextResponse.json(
      { ok: false, error: error.message || "BROKER_SUBMIT_EXCEPTION" },
      { status: 500 }
    );
  }
}

