import { Bar, BarChart, CartesianGrid, Cell, Legend, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Card } from '@/components/ui/card'
import type { TemporalZone } from '@/data/temporal'

const hourLabel = (hour: number) => `${String(hour).padStart(2, '0')}시`
const axis = { fontSize: 11, fill: '#64748b' }
const tooltipStyle = { borderRadius: 10, borderColor: '#e2e8f0', fontSize: 12 }
export function TemporalCharts({ zone }: { zone: TemporalZone }) {
  const { hours, peak, months } = zone
  return <>
    <Card className="min-w-0 p-4 sm:p-6" data-testid="hourly-chart">
      <h2 className="text-base font-bold">시간대별 승차·운행 비중 비교</h2>
      <p className="mt-2 text-xs leading-relaxed text-slate-500">{zone.candidate.zoneId} · 90일 누적 분포 · 각 비중의 24시간 합계 100%</p>
      <div className="mt-5 h-[300px] w-full" aria-label="24시간 승차·운행 비중 꺾은선그래프">
        <ResponsiveContainer width="100%" height="100%" minWidth={0}>
          <LineChart data={hours} margin={{ top: 15, right: 12, bottom: 0, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
            <XAxis dataKey="hour" tickFormatter={hourLabel} ticks={[0, 3, 6, 9, 12, 15, 18, 21, 23]} tick={axis} minTickGap={15} axisLine={false} tickLine={false} />
            <YAxis tickFormatter={(v: number) => `${v}%`} tick={axis} width={44} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={tooltipStyle} labelFormatter={(v) => hourLabel(Number(v))} formatter={(v, name) => [`${Number(v).toFixed(3)}%`, name]} />
            <Legend wrapperStyle={{ fontSize: 12, paddingTop: 14 }} />
            <ReferenceLine x={peak.hour} stroke="#93c5fd" strokeDasharray="4 4" />
            <Line dataKey="demand" name="승차 비중" stroke="#2563eb" strokeWidth={2.5} dot={false} activeDot={{ r: 5 }} connectNulls={false} isAnimationActive={false} />
            <Line dataKey="supply" name="운행 비중" stroke="#94a3b8" strokeWidth={2.5} strokeDasharray="5 3" dot={false} connectNulls={false} isAnimationActive={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Card>
    <Card className="min-w-0 p-4 sm:p-6" data-testid="gap-chart">
      <div className="flex flex-wrap items-start justify-between gap-3"><div><h2 className="text-base font-bold">시간대별 승차·운행 비중 차이</h2><p className="mt-2 text-xs text-slate-500">승차 비중 − 운행 비중 · 단위 %p</p></div><span className="rounded-md bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-700">최대 {hourLabel(peak.hour)} · +{peak.gap.toFixed(2)}%p</span></div>
      <div className="mt-5 h-[270px] w-full" aria-label="24시간 상대 격차 막대그래프">
        <ResponsiveContainer width="100%" height="100%" minWidth={0}>
          <BarChart data={hours} margin={{ top: 10, right: 12, bottom: 0, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
            <XAxis dataKey="hour" tickFormatter={hourLabel} ticks={[0, 3, 6, 9, 12, 15, 18, 21, 23]} minTickGap={15} tick={axis} axisLine={false} tickLine={false} />
            <YAxis tick={axis} width={44} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={tooltipStyle} labelFormatter={(v) => hourLabel(Number(v))} formatter={(v) => [`${Number(v).toFixed(3)}%p`, '상대 격차']} />
            <ReferenceLine y={0} stroke="#64748b" />
            <Bar dataKey="gap" name="상대 격차" maxBarSize={30} isAnimationActive={false}>{hours.map((r) => <Cell key={r.hour} fill={r.hour === peak.hour ? '#1e40af' : r.gap >= 0 ? '#60a5fa' : '#d97706'} />)}</Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-3 flex flex-wrap justify-center gap-5 text-xs text-slate-500"><span>🔵 양수: 승차 비중이 큼</span><span className="text-amber-700">● 음수: 운행 비중이 큼</span><span className="text-blue-800">■ 최대 상대 격차</span></div>
    </Card>
    <Card className="min-w-0 p-4 sm:p-6" data-testid="monthly-chart">
      <h2 className="text-base font-bold">월별 패턴 비교</h2><p className="mt-2 text-xs leading-relaxed text-slate-500">월별 일평균 승차량 · 월마다 다른 관측일 수를 반영합니다.</p>
      <div className="mt-5 h-[240px] w-full" aria-label="월별 일평균 승차량 막대그래프">
        <ResponsiveContainer width="100%" height="100%" minWidth={0}>
          <BarChart data={months} margin={{ top: 10, right: 12, bottom: 0, left: 5 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
            <XAxis dataKey="month" tickFormatter={(v) => `${v}월`} tick={axis} axisLine={false} tickLine={false} />
            <YAxis tick={axis} tickFormatter={(v: number) => v.toLocaleString('ko-KR')} width={55} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={tooltipStyle} labelFormatter={(v) => `${v}월`} formatter={(v) => [`${Number(v).toLocaleString('ko-KR', { maximumFractionDigits: 1 })}명/일`, '일평균 승차량']} />
            <Bar dataKey="dailyRiders" name="일평균 승차량" fill="#60a5fa" radius={[5, 5, 0, 0]} maxBarSize={72} isAnimationActive={false} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-5 overflow-x-auto"><table className="w-full text-left text-xs"><caption className="sr-only">월별 관측일과 일평균 승차·운행</caption><thead className="border-y border-slate-100 bg-slate-50 text-slate-500"><tr>{['월', '관측일', '승차 (명/일)', '운행 (건/일)'].map((t) => <th key={t} className="whitespace-nowrap p-3 font-medium">{t}</th>)}</tr></thead><tbody>{months.map((m) => <tr key={m.month} className="border-b border-slate-100"><th className="p-3 font-medium">{m.month}월</th><td className="p-3">{m.days}일</td><td className="p-3">{m.dailyRiders.toLocaleString('ko-KR', { maximumFractionDigits: 1 })}</td><td className="p-3">{m.dailyOperations.toLocaleString('ko-KR', { maximumFractionDigits: 1 })}</td></tr>)}</tbody></table></div>
      <p className="mt-4 text-xs leading-relaxed text-slate-500">{months.reduce((a, b) => b.dailyRiders > a.dailyRiders ? b : a).month}월의 일평균 승차량이 가장 높습니다. 6월은 11일을 제외한 29일 기준입니다. 월별 24시간 비중은 이 자료에 포함되지 않습니다.</p>
    </Card>
  </>
}
