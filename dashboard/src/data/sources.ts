import type { SourceKey } from '../types/data'

export const DATA_SOURCES: Record<SourceKey, { file: string; title: string; source: string; columns: string[] }> = {
  groups: {
    file: 'groups.csv', title: '정류장명 그룹 특징', source: 'dataset/03_features_expanded_286.csv',
    columns: ['station_name', 'stop_group_id', 'observed_days'],
  },
  memberships: {
    file: 'memberships.csv', title: 'STEP 6 권역 할당',
    source: 'STEP별 결과 파일/Michuhol_IMOD_STEP6_Spatial_Stability_Results/05_complete500_assignments.csv',
    columns: ['station_name', 'stop_group_id', 'zone_id'],
  },
  profiles: {
    file: 'zone-profiles.csv', title: 'STEP 6 권역 대표 좌표',
    source: 'STEP별 결과 파일/Michuhol_IMOD_STEP6_Spatial_Stability_Results/06_complete500_zone_profiles.csv',
    columns: ['zone_id', 'lat', 'lon', 'n_stop_groups'],
  },
  scores: {
    file: 'zone-scores.csv', title: 'STEP 7 전체 평가 단위',
    source: 'STEP별 결과 파일/Michuhol_IMOD_STEP7_Operational_Screening_Results/04_all_26_zones_scenario_scores.csv',
    columns: ['zone_id', 'provisional_review_order', 'names', 'n_stops', 'daily_demand', 'top6_frequency', 'peak_hour', 'type'],
  },
  candidates: {
    file: 'top6.csv', title: 'STEP 7 최종 예비 검토 후보',
    source: 'STEP별 결과 파일/Michuhol_IMOD_STEP7_Operational_Screening_Results/05_provisional_top6_review.csv',
    columns: ['zone_id', 'provisional_review_order', 'names', 'n_stops', 'daily_demand', 'top6_frequency', 'peak_hour', 'type'],
  },
  audit: {
    file: 'audit.csv', title: 'STEP 7 분석 규모 검증',
    source: 'STEP별 결과 파일/Michuhol_IMOD_STEP7_Operational_Screening_Results/09_audit_summary.csv',
    columns: ['all_station_names', 'input_candidate_stop_names', 'candidate_units', 'top6_count', 'monthly_days'],
  },
}
