import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { Layout } from '@/components/layout'
import { OverviewPage } from '@/pages/overview-page'
import { NotFoundPage, PlaceholderPage } from '@/pages/placeholder-page'
import { ErrorBoundary } from '@/components/error-boundary'

export default function App() {
  return <BrowserRouter basename={import.meta.env.BASE_URL}><ErrorBoundary><Routes><Route element={<Layout />}>
    <Route index element={<OverviewPage />} />
    <Route path="temporal" element={<PlaceholderPage page="temporal" />} />
    <Route path="zones" element={<PlaceholderPage page="zones" />} />
    <Route path="analysis" element={<PlaceholderPage page="analysis" />} />
    <Route path="*" element={<NotFoundPage />} />
  </Route></Routes></ErrorBoundary></BrowserRouter>
}
