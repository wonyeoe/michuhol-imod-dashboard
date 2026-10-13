import { useEffect, useRef, useState } from 'react'
import { divIcon, latLngBounds, type Marker as LeafletMarker } from 'leaflet'
import { CircleMarker, MapContainer, Marker, Pane, Popup, TileLayer, Tooltip, ZoomControl, useMap } from 'react-leaflet'
import { LocateFixed, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { formatNumber } from '@/lib/utils'
import type { Zone } from '@/types/zones'
import 'leaflet/dist/leaflet.css'

type Props = { zones: Zone[]; selectedId: string | null; onSelect: (id: string) => void; showMembers: boolean }
function View({ zones, selectedId, reset }: Pick<Props, 'zones' | 'selectedId'> & { reset: number }) {
  const map = useMap()
  const selected = zones.find((z) => z.zoneId === selectedId)
  useEffect(() => {
    if (zones.length) map.fitBounds(latLngBounds(zones.map((z) => [z.latitude, z.longitude])), { padding: [50, 65], maxZoom: 15, animate: false })
  }, [map, zones, reset])
  useEffect(() => {
    if (selected) map.panInside([selected.latitude, selected.longitude], { paddingTopLeft: [60, 95], paddingBottomRight: [60, 90], animate: !window.matchMedia('(prefers-reduced-motion: reduce)').matches })
  }, [map, selected])
  useEffect(() => {
    const observer = new ResizeObserver(() => map.invalidateSize())
    observer.observe(map.getContainer())
    return () => observer.disconnect()
  }, [map])
  return null
}
function ZoneMarker({ zone, selected, onSelect }: { zone: Zone; selected: boolean; onSelect: Props['onSelect'] }) {
  const marker = useRef<LeafletMarker>(null)
  const previous = useRef(selected)
  useEffect(() => {
    if (selected && !previous.current) marker.current?.openPopup()
    if (!selected) marker.current?.closePopup()
    previous.current = selected
  }, [selected])
  const final = zone.reviewOrder !== null
  const icon = divIcon({ className: 'zone-marker-container', iconSize: [38, 46], iconAnchor: [19, 19], popupAnchor: [0, -20],
    // IDs and ranks are validated numeric identifiers; user-provided names stay in React text nodes.
    html: `<div class="zone-marker ${final ? 'zone-marker-final' : 'zone-marker-other'} ${selected ? 'is-selected' : ''}"><span>${final ? zone.reviewOrder : '•'}</span><small>${zone.zoneId}</small></div>`,
  })
  return <Marker ref={marker} position={[zone.latitude, zone.longitude]} icon={icon} title={`${zone.zoneId} · ${zone.names.join(', ')}`} alt={`${zone.zoneId} ${final ? `최종 예비 후보, 검토 순서 ${zone.reviewOrder}` : '나머지 평가 단위'}`} zIndexOffset={selected ? 1000 : final ? 500 : 0} eventHandlers={{ click: () => onSelect(zone.zoneId) }}>
    <Popup minWidth={200} maxWidth={240} autoPanPaddingTopLeft={[15, 65]} autoPanPaddingBottomRight={[15, 30]}>
      <div className="map-popup"><p className="text-xs font-bold text-blue-700">{zone.zoneId} · {final ? `최종 예비 후보 ${zone.reviewOrder}` : '나머지 평가 단위'}</p><h3 className="text-sm font-semibold leading-relaxed">{zone.names.join(' · ')}</h3><dl className="mt-3 grid grid-cols-2 gap-y-2 text-xs"><dt>정류장명 그룹</dt><dd>{zone.members.length}개</dd><dt>일평균 승차량</dt><dd>{formatNumber(zone.dailyDemand, 1)}명/일</dd></dl><p className="mb-0! mt-3! text-[10px] text-slate-400">분석 권역 대표점 · 서비스 경계 아님</p></div>
    </Popup>
  </Marker>
}
export default function ZoneMap({ zones, selectedId, onSelect, showMembers }: Props) {
  const [reset, setReset] = useState(0)
  const [attempt, setAttempt] = useState(0)
  const [tileError, setTileError] = useState(false)
  const [loading, setLoading] = useState(true)
  const loaded = useRef(false)
  const selected = zones.find((z) => z.zoneId === selectedId)
  useEffect(() => {
    const timer = window.setTimeout(() => { if (!loaded.current) { setTileError(true); setLoading(false) } }, 12_000)
    return () => window.clearTimeout(timer)
  }, [attempt])
  if (!zones.length) return <div className="flex h-[470px] items-center justify-center bg-slate-50 p-6 text-sm text-slate-500" role="status">조건에 맞는 권역이 없습니다. 검색어나 필터를 변경해 주세요.</div>
  return <div className="map-wrapper zone-map-wrapper" aria-label="26개 공간 평가 단위 탐색 지도" data-testid="zone-map">
    <MapContainer className="candidate-map" bounds={latLngBounds(zones.map((z) => [z.latitude, z.longitude]))} boundsOptions={{ padding: [50, 65], maxZoom: 15 }} scrollWheelZoom={false} zoomControl={false} fadeAnimation={false} minZoom={10} maxZoom={18}>
      <TileLayer key={attempt} url="https://tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' eventHandlers={{ tileerror: () => { setTileError(true); setLoading(false) }, tileload: () => { loaded.current = true; setLoading(false) } }} />
      <ZoomControl position="bottomright" />
      <View zones={zones} selectedId={selectedId} reset={reset} />
      {zones.map((z) => <ZoneMarker key={z.zoneId} zone={z} selected={z.zoneId === selectedId} onSelect={onSelect} />)}
      <Pane name="group-points" style={{ zIndex: 620 }}>
        {showMembers && selected?.members.filter((m) => m.coordinates).map((m) => <CircleMarker key={m.groupId} center={[m.coordinates!.latitude, m.coordinates!.longitude]} radius={7} className="zone-group-point" pathOptions={{ color: '#047857', fillColor: '#d1fae5', fillOpacity: 1, weight: 2 }}>
          <Tooltip direction="top"><span>{m.groupId} · {m.name}<br />정류장명 그룹 대표점 (물리 정류장 아님)</span></Tooltip>
        </CircleMarker>)}
      </Pane>
    </MapContainer>
    <div className="absolute left-3 top-3 z-[500] rounded-lg border border-white/80 bg-white/95 px-3 py-2 text-[11px] text-slate-600 shadow-sm">표시 권역 <strong>{zones.length}</strong>개</div>
    <Button size="sm" variant="outline" className="absolute right-3 top-3 z-[500] bg-white shadow-sm" onClick={() => setReset((n) => n + 1)}><LocateFixed />전체 보기</Button>
    {loading && !tileError && <p role="status" className="absolute bottom-5 left-3 z-[500] rounded bg-white/95 p-2 text-xs text-slate-500">배경 지도를 불러오는 중…</p>}
    {tileError && <div role="status" className="absolute bottom-7 left-3 right-14 z-[500] flex flex-wrap items-center gap-2 rounded-lg border border-amber-200 bg-white/95 p-3 text-xs text-slate-600"><span className="flex-1 leading-relaxed">배경 지도를 불러오지 못했습니다. 권역 좌표와 목록은 계속 확인할 수 있습니다.</span><Button size="sm" variant="outline" onClick={() => { loaded.current = false; setTileError(false); setLoading(true); setAttempt((n) => n + 1) }}><RefreshCw />재시도</Button></div>}
  </div>
}
