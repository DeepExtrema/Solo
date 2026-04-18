import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const LOG_FILE = path.join(__dirname, 'error.log')

export function logError(label, err) {
  const line = `[${new Date().toISOString()}] ${label} :: ${err?.stack || err?.message || err}\n`
  try { fs.appendFileSync(LOG_FILE, line) } catch {}
  // Also stderr so user sees it in dev
  // eslint-disable-next-line no-console
  console.error(line.trim())
}
