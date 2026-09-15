import { cpSync, mkdirSync, rmSync, existsSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { spawnSync } from 'node:child_process'

const root = process.cwd()
const dist = join(root, 'dist')

const requiredFiles = [
  'index.html',
  'robots.txt',
  'sitemap.xml',
  '_headers',
  '_redirects',
  '_routes.json'
]

const requiredFolders = ['assets', 'css', 'js', 'pages']

for (const file of requiredFiles) {
  if (!existsSync(join(root, file))) {
    throw new Error(`Cloudflare build missing file: ${file}`)
  }
}

for (const folder of requiredFolders) {
  if (!existsSync(join(root, folder))) {
    throw new Error(`Cloudflare build missing folder: ${folder}`)
  }
}

if (!existsSync(join(root, 'functions/api/form.js'))) {
  throw new Error('Cloudflare build missing functions/api/form.js')
}

rmSync(dist, { recursive: true, force: true })
mkdirSync(dist, { recursive: true })

for (const file of requiredFiles) {
  cpSync(join(root, file), join(dist, file))
}

for (const folder of requiredFolders) {
  cpSync(join(root, folder), join(dist, folder), { recursive: true })
}

writeFileSync(join(dist, '.assetsignore'), '_worker.js\n_worker.js.map\n')
if (existsSync(join(root, '.assetsignore'))) {
  cpSync(join(root, '.assetsignore'), join(dist, '.assetsignore'))
}

const functionsBuild = spawnSync(
  'npx',
  ['wrangler', 'pages', 'functions', 'build', '--outdir=./dist/_worker.js'],
  {
    cwd: root,
    encoding: 'utf8',
    shell: process.platform === 'win32'
  }
)

if (functionsBuild.status !== 0) {
  console.error(functionsBuild.stdout)
  console.error(functionsBuild.stderr)
  throw new Error('Failed to build Cloudflare functions into dist/_worker.js')
}

const blocked = ['server', 'netlify', 'node_modules', 'functions']
for (const name of blocked) {
  if (existsSync(join(dist, name))) {
    throw new Error(`Cloudflare output must not include ${name}/`)
  }
}

if (!existsSync(join(dist, '_worker.js'))) {
  throw new Error('Cloudflare functions build did not create dist/_worker.js')
}

console.log('Cloudflare Workers output ready: dist/ (+ _worker.js)')
