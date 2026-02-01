const cron = require('node-cron');
const finnhub = require('finnhub');
const admin = require('firebase-admin');
require('dotenv').config();

// Configuration
const REFRESH_INTERVAL_CRON = '*/5 * * * *'; // Every 5 minutes
const POCKETBASE_URL = process.env.POCKETBASE_URL || 'http://127.0.0.1:8090';
const FINNHUB_API_KEY = process.env.FINNHUB_API_KEY;

// Initialize Finnhub
const api_key = finnhub.ApiClient.instance.authentications['api_key'];
api_key.apiKey = FINNHUB_API_KEY;
const finnhubClient = new finnhub.DefaultApi();

// Initialize Firebase Admin
// Supports:
// 1. GOOGLE_APPLICATION_CREDENTIALS path in env (Automatic)
// 2. FIREBASE_SERVICE_ACCOUNT JSON string in env (Coolify friendly)
try {
    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
        const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount)
        });
        console.log("Firebase initialized with JSON config.");
    } else {
        admin.initializeApp(); // relies on GOOGLE_APPLICATION_CREDENTIALS or default credentials
        console.log("Firebase initialized with default credentials.");
    }
} catch (error) {
    console.error("Firebase initialization warning:", error.message);
}

// Helper to fetch price from Finnhub
function getCurrentPrice(symbol) {
    return new Promise((resolve, reject) => {
        // Simple heuristic: if symbol is 6 chars like XAUUSD, try OANDA format for Forex if direct fails?
        // For now, we use the symbol as provided.
        // User example: XAUUSD. Finnhub usually wants OANDA:XAU_USD for forex.
        // We will try to guess format if it looks like a crude pair.
        let lookupSymbol = symbol;
        if (!symbol.includes(':') && symbol.length === 6) {
            // Basic naive mapping for common pairs if needed, but safer to let user define.
            // We will try sending it raw first.
            // lookupSymbol = `OANDA:${symbol.substring(0,3)}_${symbol.substring(3)}`;
        }

        // Use quote
        finnhubClient.quote(lookupSymbol, (error, data, response) => {
            if (error) {
                reject(error);
            } else if (data && data.c) {
                resolve(data.c); // 'c' is current price
            } else {
                reject(new Error("No price data returned"));
            }
        });
    });
}

// Main Logic
async function checkSignals() {
    console.log(`[${new Date().toISOString()}] Starting signal check...`);

    // Dynamic import for PocketBase (ESM)
    const { default: PocketBase } = await import('pocketbase');
    const pb = new PocketBase(POCKETBASE_URL);

    // Authenticate with PocketBase Admin
    try {
        await pb.admins.authWithPassword(process.env.POCKETBASE_EMAIL, process.env.POCKETBASE_PASSWORD);
    } catch (err) {
        console.error("PocketBase Auth Failed:", err.message);
        return;
    }

    try {
        // Fetch PENDING signals with expanded user data
        const signals = await pb.collection('signals').getFullList({
            filter: 'status = "PENDING"',
            expand: 'user',
        });

        console.log(`Found ${signals.length} pending signals.`);

        for (const signal of signals) {
            try {
                const currentPrice = await getCurrentPrice(signal.pair);
                console.log(`Signal ${signal.id} (${signal.pair}): ${signal.direction} @ ${signal.entry_price} | Current: ${currentPrice} | TP: ${signal.tp_price} | SL: ${signal.sl_price}`);

                let result = null; // 'WON' or 'LOST'

                if (signal.direction === 'BUY') {
                    if (currentPrice >= signal.tp_price) result = 'WON';
                    else if (currentPrice <= signal.sl_price) result = 'LOST';
                } else if (signal.direction === 'SELL') {
                    if (currentPrice <= signal.tp_price) result = 'WON';
                    else if (currentPrice >= signal.sl_price) result = 'LOST';
                }

                if (result) {
                    console.log(`-> Signal ${signal.id} Result: ${result}`);

                    // 1. Update Signal in PocketBase
                    await pb.collection('signals').update(signal.id, {
                        status: result,
                        ended_at: new Date().toISOString()
                    });

                    // 2. Send Notification
                    const pushToken = signal.expand?.user?.push_token || signal.expand?.user?.device_token;
                    if (pushToken) {
                        const message = {
                            token: pushToken,
                            notification: {
                                title: `Signal Update: ${signal.pair}`,
                                body: `Your ${signal.direction} signal has ${result == 'WON' ? 'WON 🟢' : 'LOST 🔴'}!`
                            },
                            data: {
                                signal_id: signal.id,
                                result: result
                            }
                        };

                        try {
                            await admin.messaging().send(message);
                            console.log(`-> Notification sent to user ${signal.expand?.user?.id}`);
                        } catch (msgErr) {
                            console.error(`-> Notification failed:`, msgErr.message);
                        }
                    } else {
                        console.log(`-> No push token for user ${signal.expand?.user?.id}`);
                    }
                }

            } catch (err) {
                console.error(`Error processing signal ${signal.id}:`, err.message);
            }
        }

    } catch (err) {
        console.error("Error fetching signals:", err);
    }
}

// Schedule Cron
cron.schedule(REFRESH_INTERVAL_CRON, () => {
    checkSignals();
});

// Run immediately on start for testing/deployment verification
console.log("Worker started. Running initial check...");
checkSignals();
