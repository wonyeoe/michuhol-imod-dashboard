// Explanatory metadata transcribed from final notebooks; never used to compute scores.
// Tests compare these dictionaries to the notebooks' actual weights definitions.
export const STEP4_WEIGHTS = {
  base: { demand: .25, mismatch: .35, low_supply: .20, intensity: .20 },
  demand_priority: { demand: .45, mismatch: .25, low_supply: .15, intensity: .15 },
  time_priority: { demand: .15, mismatch: .50, low_supply: .25, intensity: .10 },
  balanced: { demand: .25, mismatch: .25, low_supply: .25, intensity: .25 },
}
export const STEP7_WEIGHTS = {
  balanced: { demand: .25, mismatch: .30, low_supply: .20, repeat: .15, month_stable: .10 },
  demand_priority: { demand: .45, mismatch: .20, low_supply: .15, repeat: .10, month_stable: .10 },
  time_priority: { demand: .15, mismatch: .45, low_supply: .20, repeat: .10, month_stable: .10 },
  robustness_priority: { demand: .20, mismatch: .25, low_supply: .10, repeat: .25, month_stable: .20 },
}
export const CLUSTER_DESCRIPTIONS = [
  { label: '일반적인 수요·공급 특성', text: '다른 두 유형 사이의 승차·운행 규모를 보이는 정류장명 그룹입니다.', color: '#60a5fa' },
  { label: '저수요·저공급과 시간 분포 불일치', text: '승차·운행 규모는 작고 시간 분포 불일치 중앙값은 상대적으로 큽니다.', color: '#6366f1' },
  { label: '고수요·고공급 특성', text: '일평균 승차·운행 규모가 상대적으로 큰 정류장명 그룹입니다.', color: '#0f766e' },
]
export const STEP4_INDICATORS = [
  { key: 'demand', label: '관측 승차 수요', column: 'avg_daily_passengers', description: '일평균 버스 승차량 (명/일). 잠재 호출 수요와 다릅니다.' },
  { key: 'mismatch', label: '시간 분포 불일치', column: 'temporal_mismatch', description: '그룹의 승차·운행 시간 분포 차이. 실제 대기시간이 아닙니다.' },
  { key: 'low_supply', label: '저공급 시간 비율', column: 'low_supply_hour_ratio_lt1avg', description: '시간별 일평균 운행이 1회 미만인 시간의 비율. 야간도 포함합니다.' },
  { key: 'intensity', label: '운행당 승객수', column: 'passengers_per_operation', description: '승차량과 운행 건수의 비율. 차량 혼잡도나 정원 대비 이용률이 아닙니다.' },
] as const
export const NOTEBOOKS = [
  'Michuhol_IMOD_STEP1_Full_EDA_Correlation_Colab.ipynb',
  'Michuhol_IMOD_STEP2_KMeans_2026Q2_Colab (1).ipynb',
  'Michuhol_IMOD_STEP2_5_Clustering_Diagnostics_Colab (1).ipynb',
  'Michuhol_IMOD_STEP3_Cluster_Interpretation_Colab (1).ipynb',
  'Michuhol_IMOD_STEP4_Candidate_Prioritization_Colab (1).ipynb',
  'Michuhol_IMOD_STEP5_Spatial_Zones_Colab (1).ipynb',
  'Michuhol_IMOD_STEP6_Spatial_Stability_Colab (1).ipynb',
  'Michuhol_IMOD_STEP7_Operational_Screening_Colab (1).ipynb',
]
export const PROCESS = [
  { step: 1, title: '전체 EDA 및 상관분석', purpose: '모델 입력을 만들기 전에 분포와 자료 품질을 확인합니다.', method: '기존 지표 재현성, 분포·이상치, Pearson/Spearman 상관을 점검하고 주말/평일 수요 비율을 확장했습니다.', connection: '확장 특징을 STEP 2 모델 비교에 전달합니다.', limit: '상관은 인과관계가 아닙니다. 이상치 삭제나 노선 수 결측의 0 대체를 하지 않았습니다.', source: [NOTEBOOKS[0]] },
  { step: 2, title: 'K-means 비교 및 군집 진단', purpose: '변수와 전처리 선택이 유형 분류에 미치는 영향을 확인합니다.', method: '변수 조합·로그 변환·이상치 포함 여부·K=3~8을 비교했습니다. STEP 2.5에서 스케일러·PCA·K-means/GMM과 안정성 진단을 추가했습니다.', connection: 'STEP 3에서 해석할 기준 모델과 비교 모델을 정합니다.', limit: '실루엣이 높다고 I-MOD 적합성이 높은 것은 아닙니다. 과거 실험의 레이블을 최종 군집과 혼용하지 않습니다.', source: [NOTEBOOKS[1], NOTEBOOKS[2]] },
  { step: 3, title: '군집 해석 및 월별 재현성 검증', purpose: '정류장명 그룹의 수요·공급 유형을 설명합니다.', method: '8변수 K-means와 6변수 GMM의 최종 할당·원단위 특성을 비교하고 월별 운영 통계를 점검했습니다.', connection: '군집 유형은 STEP 4 평가의 참고 정보로만 사용합니다.', limit: '군집 번호는 우선순위가 아니며 점수에 가산하지 않습니다. 월별 군집 검증은 3개 규모 변수의 보조 검증입니다.', source: [NOTEBOOKS[3]] },
  { step: 4, title: '후보 정류장군 우선 검토 분석', purpose: '수요 기준과 가중치가 달라져도 검토 후보가 유지되는지 살펴봅니다.', method: '4개 지표의 경험적 백분위와 3개 수요 기준 × 4개 가중치 조합으로 비교했습니다.', connection: '수요 적격성·기본 점수·반복 선정 정보를 공간 탐색으로 전달합니다.', limit: 'STEP 7과 별개의 그룹 단위 평가입니다. 공급 부족이나 I-MOD 편익을 확정하지 않습니다.', source: [NOTEBOOKS[4]] },
  { step: 5, title: 'DBSCAN 후보 권역 도출 및 검증', purpose: '좌표가 확보된 후보 그룹의 공간적 인접성을 탐색합니다.', method: '적격 후보를 기본 순위로 정렬해 20/40/60개 풀과 거리 300/500/800m를 비교했습니다. Haversine 거리, min_samples=1을 사용했습니다.', connection: '40개 풀을 STEP 6 공간 안정성 비교에 전달합니다.', limit: '연쇄 연결로 양 끝의 거리가 eps보다 멀 수 있습니다. 이 결과는 최종 26개 권역이 아닙니다.', source: [NOTEBOOKS[5]] },
  { step: 6, title: '예비 권역 공간 안정성 검증', purpose: '연쇄 연결의 영향을 살피고 최종 공간 평가 단위를 정리합니다.', method: '같은 40개 그룹에서 DBSCAN과 Complete Linkage를 비교해 Complete Linkage 500m 결과를 사용했습니다.', connection: '26개 공간 평가 단위를 STEP 7에 전달합니다.', limit: '500m는 그룹 대표점 간 최대 거리 조건입니다. 서비스 반경·도보권·운행 경계가 아닙니다.', source: [NOTEBOOKS[6]] },
  { step: 7, title: '운영 적합성 및 선정 민감도 검증', purpose: '공간 평가 단위 가운데 우선 현장 검토할 대상을 추립니다.', method: '권역별 5개 백분위 지표에 4개 가중치 시나리오를 적용한 기존 결과를 비교합니다.', connection: '최종 6개를 권역·시간대별 탐색으로 연결합니다.', limit: '도입 확정, 운행 시뮬레이션, 실제 운영 효율의 검증 결과가 아닙니다.', source: [NOTEBOOKS[7]] },
]
