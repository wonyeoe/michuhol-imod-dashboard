import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { Layout } from '@/components/layout'
import { OverviewPage } from '@/pages/overview-page'
import { NotFoundPage } from '@/pages/placeholder-page'
import { ErrorBoundary } from '@/components/error-boundary'
import { lazy, Suspense } from 'react'
const TemporalPage = lazy(() => import('@/pages/temporal-page'))
const ZonesPage = lazy(() => import('@/pages/zones-page'))
const AnalysisPage = lazy(() => import('@/pages/analysis-page'))

export default function App() {
  return <BrowserRouter basename={import.meta.env.BASE_URL}><ErrorBoundary><Routes><Route element={<Layout />}>
    <Route index element={<OverviewPage />} />
    <Route path="temporal" element={<Suspense fallback={<p role="status">시간대별 화면을 준비하고 있습니다.</p>}><TemporalPage /></Suspense>} />
    <Route path="zones" element={<Suspense fallback={<p role="status">권역 탐색 화면을 준비하고 있습니다.</p>}><ZonesPage /></Suspense>} />
    <Route path="analysis" element={<Suspense fallback={<p role="status">분석 근거 화면을 준비하고 있습니다.</p>}><AnalysisPage /></Suspense>} />
    <Route path="*" element={<NotFoundPage />} />
  </Route></Routes></ErrorBoundary></BrowserRouter>
}
