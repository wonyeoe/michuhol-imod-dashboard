import { useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { PROCESS, STEP4_INDICATORS, STEP4_WEIGHTS, STEP7_WEIGHTS } from '@/data/analysis-methodology'
import type { AnalysisData } from '@/data/analysis'
import { formatNumber } from '@/lib/utils'

export function AnalysisSection({ step, title, description, children }: { step: string; title: string; description: string; children: ReactNode }) {
  return <section className="space-y-4"><div><p className="mb-2 text-xs font-bold tracking-widest text-blue-600">{step}</p><h2 className="text-lg font-bold text-slate-800">{title}</h2><p className="mt-2 text-xs leading-relaxed text-slate-500">{description}</p></div>{children}</section>
}
export function AnalysisProcess({ data }: { data: AnalysisData }) {
  const [active, setActive] = useState(1)
  const s = data.summary
  const results = [`확장 특징 ${s.groups}개 그룹 · 관측 ${s.days}일`, '변수·전처리·알고리즘 후보 비교 → STEP 3 해석 모델', `K-means ${data.clusters.map((c) => c.count).join('/')}개 그룹 · GMM 대안 비교`, `${data.eligibility.length}개 수요 기준 × ${Object.keys(STEP4_WEIGHTS).length}개 가중치 = 12개 시나리오`, `기준 40개 풀·500m: ${data.spatial[0].units}개 탐색 단위`, `${s.pool}개 그룹 → ${s.units}개 권역 (${s.multi}개 다중·${s.single}개 단일)`, `${s.units}개 권역 → ${s.candidates}개 예비 검토 후보`]
  const purposes = ['비교할 분석 자료 만들기', '분류 방법 비교하기', '비슷한 수요·공급 특성 분류', '평가 조건별 후보 비교', '가까운 후보의 분포 탐색', '가까운 그룹을 권역으로 묶기', '여러 평가를 종합해 후보 선정']
  const current = PROCESS[active - 1]
  return <AnalysisSection step="ANALYSIS JOURNEY" title="유형을 이해하고, 공간을 묶고, 검토 대상을 좁히다" description="단계를 선택하면 목적·방법·결과·다음 단계와의 연결을 확인할 수 있습니다.">
    <ol className="grid gap-2 sm:grid-cols-2 xl:grid-cols-7" aria-label="STEP 1부터 7까지 분석 과정">{PROCESS.map((p) => <li key={p.step}><button aria-pressed={active === p.step} onClick={() => setActive(p.step)} className={`h-full w-full rounded-xl border p-4 text-left ${active === p.step ? 'border-blue-500 bg-blue-50 text-blue-800' : 'border-slate-200 bg-white text-slate-600'}`}><span className="text-xs font-bold">STEP {p.step}{p.step < 7 && <span className="ml-2 text-slate-300">→</span>}</span><span className="mt-2 block text-xs leading-relaxed">{purposes[p.step - 1]}</span><span className="mt-2 block text-xs font-normal text-slate-500">{p.title}</span></button></li>)}</ol>
    <Card className="p-5 sm:p-6" data-testid="analysis-process-detail"><h3 className="font-semibold">STEP {active} · {purposes[active - 1]}</h3><p className="mt-2 text-sm text-slate-500">{current.title}</p><dl className="mt-4 grid gap-4 text-xs leading-6 md:grid-cols-2">{[['목적', current.purpose], ['방법', current.method], ['실제 결과', results[active - 1]], ['다음 단계', current.connection]].map(([label, text]) => <div key={label}><dt className="font-semibold text-blue-700">{label}</dt><dd className="mt-1 text-slate-600">{text}</dd></div>)}</dl><p className="mt-4 rounded-lg bg-slate-50 p-3 text-xs leading-6 text-slate-500">해석 유의: {current.limit}</p><p className="mt-3 break-all text-xs leading-relaxed text-slate-500">근거: {current.source.join(' · ')} · COLAB code/</p></Card>
  </AnalysisSection>
}
const WEIGHT_LABELS: Record<string, string> = { base: '기본형', balanced: '균형형', demand_priority: '수요 우선형', time_priority: '시간 우선형', robustness_priority: '강건성 우선형' }
export function WeightTable({ stage }: { stage: 4 | 7 }) {
  const weights: Record<string, Record<string, number>> = stage === 4 ? STEP4_WEIGHTS : STEP7_WEIGHTS
  const columns = stage === 4 ? [['demand', '수요'], ['mismatch', '시간 불일치'], ['low_supply', '저공급'], ['intensity', '운행당 승객']] : [['demand', '수요'], ['mismatch', '양의 격차 합'], ['low_supply', '저공급 중앙값'], ['repeat', '반복 선정'], ['month_stable', '월별 안정성']]
  return <div className="overflow-x-auto"><table className="candidate-table" data-testid={`step${stage}-weights`}><caption className="sr-only">STEP {stage} Notebook의 가중치 비율</caption><thead><tr><th>가중치 시나리오</th>{columns.map(([key, label]) => <th key={key}>{label}</th>)}</tr></thead><tbody>{Object.entries(weights).map(([key, values]) => <tr key={key}><th scope="row">{WEIGHT_LABELS[key]}<small className="mt-1 block font-normal text-slate-500">{key}</small></th>{columns.map(([c]) => <td key={c}>{Math.round(values[c] * 100)}%</td>)}</tr>)}</tbody></table></div>
}
export function ScreeningMethod({ data }: { data: AnalysisData }) {
  const cutLabels = ['전체', '하위 25% 경계 이상', '중앙값 이상 (기본 기준)']
  return <AnalysisSection step="STEP 4 · GROUP SCREENING" title="하나의 가중치에만 기대지 않는 검토" description="정류장명 그룹 단위의 12개 조건을 비교합니다. STEP 7의 권역 단위 4개 시나리오와 별개의 과정입니다.">
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{STEP4_INDICATORS.map((i) => <Card key={i.key} className="p-4"><h3 className="text-sm font-bold">{i.label}</h3><p className="mt-2 text-xs leading-6 text-slate-500">{i.description}</p><p className="mt-3 text-xs text-blue-600">값이 클수록 검토 점수 상승 ↑</p><code className="mt-2 block break-all text-xs text-slate-500">{i.column}</code></Card>)}</div>
    <Card className="overflow-hidden"><div className="p-5"><h3 className="text-sm font-bold">서로 다른 단위를 경험적 백분위로 맞추기</h3><p className="mt-2 text-xs leading-6 text-slate-500">전체 286개 그룹 안에서 평균 동률 순위 ÷ 그룹 수 × 100으로 변환했습니다. 0–100 척도의 백분위에 아래 가중치를 적용한 기존 분석입니다. 군집 레이블은 점수에 가산하지 않았으며, 노선 수는 기본 점수에서 제외했습니다.</p></div><WeightTable stage={4} /><div className="grid gap-3 p-5 sm:grid-cols-3">{data.eligibility.map((e, i) => <div key={e.key} className="rounded-lg bg-slate-50 p-4"><p className="text-xs font-semibold">{cutLabels[i]}</p><p className="mt-2 text-lg font-bold">{e.count}개 그룹</p><p className="mt-1 text-xs text-slate-500">{i === 0 ? '전체 관측 그룹 유지' : `일평균 승차량 ≥ ${formatNumber(e.cutoff, 6)}명`}</p></div>)}</div><p className="px-5 pb-5 text-xs leading-6 text-slate-500">3개 수요 기준 × 4개 가중치 = 12개 시나리오. 각 조건의 상위 20개 교집합과 순위 변화를 검토했습니다. 이 점수는 현장 검증 대상 탐색용이며 미충족 수요를 측정하지 않습니다.</p></Card>
  </AnalysisSection>
}
export function SpatialMethod({ data }: { data: AnalysisData }) {
  const s = data.summary
  return <AnalysisSection step="STEP 5 → STEP 6 · SPATIAL REVIEW" title="인접성 탐색에서 최종 공간 평가 단위로" description="위치가 확인되고 기본 수요 기준을 통과한 그룹을 기본 순위로 정렬한 40개 풀을 사용했습니다.">
    <div className="grid gap-5 xl:grid-cols-2"><Card className="p-5 sm:p-6"><p className="text-xs font-semibold text-slate-500">STEP 5 · DBSCAN 탐색</p><h3 className="mt-2 text-base font-bold">인접한 그룹을 연결해 보기</h3><p className="mt-3 text-xs leading-6 text-slate-500">후보 풀 20/40/60개와 eps 300/500/800m를 비교했습니다. Haversine 거리·min_samples=1을 적용했고 기준 40개·500m에서 {data.spatial[0].units}개 탐색 단위가 나왔습니다.</p><p className="mt-3 rounded-lg bg-amber-50 p-3 text-xs leading-6 text-amber-800">중간 지점이 연결되면 양 끝 거리는 500m를 넘을 수 있습니다. 같은 40개를 비교한 STEP 6 기록에서 최대 지름은 {formatNumber(data.spatial[0].diameter, 1)}m입니다. 이 {data.spatial[0].units}개는 최종 권역이 아닙니다.</p></Card>
    <Card className="border-blue-100 p-5 sm:p-6"><p className="text-xs font-semibold text-blue-600">STEP 6 · Complete Linkage 500m</p><h3 className="mt-2 text-base font-bold">그룹 간 최대 거리를 제한하기</h3><div className="my-5 flex items-center justify-around gap-3 rounded-lg bg-blue-50 p-4 text-center"><div><strong className="text-3xl text-blue-700">{s.pool}</strong><p className="mt-1 text-xs text-slate-500">정류장명 그룹</p></div><ArrowRight className="shrink-0 text-blue-400" /><div><strong className="text-3xl text-blue-700">{s.units}</strong><p className="mt-1 text-xs text-slate-500">최종 공간 평가 단위</p></div></div><p className="text-sm font-semibold">다중 그룹 권역 {s.multi}개 · 단일 그룹 권역 {s.single}개</p><p className="mt-2 text-xs leading-6 text-slate-500">500m는 구성 그룹 대표점 간 최대 거리 조건입니다. 도보권·서비스 반경·실제 운행 경계가 아닙니다.</p><Button className="mt-4" asChild><Link to="/zones">26개 권역 탐색<ArrowRight /></Link></Button></Card></div>
    <Card className="overflow-x-auto"><table className="candidate-table" data-testid="analysis-spatial"><caption className="px-5 py-3 text-left text-xs text-slate-500">STEP 6 동일 40개 풀·500m 방법 비교 (기존 CSV)</caption><thead><tr><th>방법</th><th>공간 단위</th><th>다중 그룹</th><th>단일 그룹</th></tr></thead><tbody>{data.spatial.map((r) => <tr key={r.method}><td>{r.method === 'Complete' ? 'Complete Linkage · 최종' : 'DBSCAN · 탐색'}</td><td>{r.units}</td><td>{r.multi}</td><td>{r.single}</td></tr>)}</tbody></table></Card>
  </AnalysisSection>
}
