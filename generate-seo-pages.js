#!/usr/bin/env node
/**
 * Generate keyword-focused landing pages from template
 */
const fs = require('fs');
const path = require('path');

const pagesDir = path.join(__dirname, 'pages');

const LANDING_PAGES = [
  {
    slug: 'yatili-yardimci',
    breadcrumb: 'Yatılı Yardımcı',
    h1: 'Yatılı Yardımcı Arıyorum — <em class="text-accent">7/24</em> Evde Konaklayan Personel',
    heroDesc: 'Yatılı yardımcı, yatılı ev yardımcısı ve yatılı bakıcı arayan aileler için referanslı, deneyimli aday temini. Bebek bakımı, ev işleri ve temizlik.',
    image: 'https://images.unsplash.com/photo-1476703993599-0035a21b17a9?w=800&q=80',
    imageAlt: 'Yatılı yardımcı ve yatılı ev yardımcısı',
    intro: 'Yatılı yardımcı arayan aileler için evde konaklayarak 7/24 hizmet veren referanslı personel sunuyoruz. Yatılı yardımcı; bebek bakıcısı, çocuk bakıcısı, ev yardımcısı veya yaşlı bakımı alanlarında çalışabilir. Türkmen, Özbek ve yabancı uyruklu yatılı yardımcı seçenekleri mevcuttur. Tüm adaylarımız referans kontrolü, sabıka kaydı sorgusu ve sağlık raporu doğrulamasından geçer.',
    subs: [
      ['Yatılı Bebek Bakıcısı', 'Yeni doğan ve bebek bakımında deneyimli yatılı yardımcı.'],
      ['Yatılı Ev Yardımcısı', 'Ev işleri, yemek, temizlik ve ütü için yatılı personel.'],
      ['Yatılı Çocuk Bakıcısı', 'Okul öncesi ve okul çağı çocuklar için yatılı bakıcı.'],
      ['Yatılı Yaşlı Bakıcı', 'Alzheimer, demans ve genel yaşlı bakımında yatılı yardımcı.'],
      ['Yatılı Hasta Bakıcı', 'Evde hasta bakımı ve refakat için yatılı personel.'],
      ['Türkmen Yatılı Yardımcı', 'Referanslı Türkmen uyruklu yatılı yardımcı temini.'],
    ],
    faqs: [
      ['Yatılı yardımcı ne yapar?', 'Evde konaklayarak bebek/çocuk bakımı, yaşlı bakımı, ev işleri, temizlik, yemek ve ütü hizmetleri sunar.'],
      ['Yatılı yardımcı ile yatılı bakıcı farkı nedir?', 'Yatılı bakıcı öncelikle bakım odaklıdır; yatılı yardımcı bakımın yanı sıra ev işlerine de destek verebilir.'],
      ['Yatılı yardımcı ücretleri ne kadar?', 'Deneyim, hizmet türü ve çalışma koşullarına göre değişir. Ücretsiz teklif için formu doldurun.'],
      ['Referans kontrolü yapılıyor mu?', 'Evet, tüm yatılı yardımcı adayları referans ve belge kontrolünden geçer.'],
    ],
    formTitle: 'Yatılı Yardımcı Talep Formu',
    serviceOptions: ['Yatılı Bebek Bakıcısı', 'Yatılı Ev Yardımcısı', 'Yatılı Çocuk Bakıcısı', 'Yatılı Yaşlı Bakıcı', 'Yatılı Hasta Bakıcı', 'Türkmen Yatılı Yardımcı'],
    cta: 'Yatılı Yardımcı İçin Hemen Başvurun',
    relatedLinks: [
      ['yatili-bakici.html', 'Yatılı Bakıcı'],
      ['ev-yardimcisi.html', 'Ev Yardımcısı'],
      ['bebek-bakicisi.html', 'Bebek Bakıcısı'],
    ],
  },
  {
    slug: 'gundelikci',
    breadcrumb: 'Gündelikçi',
    h1: 'Gündelikçi Arıyorum — <em class="text-accent">Günlük</em> & Gündelik Temizlik Personeli',
    heroDesc: 'Gündelikçi, günlük temizlik personeli ve ev temizliği için yardımcı arayan aileler için güvenilir, referanslı aday temini. İstanbul geneli.',
    image: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=800&q=80',
    imageAlt: 'Gündelikçi ve günlük temizlik personeli',
    intro: 'Gündelikçi arayan aileler için güvenilir temizlik personeli temin ediyoruz. Gündelikçi; ev temizliği, günlük temizlik ve gündelik temizlik ihtiyaçlarınız için belirli günlerde veya tek seferlik olarak evinize gelen deneyimli yardımcılardır. Ev işlerine yardımcı kadın, temizlik personeli ve düzenli günlük temizlik seçenekleri sunuyoruz. İstanbul\'un tüm ilçelerinde hizmet veriyoruz.',
    subs: [
      ['Gündelik Temizlik', 'Tek seferlik veya ihtiyaç anında gündelik temizlik hizmeti.'],
      ['Günlük Temizlik Personeli', 'Haftanın belirli günlerinde gelen düzenli temizlik personeli.'],
      ['Ev Temizliği Gündelikçi', 'Genel ev temizliği, banyo, mutfak ve toz alma hizmeti.'],
      ['Yarım Gün Gündelikçi', '4-5 saatlik yarım gün temizlik personeli.'],
      ['Tam Gün Gündelikçi', '8 saat ve üzeri tam gün ev temizliği personeli.'],
      ['Ev İşlerine Yardımcı', 'Temizliğe ek yemek, ütü ve alışveriş desteği.'],
    ],
    faqs: [
      ['Gündelikçi nedir?', 'Gündelikçi, belirli günlerde veya tek seferlik olarak ev temizliği ve ev işlerine yardımcı olan temizlik personelidir.'],
      ['Gündelikçi ile günlük temizlik personeli farkı nedir?', 'Gündelikçi genelde tek seferlik veya düzensiz ihtiyaç içindir; günlük temizlik personeli düzenli tekrarlayan hizmettir.'],
      ['Ev temizliği için gündelikçi bulabilir miyim?', 'Evet, ev temizliği, günlük temizlik ve gündelik temizlik için referanslı personel temin ediyoruz.'],
      ['Hangi ilçelere hizmet veriyorsunuz?', 'İstanbul geneli — Kadıköy, Beşiktaş, Üsküdar, Ataşehir ve tüm ilçeler.'],
    ],
    formTitle: 'Gündelikçi / Temizlik Talep Formu',
    serviceOptions: ['Gündelik Temizlik', 'Günlük Temizlik Personeli', 'Ev Temizliği', 'Yarım Gün Gündelikçi', 'Tam Gün Gündelikçi', 'Ev İşlerine Yardımcı'],
    cta: 'Gündelikçi İçin Hemen Başvurun',
    relatedLinks: [
      ['ev-temizligi.html', 'Ev Temizliği'],
      ['ev-yardimcisi.html', 'Ev Yardımcısı'],
      ['gunduzlu-bakici.html', 'Gündüzlü Bakıcı'],
    ],
  },
  {
    slug: 'bakici-ariyorum',
    breadcrumb: 'Bakıcı Arıyorum',
    h1: 'Bakıcı Arıyorum — <em class="text-accent">Referanslı</em> Bakıcı & Yardımcı Bulma',
    heroDesc: 'Bakıcı arıyorum diyorsanız doğru yerdesiniz. Bebek bakıcısı, çocuk bakıcısı, yabancı bakıcı, yatılı bakıcı, ev yardımcısı ve gündelikçi temini.',
    image: 'https://images.unsplash.com/photo-1555252333-9f8e92e65df9?w=800&q=80',
    imageAlt: 'Bakıcı arıyorum - referanslı bakıcı temini',
    intro: 'Bakıcı arıyorum araması yapan binlerce aile gibi siz de güvenilir bir bakıcı veya yardımcı arıyorsanız Benim Bakıcım yanınızda. 8 yıllık deneyimimizle bebek bakıcısı, çocuk bakıcısı, yabancı bakıcı, yatılı bakıcı, yatılı yardımcı, ev yardımcısı, ev temizliği ve gündelikçi temini yapıyoruz. İstanbul genelinde referanslı, sabıka kaydı kontrol edilmiş adaylar sunuyoruz. Ücretsiz danışmanlık için hemen talep oluşturun.',
    subs: [
      ['Bebek Bakıcısı Arıyorum', 'Yeni doğan ve bebek bakımında referanslı bakıcı.'],
      ['Yatılı Bakıcı Arıyorum', '7/24 evde konaklayan yatılı bakıcı ve yatılı yardımcı.'],
      ['Ev Yardımcısı Arıyorum', 'Ev işlerine yardımcı kadın, temizlik ve yemek.'],
      ['Yabancı Bakıcı Arıyorum', 'Türkmen, Özbek, Filipinli referanslı yabancı bakıcı.'],
      ['Gündelikçi Arıyorum', 'Ev temizliği, günlük temizlik, gündelik temizlik personeli.'],
      ['Hasta Bakıcısı Arıyorum', 'Evde ve hastanede refakat, hasta bakımı.'],
    ],
    faqs: [
      ['Bakıcı arıyorum, nereden başlamalıyım?', 'Talep formunu doldurun veya WhatsApp\'tan yazın. Danışmanımız 24-48 saat içinde sizi arayarak ihtiyacınızı dinler.'],
      ['Bakıcı bulmak ne kadar sürer?', 'Genellikle birkaç gün içinde uygun adayları yönlendiriyoruz. Acil taleplerde hızlandırılmış eşleştirme yapılır.'],
      ['Bakıcı arıyorum ama güvenemiyorum, ne yapmalıyım?', 'Tüm adaylarımız yüz yüze mülakat, referans araması ve sabıka kaydı kontrolünden geçer. Yazılı sözleşme düzenlenir.'],
      ['Yardımcı ve bakıcı arasındaki fark nedir?', 'Bakıcı bebek, çocuk, hasta veya yaşlı bakımına odaklanır; yardımcı ev işleri, temizlik ve genel destek sunar.'],
    ],
    formTitle: 'Bakıcı Arıyorum — Talep Formu',
    serviceOptions: ['Bebek Bakıcısı', 'Çocuk Bakıcısı', 'Yatılı Bakıcı', 'Yatılı Yardımcı', 'Ev Yardımcısı', 'Gündelikçi / Ev Temizliği', 'Yabancı Bakıcı', 'Hasta Bakıcısı', 'Yaşlı Bakıcısı'],
    cta: 'Bakıcı Arıyorum — Hemen Başvurun',
    relatedLinks: [
      ['bebek-bakicisi.html', 'Bebek Bakıcısı'],
      ['yatili-bakici.html', 'Yatılı Bakıcı'],
      ['yabanci-bakici.html', 'Yabancı Bakıcı'],
    ],
  },
];

function buildPage(p) {
  const subsHtml = p.subs.map(([title, desc]) =>
    `<div class="sub-service-card"><h4>${title}</h4><p>${desc}</p></div>`
  ).join('\n        ');

  const faqHtml = p.faqs.map(([q, a]) =>
    `<div class="faq-item"><button class="faq-question">${q}</button><div class="faq-answer"><div class="faq-answer-inner">${a}</div></div></div>`
  ).join('\n        ');

  const optionsHtml = p.serviceOptions.map(o => `<option>${o}</option>`).join('');
  const relatedHtml = p.relatedLinks.map(([href, label]) =>
    `<a href="${href}" class="btn-link" style="margin-right:16px;">${label} →</a>`
  ).join('\n          ');

  return `<!DOCTYPE html>
<html lang="tr">
<head>
<!-- Google Tag Manager -->
<script>(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','GTM-NQN6XNC8');</script>
<!-- End Google Tag Manager -->
<!-- Google tag (gtag.js) -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-ZKGP1FHNJ6"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());

  gtag('config', 'G-ZKGP1FHNJ6');
</script>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${p.breadcrumb} | Benim Bakıcım</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700&family=Playfair+Display:ital,wght@0,600;0,700;1,600&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="../css/styles.css">
</head>
<body>
<!-- Google Tag Manager (noscript) -->
<noscript><iframe src="https://www.googletagmanager.com/ns.html?id=GTM-NQN6XNC8"
height="0" width="0" style="display:none;visibility:hidden"></iframe></noscript>
<!-- End Google Tag Manager (noscript) -->
  <div class="top-bar"><div class="container"><span>📍 İstanbul Geneli — WhatsApp ile 7/24 destek</span><div class="top-bar-social"><a href="https://instagram.com/yatili.bakici" target="_blank" rel="noopener">Instagram</a><a href="https://wa.me/905355963545" target="_blank" rel="noopener">WhatsApp</a></div></div></div>
  <header class="header"><div class="container header-inner"><a href="../index.html" class="logo"><img src="../assets/logo-icon.png" alt="Benim Bakıcım logosu" class="logo-img"> Benim <span>Bakıcım</span></a><ul class="nav-desktop"><li><a href="../index.html">Ana Sayfa</a></li><li><a href="bakici-ariyorum.html">Bakıcı Arıyorum</a></li><li><a href="ilan-ver.html">İlan Ver</a></li><li><a href="iletisim.html">İletişim</a></li></ul><div class="header-actions"><a href="https://wa.me/905355963545" class="header-whatsapp" target="_blank" rel="noopener">💬 0535 596 35 45</a><a href="#talep-formu" class="btn btn-primary btn-sm">Talep Et</a><button class="menu-toggle">☰</button></div></div></header>
  <nav class="mobile-nav"><div class="mobile-nav-header"><a href="../index.html" class="logo"><img src="../assets/logo-icon.png" alt="Benim Bakıcım logosu" class="logo-img"> Benim <span>Bakıcım</span></a><button class="mobile-nav-close">✕</button></div><a href="../index.html">Ana Sayfa</a><a href="bebek-bakicisi.html">Bebek Bakıcısı</a><a href="yatili-bakici.html">Yatılı Bakıcı</a><a href="ev-temizligi.html">Ev Temizliği</a><a href="iletisim.html">İletişim</a></nav>

  <section class="page-hero">
    <div class="container">
      <div class="breadcrumb"><a href="../index.html">Ana Sayfa</a> / ${p.breadcrumb}</div>
      <div class="service-hero" style="padding:0;color:white;">
        <div>
          <div class="section-label" style="color:var(--sage-light);">Referanslı & Güvenilir</div>
          <h1 style="color:white;">${p.h1}</h1>
          <p style="color:rgba(255,255,255,0.88);">${p.heroDesc}</p>
          <div class="hero-buttons" style="margin-top:24px;">
            <a href="#talep-formu" class="btn btn-primary btn-lg">Ücretsiz Talep</a>
            <a href="https://wa.me/905355963545" class="btn btn-outline btn-lg" target="_blank" rel="noopener">WhatsApp'tan Yaz</a>
          </div>
        </div>
        <div class="service-hero-image"><img src="${p.image}" alt="${p.imageAlt}"></div>
      </div>
    </div>
  </section>

  <section class="section section-white"><div class="container container-narrow"><h2>${p.breadcrumb} Hizmeti</h2><p class="text-muted" style="margin:20px 0;line-height:1.8;">${p.intro}</p><div style="margin-top:24px;">${relatedHtml}</div></div></section>

  <section class="section section-cream"><div class="container"><div class="section-header"><h2>${p.breadcrumb} Seçenekleri</h2></div><div class="sub-services">${subsHtml}</div></div></section>

  <section class="section section-white"><div class="container"><div class="section-header"><h2>Nasıl Çalışır?</h2></div><div class="process-steps"><div class="process-step"><h4>Talep Oluşturun</h4><p>Formu doldurun veya WhatsApp\'tan yazın.</p></div><div class="process-step"><h4>Aday Eşleştirme</h4><p>Referanslı adayları sunuyoruz.</p></div><div class="process-step"><h4>Görüşme</h4><p>Tanışma görüşmesi düzenliyoruz.</p></div><div class="process-step"><h4>Yerleştirme</h4><p>Sözleşme ve takip desteği.</p></div></div></div></section>

  <section class="section section-cream" id="talep-formu"><div class="container"><div class="form-card" style="max-width:600px;margin:0 auto;"><h3>${p.formTitle}</h3><p class="text-muted" style="margin-bottom:24px;">Formu doldurun, uzmanımız WhatsApp üzerinden sizi arasın.</p><form class="contact-form" name="talep" method="POST" action="/api/form">
            <input type="hidden" name="form-name" value="talep">
            <p class="netlify-honeypot" style="display:none" aria-hidden="true"><label>Boş bırakın <input name="bot-field" tabindex="-1" autocomplete="off"></label></p>
            <div class="form-group"><label>Ad Soyad</label><input type="text" name="name" required placeholder="Adınız Soyadınız"></div>
            <div class="form-group"><label>WhatsApp / Telefon</label><input type="tel" name="phone" required placeholder="05XX XXX XX XX"></div>
            <div class="form-group"><label>İhtiyacınız</label><select name="service">${optionsHtml}</select></div>
            <div class="form-group"><label>İlçe / Semt</label><input type="text" name="district" placeholder="Örn: Kadıköy, Beşiktaş, Üsküdar"></div>
            <div class="form-group"><label>Mesaj</label><textarea name="message" placeholder="İhtiyacınızı açıklayın..."></textarea></div>
            <label class="form-checkbox"><input type="checkbox" name="kvkk" value="onaylandi" required><span><a href="kvkk.html">KVKK</a> metnini onaylıyorum.</span></label>
            <button type="submit" class="btn btn-primary btn-lg" style="width:100%;">Talep Gönder</button></form></div></div></section>

  <section class="section section-white"><div class="container"><div class="section-header"><h2>Sık Sorulan Sorular</h2></div><div class="faq-list">${faqHtml}</div></div></section>

  <section class="section section-cream"><div class="container"><div class="cta-banner"><h2>${p.cta}</h2><p>8 yıllık tecrübemizle size en uygun adayı bulalım.</p><a href="#talep-formu" class="btn btn-secondary btn-lg">Ücretsiz Talep</a></div></div></section>

  <footer class="footer"><div class="container"><div class="footer-bottom" style="border:none;padding-top:0;"><span>© 2026 Benim Bakıcım</span><div class="footer-bottom-links"><a href="../index.html">Ana Sayfa</a><a href="iletisim.html">İletişim</a></div></div></div></footer>
  <div class="floating-actions"><a href="https://wa.me/905355963545" class="floating-btn whatsapp">💬</a></div>
  <script src="../js/main.js"></script>
</body>
</html>`;
}

LANDING_PAGES.forEach(p => {
  const filePath = path.join(pagesDir, `${p.slug}.html`);
  fs.writeFileSync(filePath, buildPage(p));
  console.log('Created:', p.slug);
});

console.log('Done. Run: node apply-seo.js');
