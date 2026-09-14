# Benim Bakıcım — Web Sitesi

**benimbakicim.com** için hazırlanan güvenilir bakıcı ajansı web sitesi.

## Özellikler

- Referans site ([Erenköy Danışmanlık](https://www.erenkoydanismanlik.com/)) yapısına benzer modern tasarım
- Türkmen, Özbek ve yabancı uyruklu bakıcı odaklı içerik
- Hero slider, istatistikler, hizmet kartları, referanslar, FAQ
- Talep formları (Netlify Forms + KVKK onaylı)
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
cd benimbakicim
python3 -m http.server 8080
```

Tarayıcıda: http://localhost:8080

## Özelleştirme

1. **WhatsApp:** `0535 596 35 45` — tüm formlarda geri dönüş kanalı
2. **Formlar:** Netlify Forms (`talep` ve `ilan`) — gönderimler Netlify panelinde görünür
3. **Adres:** İletişim bölümlerindeki adres bilgisini güncelleyin

## Deployment (Cloudflare Pages)

1. Bu repo GitHub’a bağlı: https://github.com/y3ac/benimbakicim
2. [Cloudflare Dashboard](https://dash.cloudflare.com) → **Workers & Pages** → **Create** → **Pages** → **Connect to Git**
3. `y3ac/benimbakicim` reposunu seçin
4. Ayarlar:
   - **Framework preset:** None
   - **Build command:** `npm run build:cf`
   - **Build output directory:** `dist`
   - **Production branch:** `main`
5. Domain: Pages → Custom domains → `benimbakicim.com`

Yerel deneme:

```bash
npm run build:cf
npx wrangler pages deploy dist --project-name=benimbakicim
```

Not: Formlar ve `/api`, `/payments`, `/webhook` uçları Netlify Functions’a bağlıdır. Cloudflare yalnızca statik siteyi yayınlar; backend ayrı bir Worker veya mevcut Netlify backend ile çalışmalıdır.

## SEO

Hedef kelimeler: bakıcı, yardımcı, ev temizliği, gündelikçi, bebek bakıcısı, yatılı bakıcı, yatılı yardımcı.

- Meta & schema: `js/seo-config.js` → `node apply-seo.js`
- Landing sayfaları: `node generate-seo-pages.js`
- `sitemap.xml`, `robots.txt` kök dizinde
- Google Search Console → `https://benimbakicim.com/sitemap.xml`
- Google Business Profile (İstanbul) oluşturun
