import { AlertCircle, Database, RotateCcw } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
export function DataState({ title, message, retry }: { title: string; message: string; retry?: () => void }) {
  return <Card className="flex min-h-64 flex-col items-center justify-center gap-3 p-8 text-center" role="alert">
    <AlertCircle size={28} className="text-slate-400" /><h2 className="font-semibold">{title}</h2><p className="max-w-lg text-sm leading-relaxed text-muted-foreground">{message}</p>
    {retry && <Button variant="outline" className="mt-2" onClick={retry}><RotateCcw />다시 불러오기</Button>}
  </Card>
}
export function OverviewSkeleton() {
  return <div role="status" aria-live="polite" className="space-y-6">
    <span className="flex items-center gap-2 text-sm text-slate-500"><Database size={16} />분석 결과를 불러오고 있습니다.</span>
    <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">{[1, 2, 3, 4].map((i) => <div key={i} className="h-32 animate-pulse rounded-xl border border-slate-200 bg-white" />)}</div>
    <div className="h-[440px] animate-pulse rounded-xl border border-slate-200 bg-white" />
  </div>
}
