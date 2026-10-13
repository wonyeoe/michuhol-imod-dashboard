import { useEffect, useRef } from 'react'
import { Card } from '@/components/ui/card'
import { cn, formatNumber } from '@/lib/utils'
import type { Zone } from '@/types/zones'

export function ZoneList({ zones, selectedId, onSelect }: { zones: Zone[]; selectedId: string | null; onSelect: (id: string) => void }) {
  const list = useRef<HTMLUListElement>(null)
  useEffect(() => {
    const container = list.current
    const button = container?.querySelector<HTMLButtonElement>('[aria-pressed="true"]')
    if (container && button) {
      const top = button.offsetTop, bottom = top + button.offsetHeight
      if (top < container.scrollTop) container.scrollTop = top
      else if (bottom > container.scrollTop + container.clientHeight) container.scrollTop = bottom - container.clientHeight
    }
  }, [selectedId])
  return <Card className="flex min-w-0 flex-col overflow-hidden">
    <div className="border-b border-border px-5 py-4"><div className="flex justify-between"><h2 className="text-sm font-bold">권역 목록</h2><span className="text-xs text-slate-400">{zones.length}개 표시</span></div><p className="mt-2 text-[11px] text-slate-400">최종 후보는 검토 순서순 · 나머지는 ID순</p></div>
    <ul ref={list} aria-label="표시된 권역 목록" className="relative max-h-[400px] flex-1 overflow-y-auto xl:max-h-[520px]">{zones.map((z) => <li key={z.zoneId}><button data-testid={`zone-list-${z.zoneId}`} aria-pressed={selectedId === z.zoneId} onClick={() => onSelect(z.zoneId)} className={cn('candidate-item', selectedId === z.zoneId && 'candidate-item-selected')}>
      <span className={cn('mt-1 rounded-md px-2 py-1 text-[11px] font-semibold', z.reviewOrder !== null ? 'bg-blue-50 text-blue-700' : 'bg-slate-100 text-slate-600')}>{z.zoneId}</span><span className="min-w-0 flex-1"><span className="block text-[11px] text-slate-400">{z.reviewOrder !== null ? `최종 예비 후보 · 검토 ${z.reviewOrder}` : '나머지 평가 단위'}</span><span className="mt-1 block text-xs font-semibold leading-relaxed text-slate-700">{z.names.join(' · ')}</span><span className="mt-2 block text-[11px] text-slate-500">일평균 {formatNumber(z.dailyDemand, 1)}명 · {z.members.length}개 그룹</span></span>
    </button></li>)}</ul>
    {!zones.length && <p className="p-6 text-sm text-slate-500">검색 결과가 없습니다.</p>}
  </Card>
}
