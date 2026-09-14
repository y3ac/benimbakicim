#!/usr/bin/env node
/**
 * Apply SEO meta tags, Open Graph, Twitter Cards and JSON-LD to all HTML pages.
 * Usage: node apply-seo.js
 */
const fs = require('fs');
const path = require('path');
const { SITE_URL, SITE_NAME, DEFAULT_OG_IMAGE, BUSINESS, PAGE_SEO } = require('./js/seo-config');

const ROOT = __dirname;

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;');
}

function buildJsonLd(seo, canonical) {
  const graphs = [];

  graphs.push({
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    '@id': `${SITE_URL}/#organization`,
    name: BUSINESS.name,
    url: SITE_URL,
    logo: DEFAULT_OG_IMAGE,
    image: DEFAULT_OG_IMAGE,
    email: BUSINESS.email,
    telephone: BUSINESS.phone,
    priceRange: '$$',
    address: {
      '@type': 'PostalAddress',
      streetAddress: BUSINESS.address.street,
      addressLocality: BUSINESS.address.locality,
      addressRegion: BUSINESS.address.region,
      postalCode: BUSINESS.address.postalCode,
      addressCountry: BUSINESS.address.country,
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: BUSINESS.geo.lat,
      longitude: BUSINESS.geo.lng,
    },
    openingHours: BUSINESS.hours,
    sameAs: [BUSINESS.instagram, BUSINESS.whatsapp],
    areaServed: { '@type': 'City', name: 'İstanbul' },
    description: seo.description,
  });

  graphs.push({
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${SITE_URL}/#website`,
    url: SITE_URL,
    name: SITE_NAME,
    publisher: { '@id': `${SITE_URL}/#organization` },
    inLanguage: 'tr-TR',
    ...(seo.path === '/' ? {
      potentialAction: {
        '@type': 'SearchAction',
        target: `${SITE_URL}/pages/bakici-ariyorum.html?q={search_term_string}`,
        'query-input': 'required name=search_term_string',
      },
    } : {}),
  });

  const crumbs = [{ name: 'Ana Sayfa', url: SITE_URL }];
  if (seo.path !== '/') {
    const parts = seo.path.split('/').filter(Boolean);
    const pageName = parts[parts.length - 1].replace('.html', '').replace(/-/g, ' ');
    crumbs.push({ name: pageName.charAt(0).toUpperCase() + pageName.slice(1), url: canonical });
  }

  graphs.push({
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: crumbs.map((c, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: c.name,
      item: c.url,
    })),
  });

  if (seo.service) {
    graphs.push({
      '@context': 'https://schema.org',
      '@type': 'Service',
      name: seo.service,
      provider: { '@id': `${SITE_URL}/#organization` },
      areaServed: { '@type': 'City', name: 'İstanbul' },
      description: seo.description,
      url: canonical,
    });
  }

  if (seo.faqs && seo.faqs.length) {
    graphs.push({
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: seo.faqs.map(({ q, a }) => ({
        '@type': 'Question',
        name: q,
        acceptedAnswer: { '@type': 'Answer', text: a },
      })),
    });
  }

  return JSON.stringify(graphs.length === 1 ? graphs[0] : { '@context': 'https://schema.org', '@graph': graphs }, null, 2);
}

function buildSeoBlock(seo) {
  const canonical = `${SITE_URL}${seo.path === '/' ? '/' : seo.path}`;
  const robots = seo.noindex ? 'noindex, nofollow' : 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1';
  const keywords = seo.keywords || '';
  const ogType = seo.type || 'website';
  const jsonLd = buildJsonLd(seo, canonical);

  let block = `  <title>${escapeHtml(seo.title)}</title>
  <meta name="description" content="${escapeHtml(seo.description)}">
  <meta name="robots" content="${robots}">
  <meta name="author" content="${SITE_NAME}">
  <meta name="language" content="Turkish">
  <meta name="geo.region" content="TR-34">
  <meta name="geo.placename" content="İstanbul">
  <link rel="canonical" href="${canonical}">`;

  if (keywords) {
    block += `\n  <meta name="keywords" content="${escapeHtml(keywords)}">`;
  }

  block += `
  <meta property="og:locale" content="tr_TR">
  <meta property="og:site_name" content="${SITE_NAME}">
  <meta property="og:title" content="${escapeHtml(seo.title)}">
  <meta property="og:description" content="${escapeHtml(seo.description)}">
  <meta property="og:type" content="${ogType}">
  <meta property="og:url" content="${canonical}">
  <meta property="og:image" content="${DEFAULT_OG_IMAGE}">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${escapeHtml(seo.title)}">
  <meta name="twitter:description" content="${escapeHtml(seo.description)}">
  <meta name="twitter:image" content="${DEFAULT_OG_IMAGE}">
  <script type="application/ld+json">
${jsonLd}
  </script>`;

  return block;
}

function stripOldSeo(head) {
  return head
    .replace(/\s*<title>[\s\S]*?<\/title>/gi, '')
    .replace(/\s*<meta name="description"[^>]*>/gi, '')
    .replace(/\s*<meta name="keywords"[^>]*>/gi, '')
    .replace(/\s*<meta name="robots"[^>]*>/gi, '')
    .replace(/\s*<meta name="author"[^>]*>/gi, '')
    .replace(/\s*<meta name="language"[^>]*>/gi, '')
    .replace(/\s*<meta name="geo\.[^"]*"[^>]*>/gi, '')
    .replace(/\s*<link rel="canonical"[^>]*>/gi, '')
    .replace(/\s*<meta property="og:[^"]*"[^>]*>/gi, '')
    .replace(/\s*<meta name="twitter:[^"]*"[^>]*>/gi, '')
    .replace(/\s*<script type="application\/ld\+json">[\s\S]*?<\/script>/gi, '');
}

function applySeoToFile(relPath) {
  const seo = PAGE_SEO[relPath];
  if (!seo) {
    console.log('Skip (no SEO config):', relPath);
    return;
  }

  const filePath = path.join(ROOT, relPath);
  if (!fs.existsSync(filePath)) {
    console.log('Skip (missing file):', relPath);
    return;
  }

  let html = fs.readFileSync(filePath, 'utf8');
  const headMatch = html.match(/<head>([\s\S]*?)<\/head>/i);
  if (!headMatch) {
    console.log('Skip (no head):', relPath);
    return;
  }

  let headInner = headMatch[1];
  headInner = stripOldSeo(headInner);

  const viewportMatch = headInner.match(/(<meta name="viewport"[^>]*>)/i);
  const seoBlock = buildSeoBlock(seo);

  if (viewportMatch) {
    headInner = headInner.replace(viewportMatch[0], `${viewportMatch[0]}\n${seoBlock}`);
  } else {
    const charsetMatch = headInner.match(/(<meta charset="UTF-8">)/i);
    if (charsetMatch) {
      headInner = headInner.replace(charsetMatch[0], `${charsetMatch[0]}\n${seoBlock}`);
    } else {
      headInner = seoBlock + headInner;
    }
  }

  // Ensure favicon on pages
  if (relPath.startsWith('pages/') && !headInner.includes('rel="icon"')) {
    headInner = headInner.replace(
      seoBlock,
      `${seoBlock}\n  <link rel="icon" href="../assets/logo-icon.png" type="image/png">`
    );
  }

  html = html.replace(headMatch[0], `<head>${headInner}</head>`);
  fs.writeFileSync(filePath, html);
  console.log('SEO applied:', relPath);
}

Object.keys(PAGE_SEO).forEach(applySeoToFile);
console.log('Done.');
