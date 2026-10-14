import { chromium, expect } from '@playwright/test'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import Papa from 'papaparse'

const baseURL = process.env.DASHBOARD_URL ?? 'http://127.0.0.1:5173'
const output = new URL('../test-results/', import.meta.url)
await mkdir(output, { recursive: true })
const csv = (file) => readFile(new URL(`../public/data/${file}`, import.meta.url), 'utf8').then((s) => Papa.parse(s, { header: true, skipEmptyLines: true }).data)
const [candidates, hourly] = await Promise.all([csv('top6.csv'), csv('hourly-zone-shares.csv')])
const browser = await chromium.launch({ channel: 'chrome', headless: true })
const errors = []
const screenshots = []
try {
  const page = await browser.newPage({ viewport: { width: 1536, height: 1100 } })
  page.on('pageerror', (e) => errors.push(e.message))
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()) })
  for (const [device, width] of [['desktop', 1536], ['mobile', 390]]) {
    await page.setViewportSize({ width, height: device === 'desktop' ? 1100 : 844 })
    for (const [name, path, ready] of [['overview', '/', 'row-Z06'], ['temporal', '/temporal', 'temporal-metrics'], ['zones', '/zones', 'zone-detail'], ['analysis', '/analysis', 'analysis-summary']]) {
      await page.goto(`${baseURL}${path}`)
      await expect(page.getByTestId(ready)).toBeVisible()
      await expect(page.locator('main .result-summary')).toHaveCount(1)
      if (name === 'zones' || name === 'analysis') {
        await expect(page.getByTestId(name === 'zones' ? 'zone-expanded-analysis' : 'analysis-methods')).not.toHaveAttribute('open', '')
        await expect(page.locator('main .recharts-wrapper:visible')).toHaveCount(0)
      }
      await expect(page.locator('footer')).toHaveCount(0)
      await expect(page.getByText(/INCHEON · MICHUHOL|2026 Q2 · 연구 프로젝트|AI 데이터 분석 경진대회/)).toHaveCount(0)
      await expect(page.locator('header').getByText('인천 미추홀구')).toBeVisible()
      await expect(page.getByText('2026년 4–6월', { exact: true })).toHaveCount(1)
      await page.reload()
      await expect(page.getByTestId(ready)).toBeVisible()
      if (name === 'overview' || name === 'zones') await expect(page.locator('.leaflet-marker-icon')).toHaveCount(name === 'overview' ? 6 : 26)
      await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
      await page.evaluate(() => document.fonts.ready)
      await page.waitForTimeout(500)
      const file = `final-${name}-${device}.png`
      await page.screenshot({ path: fileURLToPath(new URL(file, output)), fullPage: true })
      screenshots.push(file)
      if (name === 'zones' || name === 'analysis') await page.screenshot({ path: fileURLToPath(new URL(`phase6-${name}-${device}.png`, output)), fullPage: true })
    }
  }
  await page.goto(`${baseURL}/temporal`)
  for (const c of candidates) {
    await page.getByTestId(`temporal-${c.zone_id}`).click()
    await expect(page).toHaveURL(`${baseURL}/temporal?zone=${c.zone_id}`)
    const peak = hourly.find((r) => r.zone_id === c.zone_id && r.hour === c.peak_hour)
    const summary = page.getByTestId('temporal-summary')
    await expect(summary).toContainText(`${(Number(peak.demand_share) * 100).toFixed(2)}%`)
    await expect(summary).toContainText(`${(Number(peak.supply_share) * 100).toFixed(2)}%`)
    await expect(summary).toContainText(`${(Number(peak.relative_gap) * 100).toFixed(2)}%p`)
  }
  const summary = page.getByText('24시간 비중과 차이 수치 보기', { exact: true })
  await summary.focus()
  await page.keyboard.press('Enter')
  await expect(page.getByTestId('hourly-values')).toBeVisible()
  await expect(page.getByTestId('hourly-values').locator('tbody tr')).toHaveCount(24)
  await page.reload()
  await expect(page.getByTestId('temporal-Z02')).toHaveAttribute('aria-pressed', 'true')
  await page.getByRole('link', { name: '선택 후보의 위치와 평가 지표 보기' }).click()
  await expect(page).toHaveURL(`${baseURL}/zones?zone=Z02`)
  const zoneDetails = page.getByText('상세 분석 및 다른 후보와 비교', { exact: true })
  await zoneDetails.focus()
  await page.keyboard.press('Enter')
  await expect(page.getByTestId('zone-scenarios')).toBeVisible()
  const help = page.getByText('시간 분포 차이와 월별 변동은 어떻게 읽나요?', { exact: true })
  await help.click()
  await expect(page.getByText(/시간 분포 차이\(positive_gap_sum\)/)).toBeVisible()
  await page.goto(`${baseURL}/analysis`)
  const methods = page.getByText('분석 방법 자세히 보기', { exact: true })
  await methods.focus()
  await page.keyboard.press('Enter')
  await expect(page.getByTestId('analysis-clusters')).toBeVisible()
  const scores = page.getByText('시나리오별 정확한 점수와 순위 중앙값의 의미', { exact: true })
  await scores.focus()
  await page.keyboard.press('Enter')
  await expect(page.getByText(/순위 중앙값\(median_rank\)/)).toBeVisible()
  await page.getByRole('button', { name: '메뉴 열기' }).click()
  await page.keyboard.press('Escape')
  await expect(page.getByRole('button', { name: '메뉴 열기' })).toBeFocused()
  expect(errors).toEqual([])
  const result = { baseURL, result: 'PASS', checks: ['4개 페이지 직접 접근·새로고침', '장식·푸터 제거 및 공통 기간 표시', '1536px·390px 가로 넘침 없음', '6개 후보 동적 해석 CSV 일치', '시간대별 선택 URL·새로고침·권역 전달', '키보드 설명 펼치기·모바일 설명·Escape 포커스', '콘솔 및 JavaScript 오류 없음'], screenshots, errors }
  await writeFile(new URL('final-ux-report.json', output), JSON.stringify(result, null, 2))
  console.log(JSON.stringify(result, null, 2))
} finally { await browser.close() }
