import { chromium, expect } from '@playwright/test'
import { mkdir, readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import Papa from 'papaparse'

const baseURL = process.env.DASHBOARD_URL ?? 'http://127.0.0.1:5173'
const browser = await chromium.launch({ channel: 'chrome', headless: true })
const read = async (file) => Papa.parse(await readFile(new URL(`../public/data/${file}`, import.meta.url), 'utf8'), { header: true, skipEmptyLines: true }).data
const candidates = await read('top6.csv')
const hourly = await read('hourly-zone-shares.csv')
await mkdir(new URL('../test-results/', import.meta.url), { recursive: true })
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } })
  const errors = []; page.on('pageerror', (e) => errors.push(e.message))
  await page.goto(baseURL)
  await page.getByRole('link', { name: '시간대별 분석 안내' }).click()
  await expect(page.getByTestId('temporal-Z06')).toHaveAttribute('aria-pressed', 'true')
  await expect(page.locator('[data-testid^="temporal-Z"]')).toHaveCount(6)
  for (const candidate of candidates) {
    await page.getByTestId(`temporal-${candidate.zone_id}`).click()
    const peak = hourly.find((r) => r.zone_id === candidate.zone_id && r.hour === candidate.peak_hour)
    await expect(page.getByTestId('temporal-metrics')).toContainText(candidate.zone_id)
    await expect(page.getByTestId('temporal-metrics')).toContainText(Number(candidate.daily_demand).toLocaleString('ko-KR', { maximumFractionDigits: 1 }))
    await expect(page.getByTestId('temporal-metrics')).toContainText(`${String(candidate.peak_hour).padStart(2, '0')}시`)
    await expect(page.getByTestId('temporal-metrics')).toContainText(`${(Number(peak.relative_gap) * 100).toFixed(2)}`)
    await expect(page.getByTestId('hourly-chart')).toContainText(candidate.zone_id)
    await expect(page.getByTestId('monthly-chart').locator('tbody tr')).toHaveCount(3)
    await expect(page.getByTestId('hourly-chart').locator('.recharts-line')).toHaveCount(2)
    await expect(page.getByTestId('gap-chart').locator('.recharts-bar-rectangle')).toHaveCount(hourly.filter((r) => r.zone_id === candidate.zone_id && Number(r.relative_gap) !== 0).length)
  }
  await page.getByTestId('temporal-Z06').click()
  const chart = page.getByTestId('hourly-chart').locator('.recharts-wrapper')
  await chart.scrollIntoViewIfNeeded()
  const rect = await chart.boundingBox()
  await page.mouse.move(rect.x + rect.width * .6, rect.y + 100)
  await expect(page.getByTestId('hourly-chart').locator('.recharts-tooltip-wrapper')).toBeVisible()
  await expect(page.getByTestId('hourly-chart').locator('.recharts-tooltip-wrapper')).toContainText('%')
  await page.mouse.move(0, 0)
  await page.screenshot({ path: fileURLToPath(new URL('../test-results/temporal-desktop.png', import.meta.url)), fullPage: true })
  await page.setViewportSize({ width: 390, height: 844 })
  await page.reload()
  await expect(page.getByTestId('temporal-Z06')).toBeVisible()
  await page.getByTestId('temporal-Z01').click()
  await expect(page.getByTestId('temporal-metrics')).toContainText('21시')
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  await page.screenshot({ path: fileURLToPath(new URL('../test-results/temporal-mobile.png', import.meta.url)), fullPage: true })
  await page.route('**/data/hourly-zone-shares.csv', (route) => route.fulfill({ status: 503, body: 'Unavailable' }))
  await page.reload()
  await expect(page.getByRole('heading', { name: '시간대별 데이터를 불러오지 못했습니다' })).toBeVisible()
  await page.unroute('**/data/hourly-zone-shares.csv')
  await page.getByRole('button', { name: '다시 불러오기' }).click()
  await expect(page.getByTestId('temporal-Z06')).toBeVisible()
  await page.route('**/data/hourly-zone-shares.csv', async (route) => {
    const response = await route.fetch()
    await route.fulfill({ response, body: (await response.text()).split(/\r?\n/)[0] + '\n' })
  })
  await page.reload()
  await expect(page.getByRole('heading', { name: '표시할 시간대별 자료가 없습니다' })).toBeVisible()
  expect(errors).toEqual([])
  console.log('PASS: 6개 선택·CSV 지표·차트 전환·툴팁·직접 새로고침·모바일·HTTP 재시도·빈 자료·JS 오류 없음')
} finally { await browser.close() }
