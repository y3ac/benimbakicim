import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { spawnSync } from 'node:child_process'

const root = process.cwd()
const dist = join(root, 'dist')

const build = spawnSync(process.execPath, ['scripts/build-cloudflare.mjs'], {
  cwd: root,
  encoding: 'utf8'
})

if (build.status !== 0) {
  console.error(build.stdout)
  console.error(build.stderr)
  process.exit(build.status || 1)
}

const required = [
  'index.html',
  'pages/iletisim.html',
  'pages/tesekkur.html',
  'pages/odeme.html',
  'css/styles.css',
  'js/main.js',
  'js/config.js',
  'robots.txt',
  'sitemap.xml',
  '_headers',
  '_redirects',
  '_routes.json'
]

for (const file of required) {
  if (!existsSync(join(dist, file))) {
    throw new Error(`Missing in dist/: ${file}`)
  }
}

const html = readFileSync(join(dist, 'index.html'), 'utf8')
if (html.includes('data-netlify')) {
  throw new Error('dist/index.html still contains Netlify form attributes')
}
if (!html.includes('action="/api/form"')) {
  throw new Error('dist/index.html form does not post to /api/form')
}

const js = readFileSync(join(dist, 'js/main.js'), 'utf8')
if (!js.includes('/api/form')) {
  throw new Error('dist/js/main.js does not submit to /api/form')
}

for (const name of ['server', 'netlify', 'node_modules', 'functions']) {
  if (existsSync(join(dist, name))) {
    throw new Error(`dist/ must not contain ${name}/`)
  }
}

if (!existsSync(join(root, 'functions/api/form.js'))) {
  throw new Error('Missing functions/api/form.js')
}
if (!existsSync(join(root, 'functions/api/health.js'))) {
  throw new Error('Missing functions/api/health.js')
}

const pageCount = readdirSync(join(dist, 'pages')).filter((name) => name.endsWith('.html')).length
if (pageCount < 20) {
  throw new Error(`Expected 20+ HTML pages, found ${pageCount}`)
}

if (!existsSync(join(dist, '_worker.js'))) {
  throw new Error('Missing dist/_worker.js (functions bundle)')
}

console.log(`Cloudflare verify OK (${pageCount} pages, dist/ is clean)`)
