import { Link } from 'react-router-dom'
import { ArrowLeft, Clock3, FlaskConical, MapPinned } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

const pages = {
  temporal: { title: '시간대별 분석', icon: Clock3, description: '후보 권역마다 버스 승차와 운행의 시간적 분포가 다르게 나타납니다.', next: '권역별 24시간 패턴, 월별 추이, 수요·운행 비중 비교를 제공할 예정입니다.' },
  zones: { title: '후보 권역 탐색', icon: MapPinned, description: '공간 평가 단위와 구성 정류장명 그룹을 자세히 살펴보는 공간입니다.', next: '26개 공간 평가 단위의 구성과 특성, 후보별 상세 정보를 제공할 예정입니다.' },
  analysis: { title: 'AI 분석 및 선정 근거', icon: FlaskConical, description: '정류장 유형 분석부터 최종 예비 후보 선정까지, 데이터가 이어지는 과정을 설명합니다.', next: 'STEP 1~7의 군집 특성, 후보 점수와 시나리오별 선정 근거를 제공할 예정입니다.' },
}
export function PlaceholderPage({ page }: { page: keyof typeof pages }) {
  const { title, icon: Icon, description, next } = pages[page]
  return <div><Badge className="mb-4 bg-slate-100 text-slate-500">다음 개발 단계</Badge><h1 className="text-2xl font-bold tracking-tight">{title}</h1><p className="mt-3 text-sm leading-relaxed text-slate-500">{description}</p><Card className="mt-8 flex min-h-[420px] flex-col items-center justify-center p-8 text-center"><span className="mb-5 rounded-2xl bg-blue-50 p-5 text-blue-600"><Icon size={32} strokeWidth={1.5} /></span><h2 className="text-lg font-bold">분석 화면을 준비하고 있습니다</h2><p className="mt-3 max-w-md text-sm leading-7 text-slate-500">{next}</p><p className="mt-2 text-xs text-slate-500">현재는 종합 현황에서 최종 후보와 주요 지표를 확인할 수 있습니다.</p><Button asChild variant="outline" className="mt-7"><Link to="/"><ArrowLeft />종합 현황으로 돌아가기</Link></Button></Card></div>
}
export function NotFoundPage() {
  return <Card className="p-12 text-center"><p className="text-sm font-medium text-blue-600">404</p><h1 className="my-4 text-xl font-bold">페이지를 찾을 수 없습니다</h1><Button asChild variant="outline"><Link to="/">종합 현황으로 이동</Link></Button></Card>
}
