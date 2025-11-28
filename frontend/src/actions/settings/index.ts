import { authClient } from "~/lib/auth-client";
import { client } from "~/lib/prisma";
import type { BrokerFormValues } from "~/lib/validations/broker/broker";
import { BrokerAccountStatus } from "@prisma/client";

const META_API_TOKEN = process.env.META_API_ACCESS_TOKEN;
const META_API_PROVISIONING_URL = process.env.META_API_PROVISIONING_URL

// --- Polling Constants ---
const POLLING_DELAY_MS = 3000; 
const MAX_POLLING_ATTEMPTS = 30; 

export const onSubmitBrokerDetails = async (values: BrokerFormValues) => {
    try {
        const { brokerName, platform, server, accountNumber, password } = values;

        if (!META_API_PROVISIONING_URL || !META_API_TOKEN) {
            console.error("MetaAPI configuration missing.");
            return { success: false, message: "MetaAPI configuration missing." };
        }

        // 1. Build payload (must be consistent for all POST attempts)
        const payload: Record<string, any> = {
            // ✅ FIX 1: Ensure login is cast to a Number type for the API
            login: String(accountNumber),
            password,
            name: brokerName,
            server,
            platform: platform?.toLowerCase(),
            keywords: brokerName ? [brokerName] : [],
            magic: 123456,
            reliability: 'high',
            // 💡 FIX 2: Included region for better server resolution, adjust 'london' if needed
            region: "london", 
        };
        // The body must be prepared once and used for every POST attempt
        const requestBody = JSON.stringify(payload); 

        const transactionId = Array.from({ length: 32 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
        let metaApiAccountId = '';
        let finalStatus = 'UNKNOWN';
        let attempt = 0;
        let pollingUrl = `${META_API_PROVISIONING_URL}/users/current/accounts`; // URL is constant
        let metaRes: any = {};
        let responseStatus: number;

        // 2. Polling Loop: Wait for final status from MetaAPI
        // 🚨 FIX 3: Polling is achieved by repeating the exact POST request.
        while (attempt < MAX_POLLING_ATTEMPTS) {
            attempt++;

            // Method must ALWAYS be POST as per MetaAPI documentation
            const method = "POST";
            const currentUrl = pollingUrl;
            
            // Body must ALWAYS contain the credentials/payload
            const body = requestBody; 

            const response = await fetch(currentUrl, {
                method: method,
                headers: {
                    "Content-Type": "application/json",
                    "Accept": "application/json",
                    "auth-token": `${META_API_TOKEN}`,
                    "transaction-id": transactionId, 
                },
                body: body,
            });

            responseStatus = response.status;
            
            try {
                metaRes = await response.json();
            } catch (e) {
                console.error(`MetaAPI request failed to parse JSON (Attempt ${attempt}):`, responseStatus, response.statusText);
                return { success: false, message: `MetaAPI returned non-JSON response (Status: ${responseStatus})` };
            }

            // --- Case A: Final State Reached (200 or 201) ---
            // This is the successful completion response documented by MetaAPI.
            if (responseStatus === 201 || (responseStatus === 200 && metaRes.state && (metaRes.state === 'DEPLOYED' || metaRes.state.includes('FAILED')))) {
                metaApiAccountId = metaRes.id;
                finalStatus = metaRes.state;
                break; // Exit loop, we have the final status
            } 
            
            // --- Case B: Accepted/Polling (202 or Message indicates retry) ---
            else if (responseStatus === 202 || metaRes.message?.includes('retry')) {
                if (metaRes.id) {
                    metaApiAccountId = metaRes.id; // Store ID if returned, although the polling doesn't use it directly
                }
                finalStatus = metaRes.state || 'INITIALIZING';
                
                // Use Retry-After header if available, otherwise use default POLLING_DELAY_MS
                const retryAfterHeader = response.headers.get('Retry-After');
                let waitTime = POLLING_DELAY_MS;
                if (retryAfterHeader) {
                    const recommendedWait = parseInt(retryAfterHeader);
                    if (!isNaN(recommendedWait) && recommendedWait > 0) {
                        waitTime = recommendedWait * 1000;
                    }
                }

                console.log(`Polling attempt ${attempt}/${MAX_POLLING_ATTEMPTS}: Status ${responseStatus}/${finalStatus}. Waiting ${waitTime}ms...`);
                await new Promise(r => setTimeout(r, waitTime));
                continue; // Retry polling
            } 
            
            // --- Case C: Immediate Failure (4xx/5xx) ---
            else if (!response.ok) {
                // This is where credential failures (400/401/404) will now be caught
                console.error("MetaAPI returned an immediate error:", responseStatus, metaRes);
                
                const details = metaRes?.details as any;
                let message = metaRes?.message || "Failed to connect MetaAPI";
                
                // Extract specific validation message
                if (Array.isArray(details) && details.length > 0 && details[0].message) {
                    message = `Validation Error: ${details[0].message}`;
                } else if (metaRes.error === 'ValidationError') {
                    message = `Validation failed. Check account details.`;
                }
                
                return { success: false, message };
            }

            // Fallback for unexpected status/response
            console.error(`Unexpected MetaAPI response (Attempt ${attempt}):`, responseStatus, metaRes);
            return { success: false, message: `Unexpected API response from MetaAPI (Status: ${responseStatus})` };
        }

        // 3. Handle Timeout (metaApiAccountId will be populated if the first POST succeeded)
        if (attempt >= MAX_POLLING_ATTEMPTS) {
             const timeoutStatus: BrokerAccountStatus = 'ERROR';
             if (metaApiAccountId) {
                 await client.brokerAccount.update({ where: { metaApiAccountId }, data: { status: timeoutStatus } });
             }
             console.error("MetaAPI account provisioning timed out.");
             return { success: false, message: `Account provisioning timed out after ${MAX_POLLING_ATTEMPTS} attempts.` };
        }

        // 4. Update Database with Final Status
        const statusToSave: BrokerAccountStatus = finalStatus === 'DEPLOYED' ? 'ACTIVE' : 'ERROR';
        
        const brokerAccount = await client.brokerAccount.upsert({
            where: { metaApiAccountId },
            create: {
                userId: values.userId,
                metaApiAccountId,
                brokerName,
                platform,
                server,
                accountNumber,
                status: statusToSave,
            },
            update: {
                status: statusToSave,
                brokerName, 
                platform, 
                server, 
                accountNumber,
            },
        });

        if (statusToSave === 'ERROR') { 
            console.error(`Account creation failed with final status: ${finalStatus}`);
            return {
                success: false,
                message: `Account deployment failed. Final status: ${finalStatus}`,
                brokerAccount,
            };
        }

        return {
            success: true,
            message: "Broker account connected and deployed successfully",
            brokerAccount,
        };
    } catch (error: any) {
        console.error("API Route Catch Error:", error);
        return { success: false, message: error.message || "Unknown server error during submission" };
    }
};
