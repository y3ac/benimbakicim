/* Benim Bakıcım — Site Configuration */
const SITE = {
  email: 'info@benimbakicim.com',
  whatsappNumber: '905355963545',
  whatsappDisplay: '0535 596 35 45',
  whatsappUrl: 'https://wa.me/905355963545',
  formProvider: 'cloudflare',
  formEndpoint: '/api/form',
  thankYouUrl: '/pages/tesekkur.html',
  paymentMethod: 'catalog_havale',
  bankTransfer: {
    bankName: '',
    accountHolder: 'Benim Bakıcım',
    iban: '',
    transferNote: 'Havale/EFT açıklama alanına ilan kodunuzu yazın',
  },
  orderReplyTemplate:
    'Siparişiniz alındı. Ödeme için havale/EFT ile aşağıdaki IBAN’a gönderim yapabilirsiniz.\n\n' +
    'Hesap sahibi: Benim Bakıcım\n' +
    'IBAN: (buraya IBAN)\n\n' +
    'Açıklama alanına ilan kodunuzu yazın.\n' +
    'Ödeme görünür görünmez siparişi onaylayıp ilan sürecine devam ederiz.',
  catalogPaymentMessage:
    'Merhaba, Standart İlan Paketi (1.000 TL) sipariş etmek istiyorum.',
  catalogPaymentUrl:
    'https://wa.me/905355963545?text=' +
    encodeURIComponent('Merhaba, Standart İlan Paketi (1.000 TL) sipariş etmek istiyorum.'),
  applicantsPerPackage: 3,
  listingPackages: [
    {
      id: 'standart',
      name: 'Standart İlan Paketi',
      price: 1000,
      priceLabel: '1.000 TL',
      badge: 'Önerilen',
      description:
        'İlanınız yayınlanır; en fazla 3 başvuran telefonu WhatsApp ve e-posta ile iletilir. Yayın, ödemeden sonra en geç 24 saat içinde başlar.',
      whatsappMessage: 'Merhaba, Standart İlan Paketi (1.000 TL) sipariş etmek istiyorum.',
      features: [
        'İlan bakıcı / yardımcı havuzunda yayınlanır',
        'En fazla 3 başvuran telefon numarası',
        'WhatsApp ve e-posta ile iletim',
        'Ödeme sonrası en geç 24 saat',
        'Görüşmeyi siz yönetirsiniz'
      ]
    },
    {
      id: 'acil',
      name: 'Acil İlan Paketi',
      price: 1500,
      priceLabel: '1.500 TL',
      badge: 'Hızlı',
      description:
        'Öncelikli yayın; ödemeden sonra en geç 12 saat. En fazla 3 numara WhatsApp ve e-posta ile iletilir.',
      whatsappMessage: 'Merhaba, Acil İlan Paketi (1.500 TL) sipariş etmek istiyorum.',
      features: [
        'Öncelikli ilan yayını',
        'En fazla 3 başvuran telefon numarası',
        'WhatsApp ve e-posta ile iletim',
        'Ödeme sonrası en geç 12 saat',
        'Görüşmeyi siz yönetirsiniz'
      ]
    }
  ],
  address: 'Soğanlık Yeni Mah. Baltacı Mehmetpaşa Sk. AC Moment Yapı B Blok No: 4 B İç Kapı No: 286, Kartal/İstanbul',
  phoneDisplay: '0535 596 35 45',
  phoneTel: '+905355963545',
  merchant: {
    brandName: 'Benim Bakıcım',
    legalName: 'Benim Bakıcım',
    taxOffice: '',
    taxNumber: '',
    mersis: '',
    email: 'info@benimbakicim.com',
    workingHours: 'Pazartesi–Cumartesi 09:00–19:00',
  },
  serviceDefinition: {
    title: 'İlan yayını ve başvuru iletimi',
    summary:
      'Ödeme sonrası ilanınız bakıcı/yardımcı havuzunda yayınlanır; başvuran telefon numaraları WhatsApp ve e-posta ile iletilir (paket başına en fazla 3).',
    deliveryWindow:
      'Ödeme tamamlandıktan sonra Standart pakette en geç 24 saat, Acil pakette en geç 12 saat içinde ilan yayını başlar. Başvuran bilgileri başvuru geldikçe WhatsApp ve e-posta ile iletilir.',
    deliveryChannel: 'WhatsApp ve e-posta',
  },
  instagram: 'https://instagram.com/yatili.bakici',
  instagramHandle: '@yatili.bakici',
}
