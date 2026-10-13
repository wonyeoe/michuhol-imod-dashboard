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
  ['hourly-zone-shares.csv', `${step7}/03_hourly_zone_shares.csv`],
  ['monthly-zone-profiles.csv', `${step7}/02_monthly_zone_profiles.csv`],
  ['cluster-assignments.csv', 'STEP별 결과 파일/Michuhol_IMOD_STEP3_Interpretation_Results/02_station_assignments_286.csv'],
  ['cluster-profiles.csv', 'STEP별 결과 파일/Michuhol_IMOD_STEP3_Interpretation_Results/03_cluster_profiles_KMeans_FULL8.csv'],
  ['model-metrics.csv', 'STEP별 결과 파일/Michuhol_IMOD_STEP3_Interpretation_Results/01_candidate_model_metrics.csv'],
  ['eligibility.csv', 'STEP별 결과 파일/Michuhol_IMOD_STEP4_Candidate_Screening_Results/01_eligibility_summary.csv'],
  ['spatial-comparison.csv', `${step6}/01_algorithm_radius_comparison.csv`],
]
// Read every source first: missing inputs cannot produce a half-updated data snapshot.
const inputs = await Promise.all(sources.map(async ([file, source]) => ({ file, source, bytes: await readFile(path.join(root, source)) })))
await mkdir(output, { recursive: true })
async function writeChanged(file, bytes) {
  const previous = await readFile(file).catch((error) => { if (error.code !== 'ENOENT') throw error; return null })
  if (!previous?.equals(Buffer.from(bytes))) await writeFile(file, bytes)
}
for (const input of inputs) await writeChanged(path.join(output, input.file), input.bytes)
await writeChanged(path.join(output, 'manifest.json'), JSON.stringify({
  analysisVersion: '2026Q2-step6-complete500-step7-final',
  sources: inputs.map(({ file, source, bytes }) => ({ file, source, bytes: bytes.length, sha256: createHash('sha256').update(bytes).digest('hex') })),
}, null, 2) + '\n')
console.log(`CSV ${inputs.length}개 원본 그대로 동기화 (${inputs.reduce((n, i) => n + i.bytes.length, 0).toLocaleString()} bytes). 원본 변경 없음.`)
