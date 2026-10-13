import { Database, Download } from 'lucide-react'
import { DATA_SOURCES } from '@/data/sources'
export function DataProvenance() {
  return <details className="data-provenance rounded-xl border border-border bg-white px-5 py-4">
    <summary className="cursor-pointer text-xs font-medium text-slate-600"><span className="ml-1 inline-flex items-center gap-2"><Database size={14} />데이터 출처와 연결 기준</span></summary>
    <div className="mt-4 text-xs leading-relaxed text-slate-500"><p>정류장명 그룹은 그룹 ID와 이름을 함께 검증합니다. 지도 좌표는 STEP 6의 권역 대표점, 검토 순서와 표시 지표는 STEP 7 최종 결과를 사용하며, 권역 ID로 연결합니다.</p><p className="mt-2">표시된 후보는 I-MOD 도입 확정 지역이 아닙니다. 지도에는 서비스 반경이나 운영 경계를 표시하지 않습니다.</p>
      <ul className="mt-4 grid gap-2 sm:grid-cols-2">{Object.values(DATA_SOURCES).map((source) => <li key={source.file}><a href={`${import.meta.env.BASE_URL}data/${source.file}`} download className="flex items-center gap-2 rounded-md p-2 text-blue-600 hover:bg-blue-50" title={source.source}><Download size={13} />{source.title}<span className="text-[10px] text-slate-400">CSV</span></a><span className="block break-all pl-7 text-[10px] text-slate-400">{source.source}</span></li>)}</ul>
    </div>
  </details>
}
