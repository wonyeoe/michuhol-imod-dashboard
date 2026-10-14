# 6차: 후보 권역 탐색·AI 분석 근거 재구성

## 변경 전후

| 페이지 | 이전 | 변경 후 기본 화면 |
| --- | --- | --- |
| `/zones` | 지도 아래 상세 지표·그룹 목록·시나리오 표·비교 차트가 연속 노출 | ‘어디를 우선 검토해야 할까?’ → 지도·검색·필터·목록 → 선택 권역 요약 → 접힌 상세 분석 |
| `/analysis` | STEP 1–7 과정·군집·공간 분석·선정 결과를 순서대로 모두 노출 | ‘왜 이 6개 지역이 선정됐을까?’ → 286→40→26→6 흐름 → 선정 기준·4개 평가 방식 → 후보 6개 카드 → 접힌 분석 방법 |

## 핵심과 상세의 분리

권역 요약은 ID·지역명·후보 여부와 검토 순서, 상위 6위 포함 횟수·일평균 승차량·최대 시간 비중 차이 시간을 보여 준다. 모든 문장과 수치는 기존 로더의 선택 권역에서 가져온다. 요약 문장의 승차량만 정수로 반올림해 ‘약’으로 표현하고 지표에는 소수 첫째 자리 값을 유지한다. 비후보에는 최종 검토 순서를 부여하지 않으며 관측 특성만 설명한다.

`상세 분석 및 다른 후보와 비교` 안에 그룹 ID·구성 목록·좌표, 양의 시간 분포 차이 합, 월별 CV·최소/최대 비율, 시나리오 점수·순위, 기존 3개 비교 차트, 산식과 출처를 보존했다. 기본 상태는 접힘이며, 펼친 상태에서 권역을 바꾸면 요약과 상세가 같은 선택 권역으로 갱신된다.

분석 근거 기본 화면은 STEP 7 정렬 순서를 쉬운 문장으로 설명한다.

1. `top6_frequency` 내림차순.
2. 위 값이 같으면 `median_rank` 오름차순.
3. 두 값이 모두 같으면 `score_balanced` 내림차순.

후보 순서는 Z06 → Z23 → Z10 → Z22 → Z01 → Z02다. 카드에는 순서·ID·이름·포함 횟수·순위 중앙값과 권역 링크를 제공한다. 균형형·수요 우선형·시간 우선형·강건성 우선형의 차이도 짧게 설명한다. 웹에서 점수나 후보를 재계산하지 않는다.

`분석 방법 자세히 보기` 안에는 기존 STEP 1–7 선택 기능, K-means·GMM, STEP 4의 12개 조건, DBSCAN·Complete Linkage, STEP 7 히트맵·가중치·26개 비교, 한계·출처를 보존했다. 상세 영역은 네이티브 `details/summary`로 키보드 Enter 및 모바일 터치로 조작한다.

## 유지 사항

- 26개 마커와 후보 6개/기타 20개 구분, 검색·필터·목록·지도 선택·그룹 대표점 표시.
- 시나리오 전환, 정확한 표 수치, 전체 26개 평가 비교, 오류·빈 자료·재시도 처리.
- `?zone=Zxx` 전달과 새로고침, 후보의 시간대별 링크, 비후보 상세 내 최종 6개 시간대별 링크.
- `/`와 `/temporal`의 구현·스타일·데이터 연결은 수정하지 않았다. 전역 CSS·레이아웃도 이번 단계에서는 변경하지 않았다.
- 기존 CSV·Notebook·로더·40개 단위/통합 테스트는 수정하지 않았다. 도입 확정·운영 효과·공급 부족을 단정하지 않는다.

## 변경 파일

- 생성: `src/components/analysis/selection-overview.tsx`.
- 수정: `src/pages/zones-page.tsx`, `src/pages/analysis-page.tsx`, `src/components/zones/zone-detail.tsx`, `src/components/analysis/selection-section.tsx`.
- 브라우저 테스트 수정: `tests/browser.mjs`, `tests/zones-browser.mjs`, `tests/analysis-browser.mjs`, `tests/final-ux-browser.mjs`.
- 문서: 이 보고서와 `README.md`.

## 검증

- `npm test`: 기존 40개 통과.
- `npm run build`: TypeScript·Vite 프로덕션 빌드 통과.
- 프로덕션 미리보기 Chrome에서 `npm run test:browser` 실행. 기존 네 페이지 회귀와 추가 접힘·펼침 검증 수행.
- 권역 26개 요약 승차량, 최종 후보의 포함 횟수, 기존 상세 지표·그룹 대응을 CSV와 비교.
- 기본 후보 카드 순서·포함 횟수·순위 중앙값·권역 링크를 STEP 7 CSV와 비교.
- 기본 진입과 새로고침에서 상세가 접히고 비교 차트가 보이지 않는지 확인. 펼친 뒤 기존 차트·표·단계 선택·시나리오 전환 검증.
- 1536px 데스크톱·390px 모바일에서 문서 가로 넘침 없음. 키보드 상세 펼치기 및 메뉴 Escape 포커스 확인. 정상 탐색의 콘솔·JavaScript 오류 없음.

검증용 스크린샷은 Git에서 제외되는 `test-results/`에 생성된다.

| 화면 | 데스크톱 기본 화면 | 모바일 기본 화면 |
| --- | --- | --- |
| 권역 탐색 | [phase6-zones-desktop.png](../test-results/phase6-zones-desktop.png) | [phase6-zones-mobile.png](../test-results/phase6-zones-mobile.png) |
| 분석 근거 | [phase6-analysis-desktop.png](../test-results/phase6-analysis-desktop.png) | [phase6-analysis-mobile.png](../test-results/phase6-analysis-mobile.png) |

펼친 상태는 기존 `zones-desktop.png`, `analysis-desktop.png`, `analysis-mobile.png` 검증 캡처에서도 확인할 수 있다. 모바일 검증은 Chrome 뷰포트 기준이며 실제 iOS 기기 검증은 별도다.

실행은 프로젝트 루트에서 `npm --prefix dashboard run dev`, 또는 `cd dashboard` 후 `npm run dev`를 사용한다.

6차 작업 전 5차 변경 사항을 `ee79d0f`로 커밋했다. 이 보고서는 이후 6차 변경 사항을 설명한다.
