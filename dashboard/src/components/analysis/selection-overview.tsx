import { Link } from 'react-router-dom'
import { Card } from '@/components/ui/card'
import type { AnalysisData } from '@/data/analysis'

export function SelectionOverview({ data }: { data: AnalysisData }) {
  const s = data.summary
  const steps = [
    [s.groups, '정류장명 그룹', '수요·운행·시간적 특성을 분석한 기본 단위'],
    [s.pool, '공간 검토 대상 그룹', '기존 후보 선별 분석을 거쳐 공간 검토에 사용한 그룹'],
    [s.units, '공간 평가 권역', '가까운 그룹을 묶어 만든 평가 권역'],
    [s.candidates, '최종 예비 후보', '여러 평가 방식의 결과를 종합한 검토 대상'],
  ] as const
  return <>
    <section className="result-summary" data-testid="analysis-summary" aria-label="분석 흐름">
      <h2>그룹의 특성을 분석하고, 공간을 묶어 검토 대상을 좁혔습니다</h2>
      <ol className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {steps.map(([count, label, note], i) => <li key={label} className="rounded-lg bg-white p-4">
          <div className="flex items-center justify-between"><strong className="text-3xl text-blue-700">{count}개</strong>{i < 3 && <span aria-hidden="true" className="text-xl text-blue-500">→</span>}</div>
          <h3 className="mt-3 text-sm font-semibold">{label}</h3><p className="text-xs!">{note}</p>
        </li>)}
      </ol>
      <p className="text-xs!">단순 승차량 순위나 한 번의 필터링 결과가 아닙니다. 그룹 단위 분석과 공간 권역 평가를 거쳤습니다.</p>
    </section>
    <Card className="p-5 sm:p-6" data-testid="selection-rules">
      <h2 className="text-lg font-bold">여러 평가에서 반복해서 상위권에 드는 곳을 먼저 검토합니다</h2>
      <ol className="mt-5 grid gap-4 md:grid-cols-3">
        {[
          ['1', '상위 6위에 자주 포함된 순', '4개 평가 방식의 상위 6위 포함 횟수가 많은 곳을 먼저 봅니다.'],
          ['2', '같은 횟수라면 순위 중앙값 순', '4개 순위 중 가운데 두 값의 평균이 작은 곳을 먼저 봅니다.'],
          ['3', '두 값도 같다면 균형형 점수 순', 'balanced 점수가 높은 곳을 먼저 봅니다.'],
        ].map(([n, title, note]) => <li key={n} className="rounded-lg bg-slate-50 p-4"><span className="text-xs font-bold text-blue-600">{n}</span><h3 className="mt-2 text-sm font-semibold">{title}</h3><p className="mt-2 text-xs leading-6 text-slate-600">{note}</p></li>)}
      </ol>
      <dl className="mt-5 grid gap-x-6 gap-y-3 text-xs leading-6 sm:grid-cols-2" aria-label="4개 평가 방식">
        {[
          ['균형형', '승차량·시간 분포 차이 등 여러 지표를 함께 반영합니다.'],
          ['수요 우선형', '관측된 승차량에 가장 큰 비중을 둡니다.'],
          ['시간 우선형', '승차·운행 시간 분포 차이에 가장 큰 비중을 둡니다.'],
          ['강건성 우선형', '다른 방식보다 반복 선정과 월별 안정성의 비중을 높입니다.'],
        ].map(([label, note]) => <div key={label}><dt className="font-semibold text-slate-700">{label}</dt><dd className="text-slate-600">{note}</dd></div>)}
      </dl>
    </Card>
    <section aria-labelledby="review-candidates-title">
      <h2 id="review-candidates-title" className="text-lg font-bold">이 기준으로 선정된 6개 예비 후보</h2>
      <p className="mt-2 text-xs leading-6 text-slate-600">기존 최종 검토 순서입니다. 포함 횟수는 도입 효과나 성공 확률을 의미하지 않습니다.</p>
      <ol className="mt-4 grid gap-3 md:grid-cols-2" data-testid="review-candidates">
        {data.candidates.map((z) => <li key={z.zoneId} data-testid={`review-candidate-${z.zoneId}`}><Card className="h-full p-5">
          <div className="flex items-start gap-3"><span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-blue-50 font-bold text-blue-700">{z.reviewOrder}</span><div className="min-w-0"><Link to={`/zones?zone=${z.zoneId}`} className="inline-flex min-h-11 items-center text-sm font-semibold text-blue-700 underline underline-offset-4">{z.zoneId} · {z.names.join(' · ')}</Link><p className="mt-2 text-sm font-semibold text-slate-800">상위 6위 포함 {z.top6Frequency}/4회</p><p className="mt-1 text-xs text-slate-600">평가 방식별 순위 중앙값 {z.medianRank.toFixed(1)}</p></div></div>
        </Card></li>)}
      </ol>
    </section>
  </>
}
