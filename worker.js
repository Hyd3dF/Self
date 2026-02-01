const cron = require('node-cron');
const PocketBase = require('pocketbase/cjs');
const admin = require('firebase-admin');
require('dotenv').config();

// --- 1. AYARLAR ---

// Firebase (Bildirim) Kurulumu - Temizleyici Mod
try {
    let raw = process.env.FIREBASE_SERVICE_ACCOUNT;
    if (!raw) {
        console.log("⚠️ UYARI: FIREBASE_SERVICE_ACCOUNT kutusu boş!");
    } else {
        // 1. Tırnak temizliği
        if (raw.startsWith('"') && raw.endsWith('"')) {
            raw = raw.slice(1, -1);
        }
        // 2. Ters çizgi temizliği (Bozuk formatı düzeltir)
        // \" (ters çizgi tırnak) gördüğü yeri " (tırnak) yapar.
        const cleanJson = raw.replace(/\\"/g, '"');

        const serviceAccount = JSON.parse(cleanJson);

        if (!admin.apps.length) {
            admin.initializeApp({
                credential: admin.credential.cert(serviceAccount)
            });
            console.log("✅ Firebase (Bildirim) bağlantısı başarılı.");
        }
    }
} catch (e) {
    console.error("🚨 Firebase Hatası:", e.message);
    // Hatanın detayını görelim ki gerekirse elle düzeltelim
    console.log("Gelen Bozuk Veri Başı:", process.env.FIREBASE_SERVICE_ACCOUNT?.substring(0, 20));
}

// PocketBase (Veritabanı) Kurulumu
const pb = new PocketBase(process.env.PB_URL);
pb.autoCancellation(false);

// --- 2. ROBOT MANTIĞI ---

async function checkSignals() {
    console.log('🔍 Sinyaller taranıyor...');

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
            
            // --- YENİ YÖNTEM: Kütüphanesiz Doğrudan Erişim (Fetch) ---
            const symbol = signal.pair;
            const token = process.env.FINNHUB_API_KEY;
            const url = `https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${token}`;

            try {
                const response = await fetch(url);
                const data = await response.json();

                if (!data || typeof data.c === 'undefined') {
                    console.error(`⚠️ Finnhub verisi boş geldi: ${symbol}`);
                    continue;
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

                // Eğer işlem bittiyse
                if (result) {
                    console.log(`🔔 SONUÇ: ${signal.pair} -> ${result} (Fiyat: ${currentPrice})`);
                    
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
                            console.error('Bildirim hatası:', err.message);
                        }
                    }
                }

            } catch (fetchError) {
                console.error(`⚠️ Borsa Bağlantı Hatası (${symbol}):`, fetchError.message);
            }
        }

    } catch (err) {
        console.error('🚨 Genel Robot Hatası:', err.message);
    }
}

// --- 3. BAŞLATMA ---

console.log('🚀 Worker başlatıldı (v3 - Fetch Modu). Her 5 dakikada bir çalışacak.');

// Zamanlayıcıyı kur (Her 5 dakikada bir)
cron.schedule('*/5 * * * *', checkSignals);

// Açılır açılmaz bir kere çalıştır
checkSignals();
