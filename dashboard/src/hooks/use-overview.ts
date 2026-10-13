import { useCallback, useEffect, useState } from 'react'
import { loadOverview } from '@/data/overview'
import type { OverviewData } from '@/types/data'

type LoadState = { status: 'loading' } | { status: 'ready'; data: OverviewData } | { status: 'error'; error: Error }
export function useOverview() {
  const [attempt, setAttempt] = useState(0)
  const [state, setState] = useState<LoadState>({ status: 'loading' })
  const retry = useCallback(() => setAttempt((value) => value + 1), [])
  useEffect(() => {
    const controller = new AbortController()
    let active = true
    const timeout = window.setTimeout(() => controller.abort(), 15_000)
    setState({ status: 'loading' })
    loadOverview(controller.signal).then((data) => { if (active) setState({ status: 'ready', data }) }).catch((error: unknown) => {
      if (!active) return
      setState({ status: 'error', error: controller.signal.aborted ? new Error('데이터 응답 시간이 초과되었습니다. 연결을 확인하고 다시 시도해 주세요.') : error instanceof Error ? error : new Error('데이터를 불러오지 못했습니다.') })
    }).finally(() => window.clearTimeout(timeout))
    return () => { active = false; window.clearTimeout(timeout); controller.abort() }
  }, [attempt])
  return { ...state, retry }
}
