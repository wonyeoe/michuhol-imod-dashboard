import { useCallback, useEffect, useState } from 'react'
import { loadTemporal, type TemporalData } from '@/data/temporal'

type State = { status: 'loading' } | { status: 'ready'; data: TemporalData } | { status: 'error'; error: Error }
export function useTemporal() {
  const [state, setState] = useState<State>({ status: 'loading' })
  const [attempt, setAttempt] = useState(0)
  const retry = useCallback(() => setAttempt((v) => v + 1), [])
  useEffect(() => {
    const controller = new AbortController()
    let active = true
    const timeout = window.setTimeout(() => controller.abort(), 15_000)
    setState({ status: 'loading' })
    loadTemporal(controller.signal).then((data) => { if (active) setState({ status: 'ready', data }) }).catch((error: unknown) => {
      if (active) setState({ status: 'error', error: controller.signal.aborted ? new Error('응답 시간이 초과되었습니다. 다시 시도해 주세요.') : error instanceof Error ? error : new Error('데이터를 불러오지 못했습니다.') })
    }).finally(() => window.clearTimeout(timeout))
    return () => { active = false; window.clearTimeout(timeout); controller.abort() }
  }, [attempt])
  return { ...state, retry }
}
