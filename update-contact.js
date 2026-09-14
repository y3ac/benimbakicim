#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const WA_URL = 'https://wa.me/905355963545';
const WA_DISPLAY = '0535 596 35 45';
const EMAIL = 'info@benimbakicim.com';

const FORM_ATTRS =
  'name="talep" method="POST" data-netlify="true" netlify-honeypot="bot-field" action="/pages/tesekkur.html"';
const FORM_HIDDEN = `<input type="hidden" name="form-name" value="talep">
            <p class="netlify-honeypot" style="display:none" aria-hidden="true"><label>Boş bırakın <input name="bot-field" tabindex="-1" autocomplete="off"></label></p>`;

function updateFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let changed = false;

  const replacements = [
    [/https:\/\/wa\.me\/905XXXXXXXXX/g, WA_URL],
    [/tel:\+905XXXXXXXXX/g, WA_URL],
    [/\+90 5XX XXX XX XX/g, WA_DISPLAY],
    [/905XXXXXXXXX/g, '905355963545'],
    [/7\/24 destek hattı/g, 'WhatsApp ile 7/24 destek'],
    [/📞 \+90 5XX XXX XX XX/g, `💬 WhatsApp: ${WA_DISPLAY}`],
    [/📞 \$\{WA_DISPLAY\}/g, `💬 WhatsApp: ${WA_DISPLAY}`],
    [/class="header-phone">📞/g, 'class="header-whatsapp">💬'],
    [/class="header-phone"/g, 'class="header-whatsapp"'],
    [/Hemen Ara/g, "WhatsApp'tan Yaz"],
    [/<a href="https:\/\/wa\.me\/905355963545" class="floating-btn phone"[^>]*>📞<\/a>\s*/g, ''],
    [/<div class="contact-info-item"><div class="icon">📞<\/div><div><strong>Telefon<\/strong><br><a href="https:\/\/wa\.me\/905355963545">[^<]*<\/a><\/div><\/div>\s*/g,
      `<div class="contact-info-item"><div class="icon">💬</div><div><strong>WhatsApp</strong><br><a href="${WA_URL}" target="_blank" rel="noopener">${WA_DISPLAY}</a></div></div>\n          `],
    [/<form class="contact-form">/g, `<form class="contact-form" ${FORM_ATTRS}>\n            ${FORM_HIDDEN}`],
  ];

  for (const [pattern, replacement] of replacements) {
    const next = content.replace(pattern, replacement);
    if (next !== content) {
      content = next;
      changed = true;
    }
  }

  content = content.replace(
    /<a href="https:\/\/wa\.me\/905355963545">0535 596 35 45<\/a>\s*<a href="mailto:info@benimbakicim.com">info@benimbakicim.com<\/a>/g,
    `<a href="${WA_URL}" target="_blank" rel="noopener">WhatsApp: ${WA_DISPLAY}</a>\n          <a href="mailto:${EMAIL}">${EMAIL}</a>`
  );

  content = content.replace(
    /<input type="text" required placeholder="Adınız Soyadınız">/g,
    '<input type="text" name="name" required placeholder="Adınız Soyadınız">'
  );
  content = content.replace(
    /<input type="tel" required placeholder="Telefon">/g,
    '<input type="tel" name="phone" required placeholder="Telefon / WhatsApp">'
  );
  content = content.replace(/<select>(?![^>]*name=)/g, '<select name="service">');
  content = content.replace(
    /<textarea placeholder="İhtiyacınızı açıklayın\.\.\."><\/textarea>/g,
    '<textarea name="message" placeholder="İhtiyacınızı açıklayın..."></textarea>'
  );
  content = content.replace(/<textarea><\/textarea>/g, '<textarea name="message"></textarea>');

  if (changed || content.includes('contact-form')) {
    fs.writeFileSync(filePath, content);
    console.log('Updated:', path.relative(ROOT, filePath));
  }
}

function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (entry.name.endsWith('.html') || entry.name === 'generate-pages.js') updateFile(full);
  }
}

walk(ROOT);
console.log('Done.');
