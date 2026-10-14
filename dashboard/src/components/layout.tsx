import { useEffect, useRef, useState } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { Activity, CalendarDays, Clock3, FlaskConical, LayoutDashboard, MapPinned, Menu, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export const navigation = [
  { path: '/', label: '분석 종합 현황', icon: LayoutDashboard },
  { path: '/temporal', label: '시간대별 분석', icon: Clock3 },
  { path: '/zones', label: '후보 권역 탐색', icon: MapPinned },
  { path: '/analysis', label: 'AI 분석 및 선정 근거', icon: FlaskConical },
]

export function Layout() {
  const [open, setOpen] = useState(false)
  const { pathname } = useLocation()
  const toggle = useRef<HTMLButtonElement>(null)
  const current = navigation.find((item) => item.path === pathname)?.label ?? '페이지 안내'
  useEffect(() => {
    document.title = `${current} | I-MOD 인사이트`
    window.scrollTo({ top: 0 })
  }, [current])
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && open) { setOpen(false); toggle.current?.focus() }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])
  return <div className="min-h-screen">
    <a href="#main-content" className="skip-link">본문으로 바로가기</a>
    {open && <button className="fixed inset-0 z-40 bg-slate-950/25 lg:hidden" aria-label="메뉴 닫기" onClick={() => setOpen(false)} />}
    <aside id="main-navigation" className={cn('sidebar', open && 'sidebar-open')}>
      <NavLink to="/" className="brand" onClick={() => setOpen(false)} aria-label="I-MOD 인사이트 홈">
        <span className="brand-symbol"><Activity size={23} strokeWidth={2.3} /></span>
        <span><strong>I-MOD<span className="font-normal text-slate-500"> insight</span></strong><small>버스 데이터 분석</small></span>
      </NavLink>
      <p className="nav-section-label mt-8">데이터 대시보드</p>
      <nav aria-label="주 메뉴" className="flex flex-col gap-1.5">
        {navigation.map(({ path, label, icon: Icon }) => <NavLink key={path} to={path} end={path === '/'} onClick={() => setOpen(false)} className={({ isActive }) => cn('nav-link', isActive && 'nav-link-active')}>
          <Icon size={18} /><span>{label}</span>
        </NavLink>)}
      </nav>
    </aside>
    <div className="lg:pl-[232px]">
      <header className="topbar">
        <div className="flex min-w-0 items-center gap-3">
          <Button ref={toggle} variant="ghost" size="icon" className="lg:hidden" aria-expanded={open} aria-controls="main-navigation" aria-label={open ? '메뉴 닫기' : '메뉴 열기'} onClick={() => setOpen(!open)}>{open ? <X /> : <Menu />}</Button>
          <span className="text-sm font-medium text-slate-700">인천 미추홀구</span>
        </div>
        <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-600"><CalendarDays size={14} /><span>2026년 4–6월</span><span className="hidden border-l border-slate-200 pl-2 text-slate-500 sm:inline">분석 기간</span></div>
      </header>
      <main id="main-content" tabIndex={-1} className="mx-auto max-w-[1600px] px-5 py-7 outline-none sm:px-8 lg:px-9 lg:py-9"><Outlet /></main>

    </div>
  </div>
}
