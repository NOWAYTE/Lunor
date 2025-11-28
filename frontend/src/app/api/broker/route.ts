import { NextResponse } from "next/server";
import { auth } from "~/lib/auth";
import { headers } from "next/headers";
import { onSubmitBrokerDetails } from "~/actions/settings";
import { BrokerAccountStatus } from "@prisma/client";

const META_API_ACCESS_TOKEN = process.env.META_API_ACCESS_TOKEN;
const META_API_URL = process.env.META_API_URL;
const META_API_PROVISIONING_URL = process.env.META_API_PROVISIONING_URL;

const MAX_POLLING_ATTEMPTS = 30;
const POLLING_DELAY_MS = 2000;

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
      
    // FIX: ADDED DEBUG LOG - If this log is NOT seen, the error is synchronous (e.g., META_API_PROVISIONING_URL undefined)
    console.log("Starting MT search loop. Provisioning URL set:", !!META_API_PROVISIONING_URL);

    // Try MT5 then MT4
    for (const version of ["5", "4"]) {
      try {
        const endpoint = `${META_API_PROVISIONING_URL}/known-mt-servers/${version}/search?query=${encodeURIComponent(q)}`;

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

        // Logic to parse known servers response (Looks correct based on typical MetaAPI responses)
        if (Array.isArray(json)) {
            for (const item of json) {
                if (typeof item === "string") {
                    servers.push(item);
                } else if (item && typeof item === "object") {
                    const srv = (item as any).server || (item as any).serverName || (item as any).name;
                    const brk = (item as any).broker || (item as any).brokerName || (item as any).name;

                    if (srv) servers.push(srv);
                    if (brk) brokers.push(brk);
                }
            }
        } else if (json && typeof json === "object") {
            for (const name in json) {
                if (name) brokers.push(name);

                const arr = Array.isArray((json as any)[name]) ? (json as any)[name] : [];

                for (const s of arr) {
                    if (typeof s === "string") servers.push(s);
                    else if (s && typeof s === "object") {
                        const val = (s as any).server || (s as any).serverName || (s as any).name;
                        if (val) servers.push(val);
                    }
                }
            }
        }
        // End parsing logic
        
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
  } catch (e) {
    console.error("CRITICAL BROKER_SEARCH_EXCEPTION:", e);
    return NextResponse.json(
      { ok: false, error: "BROKER_SEARCH_EXCEPTION" },
      { status: 500 }
    );
  }
}


// export async function POST(request: Request) {
//   try {
//     // 1️⃣ Get the current session
//     const session = await auth.api.getSession({
//       headers: await headers(),
//     });

//     if (!session?.user?.id) {
//       return NextResponse.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 });
//     }
//     const userId = session.user.id;

//     // 2️⃣ Parse request body
//     const body = await request.json();
//     const { accountNumber, brokerName, platform, server, password } = body;

//     if (!accountNumber || !brokerName || !platform || !server || !password) {
//       return NextResponse.json({ ok: false, error: "MISSING_FIELDS" }, { status: 400 });
//     }
//     const transactionId = crypto.randomUUID().replace(/-/g, "");

//     const brokerDetails: BrokerDetails = {
//       userId,
//       accountNumber,
//       brokerName,
//       platform,
//       server,
//       password,
//       region: "london",
//       magic: 123456, // Assuming this is the correct magic number
//       transactionId,
//     };

//     // 3️⃣ Call MetaAPI with Polling Logic
//     let response: Response;
//     let data: any;
//     let attempt = 0;

//     while (attempt < MAX_POLLING_ATTEMPTS) {
//       // Send the request (initial or poll attempt). MetaAPI uses the same POST endpoint for polling.
//       response = await fetch(`${META_API_PROVISIONING_URL}/users/current/accounts`, {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json",
//           "Accept": "application/json",
//           "auth-token": META_API_ACCESS_TOKEN!,
//           "transaction-id": transactionId, // CRITICAL: Use the same transactionId for polling
//         },
//         body: JSON.stringify({
//           login: accountNumber,
//           password,
//           name: brokerName,
//           server,
//           platform,
//           magic: 123456, // Must match the value in brokerDetails
//           keywords: [brokerName],
//         }),
//       });

//       // Read the body once
//       data = await response.json();
      
//       // Success condition: HTTP 201 Created
//       if (response.status === 201) {
//         // Account provisioned successfully, break the loop
//         break; 
//       }
      
//       // Polling condition: HTTP 202 Accepted
//       if (response.status === 202) {
//         attempt++;
//         console.log(`MetaAPI provisioning accepted. Polling attempt ${attempt}/${MAX_POLLING_ATTEMPTS}. Status: PENDING.`);
        
//         // Wait before the next attempt
//         await new Promise(resolve => setTimeout(resolve, POLLING_DELAY_MS));
//         continue; // Skip the rest of the loop and start the next iteration
//       }
      
//       // Error condition: 4xx, 5xx, or any unexpected non-201/202 status
//       if (!response.ok) {
//         console.error("MetaAPI returned a final error:", data);
//         const errorMessage = data.message || data.error || "META_API_PROVISIONING_FAILED";
        
//         // Return the error with MetaAPI's actual status code
//         return NextResponse.json(
//           { ok: false, error: errorMessage, details: data.details || null },
//           { status: response.status }
//         );
//       }
//     }
    
//     // Check if we exited the loop due to max attempts (timeout)
//     if (attempt === MAX_POLLING_ATTEMPTS) {
//       console.error("MetaAPI provisioning timed out after max attempts.");
//       return NextResponse.json(
//         { ok: false, error: "META_API_PROVISIONING_TIMEOUT" },
//         { status: 504 } // Gateway Timeout
//       );
//     }
    
//     // At this point, response.status is 201, and 'data' has the final account info.
//     const metaApiAccountId = data.id;
//     const state = data.state;

//     // 4️⃣ Insert into DB & log result
//     try {
//       const dbResult = await onSubmitBrokerDetails({
//         ...brokerDetails,
//         metaApiAccountId,
//         status: state,
//       });
//       console.log("DB insertion successful:", dbResult);
//     } catch (dbError) {
//       console.error("Error inserting broker into DB:", dbError);
//       throw dbError; // rethrow so the frontend sees the failure
//     }

//     // 5️⃣ Return to frontend
//     return NextResponse.json({
//       ok: true,
//       brokerAccount: { metaApiAccountId, status: state, transactionId },
//     });
//   } catch (error: any) {
//     // This catches critical exceptions like network failures or the re-thrown DB error.
//     console.error("Error submitting broker data:", error);
//     return NextResponse.json(
//       { ok: false, error: error.message || "INTERNAL_SERVER_ERROR" },
//       { status: 500 }
//     );
//   }
// }

export async function POST(req: Request) {
    let requestBody: any;
    
    // 1. JSON Parsing (Initial try/catch)
    try {
        requestBody = await req.json();
    } catch (error) {
        // Return 400 if the request body is not valid JSON
        return NextResponse.json({
            success: false,
            message: 'Invalid request body format (expected JSON).'
        }, { status: 400 });
    }

    // 2. Authentication
    const headerList = await headers();
    const session = await auth.api.getSession({
        headers: headerList,
    });

    if (!session?.user?.id) {
        return NextResponse.json({
            success: false,
            message: 'Unauthorized'
        }, { status: 401 });
    }

    const userId = session.user.id;

    const valuesWithUserId = {
        ...requestBody,
        userId,
    };

    // 3. Call Core Business Logic (handles polling, MetaAPI, and DB upsert)
    const result = await onSubmitBrokerDetails(valuesWithUserId);

    // 4. Handle Failure (HTTP 400)
    if (!result.success) {
        console.error(`POST /api/broker failed. Message: ${result.message}`);

        // Return 400 Bad Request if the core logic failed
        return NextResponse.json({
            ok: false,
            message: result.message,
        }, { status: 400 });
    }

    // 5. Handle Success (HTTP 200)
    // If the code reaches this point, the core logic was successful.
    return NextResponse.json({
        ok: true,
        message: result.message,
        brokerAccount: result.brokerAccount,
    }, { status: 200 });
}

