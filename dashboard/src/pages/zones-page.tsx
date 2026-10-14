import { lazy, Suspense, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { DataState, OverviewSkeleton } from '@/components/data-state'
import { ErrorBoundary } from '@/components/error-boundary'
import { ZoneList } from '@/components/zones/zone-list'
import { ZoneDetail } from '@/components/zones/zone-detail'
import { ZoneComparison } from '@/components/zones/zone-comparison'
import { useZones } from '@/hooks/use-zones'
import { filterZones } from '@/data/zones'
import { EmptyDataError } from '@/data/overview'
import { DATA_SOURCES } from '@/data/sources'
import type { Zone, ZoneFilter } from '@/types/zones'

const ZoneMap = lazy(() => import('@/components/zones/zone-map'))
const EMPTY: Zone[] = []
export default function ZonesPage() {
  const state = useZones()
  const [params, setParams] = useSearchParams()
  const [filter, setFilter] = useState<ZoneFilter>('all')
  const [query, setQuery] = useState('')
  const [showMembers, setShowMembers] = useState(false)
  const all = state.status === 'ready' ? state.data.zones : EMPTY
  const visible = useMemo(() => filterZones(all, filter, query), [all, filter, query])
  const requested = params.get('zone')
  const selected = visible.find((z) => z.zoneId === requested) ?? visible[0]
  const onSelect = (id: string) => setParams({ zone: id }, { replace: true, preventScrollReset: true })
  const reset = () => { setFilter('all'); setQuery('') }
  return <div className="space-y-7">
    <section className="page-intro"><div><h1>후보 권역 탐색</h1><p className="mt-3 max-w-3xl text-[13px] leading-relaxed text-slate-500">공간 분석으로 도출된 26개 평가 권역의 위치와 구성, 주요 지표를 탐색하고 최종 예비 검토 후보를 비교합니다.</p></div><Button variant="outline" asChild><Link to="/">종합 현황으로 돌아가기</Link></Button></section>
    {state.status === 'loading' && <OverviewSkeleton />}
    {state.status === 'error' && <DataState title={state.error instanceof EmptyDataError ? '표시할 권역 자료가 없습니다' : '권역 데이터를 불러오지 못했습니다'} message={state.error.message} retry={state.retry} />}
    {state.status === 'ready' && <>
      <section className="result-summary" aria-label="권역 지도 읽기"><h2>가까운 정류장명 그룹을 묶은 {all.length}개 평가 단위의 위치입니다.</h2><p>파란색 {state.data.candidates.length}개는 최종 예비 후보, 회색 {all.length - state.data.candidates.length}개는 함께 평가했지만 최종 후보에 포함되지 않은 권역입니다. 파란 마커의 숫자는 검토 순서이고 Zxx는 식별자입니다.</p><p>그룹 대표점 사이 최대 거리가 500m 이내가 되도록 묶었습니다(Complete Linkage). 실제 운행 반경이나 서비스 경계는 아닙니다.</p></section>
      <div className="grid gap-4 sm:grid-cols-3" data-testid="zone-stats">{[['전체 평가 단위', all.length], ['최종 예비 검토 후보', state.data.candidates.length], ['나머지 평가 단위', all.length - state.data.candidates.length]].map(([label, value], i) => <Card key={label} className={`stat-card ${i === 1 ? 'stat-card-accent' : ''}`}><p className="text-xs text-slate-500">{label}</p><p className="mt-3 text-3xl font-bold tabular-nums">{value}<span className="ml-1 text-xs font-normal text-slate-500">개</span></p></Card>)}</div>
      <section aria-labelledby="zone-map-title" className="space-y-4">
        <div className="section-heading"><div><h2 id="zone-map-title">지도에서 권역 탐색</h2><p>마커와 목록을 선택해 구성 그룹 및 분석 결과를 살펴보세요.</p></div></div>
        <div className="flex flex-wrap items-center justify-between gap-3"><div role="group" aria-label="지도 표시 필터" className="flex flex-wrap gap-2">{([{ key: 'all', label: `전체 ${all.length}개` }, { key: 'final', label: `최종 예비 후보 ${state.data.candidates.length}개` }, { key: 'other', label: `나머지 평가 단위 ${all.length - state.data.candidates.length}개` }] as const).map((f) => <Button key={f.key} size="sm" variant={filter === f.key ? 'default' : 'outline'} aria-pressed={filter === f.key} onClick={() => setFilter(f.key)}>{f.label}</Button>)}</div><div className="relative w-full sm:w-72"><Search size={15} className="pointer-events-none absolute left-3 top-3 text-slate-500" /><input type="search" aria-label="권역 ID 또는 정류장명 검색" placeholder="권역 ID 또는 정류장명 검색" value={query} onChange={(e) => setQuery(e.target.value)} className="h-10 w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-xs outline-blue-500" /></div></div>
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500"><div className="flex flex-wrap gap-4"><span><span className="mr-1 text-blue-600">●</span>최종 예비 후보 (숫자: 검토 순서)</span><span><span className="mr-1 text-slate-500">●</span>나머지 평가 단위</span><span>진한 외곽선: 선택 권역</span></div><label className="flex cursor-pointer items-center gap-2"><input type="checkbox" checked={showMembers} onChange={(e) => setShowMembers(e.target.checked)} className="accent-emerald-700" />선택 권역의 그룹 대표점 표시 <span className="text-emerald-700">●</span></label></div>
        <p className="text-xs text-slate-500" role="status" data-testid="zone-results">{visible.length}개 표시{selected ? ` · 선택 ${selected.zoneId}` : ' · 검색 결과 없음'}{(filter !== 'all' || query) && <button className="ml-3 text-blue-600 underline underline-offset-4" onClick={reset}>필터·검색 초기화</button>}</p>
        {requested && !all.some((z) => z.zoneId === requested) && <p role="status" className="text-xs text-amber-700">요청한 권역 ID가 없어 첫 번째 표시 권역을 선택했습니다.</p>}
        <div className="grid items-stretch gap-5 xl:grid-cols-[minmax(0,1fr)_330px]">
          <Card className="min-w-0 overflow-hidden"><ErrorBoundary label="권역 지도를 표시하지 못했습니다"><Suspense fallback={<div className="flex h-[560px] items-center justify-center text-sm text-slate-500" role="status">지도를 준비하고 있습니다.</div>}><ZoneMap zones={visible} selectedId={selected?.zoneId ?? null} onSelect={onSelect} showMembers={showMembers} /></Suspense></ErrorBoundary><p className="border-t border-border px-4 py-3 text-xs leading-relaxed text-slate-500">권역 대표점과 녹색 그룹 대표점은 분석 위치입니다. 지도 기호의 크기는 서비스 반경을 의미하지 않습니다.</p></Card>
          <ZoneList zones={visible} selectedId={selected?.zoneId ?? null} onSelect={onSelect} />
        </div>
        <p className="text-xs leading-relaxed text-slate-500">필터는 표시 대상만 바꿉니다. 선택 권역이 필터·검색 결과에서 제외되면 첫 번째 표시 권역을 보여 줍니다. 전체 보기는 현재 표시된 권역에 지도를 맞춥니다.</p>
      </section>
      {selected && <><ZoneDetail zone={selected} /><ZoneComparison selected={selected} candidates={state.data.candidates} /></>}
    </>}
    <Card className="p-5 sm:p-6"><details><summary className="text-sm font-bold">공간 분석의 산식과 자료 출처</summary><div className="mt-3 space-y-3 text-xs leading-6 text-slate-500"><p><strong className="text-slate-700">Complete Linkage 500m</strong>는 구성 그룹 대표점 사이의 최대 거리 조건입니다. 실제 I-MOD 운행 반경, 도보·도로 주행거리, 행정구역 또는 법정 서비스 경계가 아닙니다. 반경 원이나 서비스 폴리곤을 만들지 않습니다.</p><p>권역 대표점은 STEP 6 구성 그룹 대표 위·경도의 평균으로 기록된 좌표이며, 서비스 중심지나 배차 지점이 아닙니다. Z01~Z26은 식별자입니다. 숫자 자체는 검토 순위가 아닙니다. 최종 6개는 도입 확정 지역이 아닌 예비 검토 후보입니다.</p><p>상대 격차는 권역의 90일·24시간 승차 비중과 운행 비중의 차이입니다. 각 비중은 해당 권역의 승차·운행 누적 총량을 각각 분모로 사용합니다. 양의 격차 합은 양수인 비중 차이의 합(0–1), 최대 시간의 격차는 %p로 구분합니다. 실제 공급 부족이나 미충족 수요를 직접 증명하지 않습니다.</p><p>월별 최소/최대 비율 = 월별 일평균 승차량 최솟값 ÷ 최댓값. CV = 해당 3개월 일평균의 표본 표준편차 ÷ 평균. 4월 30일·5월 31일·6월 29일 관측 기준이며, 6월 11일은 제외합니다.</p><details><summary className="font-medium text-slate-700">사용한 분석 파일과 좌표 출처</summary><div className="mt-3 space-y-2">{(['memberships', 'profiles', 'scores', 'candidates'] as const).map((key) => <p key={key} className="break-all"><a href={`${import.meta.env.BASE_URL}data/${DATA_SOURCES[key].file}`} download className="text-blue-600 underline underline-offset-4">{DATA_SOURCES[key].source}</a></p>)}<p>권역 좌표: 06_complete500_zone_profiles.csv의 lat·lon. 그룹 좌표: 05_complete500_assignments.csv의 representative_latitude·representative_longitude. 물리 정류장 좌표 컬럼과 혼용하지 않습니다.</p></div></details></div></details></Card>
  </div>
}
