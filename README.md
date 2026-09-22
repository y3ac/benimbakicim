# Benim Bakıcım — Web Sitesi

**benimbakicim.com** için hazırlanan güvenilir bakıcı ajansı web sitesi.

## Özellikler

- Referans site ([Erenköy Danışmanlık](https://www.erenkoydanismanlik.com/)) yapısına benzer modern tasarım
- Türkmen, Özbek ve yabancı uyruklu bakıcı odaklı içerik
- Hero slider, istatistikler, hizmet kartları, referanslar, FAQ
- Talep formları (Cloudflare Pages Function + KVKK onaylı)
- Mobil uyumlu responsive tasarım
- WhatsApp / telefon floating butonları

## Sayfalar

| Sayfa | Dosya |
|-------|-------|
| Ana Sayfa | `index.html` |
| Hakkımızda | `pages/hakkimizda.html` |
| İletişim | `pages/iletisim.html` |
| İlan Ver | `pages/ilan-ver.html` |
| Türkmen Bakıcı | `pages/turkmen-bakici.html` |
| Özbek Bakıcı | `pages/ozbek-bakici.html` |
| Yabancı Bakıcı | `pages/yabanci-bakici.html` |
| Bebek / Çocuk / Hasta / Yaşlı Bakıcı | `pages/bebek-bakicisi.html` vb. |
| SSS, Referanslar, İş İlanları | `pages/sss.html` vb. |

## Yerel Geliştirme

```bash
npm run preview:cf
```

Tarayıcıda: http://localhost:8788

Statik önizleme:

```bash
python3 -m http.server 8080
```

## Özelleştirme

1. **WhatsApp:** `0535 596 35 45` — başvuru iletimi ve ödeme yönlendirmesi
2. **İlan paketleri:** Standart 1.000 TL · Acil 1.500 TL — ödeme **yalnızca WhatsApp katalog** üzerinden. Her paket en fazla 3 başvuran numarası; daha fazlası için Ek 3 Başvuru.
3. **Kapsam:** Yalnızca ilan yayını + başvuru iletimi. Referans kontrolü / ön görüşme / yerleştirme yok.
4. **Formlar:** `/api/form` (Cloudflare). `NOTIFY_WEBHOOK_URL` veya KV `FORMS` eklenebilir
5. **Adres:** İletişim bölümlerindeki adres bilgisini güncelleyin

## Deployment (Cloudflare Workers + static assets)

Bu proje Cloudflare'da **Pages değil, Worker** olarak bağlı (`benimbakicim`).

1. Repo: https://github.com/y3ac/benimbakicim
2. [Cloudflare Dashboard](https://dash.cloudflare.com) → **Workers & Pages** → `benimbakicim`
3. **Settings → Build**:
   - **Path / Root directory:** boş
   - **Build command:** `npm run build`
   - **Deploy command:** `npx wrangler deploy`
4. `CLOUDFLARE_API_TOKEN` değişkenini **sil** (Workers Builds kendi auth'unu kullanır). Eğer tutarsan token'da `Account → Workers Scripts → Edit` olmalı.
5. Domain: Worker → Custom domains → `benimbakicim.com`

Form bildirimleri için Settings → Variables:

- `NOTIFY_WEBHOOK_URL` (Make / Zapier / Discord webhook)

WhatsApp eşleştirme backend’i (`/webhook`, `/payments`, `/admin`) bu yayına dahil değildir.

## SEO

Hedef kelimeler: bakıcı, yardımcı, ev temizliği, gündelikçi, bebek bakıcısı, yatılı bakıcı, yatılı yardımcı.

- Meta & schema: `js/seo-config.js` → `node apply-seo.js`
- Landing sayfaları: `node generate-seo-pages.js`
- `sitemap.xml`, `robots.txt` kök dizinde
- Google Search Console → `https://benimbakicim.com/sitemap.xml`
- Google Business Profile (İstanbul) oluşturun
