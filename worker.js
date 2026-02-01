const cron = require('node-cron');
const PocketBase = require('pocketbase/cjs');
const finnhub = require('finnhub');
const admin = require('firebase-admin');
require('dotenv').config();

// --- 1. AYARLAR ---

// Firebase (Bildirim) Kurulumu
try {
    let serviceAccountRaw = process.env.FIREBASE_SERVICE_ACCOUNT;
    
    if (!serviceAccountRaw) {
        console.log("⚠️ UYARI: FIREBASE_SERVICE_ACCOUNT kutusu boş!");
    } else {
        // Eğer Coolify şifreyi tırnak içine aldıysa temizle
        if (serviceAccountRaw.startsWith('"') && serviceAccountRaw.endsWith('"')) {
             serviceAccountRaw = serviceAccountRaw.slice(1, -1);
        }

        // JSON'u olduğu gibi çevirmeyi dene (Benim önceki replace kodumu kaldırdım)
        const serviceAccount = JSON.parse(serviceAccountRaw);

        if (!admin.apps.length) {
            admin.initializeApp({
                credential: admin.credential.cert(serviceAccount)
            });
            console.log("✅ Firebase (Bildirim) bağlantısı başarılı.");
        }
    }
} catch (e) {
    console.error("🚨 Firebase Hatası:", e.message);
}

// PocketBase (Veritabanı) Kurulumu
const pb = new PocketBase(process.env.PB_URL);
pb.autoCancellation(false);

// Finnhub (Borsa) Kurulumu
let finnhubClient = null;
try {
    // Hem standart hem de 'default' yöntemini dene
    const ApiClient = finnhub.ApiClient || (finnhub.default && finnhub.default.ApiClient);
    
    if (ApiClient) {
        const api_key = ApiClient.instance.authentications['api_key'];
        api_key.apiKey = process.env.FINNHUB_API_KEY;
        finnhubClient = new finnhub.DefaultApi();
        console.log("✅ Finnhub (Borsa) bağlantısı hazır.");
    } else {
        console.error("⚠️ Finnhub yapısı çözülemedi. Mevcut içerik:", Object.keys(finnhub));
    }
} catch (err) {
    console.error("⚠️ Finnhub kurulum hatası:", err.message);
}

// --- 2. ROBOT MANTIĞI ---

async function checkSignals() {
    console.log('🔍 Sinyaller kontrol ediliyor...');
    
    if (!finnhubClient) {
        console.log('❌ Borsa istemcisi çalışmadığı için işlem yapılamıyor.');
        return;
    }

    try {
        // Yönetici girişi yap
        await pb.admins.authWithPassword(process.env.PB_ADMIN_EMAIL, process.env.PB_ADMIN_PASSWORD);

        // Bekleyen (PENDING) sinyalleri çek
        const signals = await pb.collection('signals').getFullList({
            filter: 'status = "PENDING"',
            expand: 'user'
        });

        if (signals.length === 0) {
            console.log('✅ Bekleyen işlem yok, robot dinleniyor.');
            return;
        }

        // Her sinyal için tek tek fiyat kontrolü yap
        for (const signal of signals) {
            finnhubClient.quote(signal.pair, async (error, data, response) => {
                if (error) {
                    console.error(`⚠️ Fiyat çekilemedi (${signal.pair}):`, error);
                    return;
                }

                const currentPrice = data.c; // Anlık Fiyat
                let result = null;

                // KAZANÇ/KAYIP Mantığı
                if (signal.type === 'BUY') {
                    if (currentPrice >= signal.tp) result = 'WON';
                    else if (currentPrice <= signal.sl) result = 'LOST';
                } else if (signal.type === 'SELL') {
                    if (currentPrice <= signal.tp) result = 'WON';
                    else if (currentPrice >= signal.sl) result = 'LOST';
                }

                // Eğer işlem bittiyse (WON veya LOST olduysa)
                if (result) {
                    console.log(`🔔 SONUÇ: ${signal.pair} -> ${result}`);
                    
                    // A) Veritabanını güncelle
                    await pb.collection('signals').update(signal.id, {
                        status: result,
                        ended_at: new Date().toISOString()
                    });

                    // B) Kullanıcıya bildirim at
                    if (signal.expand && signal.expand.user && signal.expand.user.push_token) {
                        const message = {
                            notification: {
                                title: result === 'WON' ? '🤑 Hedef Vuruldu!' : '🔻 Stop Oldu',
                                body: `${signal.pair} işlemi ${result} olarak kapandı. Fiyat: ${currentPrice}`
                            },
                            token: signal.expand.user.push_token
                        };
                        
                        try {
                            await admin.messaging().send(message);
                            console.log('📲 Bildirim gönderildi.');
                        } catch (err) {
                            console.error('Bildirim hatası:', err);
                        }
                    }
                }
            });
        }

    } catch (err) {
        console.error('🚨 Genel Robot Hatası:', err.message);
    }
}

// --- 3. BAŞLATMA ---

console.log('🚀 Worker başlatıldı. Her 5 dakikada bir piyasayı tarayacak.');

// Zamanlayıcıyı kur (Her 5 dakikada bir)
cron.schedule('*/5 * * * *', checkSignals);

// Açılır açılmaz bir kere çalıştır ki çalıştığını görelim
checkSignals();
