import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const dashboard = fileURLToPath(new URL('../', import.meta.url))
const root = path.resolve(dashboard, '..')
const output = path.join(dashboard, 'public', 'data')
const step6 = 'STEP별 결과 파일/Michuhol_IMOD_STEP6_Spatial_Stability_Results'
const step7 = 'STEP별 결과 파일/Michuhol_IMOD_STEP7_Operational_Screening_Results'
// Copy bytes only. Analysis CSVs are never edited or recomputed.
const sources = [
  ['groups.csv', 'dataset/03_features_expanded_286.csv'],
  ['memberships.csv', `${step6}/05_complete500_assignments.csv`],
  ['zone-profiles.csv', `${step6}/06_complete500_zone_profiles.csv`],
  ['zone-scores.csv', `${step7}/04_all_26_zones_scenario_scores.csv`],
  ['top6.csv', `${step7}/05_provisional_top6_review.csv`],
  ['audit.csv', `${step7}/09_audit_summary.csv`],
]
// Read every source first: missing inputs cannot produce a half-updated data snapshot.
const inputs = await Promise.all(sources.map(async ([file, source]) => ({ file, source, bytes: await readFile(path.join(root, source)) })))
await mkdir(output, { recursive: true })
for (const input of inputs) await writeFile(path.join(output, input.file), input.bytes)
await writeFile(path.join(output, 'manifest.json'), JSON.stringify({
  analysisVersion: '2026Q2-step6-complete500-step7-final',
  sources: inputs.map(({ file, source, bytes }) => ({ file, source, bytes: bytes.length, sha256: createHash('sha256').update(bytes).digest('hex') })),
}, null, 2) + '\n')
console.log(`CSV ${inputs.length}개 원본 그대로 동기화 (${inputs.reduce((n, i) => n + i.bytes.length, 0).toLocaleString()} bytes). 원본 변경 없음.`)
