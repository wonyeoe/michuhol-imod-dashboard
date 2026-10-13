import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { DataState, OverviewSkeleton } from '@/components/data-state'
import { TemporalCharts } from '@/components/temporal-charts'
import { useTemporal } from '@/hooks/use-temporal'
import { EmptyDataError } from '@/data/overview'
import { TEMPORAL_SOURCES } from '@/data/temporal'
import { cn } from '@/lib/utils'

const number = (value: number) => value.toLocaleString('ko-KR', { maximumFractionDigits: 1 })
export default function TemporalPage() {
  const state = useTemporal()
  const [selected, setSelected] = useState('Z06')
  const zone = state.status === 'ready' ? state.data.zones.find((z) => z.candidate.zoneId === selected) : undefined
  return <div className="space-y-7">
    <section className="page-intro"><div><Badge>2026 Q2 · TEMPORAL ANALYSIS</Badge><h1 className="mt-3">시간대별 분석</h1><p className="mt-3 max-w-3xl text-[13px] leading-relaxed text-slate-500">후보 권역별 버스 승차·운행의 시간적 분포를 비교하고, 상대적 차이가 크게 나타나는 시간대를 탐색합니다.</p><p className="mt-2 text-xs text-slate-400">2026년 4월–6월 · 유효 관측 90일</p></div><Button variant="outline" asChild><Link to="/">종합 현황으로 돌아가기</Link></Button></section>
    {state.status === 'loading' && <OverviewSkeleton />}
    {state.status === 'error' && <DataState title={state.error instanceof EmptyDataError ? '표시할 시간대별 자료가 없습니다' : '시간대별 데이터를 불러오지 못했습니다'} message={state.error.message} retry={state.retry} />}
    {state.status === 'ready' && <>
      <section aria-labelledby="zone-selection"><div className="section-heading"><div><h2 id="zone-selection">분석할 후보 권역 선택</h2><p>STEP 7 최종 검토 순서 · 선택에 따라 후보 순위는 변경되지 않습니다.</p></div><Badge>예비 검토 후보 6개</Badge></div><div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{state.data.zones.map(({ candidate: c }) => <button key={c.zoneId} data-testid={`temporal-${c.zoneId}`} aria-pressed={selected === c.zoneId} onClick={() => setSelected(c.zoneId)} className={cn('flex items-start gap-3 rounded-xl border bg-white p-4 text-left transition-colors hover:border-blue-300 focus-visible:outline-2 focus-visible:outline-blue-600', selected === c.zoneId ? 'border-blue-500 bg-blue-50/60 ring-1 ring-blue-500' : 'border-slate-200')}><span className="rounded-md bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-500">{c.reviewOrder}</span><span className="min-w-0"><strong className="text-sm text-blue-700">{c.zoneId}</strong><span className="mt-1 block text-xs leading-relaxed text-slate-600">{c.names.join(', ')}</span></span></button>)}</div></section>
      {!zone && <DataState title="권역 자료가 없습니다" message="선택한 권역의 분석 자료를 확인할 수 없습니다." />}
      {zone && <div className="space-y-6" data-testid="temporal-content">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-live="polite" data-testid="temporal-metrics">
          <Card className="p-5"><p className="text-xs text-slate-500">선택 권역 · 정류장명 그룹</p><p className="mt-3 text-xl font-bold text-blue-700">{zone.candidate.zoneId}</p><p className="mt-2 text-xs leading-relaxed text-slate-600">{zone.candidate.names.join(', ')}</p></Card>
          <Card className="p-5"><p className="text-xs text-slate-500">일평균 승차량</p><p className="mt-3 text-2xl font-bold tabular-nums">{number(zone.candidate.dailyDemand)}<span className="ml-1 text-xs font-normal text-slate-400">명/일</span></p><p className="mt-2 text-xs text-slate-400">90일 기준 · STEP 7 최종 결과</p></Card>
          <Card className="p-5"><p className="text-xs text-slate-500">상대 격차 최대 시간</p><p className="mt-3 text-2xl font-bold tabular-nums">{String(zone.peak.hour).padStart(2, '0')}시</p><p className="mt-2 text-xs text-slate-400">최대 승차량 시간과 다른 지표</p></Card>
          <Card className="p-5"><p className="text-xs text-slate-500">해당 시간의 상대 격차</p><p className="mt-3 text-2xl font-bold text-blue-700 tabular-nums">+{zone.peak.gap.toFixed(2)}<span className="ml-1 text-xs font-normal">%p</span></p><p className="mt-2 text-xs text-slate-500">승차 {zone.peak.demand.toFixed(2)}% · 운행 {zone.peak.supply.toFixed(2)}%</p></Card>
        </div>
        <TemporalCharts zone={zone} />
        <Card className="border-blue-100 bg-blue-50/50 p-5 sm:p-6"><h2 className="text-base font-bold">분석 결과 읽기</h2><p className="mt-3 text-sm leading-7 text-slate-700">{zone.candidate.zoneId}에서는 {zone.peak.hour}시에 승차 비중과 운행 비중의 양의 차이가 가장 크게 나타났습니다. 승차 비중은 {zone.peak.demand.toFixed(2)}%, 운행 비중은 {zone.peak.supply.toFixed(2)}%로, 상대 격차는 {zone.peak.gap.toFixed(2)}%p입니다.</p><p className="mt-3 text-xs leading-6 text-slate-500">양수는 승차 비중이, 음수는 운행 비중이 더 크다는 뜻입니다. 시간 분포의 상대적 차이이며 차량 공급 부족이나 미충족 수요를 직접 증명하지 않습니다. 최대 상대 격차 시간은 I-MOD 최적 운행시간 또는 최대 승차량 시간을 의미하지 않습니다.</p></Card>
        <Card className="p-5 sm:p-6"><h2 className="text-sm font-bold">집계 기준과 데이터 출처</h2><div className="mt-3 space-y-2 text-xs leading-6 text-slate-500"><p>권역 구성 정류장명 그룹을 합산한 90일 누적 자료입니다. 물리 정류장 ID 단위 또는 그룹별 비중의 평균이 아닙니다.</p><p>승차 비중 = 해당 시간 누적 승차량 ÷ 이 권역의 24시간 누적 승차량 ({number(zone.totalRiders)}명) × 100<br />운행 비중 = 해당 시간 누적 운행 건수 ÷ 이 권역의 24시간 누적 운행 건수 ({number(zone.totalOperations)}건) × 100</p><p>상대 격차(%p) = 승차 비중(%) − 운행 비중(%). 월별 일평균 = 월 누적값 ÷ 해당 월 관측일(4월 30일, 5월 31일, 6월 29일). 운행 건수는 원자료 집계값이며 고유 차량 대수가 아닙니다.</p><p>CSV의 실제 0은 유지합니다. 필수 관측값이 누락되면 0으로 보충하지 않고 오류를 표시합니다. 표시값만 반올림하며 검증은 원래 정밀도로 수행합니다.</p>{Object.values(TEMPORAL_SOURCES).map((s) => <p key={s.file} className="break-all"><a className="text-blue-600 underline underline-offset-4" href={`${import.meta.env.BASE_URL}data/${s.file}`} download>{s.source}</a></p>)}<p>후보·순서·일평균: 05_provisional_top6_review.csv · 04_all_26_zones_scenario_scores.csv와 교차 검증. 권역 구성: STEP 6 Complete Linkage 500m.</p></div></Card>
      </div>}
    </>}
  </div>
}
