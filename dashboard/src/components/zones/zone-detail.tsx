import { Link } from 'react-router-dom'
import { ArrowUpRight } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { formatHour, formatNumber } from '@/lib/utils'
import { SCENARIOS, type Zone } from '@/types/zones'

export function ZoneDetail({ zone }: { zone: Zone }) {
  const final = zone.reviewOrder !== null
  const metrics = [
    ['구성 정류장명 그룹', `${zone.members.length}개`, '물리 정류장 수가 아닙니다'],
    ['일평균 승차량', `${formatNumber(zone.dailyDemand, 1)}명/일`, '90일 기준 · STEP 7'],
    ['상대 격차 최대 시간', formatHour(zone.peakHour), `해당 시간 격차 ${zone.peakGap.toFixed(2)}%p`],
    ['양의 상대 격차 합', zone.positiveGapSum.toFixed(4), '0–1 척도 · 권역 시간 분포 불일치'],
    ['월별 최소/최대 비율', zone.monthlyMinMaxRatio.toFixed(4), '월별 일평균 승차량 기준'],
    ['월별 변동계수 (CV)', zone.monthlyCv.toFixed(4), '월별 일평균의 표본 표준편차 ÷ 평균'],
  ]
  return <section aria-labelledby="zone-detail-title" className="space-y-5" data-testid="zone-detail" aria-live="polite">
    <Card className="p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4"><div><div className="mb-2 flex flex-wrap gap-2"><Badge>{zone.zoneId}</Badge><Badge className={final ? '' : 'bg-slate-100 text-slate-600'}>{final ? `최종 예비 검토 후보 · 검토 순서 ${zone.reviewOrder}` : '나머지 평가 단위'}</Badge></div><h2 id="zone-detail-title" className="text-lg font-bold leading-relaxed">{zone.names.join(' · ')}</h2></div><Button variant="outline" asChild><Link to={final ? `/temporal?zone=${zone.zoneId}` : '/temporal'}>{final ? '이 후보의 시간대별 분석' : '최종 6개 시간대별 분석'}<ArrowUpRight /></Link></Button></div>
      {final && <p className="mt-3 text-xs text-blue-700">시나리오 상위 6위 포함: {zone.top6Frequency}/4회</p>}
      {!final && <p className="mt-3 text-xs text-slate-500">STEP 7 평가 대상입니다. 최종 6개 예비 후보에 포함되지 않았으며, 별도의 최종 검토 순서를 표시하지 않습니다.</p>}
      <dl className="mt-6 grid gap-5 border-t border-slate-100 pt-5 sm:grid-cols-2 xl:grid-cols-3">{metrics.map(([label, value, note]) => <div key={label}><dt className="text-xs text-slate-500">{label}</dt><dd className="mt-2 text-xl font-bold tabular-nums text-slate-800">{value}</dd><dd className="mt-1 text-[11px] leading-relaxed text-slate-400">{note}</dd></div>)}</dl>
      <p className="mt-5 text-xs leading-relaxed text-slate-500">권역 대표 좌표: {zone.latitude.toFixed(6)}, {zone.longitude.toFixed(6)} · 구성 그룹 대표점 간 최대 거리: {formatNumber(zone.diameter, 1)}m (STEP 6 기록값)</p>
    </Card>
    <div className="grid gap-5 xl:grid-cols-2">
      <Card className="min-w-0 p-5 sm:p-6"><h3 className="text-sm font-bold">구성 정류장명 그룹</h3><p className="mt-2 text-xs leading-relaxed text-slate-500">STEP 6의 그룹 ID와 이름을 그대로 사용합니다. 그룹 하나가 물리 정류장 하나를 뜻하지 않습니다.</p><ul className="mt-4 divide-y divide-slate-100" data-testid="zone-members">{zone.members.map((m) => <li key={m.groupId} className="py-3"><div className="flex items-start gap-3"><span className="rounded bg-slate-100 px-2 py-1 text-[11px] font-semibold text-slate-600">{m.groupId}</span><div><p className="text-xs font-semibold leading-relaxed">{m.name}</p><p className="mt-1 text-[11px] text-slate-400">{m.coordinates ? `그룹 대표점 ${m.coordinates.latitude.toFixed(6)}, ${m.coordinates.longitude.toFixed(6)}` : '그룹 대표 좌표 없음 · 지도 표시 제외'}</p></div></div></li>)}</ul></Card>
      <Card className="min-w-0 p-5 sm:p-6"><h3 className="text-sm font-bold">STEP 7 시나리오 평가</h3><p className="mt-2 text-xs leading-relaxed text-slate-500">전체 26개 권역 내 상대 평가 · 점수와 순위는 기존 결과를 사용합니다.</p><div className="mt-4 overflow-x-auto"><table className="candidate-table" data-testid="zone-scenarios"><caption className="sr-only">선택 권역의 4개 시나리오 점수 및 순위</caption><thead><tr><th>시나리오</th><th>점수</th><th>순위</th><th>상위 6위</th></tr></thead><tbody>{SCENARIOS.map(({ key, label }) => <tr key={key}><td className="whitespace-nowrap font-medium">{label}</td><td>{zone.scenarios[key].score.toFixed(2)}</td><td>{zone.scenarios[key].rank}위</td><td>{zone.scenarios[key].top6 ? '포함' : '미포함'}</td></tr>)}</tbody></table></div><p className="mt-3 text-[11px] leading-relaxed text-slate-400">월별 최소/최대 비율은 안정성 평가 입력입니다. CV와 다른 지표이며, 점수는 실제 운영 효율이나 도입 효과를 뜻하지 않습니다.</p></Card>
    </div>
  </section>
}
