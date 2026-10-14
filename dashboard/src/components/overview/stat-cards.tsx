import { CalendarDays, Layers3, MapPin, ScanLine, type LucideIcon } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { formatNumber } from '@/lib/utils'
import type { OverviewData } from '@/types/data'
export function StatCards({ summary }: { summary: OverviewData['summary'] }) {
  const stats: { label: string; value: number; unit: string; detail: string; icon: LucideIcon; accent?: boolean }[] = [
    { label: '분석 정류장명 그룹', value: summary.groupCount, unit: '개', detail: '정류장명 기준 분석 단위', icon: MapPin },
    { label: '유효 관측일', value: summary.observedDays, unit: '일', detail: '관측 자료가 없는 6월 11일 제외', icon: CalendarDays },
    { label: '공간 평가 단위', value: summary.zoneCount, unit: '개', detail: '가까운 그룹을 최대 거리 500m로 묶음', icon: Layers3 },
    { label: '최종 예비 검토 후보', value: summary.candidateCount, unit: '개', detail: '4개 시나리오의 선정 결과 종합', icon: ScanLine, accent: true },
  ]
  return <section aria-label="핵심 분석 통계" className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
    {stats.map(({ label, value, unit, detail, icon: Icon, accent }) => <Card key={label} className={`stat-card ${accent ? 'stat-card-accent' : ''}`}>
      <div className="flex items-center justify-between gap-2"><h2 className="text-xs font-medium text-slate-500 sm:text-[13px]">{label}</h2><Icon size={17} className={accent ? 'text-blue-500' : 'text-slate-500'} /></div>
      <p className="my-3 flex items-baseline gap-1.5"><strong className={`text-[34px] font-semibold leading-none tracking-tight tabular-nums sm:text-[38px] ${accent ? 'text-blue-600' : 'text-slate-800'}`}>{formatNumber(value)}</strong><span className="text-sm text-slate-500">{unit}</span></p>
      <p className="text-xs leading-relaxed text-slate-500 sm:text-xs">{detail}</p>
    </Card>)}
  </section>
}
