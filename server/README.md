# Benim Bakıcım — Otomatik Eşleştirme Sistemi

WhatsApp Business tabanlı, tam otomatik iki taraflı bakıcı/yardımcı eşleştirme sistemi.
Bakıcı arayan ücret ödeyerek ilan açar; sistem ilanı yayınlar, başvuru/ilgi toplar,
skorlar ve ödeme koşuluyla en uygun adayların numarasını iletir.

> Bu backend, kök dizindeki tanıtım sitesinden (`../`) bağımsız çalışır. Site `wa.me`
> ve web ilan formu üzerinden bu sisteme besleme yapar.

## Mimari

```
WhatsApp (0535 596 35 45)                Web / Instagram
        │                                       │
   Cloud API webhook  ◄── Meta AI sohbet        │ /api/listings
        │                                       │
        ▼                                       ▼
   ┌─────────────────────  Backend (Express)  ─────────────────────┐
   │ bot/stateMachine  →  listings  →  matching  →  publishing      │
   │        │                │             │            │           │
   │     conversations    payments      scoring     wa/ig/fb        │
   └───────────────────────────┬───────────────────────────────────┘
                               ▼
                        SQLite (data/)
```

Ana modüller:

- `src/bot/` — konuşma durum makinesi, niyet ayrımı, Türkçe mesajlar
- `src/domain/taxonomy.js` — hizmet türü / ilçe / maaş / niyet çıkarımı (NLU)
- `src/ai/` — ilan metni düzenleme (OpenAI opsiyonel; yoksa kural tabanlı fallback)
- `src/listings/` — ilan oluşturma, kod üretimi, yayın + havuza teklif
- `src/matching/` — skorlama ve reveal (top-N, unlock) motoru
- `src/payments/` — sağlayıcı soyutlaması (mock / iyzico / PayTR) + webhook
- `src/publishing/` — WhatsApp grup/kanal, Instagram, Facebook adaptörleri
- `src/whatsapp/` — Cloud API istemcisi (metin/buton/katalog) + webhook ayrıştırıcı
- `src/routes/` — `/webhook`, `/payments/webhook`, `/api/*`, hosted checkout stub

## Kurulum

```bash
cd server
npm install
cp .env.example .env   # değerleri doldurun (boş bırakılırsa simülasyon modunda çalışır)
npm run init-db
```

## Çalıştırma

```bash
npm start          # http://localhost:3000
npm run dev        # otomatik yeniden başlatmalı geliştirme
```

Sağlık kontrolü:

- `GET /health` → mod bilgisini döner (dryRun, whatsappLive, ai, ödeme sağlayıcı).
- `GET /health/deep` → tüm API bağlantılarını canlı doğrular (WhatsApp Graph, OpenAI,
  ödeme sağlayıcı). Kimlik yoksa ilgili kontrol `skipped`, hata varsa `503` döner.

## API çağrı katmanı (dayanıklılık)

Tüm dış çağrılar `src/utils/http.js` üzerinden yapılır: `AbortController` ile zaman aşımı,
5xx/429 ve ağ hatalarında üstel beklemeli yeniden deneme. Bu katmanı kullananlar:

- **WhatsApp Cloud API** (`src/whatsapp/client.js`) — gönderimde retry + anlamlı hata.
- **OpenAI** (`src/ai/index.js`) — 20 sn timeout, 2 retry; hata olursa kural tabanlı fallback.
- **iyzico** (`src/payments/iyzico.js`) — resmi `iyzipay` SDK ile CheckoutForm başlatma
  (`paymentPageUrl`) ve token ile durum sorgulama (`isCheckoutPaid`).
- **PayTR** (`src/payments/paytr.js`) — Link API `create` (HMAC `paytr_token`) ve callback
  hash doğrulama.

Kimlik bilgisi eksik veya sağlayıcı hata verirse `createPayment`, sistem çökmesin diye
otomatik olarak yerel hosted checkout stub'ına düşer.

## Uçtan uca simülasyon (gerçek WhatsApp/ödeme olmadan)

```bash
npm run simulate
```

Bu script tüm akışı yerelde çalıştırır: aday havuzu → bakıcı arayan sohbeti → ilan +
300 TL ödeme → yayın → havuz "Evet" → en uygun 2 numara → +300 TL ile sonraki 2 →
RevealLog denetimi → iş arayan profil akışı.

## Çalışma modları

| Değişken | Etki |
|----------|------|
| `DRY_RUN=true` | Giden WhatsApp mesajları gerçekten gönderilmez, `outbox`'a yazılır |
| `WHATSAPP_ACCESS_TOKEN` boş | Simülasyon modu (canlı API kapalı) |
| `OPENAI_API_KEY` boş | İlan metni kural tabanlı fallback ile üretilir |
| `PAYMENT_PROVIDER=mock` | Ödeme, hosted checkout stub sayfasıyla test edilir |

## Fiyatlandırma (varsayılan)

| Paket | Ücret | Açılan |
|-------|-------|--------|
| `base_300` | 300 TL | İlan yayını + en uygun 2 aday numarası |
| `unlock_300` | 300 TL | Sonraki 2 aday numarası |
| `unlock_900` | 900 TL | Kalan tüm uygun adaylar (6+ ilgilenen eşiğinde) |

`.env` içindeki `PRICE_*`, `REVEAL_*`, `UNLOCK6_THRESHOLD` ile değiştirilir.

## Eşleştirme sırası (B → A → C)

1. **B:** İlan yayınlanır; "Evet/Başvur" diyenlerden kriterlere en uygun 2 kişi seçilir.
2. **A:** Havuzdaki uygun adaylar da skorlamaya dahil edilir.
3. **C:** İkisi de yetersizse süre (`MATCH_WINDOW_HOURS`) dolunca durum bildirilir; başvuru geldikçe güncellenir.

Skorlama girdileri (`src/matching/scoring.js`): hizmet türü, semt, yatılı/gündüzlü,
maaş örtüşmesi, deneyim, referans, yanıt hızı.

## Ödeme entegrasyonu (Türkiye)

WhatsApp Pay Türkiye'de native olmadığı için akış: Katalog **vitrin** + ödeme **linki**.

Sağlayıcı seçimi `.env` içindeki `PAYMENT_PROVIDER` ile yapılır: `mock` | `iyzico` | `paytr`.

- **iyzico:** `IYZICO_API_KEY`, `IYZICO_SECRET_KEY`, `IYZICO_BASE_URL` girildiğinde
  CheckoutForm başlatılır ve müşteriye `paymentPageUrl` gönderilir. Ödeme sonrası iyzico,
  `POST /payments/iyzico/callback` adresine `token` ile döner; sistem `RetrieveCheckoutForm`
  ile `SUCCESS` durumunu doğrulayıp ilanı yayınlar.
- **PayTR:** `PAYTR_MERCHANT_ID/KEY/SALT` girildiğinde Link API ile ödeme linki üretilir.
  Ödeme sonrası PayTR, `POST /payments/paytr/callback` adresine bildirim yollar; hash
  doğrulanır ve `status=success` ise ilan yayınlanır. (Callback URL public HTTPS olmalıdır.)
- Genel/mock sağlayıcı ödeme sonucunu `POST /payments/webhook` (`x-payment-signature` HMAC)
  ile bildirir.
- Güvenlik için webhook'a ek olarak `lookupPaid(reference)` ile sağlayıcıdan durum sorgulanır.

## WhatsApp Cloud API bağlantısı

`.env` içine Meta App Dashboard değerlerini girin: `WHATSAPP_PHONE_NUMBER_ID`,
`WHATSAPP_ACCESS_TOKEN`, `WHATSAPP_APP_SECRET`, `WHATSAPP_VERIFY_TOKEN`.
Webhook callback URL: `https://<sunucu>/webhook`. Katalog için `WHATSAPP_CATALOG_ID`
ve `CATALOG_RETAILER_ID_*` girilir.

## Yönetim paneli ve onay akışı

Panel: `GET /admin` (token varsa `/admin?token=ADMIN_TOKEN`). Otomatik yenilenir.

- **Özet:** toplam/ödemesi alınan/ödeme bekleyen ilanlar, tahsilat ve bekleyen tutar.
- **Gruplar:** 💰 Ödemesi Alınan · ⏳ Ödeme Bekleyen · 📝 Taslak.
- **İlan detayı:** ilan sahibi, kriter, AI metni, ödemeler, adaylar (numara ödeme yoksa maskeli),
  yayın kanalları ve tam **aksiyon geçmişi** (`events` denetim tablosu).
- **Onay Bekleyen İşlemler:** iptal/iade talepleri; operatör Onayla/Reddet.

### Kritik kural: iptal ve iade onay bekler

İlk aşamada tüm akışı **AI otomatik yönetir** (ilan, ödeme, yayın, eşleştirme, numara açma).
Ancak **iptal ve iade OTOMATİK YAPILMAZ** — yalnızca operatör onayından sonra uygulanır:

- Kullanıcı WhatsApp'ta "iptal" yazarsa AI bir `cancel_listing` talebi oluşturur (`requested_by=seeker`),
  ilanı iptal **etmez**; talep onay kuyruğuna düşer.
- Operatör panelden **Onayla** derse ilan `cancelled` olur ve kullanıcıya bilgi gider;
  **Reddet** derse ilan aynen devam eder.
- İade için ödeme satırındaki "İade İste" → onaylanınca ödeme `refunded` olur (gerçek para
  iadesi sağlayıcı panelinden yapılır; sistem durumu kaydeder).

### Admin API (operatör + AI programatik erişim)

| Uç | Açıklama |
|----|----------|
| `GET /api/admin/overview` | Özet + gruplu ilanlar + bekleyen onaylar + son olaylar |
| `GET /api/admin/listings/:code` | İlan detayı + zaman çizelgesi |
| `POST /api/admin/listings/:code/notes` | Operatör notu ekle |
| `POST /api/admin/listings/:code/status` | Durum değiştir (iptal hariç) |
| `POST /api/admin/listings/:code/cancel-request` | İptal talebi (onay bekler) |
| `POST /api/admin/payments/:reference/refund-request` | İade talebi (onay bekler) |
| `POST /api/admin/approvals/:id/approve` | Onayla ve uygula |
| `POST /api/admin/approvals/:id/reject` | Reddet |

Tümü `x-admin-token` başlığı (veya `?token=`) ile korunur; `ADMIN_TOKEN` boşsa yerelde serbesttir.

## KVKK / güvenlik

- Numara paylaşımı yalnızca ilgili paket ödendikten sonra yapılır (`RevealLog` ile denetlenir).
- Başvuran ve arayandan açık onay alınır (bot akışında KVKK adımı).
- Webhook imzaları (WhatsApp `x-hub-signature-256`, ödeme `x-payment-signature`) doğrulanır.
- Sırlar `.env`'de tutulur, repoya girmez (`.gitignore`).

## Faz 2 — Ölçekleme yol haritası

Aşağıdakiler MVP dışıdır; adaptör arayüzleri hazır bırakıldı.

1. **Daha fazla kanal / grup**
   - `src/publishing/index.js` — her kanal bir adaptör (`{ channel, publish(listing) }`).
   - WhatsApp Kanalı (Channels) ve kontrollü grup yayını için ayrı adaptör eklenir.
   - Klasik gruplara sınırsız otomatik post **yapılmaz** (politika/ban riski); WhatsApp
     Kanalı + sınırlı, izinli grup modeli önerilir.

2. **Sahibinden.com**
   - Resmi ilan API'si sınırlı; otomatik scrap/post kırılgan ve ToS riski taşır.
   - Öneri: partner/kurumsal ilan paneli veya yarı otomatik şablon çıktı (elle yayın).
   - `publishing`'e `sahibinden` adaptörü olarak `status: 'manual'` ile eklenir.

3. **Instagram / Facebook tam otomasyon**
   - `instagramAdapter` / `facebookAdapter` içine Content Publishing API ve Page feed
     çağrıları eklenir (`IG_USER_ID`, `FB_PAGE_ID`, `META_CONTENT_ACCESS_TOKEN`).

4. **İnsan müdahalesini azaltma**
   - Meta AI + Cloud API hibritinde belirsiz mesajlar için `handoff` durumu ve
     danışman kuyruğu; niyet güven skoru düşükse insana devir.
   - Amaç: insan müdahalesi < %10 (bkz. plan başarı ölçütleri).

5. **Operasyon paneli**
   - İlan/aday/ödeme/RevealLog için basit admin arayüzü ve raporlama.
