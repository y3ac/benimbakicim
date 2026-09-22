// Yonetim paneli HTML'i. Token, API cagrilari icin JS'e gomulur.
export const renderAdminPage = (token = '') => `<!doctype html>
<html lang="tr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Benim Bakıcım — Yönetim Paneli</title>
<style>
  :root{--navy:#0f2744;--orange:#c45c26;--green:#25D366;--bg:#f4f1ec;--card:#fff;--muted:#6b7280;--line:#e5e7eb}
  *{box-sizing:border-box}
  body{font-family:system-ui,-apple-system,Segoe UI,Arial,sans-serif;margin:0;background:var(--bg);color:var(--navy)}
  header{background:var(--navy);color:#fff;padding:16px 24px;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px}
  header h1{font-size:18px;margin:0}
  header .meta{font-size:13px;color:#cbd5e1}
  button{cursor:pointer;border:0;border-radius:8px;padding:8px 14px;font-size:14px;font-weight:600}
  .btn-refresh{background:var(--green);color:#fff}
  main{padding:20px 24px;max-width:1200px;margin:0 auto}
  .cards{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:12px;margin-bottom:24px}
  .card{background:var(--card);border-radius:12px;padding:16px;box-shadow:0 1px 3px rgba(0,0,0,.06)}
  .card .label{font-size:12px;color:var(--muted);text-transform:uppercase;letter-spacing:.04em}
  .card .value{font-size:26px;font-weight:700;margin-top:4px}
  .card.accent .value{color:var(--orange)}
  .card.ok .value{color:#16a34a}
  .section-title{font-size:15px;font-weight:700;margin:20px 0 10px;display:flex;align-items:center;gap:8px}
  .badge{display:inline-block;font-size:11px;font-weight:600;padding:2px 8px;border-radius:999px}
  .b-paid{background:#dcfce7;color:#166534}.b-await{background:#fef9c3;color:#854d0e}.b-draft{background:#e5e7eb;color:#374151}
  .b-status{background:#e0e7ff;color:#3730a3}
  .listing-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:12px}
  .listing{background:var(--card);border-radius:12px;padding:14px;box-shadow:0 1px 3px rgba(0,0,0,.06);cursor:pointer;border:1px solid transparent;transition:.15s}
  .listing:hover{border-color:var(--orange)}
  .listing .code{font-weight:700}
  .listing .row{display:flex;justify-content:space-between;align-items:center;margin-top:6px;font-size:13px;color:var(--muted)}
  .empty{color:var(--muted);font-size:14px;padding:12px 0}
  .drawer-bg{position:fixed;inset:0;background:rgba(0,0,0,.4);display:none;z-index:10}
  .drawer{position:fixed;top:0;right:0;height:100%;width:min(560px,94vw);background:var(--bg);box-shadow:-4px 0 24px rgba(0,0,0,.2);
    transform:translateX(100%);transition:.2s;z-index:11;overflow-y:auto}
  .drawer.open{transform:translateX(0)}.drawer-bg.open{display:block}
  .drawer .head{background:var(--navy);color:#fff;padding:16px 20px;display:flex;justify-content:space-between;align-items:center}
  .drawer .body{padding:16px 20px}
  .box{background:var(--card);border-radius:10px;padding:12px 14px;margin-bottom:12px;box-shadow:0 1px 2px rgba(0,0,0,.05)}
  .box h3{margin:0 0 8px;font-size:13px;text-transform:uppercase;letter-spacing:.04em;color:var(--muted)}
  table{width:100%;border-collapse:collapse;font-size:13px}
  th,td{text-align:left;padding:6px 8px;border-bottom:1px solid var(--line)}
  th{color:var(--muted);font-weight:600}
  .ai{white-space:pre-wrap;font-size:13px;line-height:1.5;background:#fafafa;padding:10px;border-radius:8px}
  .timeline{list-style:none;margin:0;padding:0}
  .timeline li{position:relative;padding:0 0 14px 20px;border-left:2px solid var(--line)}
  .timeline li:last-child{border-left-color:transparent}
  .timeline .dot{position:absolute;left:-7px;top:2px;width:12px;height:12px;border-radius:50%;background:var(--orange)}
  .timeline .t-time{font-size:11px;color:var(--muted)}
  .timeline .t-title{font-weight:600;font-size:13px}
  .timeline .t-detail{font-size:12px;color:var(--muted);white-space:pre-wrap}
  .close{background:transparent;color:#fff;font-size:20px;padding:0 4px}
  .actor{font-size:10px;padding:1px 6px;border-radius:6px;background:#eef2ff;color:#3730a3;margin-left:6px}
  .feed{background:var(--card);border-radius:12px;padding:14px;box-shadow:0 1px 3px rgba(0,0,0,.06)}
  .appr{background:#fffbeb;border:1px solid #fde68a;border-radius:12px;padding:14px;margin-bottom:10px;display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap}
  .appr .info{font-size:14px}
  .appr .info .sub{font-size:12px;color:var(--muted);margin-top:2px}
  .btn-approve{background:#16a34a;color:#fff}.btn-reject{background:#dc2626;color:#fff}
  .btn-sm{padding:6px 12px;font-size:13px}
  .toolbar{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:12px}
  .btn-action{background:#e0e7ff;color:#3730a3}.btn-danger{background:#fee2e2;color:#991b1b}
  select,input[type=text]{padding:7px 10px;border:1px solid var(--line);border-radius:8px;font-size:13px}
</style>
</head>
<body>
<header>
  <div><h1>Benim Bakıcım — Yönetim Paneli</h1><div class="meta" id="meta">Yükleniyor…</div></div>
  <button class="btn-refresh" onclick="load()">Yenile</button>
</header>
<main>
  <div id="approvals-wrap" style="display:none">
    <div class="section-title">🔔 Onay Bekleyen İşlemler <span class="badge b-await" id="c-appr">0</span></div>
    <div id="approvals"></div>
  </div>
  <div class="cards" id="cards"></div>
  <div class="section-title">💰 Ödemesi Alınan İlanlar <span class="badge b-paid" id="c-paid">0</span></div>
  <div class="listing-grid" id="g-paid"></div>
  <div class="section-title">⏳ Ödeme Bekleyen İlanlar <span class="badge b-await" id="c-await">0</span></div>
  <div class="listing-grid" id="g-await"></div>
  <div class="section-title">📝 Taslak / Ödeme Oluşmamış <span class="badge b-draft" id="c-draft">0</span></div>
  <div class="listing-grid" id="g-draft"></div>
  <div class="section-title">🕓 Son Aksiyonlar</div>
  <div class="feed"><ul class="timeline" id="feed"></ul></div>
</main>

<div class="drawer-bg" id="drawerBg" onclick="closeDrawer()"></div>
<div class="drawer" id="drawer">
  <div class="head"><strong id="d-code">—</strong><button class="close" onclick="closeDrawer()">×</button></div>
  <div class="body" id="d-body"></div>
</div>

<script>
const TOKEN = ${JSON.stringify(token)};
const headers = TOKEN ? { 'x-admin-token': TOKEN } : {};
const postHeaders = Object.assign({ 'Content-Type':'application/json' }, headers);
async function post(url, body){
  const r = await fetch(url, { method:'POST', headers:postHeaders, body: JSON.stringify(body||{}) });
  const d = await r.json().catch(()=>({}));
  if(!r.ok){ alert('Hata: '+(d.error||d.reason||r.status)); return null; }
  return d;
}
let CURRENT_CODE = null;
const money = (n) => (n||0).toLocaleString('tr-TR') + ' TL';
const dt = (s) => s ? new Date(s.replace(' ','T')+ (s.includes('T')?'':'Z')).toLocaleString('tr-TR') : '—';

const EVENT_LABELS = {
  listing_created:'İlan oluşturuldu', payment_created:'Ödeme oluşturuldu', payment_paid:'Ödeme alındı',
  published:'İlan yayınlandı', offer_sent:'Havuza teklif gönderildi', candidate_revealed:'Aday numarası açıldı',
  matching_pending:'Eşleştirme bekliyor', matching_finalized:'Eşleştirme tamamlandı', publication:'Kanallara yayın',
  note:'Operatör notu', status_changed:'Durum değiştirildi',
  cancel_requested:'İptal talebi (onay bekliyor)', cancel_rejected:'İptal reddedildi', listing_cancelled:'İlan iptal edildi',
  refund_requested:'İade talebi (onay bekliyor)', refund_done:'İade yapıldı', refund_rejected:'İade reddedildi'
};
const PKG_LABELS = {
  base_300: 'Standart İlan Paketi',
  base_acil: 'Acil İlan Paketi',
  unlock_300: 'Ek 3 Başvuru',
  unlock_900: 'Ek 3 Başvuru',
};
const evLabel = (t) => EVENT_LABELS[t] || t;

async function load(){
  try{
    const r = await fetch('/api/admin/overview', { headers });
    if(!r.ok){ document.getElementById('meta').textContent = 'Yetkisiz veya hata: '+r.status; return; }
    const d = await r.json();
    render(d);
    document.getElementById('meta').textContent = 'Son güncelleme: ' + new Date().toLocaleTimeString('tr-TR');
  }catch(e){ document.getElementById('meta').textContent = 'Bağlantı hatası: '+e.message; }
}

function render(d){
  const s = d.summary;
  document.getElementById('cards').innerHTML = [
    ['Toplam İlan', s.totalListings, ''],
    ['Ödemesi Alınan', s.paidListings, 'ok'],
    ['Ödeme Bekleyen', s.awaitingListings, 'accent'],
    ['Taslak', s.draftListings, ''],
    ['Tahsilat', money(s.revenue), 'ok'],
    ['Bekleyen Tutar', money(s.pendingRevenue), 'accent'],
  ].map(([l,v,c]) => '<div class="card '+c+'"><div class="label">'+l+'</div><div class="value">'+v+'</div></div>').join('');

  renderApprovals(d.pendingApprovals||[]);
  fillGroup('g-paid','c-paid', d.groups.paid);
  fillGroup('g-await','c-await', d.groups.awaiting);
  fillGroup('g-draft','c-draft', d.groups.draft);

  document.getElementById('feed').innerHTML = (d.recentEvents||[]).map(ev =>
    '<li><span class="dot"></span><div class="t-title">'+evLabel(ev.type)+
    (ev.listing_code?' · '+ev.listing_code:'')+'<span class="actor">'+ev.actor+'</span></div>'+
    '<div class="t-time">'+dt(ev.created_at)+'</div>'+
    (ev.detail?'<div class="t-detail">'+fmtDetail(ev.type, ev.detail)+'</div>':'')+'</li>'
  ).join('') || '<li class="empty">Henüz aksiyon yok.</li>';
}

function renderApprovals(items){
  const wrap = document.getElementById('approvals-wrap');
  document.getElementById('c-appr').textContent = items.length;
  if(!items.length){ wrap.style.display='none'; return; }
  wrap.style.display='block';
  document.getElementById('approvals').innerHTML = items.map(a=>{
    const title = a.type==='refund' ? 'İADE TALEBİ' : 'İPTAL TALEBİ';
    const amt = (a.detail&&a.detail.amount)? ' · '+money(a.detail.amount) : '';
    return '<div class="appr"><div class="info"><b>'+title+'</b> · '+(a.listing_code||'')+
      (a.service?' · '+a.service:'')+amt+
      '<div class="sub">Talep eden: '+a.requested_by+' · '+dt(a.created_at)+
      (a.reason?' · Sebep: '+esc(a.reason):'')+'</div></div>'+
      '<div><button class="btn-approve btn-sm" onclick="decide('+a.id+',true)">Onayla</button> '+
      '<button class="btn-reject btn-sm" onclick="decide('+a.id+',false)">Reddet</button></div></div>';
  }).join('');
}
async function decide(id, ok){
  if(!confirm(ok?'Bu talebi ONAYLAMAK istediğinize emin misiniz? İşlem uygulanacak.':'Talebi reddet?')) return;
  const r = await post('/api/admin/approvals/'+id+'/'+(ok?'approve':'reject'));
  if(r){ load(); if(CURRENT_CODE) openDetail(CURRENT_CODE); }
}

function fillGroup(gid, cid, items){
  document.getElementById(cid).textContent = items.length;
  const el = document.getElementById(gid);
  if(!items.length){ el.innerHTML = '<div class="empty">Kayıt yok.</div>'; return; }
  el.innerHTML = items.map(l =>
    '<div class="listing" onclick="openDetail(\\''+l.code+'\\')">'+
      '<div class="code">'+l.code+' <span class="badge b-status">'+l.status+'</span></div>'+
      '<div class="row"><span>'+l.service+(l.district?' · '+l.district:'')+'</span></div>'+
      '<div class="row"><span>Başvuru: '+l.applicants+' · Açılan: '+l.revealed+'</span>'+
        '<span>'+(l.paidTotal?money(l.paidTotal):(l.pendingCount?l.pendingCount+' bekliyor':''))+'</span></div>'+
    '</div>'
  ).join('');
}

function fmtDetail(type, det){
  if(!det) return '';
  if(type==='payment_created'||type==='payment_paid') return (PKG_LABELS[det.package]||det.package)+' · '+money(det.amount)+(det.provider?' · '+det.provider:'');
  if(type==='candidate_revealed') return (det.count)+' numara açıldı ('+(PKG_LABELS[det.package]||det.package)+'), kalan '+det.remaining;
  if(type==='published') return (det.offered||0)+' havuz adayına teklif';
  if(type==='publication') return (det.channels||[]).map(c=>c.channel+'='+c.status).join(', ');
  if(type==='matching_pending') return det.reason==='awaiting_payment'?'Ödeme bekleniyor ('+det.candidates+' aday)':'Aday yok';
  if(type==='listing_created') return det.serviceType+(det.district?' · '+det.district:'');
  try{ return JSON.stringify(det); }catch(_){ return ''; }
}

const STATUSES = ['draft','awaiting_payment','published','matching','delivered','closed'];
async function openDetail(code){
  const r = await fetch('/api/admin/listings/'+code, { headers });
  if(!r.ok) return;
  const d = await r.json();
  CURRENT_CODE = code;
  document.getElementById('d-code').textContent = d.code+' — '+d.service;
  const pay = d.paymentSummary;
  const cancelled = d.status==='cancelled';
  const toolbar = '<div class="toolbar">'+
    '<button class="btn-action btn-sm" onclick="doNote(\\''+code+'\\')">📝 Not Ekle</button>'+
    '<select id="st-'+code+'">'+STATUSES.map(s=>'<option '+(s===d.status?'selected':'')+'>'+s+'</option>').join('')+'</select>'+
    '<button class="btn-action btn-sm" onclick="doStatus(\\''+code+'\\')">Durumu Kaydet</button>'+
    (cancelled?'<span class="badge b-draft">İPTAL EDİLDİ</span>':
      '<button class="btn-danger btn-sm" onclick="doCancel(\\''+code+'\\')">🚫 İptal Talebi</button>')+
    '</div>';
  document.getElementById('d-body').innerHTML =
    toolbar +
    box('İlan Sahibi', (d.seeker? (d.seeker.name||'—')+' · '+d.seeker.phone : '—')) +
    box('Kriter', d.service+(d.district?' · '+d.district:'')+' · '+(d.liveIn===1?'Yatılı':d.liveIn===0?'Gündüzlü':'Farketmez')+
        (d.salaryMin||d.salaryMax? ' · '+(d.salaryMin||'')+'-'+(d.salaryMax||'')+' TL':'')) +
    (d.aiText? '<div class="box"><h3>İlan Metni</h3><div class="ai">'+esc(d.aiText)+'</div></div>':'') +
    '<div class="box"><h3>Ödemeler ('+money(pay.paidTotal)+' tahsil)</h3>'+paymentsTable(d.payments)+'</div>' +
    '<div class="box"><h3>Adaylar ('+d.applications.length+')</h3>'+appsTable(d.applications)+'</div>' +
    '<div class="box"><h3>Yayın Kanalları</h3>'+pubsTable(d.publications)+'</div>' +
    '<div class="box"><h3>Aksiyon Geçmişi</h3><ul class="timeline">'+timeline(d.events)+'</ul></div>';
  document.getElementById('drawer').classList.add('open');
  document.getElementById('drawerBg').classList.add('open');
}
function closeDrawer(){ document.getElementById('drawer').classList.remove('open'); document.getElementById('drawerBg').classList.remove('open'); }

function box(title, val){ return '<div class="box"><h3>'+title+'</h3><div>'+esc(val)+'</div></div>'; }
function payBadge(s){
  if(s==='paid') return '<span class="badge b-paid">ödendi</span>';
  if(s==='refunded') return '<span class="badge b-draft">iade</span>';
  return '<span class="badge b-await">bekliyor</span>';
}
function paymentsTable(rows){
  if(!rows.length) return '<div class="empty">Ödeme yok.</div>';
  return '<table><tr><th>Paket</th><th>Tutar</th><th>Durum</th><th>Sağlayıcı</th><th>İşlem</th></tr>'+
    rows.map(p=>'<tr><td>'+(PKG_LABELS[p.package]||p.package)+'</td><td>'+money(p.amount)+'</td>'+
    '<td>'+payBadge(p.status)+'</td>'+
    '<td>'+(p.provider||'—')+'</td>'+
    '<td>'+(p.status==='paid'?'<button class="btn-danger btn-sm" onclick="doRefund(\\''+p.reference+'\\')">İade İste</button>':'—')+'</td></tr>').join('')+'</table>';
}
function appsTable(rows){
  if(!rows.length) return '<div class="empty">Başvuru yok.</div>';
  return '<table><tr><th>Aday</th><th>Skor</th><th>Kaynak</th><th>Telefon</th></tr>'+
    rows.map(a=>'<tr><td>'+esc(a.name||'—')+(a.hasReference?' ⭐':'')+'</td><td>'+Math.round(a.score)+'</td>'+
    '<td>'+a.source+'</td><td>'+(a.revealed?'<b>'+a.phone+'</b>':a.phone)+'</td></tr>').join('')+'</table>';
}
function pubsTable(rows){
  if(!rows.length) return '<div class="empty">Yayın yok.</div>';
  return '<table><tr><th>Kanal</th><th>Durum</th><th>Detay</th></tr>'+
    rows.map(p=>'<tr><td>'+p.channel+'</td><td>'+p.status+'</td><td>'+esc(p.detail||'')+'</td></tr>').join('')+'</table>';
}
function timeline(events){
  if(!events||!events.length) return '<li class="empty">Kayıt yok.</li>';
  return events.map(ev=>'<li><span class="dot"></span><div class="t-title">'+evLabel(ev.type)+
    '<span class="actor">'+ev.actor+'</span></div><div class="t-time">'+dt(ev.created_at)+'</div>'+
    (ev.detail?'<div class="t-detail">'+esc(fmtDetail(ev.type,ev.detail))+'</div>':'')+'</li>').join('');
}
function esc(s){ return String(s==null?'':s).replace(/[&<>]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[c])); }

// --- Operator aksiyonlari ---
async function doNote(code){
  const note = prompt('Not / aksiyon (örn: müşteriyle görüşüldü):');
  if(!note) return;
  const r = await post('/api/admin/listings/'+code+'/notes', { note });
  if(r) openDetail(code);
}
async function doStatus(code){
  const status = document.getElementById('st-'+code).value;
  const r = await post('/api/admin/listings/'+code+'/status', { status });
  if(r){ openDetail(code); load(); }
}
async function doCancel(code){
  const reason = prompt('İptal sebebi (bu talep ONAYINIZI bekleyecek):');
  if(reason===null) return;
  const r = await post('/api/admin/listings/'+code+'/cancel-request', { reason });
  if(r){ alert('İptal talebi oluşturuldu. Üstteki "Onay Bekleyen İşlemler"den onaylayabilirsiniz.'); openDetail(code); load(); }
}
async function doRefund(reference){
  const reason = prompt('İade sebebi (bu talep ONAYINIZI bekleyecek):');
  if(reason===null) return;
  const r = await post('/api/admin/payments/'+reference+'/refund-request', { reason });
  if(r){ alert('İade talebi oluşturuldu. Onay Bekleyen İşlemlerden onaylayın.'); if(CURRENT_CODE) openDetail(CURRENT_CODE); load(); }
}

load();
setInterval(load, 30000);
</script>
</body>
</html>`;

export default { renderAdminPage };
