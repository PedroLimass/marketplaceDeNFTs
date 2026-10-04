/**
 * Audita Início e Detalhe do NFT com Lighthouse (mobile e desktop) sobre o build de produção,
 * no cenário padrão dos mocks. Cada combinação roda RUNS vezes e vale a mediana.
 *
 *   pnpm build && pnpm lighthouse
 */
import { spawn } from 'node:child_process'
import { mkdir, writeFile } from 'node:fs/promises'
import { setTimeout as sleep } from 'node:timers/promises'

import { chromium } from '@playwright/test'
import lighthouse from 'lighthouse'
import desktopConfig from 'lighthouse/core/config/desktop-config.js'

const PORT = 4174
const DEBUG_PORT = 9223
const BASE_URL = `http://127.0.0.1:${String(PORT)}`
const RUNS = Number(process.env.LH_RUNS ?? 3)
const PAGES = [
  { name: 'inicio', path: '/?scenario=default' },
  { name: 'detalhe', path: '/nfts/emerald-ape-042?scenario=default' },
]
const PROFILES = [
  { name: 'mobile', config: undefined },
  { name: 'desktop', config: desktopConfig },
]
const CATEGORIES = ['performance', 'accessibility', 'best-practices', 'seo']

const median = (values) => {
  const sorted = [...values].sort((a, b) => a - b)
  const middle = Math.floor(sorted.length / 2)
  return sorted.length % 2 === 0 ? (sorted[middle - 1] + sorted[middle]) / 2 : sorted[middle]
}

async function waitForServer() {
  for (let attempt = 0; attempt < 60; attempt += 1) {
    try {
      const response = await fetch(BASE_URL)
      if (response.ok) return
    } catch {
      // servidor ainda subindo
    }
    await sleep(500)
  }
  throw new Error(`Servidor de preview não respondeu em ${BASE_URL}`)
}

const preview = spawn(
  'pnpm',
  ['exec', 'vite', 'preview', '--host', '127.0.0.1', '--port', String(PORT), '--strictPort'],
  { stdio: 'ignore' },
)

let browser
const summary = []

try {
  await waitForServer()

  for (const profile of PROFILES) {
    for (const page of PAGES) {
      const runs = []
      for (let index = 0; index < RUNS; index += 1) {
        // Perfil novo a cada rodada: sem cache nem Service Worker de rodadas anteriores.
        browser = await chromium.launch({ args: [`--remote-debugging-port=${String(DEBUG_PORT)}`] })
        const result = await lighthouse(
          `${BASE_URL}${page.path}`,
          { port: DEBUG_PORT, output: 'json', logLevel: 'error', onlyCategories: CATEGORIES },
          profile.config,
        )
        await browser.close()
        browser = undefined

        const lhr = result?.lhr
        if (!lhr) throw new Error('Lighthouse não devolveu relatório.')
        runs.push({
          scores: Object.fromEntries(
            CATEGORIES.map((id) => [id, Math.round((lhr.categories[id]?.score ?? 0) * 100)]),
          ),
          metrics: {
            fcp: lhr.audits['first-contentful-paint']?.numericValue,
            lcp: lhr.audits['largest-contentful-paint']?.numericValue,
            tbt: lhr.audits['total-blocking-time']?.numericValue,
            cls: lhr.audits['cumulative-layout-shift']?.numericValue,
            speedIndex: lhr.audits['speed-index']?.numericValue,
          },
        })
      }

      const entry = {
        page: page.name,
        profile: profile.name,
        runs: runs.length,
        medianScores: Object.fromEntries(
          CATEGORIES.map((id) => [id, median(runs.map((run) => run.scores[id]))]),
        ),
        medianMetrics: Object.fromEntries(
          Object.keys(runs[0].metrics).map((id) => [
            id,
            Math.round(median(runs.map((run) => run.metrics[id] ?? 0)) * 1000) / 1000,
          ]),
        ),
      }
      summary.push(entry)
      console.log(
        `${profile.name.padEnd(7)} ${page.name.padEnd(8)}`,
        JSON.stringify(entry.medianScores),
        JSON.stringify(entry.medianMetrics),
      )
    }
  }

  await mkdir('lighthouse-report', { recursive: true })
  await writeFile('lighthouse-report/summary.json', `${JSON.stringify(summary, null, 2)}\n`)
} finally {
  await browser?.close()
  preview.kill()
}
