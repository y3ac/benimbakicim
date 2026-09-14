import { cpSync, mkdirSync, rmSync } from 'node:fs'
import { join } from 'node:path'

const root = process.cwd()
const dist = join(root, 'dist')

rmSync(dist, { recursive: true, force: true })
mkdirSync(dist, { recursive: true })

const files = [
  'index.html',
  'robots.txt',
  'sitemap.xml',
  '_headers',
  '_redirects'
]

const folders = ['assets', 'css', 'js', 'pages']

for (const file of files) {
  cpSync(join(root, file), join(dist, file))
}

for (const folder of folders) {
  cpSync(join(root, folder), join(dist, folder), { recursive: true })
}

console.log('Cloudflare Pages output ready: dist/')
