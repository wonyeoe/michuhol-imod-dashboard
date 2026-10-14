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
    ['승차·운행 시간 분포 차이', zone.positiveGapSum.toFixed(4), '0–1 척도 · 권역 시간 분포 불일치'],
    ['월별 최소/최대 비율', zone.monthlyMinMaxRatio.toFixed(4), '월별 일평균 승차량 기준'],
    ['월별 승차량 변동 정도', zone.monthlyCv.toFixed(4), '월별 일평균의 표본 표준편차 ÷ 평균'],
  ]
  return <section aria-labelledby="zone-detail-title" className="space-y-5" data-testid="zone-detail" aria-live="polite">
    <Card className="p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4"><div><div className="mb-2 flex flex-wrap gap-2"><Badge>{zone.zoneId}</Badge><Badge className={final ? '' : 'bg-slate-100 text-slate-600'}>{final ? `최종 예비 검토 후보 · 검토 순서 ${zone.reviewOrder}` : '나머지 평가 단위'}</Badge></div><h2 id="zone-detail-title" className="text-lg font-bold leading-relaxed">{zone.names.join(' · ')}</h2></div><Button variant="outline" asChild><Link to={final ? `/temporal?zone=${zone.zoneId}` : '/temporal'}>{final ? '이 후보의 시간대별 분석' : '최종 6개 시간대별 분석'}<ArrowUpRight /></Link></Button></div>
      {final && <p className="mt-3 text-xs text-blue-700">시나리오 상위 6위 포함: {zone.top6Frequency}/4회</p>}
      {!final && <p className="mt-3 text-xs text-slate-500">STEP 7 평가 대상입니다. 최종 6개 예비 후보에 포함되지 않았으며, 별도의 최종 검토 순서를 표시하지 않습니다.</p>}
      <p className="chart-reading">{zone.zoneId}은 {zone.members.length}개 정류장명 그룹으로 구성되며 하루 평균 {formatNumber(zone.dailyDemand, 1)}명이 승차했습니다. {formatHour(zone.peakHour)}에 승차 비중이 운행 비중보다 {zone.peakGap.toFixed(2)}%p 높아 양의 차이가 가장 컸습니다.</p>
      <details className="mt-4 metric-help"><summary>시간 분포 차이와 월별 변동은 어떻게 읽나요?</summary><div><p>시간 분포 차이(positive_gap_sum)는 24시간의 승차 비중 − 운행 비중 중 양수만 합한 값입니다. 0–1 척도를 유지하며 값이 클수록 두 시간 분포가 다릅니다. 실제 공급 부족의 크기는 아닙니다.</p><p>이 권역의 월별 최소/최대 비율은 {zone.monthlyMinMaxRatio.toFixed(4)}입니다. 가장 적은 달의 일평균 승차량이 가장 많은 달의 {(zone.monthlyMinMaxRatio * 100).toFixed(1)}%라는 뜻입니다. 1에 가까울수록 세 달의 규모가 비슷합니다.</p><p>월별 승차량 변동 정도(monthly_cv)는 3개월 일평균 승차량의 표본 표준편차 ÷ 평균입니다. 이 권역은 {zone.monthlyCv.toFixed(4)}이며, 작을수록 관측 기간의 변동이 작습니다. 향후 안정성을 보장하지 않습니다.</p></div></details>
      <dl className="mt-6 grid gap-5 border-t border-slate-100 pt-5 sm:grid-cols-2 xl:grid-cols-3">{metrics.map(([label, value, note]) => <div key={label}><dt className="text-xs text-slate-500">{label}</dt><dd className="mt-2 text-xl font-bold tabular-nums text-slate-800">{value}</dd><dd className="mt-1 text-xs leading-relaxed text-slate-500">{note}</dd></div>)}</dl>
      <p className="mt-5 text-xs leading-relaxed text-slate-500">권역 대표 좌표: {zone.latitude.toFixed(6)}, {zone.longitude.toFixed(6)} · 구성 그룹 대표점 간 최대 거리: {formatNumber(zone.diameter, 1)}m (STEP 6 기록값)</p>
    </Card>
    <div className="grid gap-5 xl:grid-cols-2">
      <Card className="min-w-0 p-5 sm:p-6"><h3 className="text-sm font-bold">구성 정류장명 그룹</h3><p className="mt-2 text-xs leading-relaxed text-slate-500">STEP 6의 그룹 ID와 이름을 그대로 사용합니다. 그룹 하나가 물리 정류장 하나를 뜻하지 않습니다.</p><ul className="mt-4 divide-y divide-slate-100" data-testid="zone-members">{zone.members.map((m) => <li key={m.groupId} className="py-3"><div className="flex items-start gap-3"><span className="rounded bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-600">{m.groupId}</span><div><p className="text-xs font-semibold leading-relaxed">{m.name}</p><p className="mt-1 text-xs text-slate-500">{m.coordinates ? `그룹 대표점 ${m.coordinates.latitude.toFixed(6)}, ${m.coordinates.longitude.toFixed(6)}` : '그룹 대표 좌표 없음 · 지도 표시 제외'}</p></div></div></li>)}</ul></Card>
      <Card className="min-w-0 p-5 sm:p-6"><h3 className="text-sm font-bold">STEP 7 시나리오 평가</h3><p className="mt-2 text-xs leading-relaxed text-slate-500">평가 기준의 중요도를 바꾼 4가지 비교입니다. 전체 26개 중 점수는 클수록, 순위 숫자는 작을수록 높게 평가되었습니다. 최종 검토 순서와는 다릅니다.</p><div className="mt-4 overflow-x-auto"><table className="candidate-table" data-testid="zone-scenarios"><caption className="sr-only">선택 권역의 4개 시나리오 점수 및 순위</caption><thead><tr><th>시나리오</th><th>점수</th><th>순위</th><th>상위 6위</th></tr></thead><tbody>{SCENARIOS.map(({ key, label }) => <tr key={key}><td className="whitespace-nowrap font-medium">{label}</td><td>{zone.scenarios[key].score.toFixed(2)}</td><td>{zone.scenarios[key].rank}위</td><td>{zone.scenarios[key].top6 ? '포함' : '미포함'}</td></tr>)}</tbody></table></div><p className="mt-3 text-xs leading-relaxed text-slate-500">월별 최소/최대 비율은 안정성 평가 입력입니다. CV와 다른 지표이며, 점수는 실제 운영 효율이나 도입 효과를 뜻하지 않습니다.</p></Card>
    </div>
  </section>
}
