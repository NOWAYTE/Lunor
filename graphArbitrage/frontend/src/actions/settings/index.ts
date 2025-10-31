import { authClient } from "~/lib/auth-client";
import { client } from "~/lib/prisma";
import type { BrokerFormValues } from "~/lib/validations/broker/broker";

const META_API_TOKEN = process.env.META_API_ACCESS_TOKEN;
const META_API_URL = process.env.META_API_URL;

export const onSubmitBrokerDetails = async (values: BrokerFormValues) => {
  const session = await authClient.getSession();
  const userId = session?.data?.user?.id;
  if (!userId) return { success: false, message: "User not authenticated" };

  try {
    const { brokerName, platform, server, accountNumber, password, region } = values;
    const response = await fetch(`${META_API_URL}/users/current/accounts`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${META_API_TOKEN}`,
      },
      body: JSON.stringify({
        name: brokerName,
        type: platform,
        login: accountNumber,
        password,
        server,
        region,
      }),
    });

    const metaRes = await response.json();

    if (!response.ok) {
      console.error("MetaAPI error:", metaRes);
      return { success: false, message: metaRes.message || "Failed to connect MetaAPI" };
    }

    const brokerAccount = await client.brokeraccount.upsert({
      where: {
        metaApiAccountId: metaRes.id, 
      },
      create: {
        userId,
        metaApiAccountId: metaRes.id,
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

    return {
      success: true,
      message: "Broker account connected successfully",
      brokerAccount,
    };
  } catch (error: any) {
    console.error(error);
    return { success: false, message: error.message || "Unknown error" };
  }
};
