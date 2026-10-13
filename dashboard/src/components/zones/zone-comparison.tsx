import { useState } from 'react'
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { SCENARIOS, type ScenarioKey, type Zone } from '@/types/zones'
import { formatNumber } from '@/lib/utils'

type ChartRow = { zoneId: string; label: string; value: number; selected: boolean }
function MetricChart({ rows, label, unit, digits, max }: { rows: ChartRow[]; label: string; unit: string; digits: number; max?: number }) {
  return <div className="mt-4 h-[280px] w-full" role="img" aria-label={`${label} 비교. 정확한 값은 아래 비교 수치 표에서 확인할 수 있습니다.`}><ResponsiveContainer width="100%" height="100%" minWidth={0}>
    <BarChart data={rows} layout="vertical" margin={{ top: 5, right: 16, left: 0, bottom: 5 }} barSize={18}>
      <CartesianGrid horizontal={false} stroke="#e2e8f0" strokeDasharray="3 3" />
      <XAxis type="number" domain={[0, max ?? 'auto']} tick={{ fontSize: 10, fill: '#64748b' }} tickLine={false} axisLine={false} tickFormatter={(v: number) => formatNumber(v, digits)} />
      <YAxis type="category" dataKey="label" width={85} tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
      <Tooltip contentStyle={{ borderRadius: 10, borderColor: '#e2e8f0', fontSize: 12 }} formatter={(v) => [`${formatNumber(Number(v), digits)}${unit}`, label]} />
      <Bar dataKey="value" radius={[0, 4, 4, 0]} isAnimationActive={false}>{rows.map((r) => <Cell key={r.zoneId} fill={r.selected ? '#1d4ed8' : '#bfdbfe'} />)}</Bar>
    </BarChart>
  </ResponsiveContainer></div>
}
export function ZoneComparison({ selected, candidates }: { selected: Zone; candidates: Zone[] }) {
  const [scenario, setScenario] = useState<ScenarioKey>('balanced')
  const zones = selected.reviewOrder !== null ? candidates : [...candidates, selected]
  const rows = (value: (z: Zone) => number) => zones.map((z) => ({ zoneId: z.zoneId, label: `${z.zoneId}${z.zoneId === selected.zoneId ? ' · 선택' : ''}`, value: value(z), selected: z.zoneId === selected.zoneId }))
  return <section aria-labelledby="zone-comparison-title" data-testid="zone-comparison" className="space-y-5">
    <div className="section-heading"><div><h2 id="zone-comparison-title">선택 권역과 최종 후보 비교</h2><p>최종 6개는 검토 순서대로 유지합니다. 나머지 권역을 선택하면 비교에 1개를 추가합니다.</p></div></div>
    <div className="grid gap-5 xl:grid-cols-2">
      <Card className="min-w-0 p-5"><h3 className="text-sm font-bold">일평균 승차량 <span className="font-normal text-slate-400">· 명/일</span></h3><MetricChart rows={rows((z) => z.dailyDemand)} label="일평균 승차량" unit="명/일" digits={1} /></Card>
      <Card className="min-w-0 p-5"><h3 className="text-sm font-bold">양의 상대 격차 합 <span className="font-normal text-slate-400">· 0–1</span></h3><MetricChart rows={rows((z) => z.positiveGapSum)} label="양의 상대 격차 합" unit="" digits={4} max={1} /><p className="text-[11px] leading-relaxed text-slate-400">권역의 시간별 승차·운행 비중 차이 중 양수만 합한 값입니다. 구성 그룹별 불일치의 중앙값과 구분합니다.</p></Card>
    </div>
    <Card className="min-w-0 p-5 sm:p-6"><div className="flex flex-wrap items-center justify-between gap-4"><h3 className="text-sm font-bold">시나리오별 상대 평가 점수 <span className="font-normal text-slate-400">· 0–100</span></h3><div className="flex flex-wrap gap-2" role="group" aria-label="비교 시나리오">{SCENARIOS.map(({ key, label }) => <Button key={key} size="sm" variant={key === scenario ? 'default' : 'outline'} aria-pressed={key === scenario} onClick={() => setScenario(key)}>{label}</Button>)}</div></div><MetricChart rows={rows((z) => z.scenarios[scenario].score)} label={`${SCENARIOS.find((s) => s.key === scenario)!.label} 점수`} unit="점" digits={2} max={100} /><p className="text-xs leading-relaxed text-slate-500">같은 시나리오의 기존 평가 점수를 비교합니다. 필터·검색·시나리오 선택은 점수와 최종 후보 순서를 바꾸지 않습니다.</p>
      <details className="mt-5 rounded-lg border border-slate-200"><summary className="p-3 text-xs font-medium text-slate-600">비교 수치 표 보기 · {zones.length}개 권역</summary><div className="overflow-x-auto"><table className="candidate-table" data-testid="zone-comparison-table"><caption className="sr-only">최종 후보와 선택 권역의 비교 값</caption><thead><tr><th>권역</th><th>일평균 (명/일)</th><th>양의 격차 합</th><th>선택 시나리오 점수</th><th>시나리오 순위</th></tr></thead><tbody>{zones.map((z) => <tr key={z.zoneId} className={z.zoneId === selected.zoneId ? 'is-selected' : ''}><td className="whitespace-nowrap font-medium">{z.zoneId}{z.zoneId === selected.zoneId && ' · 선택'}</td><td>{formatNumber(z.dailyDemand, 1)}</td><td>{z.positiveGapSum.toFixed(4)}</td><td>{z.scenarios[scenario].score.toFixed(2)}</td><td>{z.scenarios[scenario].rank}위</td></tr>)}</tbody></table></div></details>
    </Card>
  </section>
}
