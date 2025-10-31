import { NextResponse } from "next/server";

const META_API_TOKEN = process.env.META_API_ACCESS_TOKEN;
const META_API_URL = process.env.META_API_URL;

export async function POST(request: Request) {
    const { accountNumber, brokerName, platform, server, password, region="london"} = await request.json();
    
    const res = await fetch(`${META_API_URL}/users/current/accounts`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${META_API_TOKEN}`,
        },
        body: JSON.stringify({
            brokerName,
            platform,
            server,
            accountNumber,
            password,
            region,
        }),
    });

    if(!res.ok){
        const error = await res.json();
        return NextResponse.json(error, { status: res.status });
    }


    const data = await res.json();

    return NextResponse.json(data);
}