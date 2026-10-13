import { Link } from 'react-router-dom'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { DataState, OverviewSkeleton } from '@/components/data-state'
import { AnalysisProcess, ScreeningMethod, SpatialMethod } from '@/components/analysis/method-sections'
import { ClusterSection } from '@/components/analysis/cluster-section'
import { SelectionSection } from '@/components/analysis/selection-section'
import { ANALYSIS_SOURCES } from '@/data/analysis-sources'
import { DATA_SOURCES } from '@/data/sources'
import { EmptyDataError } from '@/data/overview'
import { useAnalysis } from '@/hooks/use-analysis'

export default function AnalysisPage() {
  const state = useAnalysis()
  return <div className="space-y-8">
    <section className="page-intro"><div><Badge>STEP 1–7 · ANALYSIS EVIDENCE</Badge><h1 className="mt-3">AI 분석 및 선정 근거</h1><p className="mt-3 max-w-3xl text-[13px] leading-relaxed text-slate-500">정류장명 그룹의 수요·공급 특성 분석부터 공간 권역화, 시나리오 평가, 최종 예비 후보 선정까지의 과정을 살펴봅니다.</p></div><Button variant="outline" asChild><Link to="/">종합 현황으로 돌아가기</Link></Button></section>
    <p className="rounded-lg border border-blue-100 bg-blue-50/50 px-4 py-3 text-xs leading-6 text-blue-800">기존 최종 분석을 설명하는 화면입니다. 최종 6개는 현장 검증을 위한 예비 검토 후보이며 I-MOD 도입 확정 지역이 아닙니다.</p>
    {state.status === 'loading' && <OverviewSkeleton />}
    {state.status === 'error' && <DataState title={state.error instanceof EmptyDataError ? '표시할 분석 근거가 없습니다' : '분석 근거를 불러오지 못했습니다'} message={state.error.message} retry={state.retry} />}
    {state.status === 'ready' && <>
      <section aria-label="분석 규모" data-testid="analysis-summary"><div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">{[['분석 기간', '2026년 4–6월'], ['실제 관측일', `${state.data.summary.days}일`], ['정류장명 그룹', `${state.data.summary.groups}개`], ['공간 평가 단위', `${state.data.summary.units}개`], ['최종 예비 검토 후보', `${state.data.summary.candidates}개`]].map(([label, value]) => <Card key={label} className="p-5"><p className="text-xs text-slate-500">{label}</p><p className="mt-3 text-xl font-bold tabular-nums">{value}</p></Card>)}</div><p className="mt-3 text-xs leading-6 text-slate-500">6월 11일은 관측 자료에서 제외되었습니다. 좌표 확보 {state.data.summary.located}개 그룹 · 미확보 {state.data.summary.unlocated}개 그룹. 좌표가 없어도 전체 통계에는 포함하며 공간 분석과 구분합니다. 정류장명 그룹은 물리 정류장 ID와 다른 분석 단위입니다.</p></section>
      <AnalysisProcess data={state.data} />
      <ClusterSection data={state.data} />
      <ScreeningMethod data={state.data} />
      <SpatialMethod data={state.data} />
      <SelectionSection data={state.data} />
    </>}
    <Card className="p-5 sm:p-6"><h2 className="text-base font-bold">분석의 한계와 활용 범위</h2><ul className="mt-4 grid gap-3 text-xs leading-6 text-slate-500 md:grid-cols-2">{['관측 버스 승차량은 전체 잠재 호출 수요가 아닙니다. 시간대별 상대 격차는 미충족 수요나 공급 부족을 직접 입증하지 않습니다.', 'OD(출발지·도착지) 데이터가 없어 개별 이동 경로나 이동 수요를 추정하지 않았습니다.', '실제 차량 운영 시뮬레이션을 수행하지 않았습니다. 운행 건수는 차량 수용력이나 배차간격과 다릅니다.', '500m 공간 조건은 실제 서비스 운영 경계가 아닙니다. 현장 접근성·도로망·환승 편의성 검토가 추가로 필요합니다.', '최대 상대 격차 시간은 최대 승차량 시간이나 I-MOD 최적 운행시간이 아닙니다.', '최종 후보는 2026년 2분기 자료에 기반합니다. 다른 기간의 수요나 도입 효과를 보장하지 않습니다.'].map((text) => <li key={text} className="rounded-lg bg-slate-50 p-4">{text}</li>)}</ul></Card>
    <Card className="p-5"><details><summary className="text-sm font-semibold">자료 출처와 표시 원칙</summary><p className="mt-3 text-xs leading-6 text-slate-500">분석 설명은 프로젝트 데이터 구조 보고서, STEP 1–7 최종 Notebook 및 결과 CSV와 대조했습니다. 가중치는 Notebook에서 옮긴 설명용 설정이며 점수 계산에 사용하지 않습니다. 순위·점수는 CSV의 기존 값이고, 개수·합계·대응 관계만 검증합니다. STEP 8 또는 폐기된 실험은 사용하지 않습니다.</p><div className="mt-3 space-y-2">{[...Object.values(ANALYSIS_SOURCES), DATA_SOURCES.groups, DATA_SOURCES.memberships, DATA_SOURCES.profiles, DATA_SOURCES.scores, DATA_SOURCES.candidates].map((s) => <p key={s.file} className="break-all text-[11px]"><a href={`${import.meta.env.BASE_URL}data/${s.file}`} download className="text-blue-600 underline underline-offset-4">{s.source}</a></p>)}</div></details></Card>
  </div>
}
