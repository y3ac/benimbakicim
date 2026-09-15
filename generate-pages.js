#!/usr/bin/env node
/**
 * Generate service pages for Benim Bakıcım
 */
const fs = require('fs');
const path = require('path');

const pagesDir = path.join(__dirname, 'pages');

const services = [
  {
    slug: 'ozbek-bakici',
    title: 'Özbek Bakıcı',
    meta: 'Özbek bakıcı temini — referanslı, deneyimli ve güvenilir Özbek uyruklu bakıcılar.',
    heroTitle: 'Güvenilir & Referanslı <em class="text-accent">Özbek</em> Bakıcı',
    heroDesc: 'Disiplinli, çalışkan ve aile odaklı Özbek uyruklu bakıcılar — referansları doğrulanmış profesyoneller.',
    image: 'https://images.unsplash.com/photo-1476703993599-0035a21b17a9?w=800&q=80',
    intro: 'Özbek bakıcılar, temizlik ve düzen konusundaki titizlikleri, çocuk bakımındaki deneyimleri ve güvenilirlikleriyle aileler tarafından sıklıkla tercih edilir. Benim Bakıcım olarak tüm Özbek uyruklu adaylarımızı kapsamlı değerlendirme sürecinden geçiriyoruz.',
    subs: ['Yatılı Özbek Bakıcı', 'Gündüzlü Özbek Bakıcı', 'Bebek & Çocuk Bakımı', 'Yaşlı & Hasta Bakımı', 'Ev Yardımcısı', 'Referanslı Bakıcı'],
    faqs: [
      ['Özbek bakıcılar hangi alanlarda hizmet verir?', 'Bebek ve çocuk bakımı, yaşlı bakımı, hasta refakati ve ev yardımcılığı alanlarında deneyimli Özbek bakıcılar sunuyoruz.'],
      ['Referans kontrolü yapılıyor mu?', 'Evet, tüm adayların referansları aranır, sabıka kaydı ve sağlık raporu kontrol edilir.'],
      ['Ücretler nasıl belirlenir?', 'Deneyim, çalışma şekli ve hizmet türüne göre değişir. Ücretsiz danışmanlık için formu doldurun.'],
    ],
  },
  {
    slug: 'yabanci-bakici',
    title: 'Yabancı Uyruklu Bakıcı',
    meta: 'Yabancı uyruklu referanslı bakıcı temini — Türkmen, Özbek, Filipinli ve daha fazlası.',
    heroTitle: 'Referanslı <em class="text-accent">Yabancı Uyruklu</em> Bakıcılar',
    heroDesc: 'Türkmen, Özbek, Filipinli ve diğer uyruklardan çalışma izinli, eğitimli ve referanslı profesyonel bakıcılar.',
    image: 'https://images.unsplash.com/photo-1476703993599-0035a21b17a9?w=800&q=80',
    intro: 'Yabancı uyruklu bakıcı temini konusunda 8 yıllık deneyimimizle, ailelerin ihtiyaçlarına en uygun adayları güvenle eşleştiriyoruz. Tüm adaylarımız yasal çalışma iznine sahip, referansları doğrulanmış profesyonellerdir.',
    subs: ['Türkmen Bakıcı', 'Özbek Bakıcı', 'Filipinli Bakıcı', 'Yatılı Yabancı Bakıcı', 'Gündüzlü Yabancı Bakıcı', 'İngilizce Bilen Bakıcı'],
    faqs: [
      ['Yabancı bakıcılar yasal mı çalışıyor?', 'Evet, tüm adaylarımız çalışma ve oturma izni süreçlerini tamamlamış kişilerdir.'],
      ['Hangi uyruklardan bakıcı bulabilirim?', 'Türkmen, Özbek, Filipinli ve diğer uyruklardan referanslı bakıcı temin ediyoruz.'],
      ['Yerleştirme sonrası destek var mı?', 'Evet, yerleştirme sonrasında da iletişimde kalarak yanınızdayız.'],
    ],
  },
  {
    slug: 'bebek-bakicisi',
    title: 'Bebek Bakıcısı',
    meta: 'Bebek bakıcısı İstanbul — güvenilir, referanslı bebek bakıcı temini.',
    heroTitle: 'Güvenilir & Referanslı <em class="text-accent">Bebek Bakıcısı</em>',
    heroDesc: 'Yeni doğandan itibaren bebeğinizin beslenme, uyku ve gelişim sürecine şefkatle eşlik eden deneyimli bakıcılar.',
    image: 'https://images.unsplash.com/photo-1555252333-9f8e92e65df9?w=800&q=80',
    intro: 'Bebeğinizin ilk yılları hayatının temelini oluşturur. Benim Bakıcım olarak bu hassas dönemde ailenize en doğru bebek bakıcısını bulmak için yanınızdayız.',
    subs: ['Yatılı Bebek Bakıcısı', 'Gündüzlü Bebek Bakıcısı', 'Yeni Doğan Bakıcısı', 'İkiz Bebek Bakıcısı', 'Türkmen Bebek Bakıcısı', 'Referanslı Bebek Bakıcısı'],
    faqs: [
      ['Bebek bakıcısı nasıl seçilir?', 'Deneyim, referans kontrolü, sağlık raporu ve aile uyumu en önemli kriterlerdir.'],
      ['Yatılı ve gündüzlü farkı nedir?', 'Yatılı bakıcı evde konaklayarak 7/24 destek sunar; gündüzlü belirli saatlerde gelir.'],
      ['Süreç ne kadar sürer?', 'Genellikle birkaç gün içinde uygun adayları yönlendiriyoruz.'],
    ],
  },
  {
    slug: 'cocuk-bakicisi',
    title: 'Çocuk Bakıcısı',
    meta: 'Çocuk bakıcısı — eğitimli oyun ablası ve dadı temini.',
    heroTitle: 'Eğitimli & Sevecen <em class="text-accent">Çocuk Bakıcısı</em>',
    heroDesc: 'Oyunla öğreten, çocuğunuzun sosyal ve zihinsel gelişimini destekleyen eğitimli bakıcılar.',
    image: 'https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?w=800&q=80',
    intro: 'Okul öncesi ve okul çağındaki çocuklarınız için deneyimli, sabırlı ve eğitimli bakıcılar sunuyoruz. Oyun ablası, dadı ve okul sonrası bakıcı seçenekleri mevcuttur.',
    subs: ['Yatılı Çocuk Bakıcısı', 'Okul Sonrası Bakıcı', 'Oyun Ablası', 'Profesyonel Dadı', 'Türkmen Çocuk Bakıcısı', 'Özbek Çocuk Bakıcısı'],
    faqs: [
      ['Çocuk bakıcısı ne yapar?', 'Beslenme, oyun, ödev desteği, okula götürme-alma ve gelişim aktiviteleri.'],
      ['Okul sonrası bakıcı bulabilir miyim?', 'Evet, belirli saatlerde gelen okul sonrası bakıcı temin ediyoruz.'],
      ['Referans kontrolü var mı?', 'Tüm adayların referansları doğrulanır.'],
    ],
  },
  {
    slug: 'hasta-bakicisi',
    title: 'Hasta Bakıcısı',
    meta: 'Hasta bakıcısı — evde ve hastanede refakat, ameliyat sonrası bakım.',
    heroTitle: 'Deneyimli & Sabırlı <em class="text-accent">Hasta Bakıcısı</em>',
    heroDesc: 'Hastane ve evde refakat, ameliyat sonrası bakım ve kronik hastalıklarda deneyimli bakım personeli.',
    image: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=800&q=80',
    intro: 'Hasta yakınlarının bakımında deneyimli, sabırlı ve güvenilir bakıcılarımızla evde ve hastanede profesyonel refakat hizmeti sunuyoruz.',
    subs: ['Evde Hasta Bakımı', 'Yatılı Hasta Bakıcı', 'Ameliyat Sonrası Bakım', 'Alzheimer Bakıcısı', 'Felçli Hasta Bakıcı', 'Kronik Hasta Bakımı'],
    faqs: [
      ['Hasta bakıcısı hangi görevleri üstlenir?', 'İlaç takibi, hijyen, beslenme desteği, refakat ve günlük ihtiyaçlar.'],
      ['Acil ihtiyaç karşılanır mı?', 'Evet, acil taleplerde hızlandırılmış eşleştirme yapıyoruz.'],
      ['Evde mi hastanede mi?', 'Her iki ortamda da hizmet veriyoruz.'],
    ],
  },
  {
    slug: 'yasli-bakicisi',
    title: 'Yaşlı Bakıcısı',
    meta: 'Yaşlı bakıcısı — Alzheimer, demans ve Parkinson bakımında uzman personel.',
    heroTitle: 'Saygılı & Şefkatli <em class="text-accent">Yaşlı Bakıcısı</em>',
    heroDesc: 'Alzheimer, demans ve Parkinson gibi durumlarda uzmanlaşmış, büyüklerimize saygıyla yaklaşan bakıcılar.',
    image: 'https://images.unsplash.com/photo-1576765608535-5f04d1e3f289?w=800&q=80',
    intro: 'Yaşlı bakımında deneyimli, sabırlı ve güvenilir personelimizle büyüklerinize hak ettikleri özeni sunuyoruz. Yatılı ve gündüzlü seçenekler mevcuttur.',
    subs: ['Yatılı Yaşlı Bakıcısı', 'Alzheimer Bakıcısı', 'Demans Bakıcı', 'Parkinson Bakıcı', 'Türkmen Yaşlı Bakıcı', 'Evde Yaşlı Bakımı'],
    faqs: [
      ['Yaşlı bakıcısı ne yapar?', 'Günlük bakım, ilaç takibi, refakat, beslenme ve sosyal aktivite desteği.'],
      ['Alzheimer hastası için özel bakıcı var mı?', 'Evet, Alzheimer ve demans bakımında deneyimli adaylarımız var.'],
      ['Yatılı hizmet mümkün mü?', 'Evet, 7/24 yatılı yaşlı bakıcı temin ediyoruz.'],
    ],
  },
  {
    slug: 'ev-yardimcisi',
    title: 'Ev Yardımcısı',
    meta: 'Ev yardımcısı ve temizlik personeli — güvenilir yatılı ve gündüzlü seçenekler.',
    heroTitle: 'Güvenilir <em class="text-accent">Ev Yardımcısı</em>',
    heroDesc: 'Evinizin düzeni için güvenilir ev yardımcıları, temizlik personeli ve yatılı hizmet seçenekleri.',
    image: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=800&q=80',
    intro: 'Ev işleri, temizlik ve günlük düzen konularında deneyimli, güvenilir ev yardımcıları sunuyoruz. Türkmen ve Özbek uyruklu personel seçenekleri mevcuttur.',
    subs: ['Yatılı Ev Yardımcısı', 'Gündüzlü Ev Yardımcısı', 'Temizlik Personeli', 'Türkmen Ev Yardımcısı', 'Özbek Ev Yardımcısı', 'Yemek & Temizlik'],
    faqs: [
      ['Ev yardımcısı ne yapar?', 'Temizlik, yemek, ütü, alışveriş ve genel ev düzeni.'],
      ['Yatılı ev yardımcısı bulabilir miyim?', 'Evet, yatılı ev yardımcısı temin ediyoruz.'],
      ['Referans kontrolü yapılıyor mu?', 'Tüm adaylar referans ve belge kontrolünden geçer.'],
    ],
  },
  {
    slug: 'yatili-bakici',
    title: 'Yatılı Bakıcı',
    meta: 'Yatılı bakıcı temini — 7/24 evde konaklayan referanslı bakıcılar.',
    heroTitle: '7/24 Destek Sunan <em class="text-accent">Yatılı</em> Bakıcı',
    heroDesc: 'Evinizde konaklayarak gece dahil tam bakım hizmeti veren, referanslı yatılı bakıcılar.',
    image: 'https://images.unsplash.com/photo-1476703993599-0035a21b17a9?w=800&q=80',
    intro: 'Yatılı bakıcılar evinizde konaklayarak 7/24 destek sunar. Bebek bakımı, yaşlı bakımı ve ev yardımcılığı alanlarında Türkmen, Özbek ve yabancı uyruklu deneyimli adaylar temin ediyoruz.',
    subs: ['Yatılı Bebek Bakıcısı', 'Yatılı Çocuk Bakıcısı', 'Yatılı Yaşlı Bakıcı', 'Yatılı Hasta Bakıcı', 'Yatılı Ev Yardımcısı', 'Türkmen Yatılı Bakıcı'],
    faqs: [
      ['Yatılı bakıcı ne yapar?', 'Evde konaklayarak gece dahil tam bakım, çocuk/yetişkin bakımı ve ev düzeni desteği sunar.'],
      ['Hafta sonu izni var mı?', 'Çalışma koşulları sözleşmede belirlenir; genellikle haftada 1 gün izin uygulanır.'],
      ['Yatılı bakıcı ücretleri?', 'Deneyim ve hizmet türüne göre değişir; ücretsiz teklif için formu doldurun.'],
    ],
  },
  {
    slug: 'gunduzlu-bakici',
    title: 'Gündüzlü Bakıcı',
    meta: 'Gündüzlü bakıcı — belirli saatlerde gelen esnek bakım çözümleri.',
    heroTitle: 'Esnek Saatlerle <em class="text-accent">Gündüzlü</em> Bakıcı',
    heroDesc: 'Belirli saatlerde gelerek gün içinde bakım hizmeti veren, çalışan ebeveynler için ideal bakıcılar.',
    image: 'https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?w=800&q=80',
    intro: 'Gündüzlü bakıcılar belirlediğiniz saatlerde gelerek gün içinde bakım hizmeti sunar. Part-time ve tam gün seçenekleri mevcuttur.',
    subs: ['Gündüzlü Bebek Bakıcısı', 'Gündüzlü Çocuk Bakıcısı', 'Okul Sonrası Bakıcı', 'Gündüzlü Yaşlı Bakıcı', 'Gündüzlü Ev Yardımcısı', 'Part-time Bakıcı'],
    faqs: [
      ['Gündüzlü bakıcı kaç saat çalışır?', 'Genellikle 4-10 saat arası; ihtiyacınıza göre esnek planlanır.'],
      ['Yatılıdan farkı nedir?', 'Gündüzlü bakıcı akşam eve dönmez, evde kalmaz; belirli saatlerde hizmet verir.'],
      ['Hangi bölgelere hizmet veriyorsunuz?', 'Öncelikli olarak İstanbul genelinde hizmet veriyoruz.'],
    ],
  },
  {
    slug: 'yeni-dogan-bakici',
    title: 'Yeni Doğan Bakıcısı',
    meta: 'Yeni doğan bakıcısı — 0-6 ay bebek bakımında uzman personel.',
    heroTitle: 'Yeni Doğan Döneminde <em class="text-accent">Uzman</em> Bakım',
    heroDesc: '0-6 ay arası yeni doğan bakımında uzmanlaşmış, emzirme desteği ve bebek bakımı konusunda deneyimli bakıcılar.',
    image: 'https://images.unsplash.com/photo-1555252333-9f8e92e65df9?w=800&q=80',
    intro: 'Yeni doğan dönemi bebeğinizin hayatının en hassas evresidir. Deneyimli yeni doğan bakıcılarımız emzirme desteği, uyku düzeni ve hijyen konularında profesyonel yardım sunar.',
    subs: ['Yatılı Yeni Doğan Bakıcı', 'Gündüzlü Yeni Doğan Bakıcı', 'İkiz Bebek Bakıcısı', 'Emzirme Destekli Bakıcı', 'Gece Bakıcısı', 'Referanslı Yeni Doğan Bakıcı'],
    faqs: [
      ['Yeni doğan bakıcısı ne yapar?', 'Emzirme desteği, mama hazırlama, uyku düzeni, banyo ve hijyen bakımı.'],
      ['Gece desteği alabilir miyim?', 'Evet, yatılı veya gece vardiyalı bakıcı temin edebiliriz.'],
      ['Ne zaman başlamalıyım?', 'Doğum öncesi veya sonrası hemen başvurabilirsiniz.'],
    ],
  },
  {
    slug: 'refakatci',
    title: 'Refakatçi',
    meta: 'Refakatçi hizmeti — hastane ve evde profesyonel refakat.',
    heroTitle: 'Profesyonel <em class="text-accent">Refakatçi</em> Hizmeti',
    heroDesc: 'Hastane ve evde refakat, ameliyat ve tedavi süreçlerinde deneyimli refakatçi personeli.',
    image: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=800&q=80',
    intro: 'Hastane ziyaretlerinde, ameliyat öncesi ve sonrası süreçlerde, evde bakım dönemlerinde profesyonel refakatçi hizmeti sunuyoruz.',
    subs: ['Hastane Refakatçisi', 'Evde Refakat', 'Ameliyat Sonrası Refakat', 'Yaşlı Refakatçi', 'Yatılı Refakatçi', 'Gündüzlü Refakatçi'],
    faqs: [
      ['Refakatçi ne yapar?', 'Hasta/yetişkin refakati, ilaç takibi, günlük ihtiyaç desteği ve iletişim.'],
      ['Hastanede refakat mümkün mü?', 'Evet, hastane refakatçisi temin ediyoruz.'],
      ['Acil refakat ihtiyacı karşılanır mı?', 'Evet, acil taleplerde hızlandırılmış eşleştirme yapıyoruz.'],
    ],
  },
  {
    slug: 'ingilizce-bilen-bakici',
    title: 'İngilizce Bilen Bakıcı',
    meta: 'İngilizce bilen bakıcı — çocuğunuzun erken yaşta dil gelişimine katkı.',
    heroTitle: 'İngilizce Konuşan <em class="text-accent">Profesyonel</em> Bakıcı',
    heroDesc: 'İngilizce bilen Filipinli, Türkmen ve yabancı uyruklu bakıcılarla çocuğunuzun dil gelişimine destek.',
    image: 'https://images.unsplash.com/photo-1476703993599-0035a21b17a9?w=800&q=80',
    intro: 'İngilizce bilen bakıcılar, çocuğunuzun erken yaşta yabancı dile aşinalık kazanmasına yardımcı olur. Filipinli ve uluslararası deneyimli adaylarımız mevcuttur.',
    subs: ['Filipinli İngilizce Bakıcı', 'Bebek Bakıcısı (İngilizce)', 'Çocuk Bakıcısı (İngilizce)', 'Yatılı İngilizce Bakıcı', 'Gündüzlü İngilizce Bakıcı', 'Eğitim Odaklı Bakıcı'],
    faqs: [
      ['Gerçekten İngilizce konuşuyorlar mı?', 'Evet, mülakat sırasında dil seviyesi değerlendirilir.'],
      ['Hangi uyruklardan bulabilirim?', 'Filipinli başta olmak üzere İngilizce bilen çeşitli uyruklardan aday sunuyoruz.'],
      ['Bebekler için uygun mu?', 'Evet, bebek bakımında deneyimli İngilizce bilen bakıcılarımız var.'],
    ],
  },
  {
    slug: 'ev-temizligi',
    title: 'Ev Temizliği',
    meta: 'Ev temizliği, günlük temizlik ve gündelik temizlik hizmeti. Güvenilir temizlik personeli temini.',
    heroTitle: 'Ev Temizliği, <em class="text-accent">Günlük Temizlik</em> & Gündelik Temizlik',
    heroDesc: 'Ev temizliği için güvenilir temizlik personeli, günlük temizlik ve gündelik temizlik hizmetleri.',
    image: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=800&q=80',
    intro: 'İstanbul genelinde ev temizliği, günlük temizlik ve gündelik temizlik ihtiyaçlarınız için referanslı temizlik personeli temin ediyoruz.',
    subs: ['Günlük Temizlik', 'Gündelik Temizlik', 'Ev Temizliği Personeli', 'Yatılı Ev Yardımcısı', 'Gündüzlü Temizlik', 'Ütü & Ev Düzeni'],
    faqs: [
      ['Günlük temizlik ile gündelik temizlik farkı nedir?', 'Günlük temizlik düzenli tekrarlayan hizmettir; gündelik temizlik tek seferlik ihtiyaç içindir.'],
      ['Ev temizliği personeli ne yapar?', 'Genel ev temizliği, banyo, mutfak, toz alma, süpürme ve silme işlerini üstlenir.'],
      ['Referans kontrolü yapılıyor mu?', 'Evet, tüm adaylar referans ve belge kontrolünden geçer.'],
    ],
  },
  {
    slug: 'filipinli-bakici',
    title: 'Filipinli Bakıcı',
    meta: 'Filipinli bakıcı — çalışma izinli, İngilizce bilen profesyonel bakıcılar.',
    heroTitle: 'Çalışma İzinli <em class="text-accent">Filipinli</em> Bakıcılar',
    heroDesc: 'Yabancı dil bilen, eğitimli ve resmi çalışma izinli Filipinli profesyonel bakıcılar.',
    image: 'https://images.unsplash.com/photo-1476703993599-0035a21b17a9?w=800&q=80',
    intro: 'Filipinli bakıcılar, uluslararası bakım standartları, İngilizce dil becerisi ve profesyonel yaklaşımlarıyla premium hizmet sunar.',
    subs: ['Filipinli Bebek Bakıcısı', 'Filipinli Çocuk Bakıcısı', 'Yatılı Filipinli Bakıcı', 'İngilizce Eğitimli Bakıcı', 'Referanslı Filipinli Bakıcı', 'Gündüzlü Filipinli Bakıcı'],
    faqs: [
      ['Filipinli bakıcılar çalışma izinli mi?', 'Evet, yönlendirdiğimiz tüm Filipinli bakıcılar resmi çalışma izinlidir.'],
      ['İngilizce konuşuyorlar mı?', 'Evet, İngilizce başta olmak üzere yabancı dil bilen adaylar sunuyoruz.'],
      ['Bebek bakımında deneyimli mi?', 'Evet, bebek ve çocuk bakımında deneyimli Filipinli bakıcılarımız var.'],
    ],
  },
];

function generateServicePage(s) {
  const faqHtml = s.faqs.map(([q, a]) => `
        <div class="faq-item"><button class="faq-question">${q}</button><div class="faq-answer"><div class="faq-answer-inner">${a}</div></div></div>`).join('');

  const subsHtml = s.subs.map(sub => `
        <div class="sub-service-card"><h4>${sub}</h4><p>${sub} hizmeti için referanslı ve deneyimli adaylarımızla iletişime geçin.</p></div>`).join('');

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
  <meta name="description" content="${s.meta}">
  <title>${s.title} | Benim Bakıcım</title>
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
  <div class="top-bar"><div class="container"><span>📍 İstanbul Geneli — WhatsApp ile 7/24 destek</span><div class="top-bar-social"><a href="https://wa.me/905355963545" target="_blank" rel="noopener">WhatsApp</a></div></div></div>
  <header class="header"><div class="container header-inner"><a href="../index.html" class="logo"><img src="../assets/logo-icon.png" alt="Benim Bakıcım logosu" class="logo-img"> Benim <span>Bakıcım</span></a><ul class="nav-desktop"><li><a href="../index.html">Ana Sayfa</a></li><li><a href="turkmen-bakici.html">Hizmetler</a></li><li><a href="ilan-ver.html">İlan Ver</a></li><li><a href="hakkimizda.html">Hakkımızda</a></li><li><a href="iletisim.html">İletişim</a></li></ul><div class="header-actions"><a href="https://wa.me/905355963545" class="header-whatsapp" target="_blank" rel="noopener">💬 0535 596 35 45</a><a href="#talep-formu" class="btn btn-primary btn-sm">Bakıcı Talep Et</a><button class="menu-toggle">☰</button></div></div></header>
  <nav class="mobile-nav"><div class="mobile-nav-header"><a href="../index.html" class="logo"><img src="../assets/logo-icon.png" alt="Benim Bakıcım logosu" class="logo-img"> Benim <span>Bakıcım</span></a><button class="mobile-nav-close">✕</button></div><a href="../index.html">Ana Sayfa</a><a href="turkmen-bakici.html">Türkmen Bakıcı</a><a href="ozbek-bakici.html">Özbek Bakıcı</a><a href="bebek-bakicisi.html">Bebek Bakıcısı</a><a href="iletisim.html">İletişim</a></nav>

  <section class="page-hero">
    <div class="container">
      <div class="breadcrumb"><a href="../index.html">Ana Sayfa</a> / ${s.title}</div>
      <div class="service-hero" style="padding:0;color:white;">
        <div>
          <div class="section-label" style="color:var(--sage-light);">Referanslı & Güvenilir</div>
          <h1 style="color:white;">${s.heroTitle}</h1>
          <p style="color:rgba(255,255,255,0.88);">${s.heroDesc}</p>
          <div class="hero-buttons" style="margin-top:24px;">
            <a href="#talep-formu" class="btn btn-primary btn-lg">Bakıcı Talep Et</a>
            <a href="https://wa.me/905355963545" class="btn btn-outline btn-lg" target="_blank" rel="noopener">WhatsApp'tan Yaz</a>
          </div>
        </div>
        <div class="service-hero-image"><img src="${s.image}" alt="${s.title}"></div>
      </div>
    </div>
  </section>

  <section class="section section-white"><div class="container container-narrow"><h2>${s.title} Hizmetimiz Nedir?</h2><p class="text-muted" style="margin:20px 0;">${s.intro}</p></div></section>

  <section class="section section-cream"><div class="container"><div class="section-header"><h2>${s.title} Hizmet Seçenekleri</h2></div><div class="sub-services">${subsHtml}</div></div></section>

  <section class="section section-white"><div class="container"><div class="section-header"><h2>Bakıcı Bulma Sürecimiz</h2></div><div class="process-steps"><div class="process-step"><h4>İhtiyaç Analizi</h4><p>Beklentilerinizi belirliyoruz.</p></div><div class="process-step"><h4>Aday Eşleştirme</h4><p>Referanslı adayları sunuyoruz.</p></div><div class="process-step"><h4>Görüşme</h4><p>Tanışma görüşmesi düzenliyoruz.</p></div><div class="process-step"><h4>Yerleştirme</h4><p>Sözleşme ve takip desteği.</p></div></div></div></section>

  <section class="section section-cream" id="talep-formu"><div class="container"><div class="form-card" style="max-width:600px;margin:0 auto;"><h3>${s.title} Talep Formu</h3><p class="text-muted" style="margin-bottom:24px;">Formu doldurun, uzmanımız sizi arasın.</p><form class="contact-form" name="talep" method="POST" action="/api/form">
            <input type="hidden" name="form-name" value="talep">
            <p class="netlify-honeypot" style="display:none" aria-hidden="true"><label>Boş bırakın <input name="bot-field" tabindex="-1" autocomplete="off"></label></p>
            <div class="form-group"><label>Ad Soyad</label><input type="text" name="name" required placeholder="Adınız Soyadınız"></div><div class="form-group"><label>WhatsApp / Telefon</label><input type="tel" name="phone" required placeholder="Telefon / WhatsApp"></div><div class="form-group"><label>Hizmet</label><select name="service">${s.subs.map(sub => `<option>${sub}</option>`).join('')}</select></div><div class="form-group"><label>Mesaj</label><textarea name="message" placeholder="İhtiyacınızı açıklayın..."></textarea></div><label class="form-checkbox"><input type="checkbox" name="kvkk" value="onaylandi" required><span><a href="kvkk.html">KVKK</a> metnini onaylıyorum.</span></label><button type="submit" class="btn btn-primary btn-lg" style="width:100%;">Talep Gönder</button></form></div></div></section>

  <section class="section section-white"><div class="container"><div class="section-header"><h2>Sık Sorulan Sorular</h2></div><div class="faq-list">${faqHtml}</div></div></section>

  <section class="section section-cream"><div class="container"><div class="cta-banner"><h2>${s.title} İçin Hemen Başvurun</h2><p>8 yıllık tecrübemizle ailenize en uygun adayı bulalım.</p><a href="#talep-formu" class="btn btn-secondary btn-lg">Ücretsiz Talep</a></div></div></section>

  <footer class="footer"><div class="container"><div class="footer-bottom" style="border:none;padding-top:0;"><span>© 2026 Benim Bakıcım</span><div class="footer-bottom-links"><a href="../index.html">Ana Sayfa</a><a href="iletisim.html">İletişim</a></div></div></div></footer>
  <div class="floating-actions"><a href="https://wa.me/905355963545" class="floating-btn whatsapp">💬</a></div>
  <script src="../js/main.js"></script>
</body>
</html>`;
}

const skipIfExists = ['turkmen-bakici', 'ev-temizligi'];

services.forEach(s => {
  const filePath = path.join(pagesDir, `${s.slug}.html`);
  if (skipIfExists.includes(s.slug)) return;
  if (fs.existsSync(filePath)) {
    console.log('Skipped (exists):', s.slug);
    return;
  }
  fs.writeFileSync(filePath, generateServicePage(s));
  console.log('Created:', s.slug);
});

console.log('Done!');
