import { authClient } from "~/lib/auth-client";
import { client } from "~/lib/prisma";
import type { BrokerFormValues } from "~/lib/validations/broker/broker";

const META_API_TOKEN = process.env.META_API_ACCESS_TOKEN;
const META_API_PROVISIONING_URL = process.env.META_API_PROVISIONING_URL

export const onSubmitBrokerDetails = async (values: BrokerFormValues) => {
  const session = await authClient.getSession();
  const userId = session?.data?.user?.id;
  if (!userId) return { success: false, message: "User not authenticated" };

  try {
    const { brokerName, platform, server, accountNumber, password } = values;

    if (!META_API_PROVISIONING_URL || !META_API_TOKEN) {
      return { success: false, message: "MetaAPI configuration missing. Set META_API_PROVISIONING_URL and META_API_ACCESS_TOKEN in your environment." };
    }

    // Build payload per Provisioning API (auto broker detection)
    const payload: Record<string, any> = {
      login: accountNumber,
      password,
      name: brokerName,
      server,
      platform: platform?.toLowerCase(),
      keywords: brokerName ? [brokerName] : [],
    };

    const transactionId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    const response = await fetch(`${META_API_PROVISIONING_URL}/users/current/accounts`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        "auth-token": `${META_API_TOKEN}`,
        "transaction-id": transactionId,
      },
      body: JSON.stringify(payload),
    });

    const metaRes = await response.json();

    if (!response.ok) {
      const details = metaRes?.details as string | undefined;
      let message = metaRes?.message || "Failed to connect MetaAPI";
      if (details === 'E_SRV_NOT_FOUND') message = 'Server file not found for specified broker/server';
      else if (details === 'E_AUTH') message = 'Authentication failed. Please check login/password/server';
      else if (details === 'E_SERVER_TIMEZONE') message = 'Settings detection in progress or failed. Please retry later';
      console.error("MetaAPI error:", metaRes);
      return { success: false, message };
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
