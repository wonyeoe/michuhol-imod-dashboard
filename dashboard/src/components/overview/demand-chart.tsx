import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { formatNumber } from '@/lib/utils'
import type { Candidate } from '@/types/data'

export default function DemandChart({ candidates, selectedId }: { candidates: Candidate[]; selectedId: string | null }) {
  return <div className="h-[265px] w-full" role="img" aria-label="최종 후보별 일평균 승차량 비교. 정확한 수치는 옆 비교표에서 확인할 수 있습니다.">
    <ResponsiveContainer width="100%" height="100%" minWidth={0}>
      <BarChart data={candidates} layout="vertical" margin={{ top: 4, right: 14, left: -15, bottom: 4 }} barSize={13} accessibilityLayer>
        <CartesianGrid horizontal={false} stroke="#edf1f5" strokeDasharray="3 3" />
        <XAxis type="number" tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} axisLine={false} tickFormatter={(value: number) => `${value / 1000}천`} domain={[0, 'auto']} />
        <YAxis type="category" dataKey="zoneId" width={53} axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} />
        <Tooltip cursor={{ fill: '#f1f5f9' }} formatter={(value) => [`${formatNumber(Number(value), 1)}명`, '일평균 승차량']} contentStyle={{ borderRadius: 10, border: '1px solid #e2e8f0', fontSize: 12 }} />
        <Bar dataKey="dailyDemand" radius={[0, 4, 4, 0]} isAnimationActive={false}>{candidates.map((candidate) => <Cell key={candidate.zoneId} fill={candidate.zoneId === selectedId ? '#2563eb' : '#b5cef9'} />)}</Bar>
      </BarChart>
    </ResponsiveContainer>
  </div>
}
