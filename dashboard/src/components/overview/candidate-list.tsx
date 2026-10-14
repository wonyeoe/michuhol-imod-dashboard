import { ArrowUpRight, Check, Clock3 } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn, formatHour, formatNumber } from '@/lib/utils'
import type { Candidate } from '@/types/data'

export function CandidateList({ candidates, selectedId, onSelect }: { candidates: Candidate[]; selectedId: string | null; onSelect: (id: string) => void }) {
  return <Card className="flex h-full flex-col overflow-hidden">
    <div className="flex items-center justify-between border-b border-border px-5 py-5"><h2 className="text-sm font-bold">최종 예비 검토 후보</h2><span className="text-xs text-slate-500">검토 순서순</span></div>
    <ol className="flex flex-1 flex-col">
      {candidates.map((candidate) => <li key={candidate.zoneId} className="flex flex-1">
        <button onClick={() => onSelect(candidate.zoneId)} aria-pressed={selectedId === candidate.zoneId} aria-label={`${candidate.zoneId} ${candidate.names.join(', ')} 선택`} className={cn('candidate-item group', selectedId === candidate.zoneId && 'candidate-item-selected')} data-testid={`candidate-${candidate.zoneId}`}>
          <span className="candidate-rank">{String(candidate.reviewOrder).padStart(2, '0')}</span>
          <span className="min-w-0 flex-1">
            <span className="mb-1 flex items-center gap-2"><span className="text-xs font-semibold tracking-wide text-slate-500">{candidate.zoneId}</span><span className="text-xs text-slate-500">{candidate.members.length}개 그룹</span></span>
            <span className="line-clamp-2 block text-[12px] font-semibold leading-relaxed text-slate-700">{candidate.names.join(' · ')}</span>
            <span className="mt-1 block text-xs text-slate-500">일평균 <strong className="font-medium tabular-nums text-slate-600">{formatNumber(candidate.dailyDemand, 1)}</strong>명</span>
          </span>
          {selectedId === candidate.zoneId ? <Check size={15} className="mt-4 shrink-0 text-blue-600" /> : <ArrowUpRight size={15} className="mt-4 shrink-0 text-slate-300 group-hover:text-blue-500" />}
        </button>
      </li>)}
    </ol>
  </Card>
}

export function SelectionSummary({ candidate }: { candidate?: Candidate }) {
  if (!candidate) return <p className="text-sm text-slate-500">지도 또는 목록에서 후보를 선택해 주세요.</p>
  return <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between" aria-live="polite" data-testid="selection-summary">
    <div className="flex min-w-0 items-start gap-3"><Badge className="mt-0.5 shrink-0">{candidate.zoneId}</Badge><div><p className="text-sm font-semibold leading-relaxed">{candidate.names.join(' · ')}</p><p className="mt-1 text-xs text-slate-500">선택한 후보 · 정류장명 그룹 {candidate.members.length}개</p></div></div>
    <div className="flex shrink-0 items-center gap-2 text-xs text-slate-500"><Clock3 size={14} /><span>상대 격차 최대 <strong className="ml-1 text-slate-700">{formatHour(candidate.peakHour)}</strong></span></div>
  </div>
}
