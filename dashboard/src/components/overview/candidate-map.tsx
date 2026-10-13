import { useEffect, useRef, useState } from 'react'
import { divIcon, latLngBounds, type Marker as LeafletMarker } from 'leaflet'
import { MapContainer, Marker, Popup, TileLayer, ZoomControl, useMap } from 'react-leaflet'
import { LocateFixed, MapPin, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { formatHour, formatNumber } from '@/lib/utils'
import type { Candidate } from '@/types/data'
import 'leaflet/dist/leaflet.css'

type MapProps = { candidates: Candidate[]; selectedId: string | null; onSelect: (id: string) => void }
function ViewControls({ candidates, reset }: Pick<MapProps, 'candidates'> & { reset: number }) {
  const map = useMap()
  useEffect(() => {
    map.fitBounds(latLngBounds(candidates.map((c) => [c.latitude, c.longitude])), { padding: [55, 55], maxZoom: 14, animate: false })
  }, [map, candidates, reset])
  useEffect(() => {
    const observer = new ResizeObserver(() => map.invalidateSize())
    observer.observe(map.getContainer())
    return () => observer.disconnect()
  }, [map])
  return null
}
function CandidateMarker({ candidate, selected, onSelect }: { candidate: Candidate; selected: boolean; onSelect: (id: string) => void }) {
  const marker = useRef<LeafletMarker>(null)
  const previouslySelected = useRef(selected)
  useEffect(() => {
    // Keep the initial overview unobstructed; later list/table selections open the popup.
    if (selected && !previouslySelected.current) marker.current?.openPopup()
    if (!selected) marker.current?.closePopup()
    previouslySelected.current = selected
  }, [selected])
  const icon = divIcon({
    className: 'candidate-marker-container',
    html: `<div class="candidate-marker ${selected ? 'is-selected' : ''}"><span>${candidate.reviewOrder}</span><small>${candidate.zoneId}</small></div>`,
    iconSize: [42, 48], iconAnchor: [21, 24], popupAnchor: [0, -24],
  })
  return <Marker ref={marker} position={[candidate.latitude, candidate.longitude]} icon={icon} title={`${candidate.zoneId} · ${candidate.names.join(', ')}`} alt={`${candidate.zoneId} 후보 ${candidate.reviewOrder}`} zIndexOffset={selected ? 1000 : 0} eventHandlers={{ click: () => onSelect(candidate.zoneId) }}>
    <Popup minWidth={210} maxWidth={250} autoPanPaddingTopLeft={[15, 65]} autoPanPaddingBottomRight={[15, 30]}>
      <div className="map-popup"><span className="text-[11px] font-bold text-blue-600">검토 순서 {candidate.reviewOrder} · {candidate.zoneId}</span><h3 className="mt-2 text-sm font-semibold leading-relaxed">{candidate.names.join(' · ')}</h3><dl className="mt-3 grid grid-cols-2 gap-y-2 text-xs"><dt>일평균 승차량</dt><dd>{formatNumber(candidate.dailyDemand, 1)}명</dd><dt>상위 6위 포함</dt><dd>{candidate.top6Frequency}/4회</dd><dt>상대 격차 최대</dt><dd>{formatHour(candidate.peakHour)}</dd></dl><p className="mb-0! mt-3! text-[10px] text-slate-400">분석 권역 대표점 · 예비 검토 후보</p></div>
    </Popup>
  </Marker>
}

export default function CandidateMap({ candidates, selectedId, onSelect }: MapProps) {
  const [tileError, setTileError] = useState(false)
  const [tileAttempt, setTileAttempt] = useState(0)
  const [reset, setReset] = useState(0)
  const [tilesLoading, setTilesLoading] = useState(true)
  const hasLoadedTile = useRef(false)
  useEffect(() => {
    const timer = window.setTimeout(() => { if (!hasLoadedTile.current) { setTileError(true); setTilesLoading(false) } }, 12_000)
    return () => window.clearTimeout(timer)
  }, [tileAttempt])
  if (candidates.length === 0) return <div className="flex h-[460px] items-center justify-center gap-2 bg-slate-50 text-sm text-slate-500"><MapPin size={18} />표시할 후보 좌표가 없습니다.</div>
  return <div className="map-wrapper" aria-label="최종 예비 검토 후보 지도">
    <MapContainer bounds={latLngBounds(candidates.map((c) => [c.latitude, c.longitude]))} boundsOptions={{ padding: [55, 55], maxZoom: 14 }} scrollWheelZoom={false} zoomControl={false} fadeAnimation={false} className="candidate-map" minZoom={10} maxZoom={18}>
      <TileLayer key={tileAttempt} url="https://tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' eventHandlers={{
        tileerror: () => { setTileError(true); setTilesLoading(false) },
        tileload: () => { hasLoadedTile.current = true; setTilesLoading(false) },
      }} />
      <ZoomControl position="bottomright" />
      <ViewControls candidates={candidates} reset={reset} />
      {candidates.map((candidate) => <CandidateMarker key={candidate.zoneId} candidate={candidate} selected={candidate.zoneId === selectedId} onSelect={onSelect} />)}
    </MapContainer>
    <div className="absolute left-4 top-4 z-[500] flex items-center gap-2 rounded-lg border border-white/80 bg-white/95 px-3 py-2 text-[11px] text-slate-600 shadow-sm"><span className="size-2 rounded-full bg-blue-600" />최종 후보 대표점 <strong>{candidates.length}</strong></div>
    <Button variant="outline" size="sm" className="absolute right-4 top-4 z-[500] bg-white shadow-sm" onClick={() => setReset((r) => r + 1)}><LocateFixed />전체 보기</Button>
    {tilesLoading && !tileError && <div role="status" className="absolute bottom-5 left-4 z-[500] rounded-md bg-white/95 px-3 py-2 text-xs text-slate-600">배경 지도를 불러오는 중…</div>}
    {tileError && <div role="status" className="absolute bottom-7 left-4 right-14 z-[500] flex flex-wrap items-center gap-2 rounded-lg border border-amber-200 bg-white/95 p-3 text-xs text-slate-600"><span className="flex-1 leading-relaxed">배경 지도를 불러오지 못했습니다. 후보 좌표와 목록은 계속 확인할 수 있습니다.</span><Button size="sm" variant="outline" onClick={() => { hasLoadedTile.current = false; setTileError(false); setTilesLoading(true); setTileAttempt((n) => n + 1) }}><RefreshCw />재시도</Button></div>}
  </div>
}
