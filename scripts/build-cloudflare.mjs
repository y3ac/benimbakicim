import { cpSync, mkdirSync, rmSync, existsSync } from 'node:fs'
import { join } from 'node:path'

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

rmSync(dist, { recursive: true, force: true })
mkdirSync(dist, { recursive: true })

for (const file of requiredFiles) {
  cpSync(join(root, file), join(dist, file))
}

for (const folder of requiredFolders) {
  cpSync(join(root, folder), join(dist, folder), { recursive: true })
}

const blocked = ['server', 'netlify', 'node_modules', 'functions']
for (const name of blocked) {
  if (existsSync(join(dist, name))) {
    throw new Error(`Cloudflare output must not include ${name}/`)
  }
}

console.log('Cloudflare Pages output ready: dist/')
