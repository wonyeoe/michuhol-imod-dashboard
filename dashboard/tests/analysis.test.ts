import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { buildAnalysis, type AnalysisKey, type AnalysisTables } from '../src/data/analysis'
import { ANALYSIS_SOURCES } from '../src/data/analysis-sources'
import { NOTEBOOKS, STEP4_WEIGHTS, STEP7_WEIGHTS } from '../src/data/analysis-methodology'
import { DATA_SOURCES } from '../src/data/sources'
import { parseCsv, parseTable } from '../src/data/overview'
import { SCENARIOS } from '../src/types/zones'
import type { SourceKey, SourceTables } from '../src/types/data'

const read = (path: string) => readFileSync(new URL(`../../${path}`, import.meta.url), 'utf8')
function fixtures() {
  const base = Object.fromEntries((Object.keys(DATA_SOURCES) as SourceKey[]).map((key) => [key, parseCsv(read(DATA_SOURCES[key].source), key)])) as SourceTables
  const extra = Object.fromEntries((Object.keys(ANALYSIS_SOURCES) as AnalysisKey[]).map((key) => [key, parseTable(read(ANALYSIS_SOURCES[key].source), { title: key, columns: [...ANALYSIS_SOURCES[key].columns] })])) as AnalysisTables
  return { base, extra }
}
function notebookCode(file: string) {
  const notebook = JSON.parse(read(`COLAB code/${file}`)) as { cells: { cell_type: string; source: string[] }[] }
  return notebook.cells.filter((c) => c.cell_type === 'code').map((c) => c.source.join('')).join('\n')
}
describe('분석 근거의 실제 자료 계약', () => {
  it('286개 군집과 40→26→6 규모·공간 구성을 원본에서 검증한다', () => {
    const { base, extra } = fixtures(); const d = buildAnalysis(base, extra)
    expect(d.summary).toEqual({ days: 90, groups: 286, located: 249, unlocated: 37, pool: 40, units: 26, multi: 12, single: 14, candidates: 6 })
    expect(d.clusters.map((c) => c.count)).toEqual([196, 65, 25])
    expect(d.clusters.reduce((s, c) => s + c.share, 0)).toBeCloseTo(100, 10)
    expect(d.models.map((m) => m.counts)).toEqual([[196, 65, 25], [56, 208, 22]])
    expect(d.models.map((m) => m.dimensions)).toEqual([5, 5])
    expect(d.candidates.map((z) => z.zoneId)).toEqual(['Z06', 'Z23', 'Z10', 'Z22', 'Z01', 'Z02'])
    expect(d.candidates.map((z) => z.top6Frequency)).toEqual([4, 4, 3, 2, 2, 2])
    expect(d.eligibility.map((e) => e.count)).toEqual([286, 214, 143])
    expect(d.spatial.map((r) => [r.units, r.multi, r.single, r.diameter])).toEqual([[22, 8, 14, 1254.2], [26, 12, 14, 492.3]])
  })
  it('26개 권역의 점수·순위와 최종 순위 중앙값을 CSV 그대로 사용한다', () => {
    const { base, extra } = fixtures()
    for (const z of buildAnalysis(base, extra).zones) {
      const r = base.scores.find((r) => r.zone_id === z.zoneId)!
      for (const { key } of SCENARIOS) expect(z.scenarios[key]).toEqual({ score: Number(r[`score_${key}`]), rank: Number(r[`rank_${key}`]), top6: r[`top6_${key}`] === 'True' })
      expect(z.medianRank).toBe(Number(r.median_rank))
    }
  })
  it('설명용 STEP 4·7 가중치를 Notebook 코드와 교차 검증한다', () => {
    for (const [file, weights] of [[NOTEBOOKS[4], STEP4_WEIGHTS], [NOTEBOOKS[7], STEP7_WEIGHTS]] as const) {
      const code = notebookCode(file)
      for (const [scenario, values] of Object.entries(weights)) {
        const dict = code.match(new RegExp(`'${scenario}'\\s*:\\s*\\{([^}]+)\\}`))?.[1]
        expect(dict).toBeDefined()
        const parsed = Object.fromEntries([...dict!.matchAll(/'([a-z_]+)'\s*:\s*([.\d]+)/g)].map((m) => [m[1], Number(m[2])]))
        expect(values).toEqual(parsed)
        expect(Object.values(values).reduce((s, v) => s + v, 0)).toBeCloseTo(1)
      }
    }
    const code = notebookCode(NOTEBOOKS[7]).replace(/\s/g, '')
    expect(code).toContain("sort_values(['top6_frequency','median_rank','score_balanced'],ascending=[False,True,False])")
    expect(code).not.toContain("sort_values(['top6_frequency','mean_rank'")
  })
  it('STEP 4 실제 순위 파일은 3×4의 12개 조건, STEP 5 기준 결과는 22개다', () => {
    const rows = parseTable(read('STEP별 결과 파일/Michuhol_IMOD_STEP4_Candidate_Screening_Results/06_scenario_rankings.csv'), { title: 'STEP4', columns: ['scenario', 'station_name', 'scenario_rank', 'scenario_score'] })
    expect(rows).toHaveLength((286 + 214 + 143) * 4)
    expect(new Set(rows.map((r) => r.scenario)).size).toBe(12)
    const rows5 = parseTable(read('STEP별 결과 파일/Michuhol_IMOD_STEP5_Spatial_Zones_Results/02_spatial_scenario_summary.csv'), { title: 'STEP5', columns: ['pool', 'radius_m', 'n_multistop_zones', 'n_singletons'] })
    const row = rows5.find((r) => r.pool === '40' && r.radius_m === '500')!
    expect([Number(row.n_multistop_zones), Number(row.n_singletons)]).toEqual([8, 14])
    expect(notebookCode(NOTEBOOKS[5])).toContain("min_samples=1,metric='haversine'")
  })
  it('행 순서와 무관하게 ID와 이름을 대조한다', () => {
    const a = fixtures(), b = fixtures()
    b.extra.assignments.reverse(); b.extra.profiles.reverse(); b.extra.metrics.reverse(); b.extra.spatial.reverse()
    expect(buildAnalysis(a.base, a.extra)).toEqual(buildAnalysis(b.base, b.extra))
  })
  it('중복·누락·이름 불일치·잘못된 군집 레이블을 차단한다', () => {
    const a = fixtures(); a.extra.assignments.push({ ...a.extra.assignments[0] })
    expect(() => buildAnalysis(a.base, a.extra)).toThrow(/중복/)
    const b = fixtures(); b.extra.assignments.pop()
    expect(() => buildAnalysis(b.base, b.extra)).toThrow(/그룹 수/)
    const c = fixtures(); c.extra.assignments[0].station_name = '잘못된 이름'
    expect(() => buildAnalysis(c.base, c.extra)).toThrow(/대응/)
    const d = fixtures(); d.extra.assignments[0].KMeans_FULL8 = ''
    expect(() => buildAnalysis(d.base, d.extra)).toThrow(/값이 없습니다/)
    d.extra.assignments[0].KMeans_FULL8 = '3'
    expect(() => buildAnalysis(d.base, d.extra)).toThrow(/올바르지/)
  })
  it('프로필·모델 군집 수·공간 구성·중앙값 변조를 거부한다', () => {
    const a = fixtures(); a.extra.profiles[0].count = '195'
    expect(() => buildAnalysis(a.base, a.extra)).toThrow(/개수/)
    const b = fixtures(); b.extra.metrics[0].cluster_sizes = '1/2/283'
    expect(() => buildAnalysis(b.base, b.extra)).toThrow(/모델 지표/)
    const c = fixtures(); c.extra.spatial.find((r) => r.method === 'Complete' && r.radius_m === '500')!.n_groups = '25'
    expect(() => buildAnalysis(c.base, c.extra)).toThrow(/합계/)
    const d = fixtures(); d.base.scores[0].median_rank = '2'
    expect(() => buildAnalysis(d.base, d.extra)).toThrow(/중앙값/)
  })
  it('빈 자료 및 CSV 누락 컬럼을 명시적으로 거부한다', () => {
    const f = fixtures(); f.extra.assignments = []
    expect(() => buildAnalysis(f.base, f.extra)).toThrow(/비어/)
    expect(() => parseTable('station_name,stop_group_id\na,SG001\n', { title: '군집', columns: [...ANALYSIS_SOURCES.assignments.columns] })).toThrow(/필수 컬럼/)
  })
})
