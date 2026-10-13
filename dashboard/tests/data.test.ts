import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { createHash } from 'node:crypto'
import { describe, expect, it } from 'vitest'
import { buildOverview, DataValidationError, EmptyDataError, parseCsv } from '../src/data/overview'
import { DATA_SOURCES } from '../src/data/sources'
import type { SourceKey, SourceTables } from '../src/types/data'

const root = fileURLToPath(new URL('../../', import.meta.url))
function fixtures(): SourceTables {
  return Object.fromEntries((Object.keys(DATA_SOURCES) as SourceKey[]).map((key) => [key, parseCsv(readFileSync(root + DATA_SOURCES[key].source, 'utf8'), key)])) as SourceTables
}

describe('최종 분석 CSV와 화면 데이터 계약', () => {
  it('실제 CSV에서 통계와 STEP 7 최종 순서를 읽는다', () => {
    const result = buildOverview(fixtures())
    expect(result.summary).toEqual({ groupCount: 286, observedDays: 90, zoneCount: 26, candidateCount: 6 })
    expect(result.candidates.map((c) => c.zoneId)).toEqual(['Z06', 'Z23', 'Z10', 'Z22', 'Z01', 'Z02'])
    expect(result.candidates.map((c) => c.top6Frequency)).toEqual([4, 4, 3, 2, 2, 2])
    expect(result.candidates.map((c) => c.peakHour)).toEqual([18, 16, 15, 18, 21, 7])
    expect(result.candidates[0].dailyDemand).toBe(10306.455556)
    expect(result.candidates[0].latitude).toBe(37.443106)
    expect(result.candidates[0].longitude).toBe(126.701493)
    expect(result.candidates[1].members.map((m) => m.name)).toEqual(['남중학교', '인화여고'])
  })
  it('CSV 행 순서가 달라도 zone_id로 정확히 연결한다', () => {
    const input = fixtures()
    input.profiles.reverse(); input.candidates.reverse(); input.memberships.reverse()
    expect(buildOverview(input).candidates.map((c) => [c.zoneId, c.latitude])).toEqual(buildOverview(fixtures()).candidates.map((c) => [c.zoneId, c.latitude]))
  })
  it('중복 권역과 그룹 할당은 다대다 결합 전에 차단한다', () => {
    const input = fixtures()
    input.profiles.push({ ...input.profiles[0] })
    expect(() => buildOverview(input)).toThrow(/중복/)
    const second = fixtures()
    second.memberships.push({ ...second.memberships[0] })
    expect(() => buildOverview(second)).toThrow(/중복/)
  })
  it('좌표 결측을 0이나 임의 좌표로 대체하지 않는다', () => {
    const input = fixtures()
    input.profiles.find((r) => r.zone_id === 'Z06')!.lat = ''
    expect(() => buildOverview(input)).toThrow(/lat/)
  })
  it('그룹 ID가 같아도 이름이 다르면 결합을 중단한다', () => {
    const input = fixtures()
    input.memberships[0].station_name = '다른 정류장'
    expect(() => buildOverview(input)).toThrow(/대응/)
  })
  it('STEP 7 전체 결과와 다른 후보 값 및 순서를 차단한다', () => {
    const input = fixtures()
    input.candidates[0].daily_demand = '123'
    expect(() => buildOverview(input)).toThrow(/daily_demand/)
    const second = fixtures()
    second.candidates[0].provisional_review_order = '99'
    expect(() => buildOverview(second)).toThrow(/순서/)
  })
  it('빈 후보 결과는 별도 빈 상태로 전달한다', () => {
    const input = fixtures(); input.candidates = []
    expect(() => buildOverview(input)).toThrow(EmptyDataError)
  })
  it('BOM·따옴표·쉼표가 있는 CSV를 처리하고 HTML 응답을 거부한다', () => {
    expect(parseCsv('\uFEFFstation_name,stop_group_id,observed_days\n"이름, 쉼표",SG001,90\n', 'groups')[0].station_name).toBe('이름, 쉼표')
    expect(() => parseCsv('<!doctype html><html>not csv</html>', 'groups')).toThrow(DataValidationError)
  })
  it('배포용 복사본 6개가 원본 바이트 및 manifest 해시와 일치한다', () => {
    const manifest = JSON.parse(readFileSync(new URL('../public/data/manifest.json', import.meta.url), 'utf8'))
    for (const item of manifest.sources) {
      const original = readFileSync(root + item.source)
      const copy = readFileSync(new URL(`../public/data/${item.file}`, import.meta.url))
      expect(copy.equals(original)).toBe(true)
      expect(createHash('sha256').update(copy).digest('hex')).toBe(item.sha256)
    }
  })
})
