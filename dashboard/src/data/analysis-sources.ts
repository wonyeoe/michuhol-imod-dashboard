const step3 = 'STEP별 결과 파일/Michuhol_IMOD_STEP3_Interpretation_Results'
export const ANALYSIS_SOURCES = {
  assignments: { file: 'cluster-assignments.csv', title: 'STEP 3 최종 군집 할당', source: `${step3}/02_station_assignments_286.csv`, columns: ['station_name', 'stop_group_id', 'KMeans_FULL8', 'GMM_ROUTE6'] },
  profiles: { file: 'cluster-profiles.csv', title: 'STEP 3 K-means 군집 중앙값', source: `${step3}/03_cluster_profiles_KMeans_FULL8.csv`, columns: ['KMeans_FULL8', 'count', 'avg_daily_passengers', 'avg_daily_operations', 'temporal_mismatch'] },
  metrics: { file: 'model-metrics.csv', title: 'STEP 3 모델 지표', source: `${step3}/01_candidate_model_metrics.csv`, columns: ['model', 'silhouette_in_PCA', 'pca_components', 'cluster_sizes', 'min_cluster'] },
  eligibility: { file: 'eligibility.csv', title: 'STEP 4 수요 적격성', source: 'STEP별 결과 파일/Michuhol_IMOD_STEP4_Candidate_Screening_Results/01_eligibility_summary.csv', columns: ['scenario', 'cutoff', 'eligible_count'] },
  spatial: { file: 'spatial-comparison.csv', title: 'STEP 6 공간 방법 비교', source: 'STEP별 결과 파일/Michuhol_IMOD_STEP6_Spatial_Stability_Results/01_algorithm_radius_comparison.csv', columns: ['method', 'radius_m', 'n_groups', 'n_multistop', 'n_singletons', 'largest_group', 'max_group_diameter_m'] },
} as const
