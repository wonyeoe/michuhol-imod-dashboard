import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { buildZones, filterZones } from '../src/data/zones'
import { parseCsv } from '../src/data/overview'
import { DATA_SOURCES } from '../src/data/sources'
import { SCENARIOS } from '../src/types/zones'
import type { SourceKey, SourceTables } from '../src/types/data'

function fixtures() {
  return Object.fromEntries((Object.keys(DATA_SOURCES) as SourceKey[]).map((key) => [key, parseCsv(readFileSync(new URL(`../../${DATA_SOURCES[key].source}`, import.meta.url), 'utf8'), key)])) as SourceTables
}
describe('STEP 6·7 권역 탐색 계약', () => {
  it('실제 26개·6개·20개를 구분하고 후보 외에는 최종 검토 순서를 부여하지 않는다', () => {
    const data = buildZones(fixtures())
    expect(data.zones).toHaveLength(26)
    expect(data.candidates.map((z) => z.zoneId)).toEqual(['Z06', 'Z23', 'Z10', 'Z22', 'Z01', 'Z02'])
    expect(data.candidates.map((z) => z.reviewOrder)).toEqual([1, 2, 3, 4, 5, 6])
    const others = data.zones.filter((z) => z.reviewOrder === null)
    expect(others).toHaveLength(20)
    expect(others.map((z) => z.zoneId)).toEqual(others.map((z) => z.zoneId).sort())
    expect(data.zones.reduce((s, z) => s + z.members.length, 0)).toBe(40)
    expect(data.zones.flatMap((z) => z.members).every((m) => m.coordinates)).toBe(true)
  })
  it('26개 권역의 모든 표시 수치·구성·좌표를 원본 필드와 대조한다', () => {
    const input = fixtures()
    for (const z of buildZones(input).zones) {
      const row = input.scores.find((r) => r.zone_id === z.zoneId)!
      const profile = input.profiles.find((r) => r.zone_id === z.zoneId)!
      expect([z.latitude, z.longitude]).toEqual([Number(profile.lat), Number(profile.lon)])
      expect(z.dailyDemand).toBe(Number(row.daily_demand))
      expect(z.peakHour).toBe(Number(row.peak_hour))
      expect(z.peakGap).toBe(Number(row.peak_hour_gap) * 100)
      expect(z.positiveGapSum).toBe(Number(row.positive_gap_sum))
      expect(z.monthlyCv).toBe(Number(row.monthly_cv))
      expect(z.monthlyMinMaxRatio).toBe(Number(row.monthly_min_max_ratio))
      expect(z.members.map((m) => [m.groupId, m.name])).toEqual(input.memberships.filter((m) => m.zone_id === z.zoneId).map((m) => [m.stop_group_id, m.station_name]))
      for (const { key } of SCENARIOS) expect(z.scenarios[key]).toEqual({ score: Number(row[`score_${key}`]), rank: Number(row[`rank_${key}`]), top6: row[`top6_${key}`] === 'True' })
    }
  })
  it('입력 행 순서를 바꿔도 권역 ID 기준으로 같은 결과를 연결한다', () => {
    const a = fixtures(), b = fixtures()
    b.scores.reverse(); b.profiles.reverse(); b.candidates.reverse()
    expect(buildZones(b)).toEqual(buildZones(a))
  })
  it('필터·ID 및 정류장명 검색은 값·순서를 바꾸지 않는다', () => {
    const { zones, candidates } = buildZones(fixtures())
    expect(filterZones(zones, 'all', '')).toHaveLength(26)
    expect(filterZones(zones, 'final', '')).toEqual(candidates)
    expect(filterZones(zones, 'other', '')).toHaveLength(20)
    expect(filterZones(zones, 'all', ' z23 ')[0].names).toEqual(['남중학교', '인화여고'])
    expect(filterZones(zones, 'all', '인화여고')[0].zoneId).toBe('Z23')
    expect(filterZones(zones, 'other', 'z23')).toEqual([])
    expect(filterZones(zones, 'all', '없는 정류장')).toEqual([])
    expect(zones).toHaveLength(26)
  })
  it.each(['', 'NaN', '999', '0'])('비후보 권역 좌표 오류 %s를 임의 좌표로 대체하지 않는다', (value) => {
    const input = fixtures(); input.profiles.find((r) => r.zone_id === 'Z03')!.lat = value
    expect(() => buildZones(input)).toThrow(/lat/)
  })
  it('범위 내 다른 대표 좌표와 반쪽 그룹 좌표도 차단한다', () => {
    const a = fixtures(); a.profiles.find((r) => r.zone_id === 'Z03')!.lat = '37.5'
    expect(() => buildZones(a)).toThrow(/평균/)
    const b = fixtures(); b.memberships[0].representative_latitude = ''
    expect(() => buildZones(b)).toThrow(/불완전/)
  })
  it('그룹 좌표가 둘 다 없으면 그룹 목록을 보존하고 좌표를 만들지 않는다', () => {
    const input = fixtures(); input.memberships[0].representative_latitude = ''; input.memberships[0].representative_longitude = ''
    const member = buildZones(input).zones.flatMap((z) => z.members).find((m) => m.groupId === input.memberships[0].stop_group_id)!
    expect(member.coordinates).toBeNull()
    expect(member.name).toBe(input.memberships[0].station_name)
  })
  it('중복·잘못된 참조·이름 불일치를 거부한다', () => {
    const a = fixtures(); a.scores.push({ ...a.scores[0] })
    expect(() => buildZones(a)).toThrow(/중복/)
    const b = fixtures(); b.memberships[0].zone_id = 'Z99'
    expect(() => buildZones(b)).toThrow(/대표 좌표/)
    const c = fixtures(); c.scores.find((r) => r.zone_id === 'Z03')!.names = '임의 이름'
    expect(() => buildZones(c)).toThrow(/구성 정류장명/)
  })
  it('누락 지표, 시나리오 순위 오류와 최종 파일 불일치를 거부한다', () => {
    const a = fixtures(); a.scores.find((r) => r.zone_id === 'Z03')!.monthly_cv = ''
    expect(() => buildZones(a)).toThrow(/monthly_cv/)
    const b = fixtures(); b.scores.find((r) => r.zone_id === 'Z03')!.rank_balanced = '0'
    expect(() => buildZones(b)).toThrow(/rank_balanced/)
    const c = fixtures(); c.candidates[0].score_balanced = '99'
    expect(() => buildZones(c)).toThrow(/최종 후보/)
  })
  it('전체 평가 자료가 비어 있으면 빈 상태를 전달한다', () => {
    const input = fixtures(); input.scores = []
    expect(() => buildZones(input)).toThrow(/공간 평가 단위가 없습니다/)
  })
})
