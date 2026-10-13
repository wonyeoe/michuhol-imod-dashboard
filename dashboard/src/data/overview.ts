import Papa from 'papaparse'
import { DATA_SOURCES } from './sources'
import type { Candidate, CsvRow, OverviewData, SourceKey, SourceTables } from '../types/data'

export class DataValidationError extends Error { name = 'DataValidationError' }
export class EmptyDataError extends Error { name = 'EmptyDataError' }

function check(condition: unknown, message: string): asserts condition {
  if (!condition) throw new DataValidationError(message)
}
export function parseCsv(text: string, key: SourceKey): CsvRow[] {
  const result = Papa.parse<CsvRow>(text.replace(/^\uFEFF/, ''), { header: true, skipEmptyLines: 'greedy' })
  check(result.errors.length === 0, `${DATA_SOURCES[key].title}: CSV 형식을 확인해 주세요.`)
  const fields = result.meta.fields ?? []
  check(DATA_SOURCES[key].columns.every((column) => fields.includes(column)), `${DATA_SOURCES[key].title}: 필수 컬럼이 없습니다.`)
  return result.data
}
function number(row: CsvRow, field: string, integer = false): number {
  const value = row[field]
  check(value !== undefined && value.trim() !== '', `${row.zone_id ?? row.station_name ?? '분석 자료'}: ${field} 값이 없습니다.`)
  const parsed = Number(value)
  check(Number.isFinite(parsed) && (!integer || Number.isInteger(parsed)), `${field} 값이 올바른 숫자가 아닙니다.`)
  return parsed
}
function unique(rows: CsvRow[], key: string, label: string): Map<string, CsvRow> {
  const map = new Map<string, CsvRow>()
  for (const row of rows) {
    check(row[key]?.trim(), `${label}: ${key}가 비어 있습니다.`)
    check(!map.has(row[key]), `${label}: ${key} 중복으로 결합을 중단했습니다.`)
    map.set(row[key], row)
  }
  return map
}

export function buildOverview(tables: SourceTables): OverviewData {
  const { groups, memberships, profiles, scores, candidates, audit } = tables
  if (candidates.length === 0) throw new EmptyDataError('표시할 최종 예비 검토 후보가 없습니다.')
  check(audit.length === 1 && groups.length > 0, '분석 규모 검증 자료가 비어 있거나 중복되었습니다.')
  const groupMap = unique(groups, 'stop_group_id', '그룹 특징')
  unique(groups, 'station_name', '그룹 특징')
  unique(memberships, 'stop_group_id', 'STEP 6 할당')
  unique(memberships, 'station_name', 'STEP 6 할당')
  const profileMap = unique(profiles, 'zone_id', 'STEP 6 권역')
  const scoreMap = unique(scores, 'zone_id', 'STEP 7 점수')
  unique(candidates, 'zone_id', '최종 후보')
  unique(candidates, 'provisional_review_order', '최종 순서')
  const days = new Set(groups.map((row) => number(row, 'observed_days', true)))
  check(days.size === 1 && [...days][0] > 0, '정류장명 그룹별 관측일이 일치하지 않습니다.')
  const observedDays = [...days][0]
  const monthlyDays = [...audit[0].monthly_days.matchAll(/(\d+)\s*:\s*(\d+)/g)]
  check(monthlyDays.length === 3 && monthlyDays.reduce((sum, match) => sum + Number(match[2]), 0) === observedDays, '관측일과 월별 감사 결과가 다릅니다.')
  check(groups.length === number(audit[0], 'all_station_names', true), '그룹 수가 STEP 7 감사 결과와 다릅니다.')
  check(memberships.length === number(audit[0], 'input_candidate_stop_names', true), '공간 후보 그룹 수가 STEP 7과 다릅니다.')
  check(profiles.length === number(audit[0], 'candidate_units', true) && scores.length === profiles.length, '공간 평가 단위 수가 STEP 6·7 사이에서 다릅니다.')
  check(candidates.length === number(audit[0], 'top6_count', true), '최종 후보 수가 STEP 7 감사 결과와 다릅니다.')
  for (const member of memberships) {
    check(groupMap.get(member.stop_group_id)?.station_name === member.station_name, '정류장명과 그룹 ID의 대응이 다릅니다.')
    check(profileMap.has(member.zone_id), `${member.zone_id}: STEP 6 대표 좌표 자료가 없습니다.`)
  }
  for (const profile of profiles) {
    check(scoreMap.has(profile.zone_id), `${profile.zone_id}: STEP 7 결과가 없습니다.`)
    const memberCount = memberships.filter((m) => m.zone_id === profile.zone_id).length
    check(memberCount === number(profile, 'n_stop_groups', true) && memberCount > 0, `${profile.zone_id}: 구성 그룹 수가 다릅니다.`)
  }
  const orderedScores = [...scores].sort((a, b) => number(a, 'provisional_review_order', true) - number(b, 'provisional_review_order', true))
  const ordered = [...candidates].sort((a, b) => number(a, 'provisional_review_order', true) - number(b, 'provisional_review_order', true))
  const result: Candidate[] = ordered.map((row, index) => {
    check(/^Z\d{2}$/.test(row.zone_id), '최종 권역 ID 형식이 올바르지 않습니다.')
    const profile = profileMap.get(row.zone_id)
    const score = scoreMap.get(row.zone_id)
    check(profile && score, `${row.zone_id}: 권역 연결 자료를 찾을 수 없습니다.`)
    check(orderedScores[index].zone_id === row.zone_id && number(row, 'provisional_review_order', true) === index + 1, '최종 후보 순서가 전체 STEP 7 결과와 다릅니다.')
    for (const field of DATA_SOURCES.candidates.columns) check(row[field] === score[field], `${row.zone_id}: ${field} 값이 STEP 7 전체 결과와 다릅니다.`)
    const members = memberships.filter((member) => member.zone_id === row.zone_id).map((member) => ({ groupId: member.stop_group_id, name: member.station_name }))
    const names = row.names.split('|').map((name) => name.trim())
    check(names.length === members.length && names.every((name) => members.some((m) => m.name === name)), `${row.zone_id}: 구성 정류장명 그룹이 다릅니다.`)
    check(number(row, 'n_stops', true) === members.length, `${row.zone_id}: 그룹 수가 다릅니다.`)
    const latitude = number(profile, 'lat'), longitude = number(profile, 'lon')
    check(latitude >= 37 && latitude <= 38 && longitude >= 126 && longitude <= 127, `${row.zone_id}: 분석 좌표가 없거나 범위를 벗어났습니다.`)
    const dailyDemand = number(row, 'daily_demand'), top6Frequency = number(row, 'top6_frequency', true), peakHour = number(row, 'peak_hour', true)
    check(dailyDemand >= 0 && top6Frequency >= 0 && top6Frequency <= 4 && peakHour >= 0 && peakHour <= 23, `${row.zone_id}: 표시 지표의 범위를 확인해 주세요.`)
    check(row.type === 'single' || row.type === 'multi', `${row.zone_id}: 권역 유형이 올바르지 않습니다.`)
    check((row.type === 'single') === (members.length === 1), `${row.zone_id}: 권역 유형과 그룹 수가 다릅니다.`)
    return { zoneId: row.zone_id, reviewOrder: number(row, 'provisional_review_order', true), names, members, dailyDemand, top6Frequency, peakHour, type: row.type, latitude, longitude }
  })
  return { summary: { groupCount: groups.length, observedDays, zoneCount: profiles.length, candidateCount: result.length }, candidates: result }
}

export async function loadOverview(signal: AbortSignal): Promise<OverviewData> {
  const entries = await Promise.all((Object.keys(DATA_SOURCES) as SourceKey[]).map(async (key) => {
    const source = DATA_SOURCES[key]
    const response = await fetch(`${import.meta.env.BASE_URL}data/${source.file}`, { signal })
    if (!response.ok) throw new Error(`${source.title}을 불러오지 못했습니다. (HTTP ${response.status})`)
    return [key, parseCsv(await response.text(), key)] as const
  }))
  return buildOverview(Object.fromEntries(entries) as SourceTables)
}
