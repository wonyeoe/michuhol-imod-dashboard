import { chromium, expect } from '@playwright/test'
import { mkdir, readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import Papa from 'papaparse'

const baseURL = process.env.DASHBOARD_URL ?? 'http://127.0.0.1:5173'
const browser = await chromium.launch({ channel: 'chrome', headless: true })
const csv = async (name) => Papa.parse(await readFile(new URL(`../public/data/${name}`, import.meta.url), 'utf8'), { header: true, skipEmptyLines: true }).data
const scores = await csv('zone-scores.csv'), candidates = await csv('top6.csv')
const scenarios = [['balanced', '균형형'], ['demand_priority', '수요 우선형'], ['time_priority', '시간 우선형'], ['robustness_priority', '강건성 우선형']]
await mkdir(new URL('../test-results/', import.meta.url), { recursive: true })
try {
  const page = await browser.newPage({ viewport: { width: 1536, height: 1100 }, deviceScaleFactor: 1 })
  const errors = []; page.on('pageerror', (e) => errors.push(e.message))
  const files = new Set(); page.on('request', (r) => { if (new URL(r.url()).pathname.startsWith('/data/')) files.add(new URL(r.url()).pathname) })
  await page.goto(baseURL)
  await page.getByRole('link', { name: '분석 과정 안내' }).click()
  await expect(page).toHaveURL(`${baseURL}/analysis`)
  await expect(page.getByTestId('analysis-summary')).toContainText('286개')
  await expect(page.getByTestId('analysis-summary')).toContainText('249개')
  await expect(page.getByTestId('analysis-summary')).toContainText('37개')
  for (const count of [196, 65, 25]) await expect(page.getByTestId('analysis-clusters')).toContainText(`${count}개`)
  for (let step = 1; step <= 7; step++) {
    await page.getByRole('list', { name: 'STEP 1부터 7까지 분석 과정' }).getByRole('button', { name: new RegExp(`STEP ${step}`) }).click()
    await expect(page.getByTestId('analysis-process-detail')).toContainText(`STEP ${step}`)
    await expect(page.getByTestId('analysis-process-detail')).toContainText('해석 유의:')
  }
  await page.getByText('GMM 비교와 모델 검증 범위', { exact: true }).click()
  await expect(page.getByTestId('analysis-models')).toContainText('56 / 208 / 22')
  await expect(page.getByTestId('step4-weights').locator('tbody tr')).toHaveCount(4)
  const rows = page.getByTestId('analysis-rank-heatmap').locator('tbody tr')
  await expect(rows).toHaveCount(6)
  for (let index = 0; index < candidates.length; index++) {
    const c = candidates[index], row = page.getByTestId(`analysis-final-${c.zone_id}`)
    await expect(rows.nth(index)).toHaveAttribute('data-testid', `analysis-final-${c.zone_id}`)
    await expect(row.locator('td').nth(0)).toHaveText(c.provisional_review_order)
    for (let i = 0; i < scenarios.length; i++) {
      await expect(row.locator('td').nth(i + 2)).toHaveText(`${c[`rank_${scenarios[i][0]}`]}위`)
      await expect(row.locator('td').nth(i + 2).locator('span')).toHaveAttribute('title', new RegExp(Number(c[`score_${scenarios[i][0]}`]).toFixed(4)))
    }
    await expect(row).toContainText(`${c.top6_frequency}/4회`)
    await expect(row.locator('td').nth(7)).toHaveText(Number(c.median_rank).toFixed(1))
  }
  await page.getByText('STEP 7 가중치와 평가 지표 확인', { exact: true }).click()
  await expect(page.getByTestId('step7-weights').locator('tbody tr')).toHaveCount(4)
  await page.getByRole('button', { name: '전체 26개 권역 평가 비교하기' }).click()
  await page.getByText('전체 권역 점수·순위 표 보기', { exact: true }).click()
  for (const [key, label] of scenarios) {
    await page.getByRole('group', { name: '전체 권역 비교 시나리오' }).getByRole('button', { name: label, exact: true }).click()
    await expect(page.getByTestId('analysis-all-zones').locator('.recharts-bar-rectangle')).toHaveCount(26)
    await expect(page.getByTestId('analysis-all-table').locator('tbody tr')).toHaveCount(26)
    for (const score of scores) {
      const row = page.getByTestId('analysis-all-table').locator('tbody tr').filter({ has: page.getByRole('cell', { name: score.zone_id, exact: true }) })
      await expect(row.locator('td').nth(2)).toHaveText(Number(score[`score_${key}`]).toFixed(4))
      await expect(row.locator('td').nth(3)).toHaveText(`${score[`rank_${key}`]}위`)
    }
  }
  await page.getByRole('button', { name: '전체 26개 권역 평가 접기' }).click()
  await page.getByRole('list', { name: 'STEP 1부터 7까지 분석 과정' }).getByRole('button', { name: /STEP 7/ }).click()
  await page.screenshot({ path: fileURLToPath(new URL('../test-results/analysis-desktop.png', import.meta.url)), fullPage: true })
  await page.getByTestId('analysis-final-Z23').getByRole('link', { name: 'Z23', exact: true }).click()
  await expect(page.getByTestId('zone-list-Z23')).toHaveAttribute('aria-pressed', 'true')
  await page.goto(`${baseURL}/analysis`)
  await page.getByRole('link', { name: 'Z10 시간대별 분석' }).click()
  await expect(page.getByTestId('temporal-Z10')).toHaveAttribute('aria-pressed', 'true')
  await page.goto(`${baseURL}/analysis`)
  await page.getByRole('link', { name: '26개 권역 탐색', exact: true }).click()
  await expect(page.getByTestId('zone-list-Z06')).toBeVisible()
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto(`${baseURL}/analysis`)
  await expect(page.getByTestId('analysis-summary')).toBeVisible()
  await page.reload()
  await expect(page.getByTestId('analysis-final-Z06')).toBeVisible()
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  const heatmap = page.getByTestId('analysis-rank-heatmap').locator('..')
  await heatmap.evaluate((e) => { e.scrollLeft = e.scrollWidth })
  expect(await heatmap.evaluate((e) => e.scrollLeft)).toBeGreaterThan(0)
  await heatmap.evaluate((e) => { e.scrollLeft = 0 })
  await page.screenshot({ path: fileURLToPath(new URL('../test-results/analysis-mobile.png', import.meta.url)), fullPage: true })
  await page.route('**/data/cluster-assignments.csv', (r) => r.fulfill({ status: 503, body: 'Unavailable' }))
  await page.reload()
  await expect(page.getByRole('heading', { name: '분석 근거를 불러오지 못했습니다' })).toBeVisible()
  await page.unroute('**/data/cluster-assignments.csv')
  await page.getByRole('button', { name: '다시 불러오기' }).click()
  await expect(page.getByTestId('analysis-summary')).toBeVisible()
  await page.route('**/data/cluster-assignments.csv', async (route) => {
    const response = await route.fetch()
    await route.fulfill({ response, body: (await response.text()).split(/\r?\n/)[0] + '\n' })
  })
  await page.reload()
  await expect(page.getByRole('heading', { name: '표시할 분석 근거가 없습니다' })).toBeVisible()
  await page.unroute('**/data/cluster-assignments.csv')
  await page.route('**/data/cluster-assignments.csv', async (route) => {
    const response = await route.fetch()
    const data = Papa.parse(await response.text(), { header: true, skipEmptyLines: true }).data
    data.push({ ...data[0] })
    await route.fulfill({ response, body: Papa.unparse(data) })
  })
  await page.reload()
  await expect(page.getByRole('alert')).toContainText('중복')
  expect(errors).toEqual([])
  expect([...files].some((f) => /StopGroup_Hourly|STEP8|final_dataset/i.test(f))).toBe(false)
  console.log(JSON.stringify({ baseURL, result: 'PASS: 7개 단계·군집 개수·6×4 순위·26×4 점수/순위·링크 선택 전달·390px·표 스크롤·오류/재시도/빈/중복', pageErrors: errors }, null, 2))
} finally { await browser.close() }
