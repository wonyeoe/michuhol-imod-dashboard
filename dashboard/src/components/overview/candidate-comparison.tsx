import { lazy, Suspense } from 'react'
import { ChartNoAxesCombined, Info } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ErrorBoundary } from '@/components/error-boundary'
import { cn, formatHour, formatNumber } from '@/lib/utils'
import type { Candidate } from '@/types/data'

const DemandChart = lazy(() => import('./demand-chart'))
export function CandidateComparison({ candidates, selectedId, onSelect }: { candidates: Candidate[]; selectedId: string | null; onSelect: (id: string) => void }) {
  return <section aria-labelledby="comparison-title">
    <div className="section-heading"><div><h2 id="comparison-title">최종 후보 비교</h2><p>수요 규모와 여러 시나리오에서의 반복 선정 결과를 함께 살펴보세요.</p></div><Badge className="bg-slate-100 text-slate-500">STEP 7 분석 결과</Badge></div>
    <div className="grid gap-5 2xl:grid-cols-[minmax(0,1fr)_285px]">
      <Card className="min-w-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="candidate-table">
            <caption className="sr-only">최종 예비 검토 후보 6개 비교. 권역 ID 버튼을 누르면 지도 및 후보 목록과 연동됩니다.</caption>
            <thead><tr><th scope="col" className="w-16">검토 순서</th><th scope="col">권역</th><th scope="col">구성 정류장명 그룹</th><th scope="col" className="text-right!">일평균 승차량</th><th scope="col">상위 6위 포함</th><th scope="col">상대 격차 최대 시간</th></tr></thead>
            <tbody>{candidates.map((candidate) => <tr key={candidate.zoneId} className={cn(selectedId === candidate.zoneId && 'is-selected')} data-testid={`row-${candidate.zoneId}`}>
              <td><span className={cn('table-rank', selectedId === candidate.zoneId && 'bg-blue-600! text-white!')}>{candidate.reviewOrder}</span></td>
              <td><button className="rounded-md px-1 py-2 font-semibold text-blue-600 hover:bg-blue-100 focus-visible:outline-2 focus-visible:outline-blue-500" onClick={() => onSelect(candidate.zoneId)} aria-pressed={selectedId === candidate.zoneId} aria-label={`지도에서 ${candidate.zoneId} 선택`}>{candidate.zoneId}</button></td>
              <td className="min-w-[185px] max-w-[300px]">{candidate.names.map((name) => <span key={name} className="block text-xs leading-6 text-slate-600">{name}</span>)}</td>
              <td className="whitespace-nowrap text-right"><span className="font-semibold tabular-nums text-slate-700">{formatNumber(candidate.dailyDemand, 1)}</span><span className="ml-1 text-[11px] text-slate-400">명</span></td>
              <td><span className="inline-flex items-center gap-2 whitespace-nowrap"><span className="flex gap-[3px]" aria-hidden="true">{[1, 2, 3, 4].map((i) => <span key={i} className={cn('h-3 w-[5px] rounded-sm', i <= candidate.top6Frequency ? 'bg-blue-500' : 'bg-slate-200')} />)}</span><span className="text-xs tabular-nums text-slate-500">{candidate.top6Frequency}/4회</span></span></td>
              <td><Badge className="bg-slate-100 font-normal tabular-nums text-slate-600">{formatHour(candidate.peakHour)}</Badge></td>
            </tr>)}</tbody>
          </table>
        </div>
        <div className="flex items-start gap-2 border-t border-border bg-slate-50/70 px-5 py-3.5 text-[11px] leading-relaxed text-slate-500"><Info className="mt-0.5 shrink-0" size={13} /><p>상대 격차 최대 시간은 <strong className="font-medium">승차 비중과 운행 비중의 차이가 가장 큰 시간</strong>입니다. 승차량 자체가 가장 많은 시간과 다를 수 있습니다.</p></div>
      </Card>
      <Card className="p-5 2xl:pb-3"><h3 className="flex items-center gap-2 text-sm font-semibold"><ChartNoAxesCombined size={16} className="text-slate-400" />수요 규모 비교</h3><p className="mb-4 mt-1 text-[11px] text-slate-400">일평균 승차량 · 명 · 검토 순서순</p><ErrorBoundary label="수요 비교 차트를 표시하지 못했습니다"><Suspense fallback={<div className="h-[265px] animate-pulse rounded-lg bg-slate-50" role="status" aria-label="차트 불러오는 중" />}><DemandChart candidates={candidates} selectedId={selectedId} /></Suspense></ErrorBoundary><p className="mt-2 text-[11px] leading-relaxed text-slate-400">승차량은 후보 검토의 한 지표입니다.<br />최종 검토 순서는 수요 규모순과 다릅니다.</p></Card>
    </div>
  </section>
}
