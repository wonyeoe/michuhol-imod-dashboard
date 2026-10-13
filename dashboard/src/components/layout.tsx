import { useEffect, useRef, useState } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { Activity, ArrowUpRight, CalendarDays, ChevronRight, Clock3, FlaskConical, LayoutDashboard, MapPinned, Menu, X } from 'lucide-react'
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
        <span><strong>I-MOD<span className="font-normal text-slate-400"> insight</span></strong><small>미추홀구 모빌리티 분석</small></span>
      </NavLink>
      <div className="workspace-label"><span className="size-2 rounded-full bg-blue-500" /> INCHEON · MICHUHOL</div>
      <p className="nav-section-label">데이터 대시보드</p>
      <nav aria-label="주 메뉴" className="flex flex-col gap-1.5">
        {navigation.map(({ path, label, icon: Icon }) => <NavLink key={path} to={path} end={path === '/'} onClick={() => setOpen(false)} className={({ isActive }) => cn('nav-link', isActive && 'nav-link-active')}>
          <Icon size={18} /><span>{label}</span>
        </NavLink>)}
      </nav>
      <div className="sidebar-bottom">
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <FlaskConical size={19} className="mb-3 text-blue-600" />
          <p className="text-xs font-semibold leading-relaxed text-slate-700">공공데이터 활용<br />AI 데이터 분석 경진대회</p>
          <p className="mt-2 text-[11px] leading-relaxed text-slate-500">데이터로 살펴보는<br />더 나은 지역 이동의 가능성</p>
        </div>
        <div className="mt-5 flex items-center justify-between text-[11px] text-slate-400"><span>2026 Q2 · 연구 프로젝트</span><ArrowUpRight size={13} /></div>
      </div>
    </aside>
    <div className="lg:pl-[232px]">
      <header className="topbar">
        <div className="flex min-w-0 items-center gap-3">
          <Button ref={toggle} variant="ghost" size="icon" className="lg:hidden" aria-expanded={open} aria-controls="main-navigation" aria-label={open ? '메뉴 닫기' : '메뉴 열기'} onClick={() => setOpen(!open)}>{open ? <X /> : <Menu />}</Button>
          <span className="hidden text-sm text-slate-400 sm:inline">대시보드</span><ChevronRight className="hidden text-slate-300 sm:block" size={14} />
          <span className="truncate text-sm font-medium text-slate-700">{current}</span>
        </div>
        <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-600"><CalendarDays size={14} /><span>2026년 4–6월</span><span className="hidden border-l border-slate-200 pl-2 text-slate-400 sm:inline">분석 기간</span></div>
      </header>
      <main id="main-content" tabIndex={-1} className="mx-auto max-w-[1600px] px-5 py-7 outline-none sm:px-8 lg:px-9 lg:py-9"><Outlet /></main>
      <footer className="mx-auto flex max-w-[1600px] flex-col gap-2 px-5 pb-7 pt-2 text-[11px] text-slate-400 sm:flex-row sm:justify-between sm:px-8 lg:px-9"><span>I-MOD insight · 인천 미추홀구</span><span>공공데이터 기반 탐색적 분석 · 2026년 2분기</span></footer>
    </div>
  </div>
}
