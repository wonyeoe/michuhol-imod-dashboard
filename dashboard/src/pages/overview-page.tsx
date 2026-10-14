import { lazy, Suspense, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, ArrowUpRight, Info, MapPinned } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { DataState, OverviewSkeleton } from '@/components/data-state'
import { ErrorBoundary } from '@/components/error-boundary'
import { CandidateList, SelectionSummary } from '@/components/overview/candidate-list'
import { CandidateComparison } from '@/components/overview/candidate-comparison'
import { StatCards } from '@/components/overview/stat-cards'
import { DataProvenance } from '@/components/overview/data-provenance'
import { useOverview } from '@/hooks/use-overview'
import { EmptyDataError } from '@/data/overview'

const CandidateMap = lazy(() => import('@/components/overview/candidate-map'))
export function OverviewPage() {
  const state = useOverview()
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const candidates = state.status === 'ready' ? state.data.candidates : []
  const effectiveSelection = selectedId && candidates.some((c) => c.zoneId === selectedId) ? selectedId : candidates[0]?.zoneId ?? null
  return <div className="space-y-7">
    <section className="page-intro">
      <div><h1>데이터로 탐색하는<br className="sm:hidden" /> I-MOD 운영 검토 후보</h1><p className="mt-3 text-[13px] leading-relaxed text-slate-500">버스 승차량과 운행의 시간 분포를 비교하여 현장 검토가 필요한 후보를 탐색했습니다.</p></div>
      <Button variant="outline" asChild className="shrink-0 bg-white"><Link to="/analysis">분석 과정 안내<ArrowUpRight /></Link></Button>
    </section>
    {state.status === 'loading' && <OverviewSkeleton />}
    {state.status === 'error' && <DataState title={state.error instanceof EmptyDataError ? '표시할 후보가 없습니다' : '분석 데이터를 불러오지 못했습니다'} message={state.error.message} retry={state.retry} />}
    {state.status === 'ready' && <>
      <section className="result-summary" aria-label="핵심 분석 결과"><h2>{state.data.summary.zoneCount}개 평가 권역 중 {candidates.length}개를 예비 검토 후보로 선정했습니다.</h2><p>승차량만으로 줄 세우지 않고, 평가 기준의 중요도를 달리한 4개 시나리오를 종합했습니다. 도입 확정 지역이 아닌 추가 검토 대상입니다.</p></section>
      <StatCards summary={state.data.summary} />
      <section aria-labelledby="map-title">
        <div className="section-heading"><div><h2 id="map-title">최종 후보 권역 한눈에 보기</h2><p>지도나 목록에서 후보를 선택하면 해당 권역의 분석 결과를 확인할 수 있습니다.</p></div><span className="hidden items-center gap-1.5 text-xs text-slate-500 sm:flex"><MapPinned size={14} />분석 결과의 대표 좌표</span></div>
        <div className="grid items-stretch gap-5 xl:grid-cols-[minmax(0,1fr)_310px]">
          <Card className="min-w-0 overflow-hidden">
            <ErrorBoundary label="지도를 표시하지 못했습니다"><Suspense fallback={<div className="flex h-[470px] items-center justify-center bg-slate-100 text-sm text-slate-500" role="status">지도를 준비하고 있습니다.</div>}><CandidateMap candidates={candidates} selectedId={effectiveSelection} onSelect={setSelectedId} /></Suspense></ErrorBoundary>
            <div className="border-t border-border px-5 py-4"><SelectionSummary candidate={candidates.find((c) => c.zoneId === effectiveSelection)} /><Link to={`/zones?zone=${effectiveSelection}`} className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-blue-600">선택 후보의 권역 상세 보기<ArrowUpRight size={13} /></Link></div>
          </Card>
          <CandidateList candidates={candidates} selectedId={effectiveSelection} onSelect={setSelectedId} />
        </div>
        <p className="mt-3 flex items-start gap-1.5 text-xs leading-relaxed text-slate-500"><Info size={12} className="mt-0.5 shrink-0" />파란 마커의 숫자는 최종 검토 순서, Zxx는 권역 ID입니다. 지도는 분석 권역의 대표점을 표시합니다. 예비 검토 후보이며, 실제 서비스 반경 또는 운영 경계를 의미하지 않습니다.</p>
      </section>
      <CandidateComparison candidates={candidates} selectedId={effectiveSelection} onSelect={setSelectedId} />
    </>}
    <section className="temporal-banner">
      <div><h2 className="text-base font-bold text-slate-800">후보마다 차이가 큰 시간도 다릅니다</h2><p className="mt-2 text-sm leading-relaxed text-slate-600">후보 권역마다 버스 승차와 운행의 시간적 분포가 다르게 나타납니다.</p></div>
      <Button asChild className="shrink-0"><Link to={effectiveSelection ? `/temporal?zone=${effectiveSelection}` : "/temporal"}>시간대별 분석 안내<ArrowRight /></Link></Button>
    </section>
    <DataProvenance />
  </div>
}
