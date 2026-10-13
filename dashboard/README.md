# I-MOD 인사이트 — 버스 데이터 기반 후보 권역 분석 대시보드

인천 미추홀구 버스 승차·운행 데이터 기반 I-MOD 예비 검토 후보 대시보드다. 기존 STEP 1~7 분석 결과를 재학습·재산정하지 않고 사용한다.

## 실행

Node.js 22.12 이상을 사용한다. 검증 환경은 Windows, Node.js 24.11.0이다.

프로젝트 루트에서:

```powershell
cd dashboard
npm install
npm run dev
```

PowerShell에서 `npm.ps1` 실행 정책 오류가 나면 `npm` 대신 `npm.cmd`를 사용한다. 기본 접속 주소는 `http://127.0.0.1:5173`이며 사용 중인 포트가 있으면 터미널에 표시된 주소를 확인한다.

```powershell
npm run build
npm run preview
```

`build`는 TypeScript 검사 후 `dist/`에 정적 웹 앱을 생성한다. `preview` 기본 주소는 `http://127.0.0.1:4173`이다. 백엔드·데이터베이스·지도 API 키는 사용하지 않는다.

`predev`, `prebuild`, `pretest`는 필요한 CSV 13개를 `public/data/`로 자동 동기화한다. 같은 바이트의 파일은 다시 쓰지 않는다. 원본 파일과 상대 경로가 있는 **저장소 전체**에서 실행해야 한다. `dashboard/`만 별도로 복사하면 데이터 동기화에 실패한다. 운영 시에는 `dist/`만 정적 호스팅하면 된다.

## 구현 범위

| 경로 | 현재 구현 |
|---|---|
| `/` | 프로젝트 소개, 실제 CSV 기반 KPI 4개, 최종 후보 지도·목록·비교표·수요 비교 차트, 시간대별 분석 안내, 데이터 출처 |
| `/temporal` | 6개 후보 선택, 시간별 비중 선그래프·상대 격차 막대, 월별 일평균·운행 표, 동적 해석·집계 기준 |
| `/zones` | 26개 권역 지도·필터·검색, 상세 지표·구성 그룹, 최종 6개와 비교 |
| `/analysis` | STEP 1~7 과정, 군집 분포, STEP 4 시나리오·공간 방법 비교, 최종 순위 히트맵·선정 근거 |
| 기타 | 404 안내 |

- 공통 사이드바, 모바일 메뉴, 페이지별 활성 메뉴·문서 제목.
- 지도 마커·후보 목록·비교표의 권역 버튼을 하나의 선택 상태로 연결.
- 후보 좌표에 맞춘 초기 지도 범위와 전체 보기 버튼.
- 지도는 STEP 6의 권역 대표점만 표시하며 서비스 반경·운영 경계를 만들지 않음.
- 데이터 로딩, HTTP/파싱/키/값 오류, 빈 후보 결과, 지도 타일 오류와 재시도 처리.
- 배경 지도 연결에 실패해도 실제 좌표 마커와 후보 목록은 유지.
- 지도·차트 코드 분리 로딩, 모바일 표 가로 스크롤, 키보드 포커스·본문 바로가기.

## 기술 구성

- React + TypeScript + Vite
- Tailwind CSS의 Vite 플러그인
- shadcn/ui 방식의 로컬 Button/Card/Badge와 `components.json`; Button의 Slot은 Radix 사용
- Recharts: 후보 승차량·시간 분포·상대 격차·월별 비교·군집 분포·시나리오 점수 차트
- React Leaflet + Leaflet: 실제 좌표 대표점 지도
- React Router: 4개 페이지와 404
- Papa Parse: BOM·따옴표·쉼표가 포함된 CSV 파싱
- Vitest / Playwright: 데이터 계약·실제 브라우저 검증용 개발 의존성

## 파일 구성

```text
dashboard/
  package.json / package-lock.json     의존성·명령·잠금 버전
  index.html / public/favicon.svg      한국어 문서·앱 아이콘
  vite.config.ts / tsconfig*.json      빌드·타입 설정
  components.json                     shadcn/ui 설정
  scripts/sync-data.mjs                원본 바이트 복사·출처 manifest
  public/data/                        자동 생성, Git 제외
  src/
    main.tsx / App.tsx                앱 진입·라우팅
    index.css                         공통 스타일·반응형·지도 마커
    types/data.ts                     CSV·권역·화면 데이터 타입
    data/sources.ts                   CSV별 원본 경로·필수 컬럼
    data/overview.ts                  파싱·연결·데이터 계약 검증
    hooks/use-overview.ts             로딩·오류·재시도·취소·시간초과
    lib/utils.ts                     스타일 병합·숫자/시간 포맷
    components/
      layout.tsx                     사이드바·헤더·푸터
      data-state.tsx                 로딩·오류·빈 결과
      error-boundary.tsx             렌더링 오류 격리
      ui/                            Button / Card / Badge
      overview/
        stat-cards.tsx               핵심 통계 4개
        candidate-map.tsx            지도·마커·팝업·타일 오류
        candidate-list.tsx           후보 선택 목록·선택 요약
        candidate-comparison.tsx     비교표
        demand-chart.tsx             Recharts 수요 비교
        data-provenance.tsx          데이터 출처·원본 사본 다운로드
    pages/
      overview-page.tsx              종합 현황
      placeholder-page.tsx           404 안내 (기존 안내 컴포넌트 보존)
  tests/data.test.ts                  실제 CSV 및 결합 오류 테스트
  tests/browser.mjs                   Chrome 헤드리스 동작 검증
  test-results/                       스크린샷·서버 로그, Git 제외
  dist/                               빌드 결과, Git 제외
```

이번 변경은 `dashboard/` 안에만 생성했다. 기존 CSV·Notebook·Markdown 및 분석 보고서는 수정하지 않았다.

## 데이터 출처와 연결

STEP 6 폴더: `STEP별 결과 파일/Michuhol_IMOD_STEP6_Spatial_Stability_Results/`

STEP 7 폴더: `STEP별 결과 파일/Michuhol_IMOD_STEP7_Operational_Screening_Results/`

| 원본 | 행 수 | 브라우저용 사본 | 사용 필드·역할 |
|---|---:|---|---|
| `dataset/03_features_expanded_286.csv` | 286 | `groups.csv` | `station_name`, `stop_group_id`, `observed_days`: 그룹 수·관측일·키 검증 |
| STEP 6 `05_complete500_assignments.csv` | 40 | `memberships.csv` | `station_name`, `stop_group_id`, `zone_id`: 구성 그룹 연결 |
| STEP 6 `06_complete500_zone_profiles.csv` | 26 | `zone-profiles.csv` | `zone_id`, `lat`, `lon`, `n_stop_groups`: 지도 좌표·평가 단위 수 |
| STEP 7 `04_all_26_zones_scenario_scores.csv` | 26 | `zone-scores.csv` | 전체 평가 단위·후보 순서 및 표시 수치의 교차검증 |
| STEP 7 `05_provisional_top6_review.csv` | 6 | `top6.csv` | `provisional_review_order`, `zone_id`, `names`, `daily_demand`, `top6_frequency`, `peak_hour`, `n_stops`, `type` |
| STEP 7 `09_audit_summary.csv` | 1 | `audit.csv` | 그룹·공간 단위·후보 수 및 월별 관측일 교차검증 |

분석 근거 CSV를 포함한 총 용량은 230,015바이트다. 각 페이지는 필요한 파일만 읽으며, 100MiB가 넘는 시간대 원천은 화면에 로드하지 않는다.

```text
그룹 특징 ── stop_group_id + station_name 검증 ── STEP 6 membership
                                                    │ zone_id
STEP 6 권역 프로필 ────────────────────────────────┤
                                                    │ zone_id
STEP 7 전체 평가 ── 값·순서 교차검증 ── STEP 7 최종 6개
                                                    │
                                  지도·후보 목록·비교표·차트
```

`sync-data.mjs`는 변환하지 않고 원본 바이트를 복사한다. `manifest.json`에는 원본 상대 경로, 파일 크기, SHA-256, 분석 버전을 남긴다. 복사본과 manifest는 빌드 산출물에 포함되지만 Git에서는 제외한다.

### 표시 지표 계약

- KPI는 임의 상수가 아니라 실제 그룹 행 수, 관측일, STEP 6 권역 행 수, 최종 후보 행 수에서 읽고 STEP 7 감사 자료와 비교한다.
- 결과: 286개 정류장명 그룹 / 90일 / 26개 공간 평가 단위 / 6개 예비 후보.
- 정렬: STEP 7 `provisional_review_order` 오름차순. 화면에서 재평가하지 않는다.
- 순서: Z06 → Z23 → Z10 → Z22 → Z01 → Z02.
- 지도: STEP 6 `lat`, `lon`을 그대로 사용한다. 새로운 좌표·중심점·반경을 산출하지 않는다. 지도 표시 범위 조정만 Leaflet에 맡긴다.
- 구성 목록은 STEP 7 `names`를 표시용으로 분리하고 정식 membership과 대조한다.
- `n_stops`는 정류장명 그룹 수다. 물리 정류장 개수가 아니다.
- `daily_demand`는 소수 첫째 자리로 표시한다. 데이터의 원래 정밀도는 유지한다.
- `peak_hour`는 **승차 비중−운행 비중의 상대 격차 최대 시간**이다. 승차량 최대 시간으로 바꾸어 설명하지 않는다.
- 후보는 예비 검토 대상이며 도입 확정이나 실제 운영 효과를 뜻하지 않는다.

## 검증

```powershell
npm test
```

38개 데이터 계약 테스트는 실제 원본 CSV와 최종 Notebook을 읽는다. 최종 값·순서·좌표·구성 그룹, 시간·월별 분모, 군집 개수·공간 구성, 설명용 가중치, 중복·누락·잘못된 참조, 빈 CSV, 파싱 오류 및 복사본 SHA-256을 검증한다.

브라우저 검증은 먼저 `npm run dev`를 실행한 터미널을 유지하고 다른 터미널에서 실행한다. 로컬 Google Chrome이 필요하다.

```powershell
npm run test:browser
```

다른 주소를 테스트할 경우:

```powershell
$env:DASHBOARD_URL = 'http://127.0.0.1:4173'
npm run test:browser
```

브라우저 검증 범위:

- 실제 데이터 렌더링·6개 마커
- 지도 → 목록, 목록 → 지도·비교표, 비교표 → 선택 요약
- 세 안내 페이지 이동·직접 새로고침 및 404
- 390px 모바일 메뉴·문서 가로 넘침·팝업 경계
- CSV HTTP 오류·재시도 복구·빈 후보 CSV
- 타일 요청 차단 시 오류 안내 및 마커·선택 유지
- 처리되지 않은 브라우저 런타임 오류

스크린샷은 `test-results/`에 페이지별 `overview`, `temporal`, `zones`, `analysis` 접두사와 `-desktop.png`, `-mobile.png` 이름으로 저장한다.

### 2026-10-13 구현 검증 결과

- `npm run build`: TypeScript 검사·Vite 프로덕션 빌드 성공.
- `npm test`: 실제 CSV 데이터 계약 9개 테스트 통과.
- 개발 서버 `127.0.0.1:5173` 및 빌드 미리보기 `127.0.0.1:4173` 모두 브라우저 검증 통과.
- 데스크톱 1536px 및 모바일 390px 확인. 지도/목록/표 연동, 모바일 팝업 경계, 라우팅·새로고침, 오류·빈 데이터·재시도 확인.
- 브라우저의 처리되지 않은 런타임 오류 0건. 실제 OpenStreetMap 배경 타일 표시도 확인.
- 원본 CSV 6개와 웹용 사본의 바이트·SHA-256 일치. 기존 추적 파일 변경 없음.
- 검증 환경의 재빌드 중 기존 출력 디렉터리 정리 단계에서 조기 종료가 발생해, 검증용 개발 서버 종료와 생성된 `dashboard/dist` 정리 후 표준 빌드를 다시 완료했다. 정리 생략 빌드도 성공했지만 최종 산출물은 정리 후 표준 빌드로 생성했다.
- 검증용 서버는 종료했다. 다시 확인하려면 위 실행 명령을 사용한다.

## 운영 및 후속 개발

- 배경 지도는 외부 OpenStreetMap 표준 타일을 사용하므로 인터넷 연결이 필요하다. 출처 표기를 유지한다. 공개 배포 시 예상 트래픽에 맞춰 [OSM 타일 사용 정책](https://operations.osmfoundation.org/policies/tiles/)과 공급자를 검토한다.
- BrowserRouter를 사용한다. 정적 호스팅은 `/temporal`, `/zones`, `/analysis` 요청을 `index.html`로 되돌리는 SPA fallback을 설정해야 한다.
- 하위 경로 배포 시 Vite의 `base`를 지정한다. 데이터 경로와 Router basename은 `BASE_URL`을 따른다.
- `/zones`는 STEP 6·7의 26개 평가 단위 상세 탐색을 제공한다.
- `/analysis`는 STEP 3 군집과 STEP 4~7의 점수·민감도 결과를 연결한다.
- 임의 날짜·요일 조회는 큰 시간대 자료를 별도 경량 집계하는 설계가 필요하다. 기존 고정 분석 결과와 기간 필터 통계는 구분해야 한다.
- 본 단계에서는 웹 배포·백엔드·데이터베이스·분석 재실행을 수행하지 않는다.

## 구성 참고

- [Vite 시작 안내](https://vite.dev/guide/)
- [Tailwind CSS Vite 설치](https://tailwindcss.com/docs/installation/using-vite)
- [shadcn/ui Vite 구성](https://ui.shadcn.com/docs/installation/vite)
- [React Leaflet 설치](https://react-leaflet.js.org/docs/start-installation/)

로컬 개발 흐름에는 Sites 스킬의 local-only 지침을 참고했다. Sites 등록·동기화·발행 기능은 사용하지 않았다.

## 2차 구현: 시간대별 분석

기존 레이아웃을 유지하고 `/temporal`을 실제 분석 화면으로 구현했다. 기본 선택은 Z06이며 STEP 7 순서 Z06 → Z23 → Z10 → Z22 → Z01 → Z02를 유지한다. 권역 선택은 카드·시간별 비중·격차·월별 비교·설명을 함께 갱신한다. 순위와 선정 점수는 재계산하지 않는다.

### 추가 데이터와 실제 컬럼

| STEP 7 파일 | 행 단위 / 수 | 사용 컬럼 |
|---|---|---|
| `03_hourly_zone_shares.csv` | 권역 × 시간 / 624 | `zone_id`, `hour`, `passenger_count`, `operation_count`, `demand_share`, `supply_share`, `relative_gap` |
| `02_monthly_zone_profiles.csv` | 권역 × 월 / 78 | `zone_id`, `month`, `riders`, `operations`, `observed_days`, `daily_riders`, `daily_operations` |
| `05_provisional_top6_review.csv` | 최종 후보 / 6 | 기존 필드와 `peak_hour_gap`, `peak_hour_riders_90d`, `peak_hour_ops_90d` |
| `04_all_26_zones_scenario_scores.csv` | 전체 평가 단위 / 26 | 위 최대 격차 필드 및 기존 후보 순서·지표 교차 검증 |

기존 동기화 스크립트에 시간·월별 파일 2개만 추가했다. 후보 파일은 기존 사본을 재사용한다. `loadOverviewTables`와 `buildOverview`를 재사용하여 후보를 읽고, 시간·월별 자료를 `zone_id`로 연결한다. 복합 키 `zone_id + hour`, `zone_id + month`의 중복을 차단한다. 정류장명과 물리 정류장 ID를 새로 결합하지 않는다.

### 분모와 산식

STEP 7 Notebook의 `h.groupby(['zone_id','hour']).sum()`과 월별 집계 코드를 대조했다.

- 승차 비중(%) = **권역 구성 정류장명 그룹의 해당 시간 90일 누적 승차량 / 같은 권역의 90일·24시간 전체 누적 승차량 × 100**.
- 운행 비중(%) = **권역 구성 정류장명 그룹의 해당 시간 90일 누적 운행 건수 / 같은 권역의 90일·24시간 전체 누적 운행 건수 × 100**.
- 두 비중은 각각 자체 분모를 사용한다. 그룹별 비율 평균이나 일별 비율 평균, 전체 26개 권역 총량에 대한 비율이 아니다. 운행 건수는 원자료 집계값이며 고유 차량 대수가 아니다.
- CSV 비중은 0~1 척도다. 화면에서는 100배하여 %로, `relative_gap × 100`은 %p로 표시하고 `demand_share − supply_share`와 대조한다.
- 최대 격차는 24시간 중 **부호 있는 차이의 최댓값**이다. 절댓값 최댓값이나 승차량 최댓값이 아니다. 동률이면 시간 오름차순 첫 행을 사용하는 Notebook의 `idxmax`와 같은 규칙이다.
- 월별 일평균 승차량 = `riders / observed_days`, 일평균 운행 = `operations / observed_days`. 관측일은 4월 30일·5월 31일·6월 29일이며 6월 11일은 제외한다. 전체 일평균은 누적 승차량 / 90일이며 월별 평균의 단순 평균과 구분한다.
- 실제 0은 보존한다. 필수 숫자 결측·시간/월 누락은 명시적 오류로 처리하며 0으로 채운 차트를 만들지 않는다. CSV 원정밀도로 검증하고 화면만 반올림한다.

시간별 비중은 두 선과 툴팁으로, 상대 격차는 양수(파랑)·음수(주황)·최대(진한 파랑) 막대와 0 기준선으로 표현한다. 월별 비교는 일평균 승차 막대와 일평균 운행·관측일 표를 사용한다. 월별 24시간 자료가 없어 월별 시간 곡선은 구현하지 않았다. `/zones`, `/analysis`는 이번 범위에서 제외했다.

### 생성·수정 파일

- 생성: `src/data/temporal.ts`, `src/hooks/use-temporal.ts`, `src/components/temporal-charts.tsx`, `src/pages/temporal-page.tsx`, `tests/temporal.test.ts`, `tests/temporal-browser.mjs`.
- 수정: `src/data/overview.ts`(파서·테이블 로더 재사용), `src/App.tsx`(지연 로딩), `src/components/layout.tsx`(예정 표시 제거), `scripts/sync-data.mjs`, `package.json`, `tests/browser.mjs`, `tests/data.test.ts`, `README.md`.
- 자동 생성: `public/data/hourly-zone-shares.csv`, `public/data/monthly-zone-profiles.csv`, `manifest.json`, `dist/`, `test-results/temporal-desktop.png`, `test-results/temporal-mobile.png`. 이 산출물은 기존 Git 제외 규칙을 따른다.
- 원본 분석 CSV와 Notebook은 수정하지 않았다.

### 2차 검증 결과 (2026-10-13)

- TypeScript 및 Vite 프로덕션 빌드 성공. 환경의 기존 `dist` 정리 단계 조기 종료 후, 생성물 경로를 확인하여 정리하고 표준 `npm run build`로 완료했다.
- `npm test`: 17개 통과. 실제 6개 권역의 비중 합 100%, 격차 합 0, 최대 시간 [18,16,15,18,21,7], 월별/시간별 총량, 관측일·일평균, 누락·중복·변조 거부, 모든 사본 SHA-256 검증.
- Chrome: 기존 종합 현황 지도·목록·비교표, 라우팅, 모바일 메뉴, 오류·빈 자료·타일 실패 회귀 통과.
- Chrome: 새 페이지 6개 선택·실제 CSV 지표 대조·차트 전환·툴팁·직접 새로고침·HTTP 오류/재시도·빈 CSV 통과. 처리되지 않은 JS 오류 0건.
- 시간대별 화면 데스크톱 1440px / 모바일 390px 스크린샷 확인. 가로 넘침 없음. 기존 화면은 1536px / 390px 검증.
- 상대 격차가 실제 0인 시간은 높이가 0이므로 Recharts 막대 도형이 생기지 않는다. 브라우저 테스트는 실제 비영 값의 수와 대조하며, 24시간 원자료와 축은 유지한다.

실행·검증 명령은 위와 동일하다. `npm run test:browser`는 종합 현황 회귀와 시간대별 테스트를 함께 실행한다. 후속 작업은 후보 권역 상세와 AI 분석 근거 페이지이며, 임의 월·날짜·요일의 시간 분포를 보려면 원천 시간 자료의 별도 집계가 필요하다.

## 3차 구현: 후보 권역 탐색

`/zones`는 기존 STEP 6·7 결과를 탐색한다. 점수 재계산·후보 재선정·군집화·원본 수정은 하지 않는다. 기존에 동기화된 CSV를 그대로 사용하므로 추가 복사본이나 의존성이 없다. 시간대 원천 대용량 CSV를 다운로드하지 않는다.

### 지도·필터·상세·비교

- 권역 대표점 26개: 최종 예비 후보 6개는 파랑, 나머지 20개는 회색. 선택은 진한 외곽선으로 강조한다. 파란 마커의 숫자는 STEP 7 최종 검토 순서이며 `Zxx`는 식별자다.
- 지도와 목록·상세가 같은 선택 상태를 사용한다. 선택 좌표가 보이지 않으면 지도 안으로 이동한다. 전체 보기는 현재 표시된 권역의 범위에 맞춘다.
- 전체/최종 후보/나머지 필터와 ID·정류장명 부분 검색을 함께 적용한다. 최종 후보는 검토 순서, 나머지는 ID 오름차순. 값과 순위를 재계산하지 않는다.
- 필터·검색 결과에 선택 권역이 없으면 첫 번째 표시 권역을 선택한다. 결과가 없으면 지도·목록에 빈 상태를 표시하고 상세·비교를 숨긴다. 초기화 버튼으로 복구한다.
- 구성 그룹은 `stop_group_id`와 `station_name`을 표시한다. 체크박스를 켜면 선택 권역의 실제 그룹 대표점만 녹색 기호로 표시한다. 좌표 두 값이 모두 없으면 목록은 보존하고 지도 기호만 생략한다. 반쪽 좌표·잘못된 좌표는 오류로 처리한다.
- 상세에는 구성 그룹 수, 일평균 승차량, 최대 상대 격차 시간과 %p, 양의 격차 합, 월별 최소/최대 비율·CV, 4개 시나리오 점수·순위를 표시한다. 최종 후보에만 검토 순서와 상위 6위 포함 횟수를 표시한다.
- 비교 차트는 일평균 승차량(명/일), 양의 격차 합(0–1), 시나리오 점수(0–100)를 별도 축으로 표현한다. 선택한 권역이 최종 후보이면 6개, 나머지이면 최종 6개에 선택 권역을 더해 7개를 비교한다. 4개 시나리오 전환 및 정확한 수치 표를 제공한다.
- 종합 현황의 선택 요약 아래 링크는 `/zones?zone=Zxx`로 선택을 전달한다. 최종 후보 상세는 `/temporal?zone=Zxx`로 같은 후보를 연다. 나머지 권역의 링크는 기존 최종 6개 시간대별 화면으로 안내한다.
- CSV 로딩·오류·빈 결과·재시도, 지도 타일 오류·재시도를 제공한다. 타일이 실패해도 실제 좌표 마커와 목록·상세는 유지한다.

### 사용한 실제 컬럼과 연결

기존 `loadOverviewTables` → `buildOverview`의 감사·키·최종 후보 검증을 재사용하고 `buildZones`에서 26개 전체를 검증한다. 후보 여부는 **최종 6개 CSV의 `zone_id` 집합**으로만 결정한다. 전체 평가 CSV에 있는 7~26의 `provisional_review_order`를 비후보의 최종 검토 순서로 노출하지 않는다.

| 원본 | 실제 사용 컬럼 | 역할 |
|---|---|---|
| STEP 6 `05_complete500_assignments.csv` | `zone_id`, `stop_group_id`, `station_name`, `representative_latitude`, `representative_longitude` | 40개 그룹의 권역 구성과 그룹 대표점 |
| STEP 6 `06_complete500_zone_profiles.csv` | `zone_id`, `n_stop_groups`, `names`, `lat`, `lon`, `diameter_m` | 26개 권역 대표점, 그룹 수·이름 대조, 기록된 최대 거리 |
| STEP 7 `04_all_26_zones_scenario_scores.csv` | `zone_id`, `names`, `n_stops`, `daily_demand`, `daily_ops`, `peak_hour`, `peak_hour_gap`, `positive_gap_sum`, `monthly_cv`, `monthly_min_max_ratio`, `top6_frequency` | 전체 권역 지표; `daily_ops`는 로더에서 검증하며 별도 카드로 노출하지 않음 |
| 같은 전체 평가 CSV | `score_balanced`, `rank_balanced`, `top6_balanced`, `score_demand_priority`, `rank_demand_priority`, `top6_demand_priority`, `score_time_priority`, `rank_time_priority`, `top6_time_priority`, `score_robustness_priority`, `rank_robustness_priority`, `top6_robustness_priority` | 시나리오별 점수·순위·상위 6위 여부 |
| STEP 7 `05_provisional_top6_review.csv` | `zone_id`, `provisional_review_order`, 기존 후보 표시 필드와 위 평가 지표 | 최종 후보 여부·검토 순서, 전체 평가 결과와 값 교차 검증 |
| 기존 그룹 특징·감사 파일 | `stop_group_id`, `station_name`, `observed_days`, 그룹·권역·후보 수 등 기존 감사 필드 | 기존 정류장명 그룹 마스터와 규모 검증 |

권역 프로필과 평가는 `zone_id`의 1:1 결합, 할당 그룹은 `zone_id`의 N:1 결합이다. 그룹 ID·이름 대응은 기존 마스터와 대조한다. 물리 정류장 `station_id`, 일반 `latitude`·`longitude`를 그룹 키·대표 좌표로 대체하지 않는다.

### 좌표 출처와 500m 해석

STEP 6 Notebook을 확인했다. 그룹 대표점 사이의 **Haversine 거리**를 구한 후 Complete Linkage 500m를 적용했다. 권역 CSV의 `lat`·`lon`은 구성 그룹의 `representative_latitude`·`representative_longitude` 산술평균이다. 지도는 이 기록된 좌표를 그대로 사용하며, 평균은 값의 대응 검증에만 이용한다. `diameter_m`도 CSV 기록값을 표시한다.

500m는 구성 그룹 대표점 사이의 최대 거리 조건이다. 중심에서 반경 500m, 도보·도로 주행거리, 행정 경계 또는 실제 운영 영역을 뜻하지 않는다. 지도에 서비스 반경 원·폴리곤을 만들지 않았다. 그룹 대표점의 `CircleMarker`는 고정 7픽셀의 화면 기호이며 지리적 반경이 아니다. 대표점은 배차 지점이나 정확한 승차 시설 위치가 아니다.

### 지표 해석

- `daily_demand`: 구성 그룹의 `avg_daily_passengers`를 합산한 기존 STEP 7 결과. 단위 명/일, 관측 90일.
- `positive_gap_sum`: 권역 시간별 `demand_share - supply_share` 중 양수의 합. 0–1 척도를 그대로 표시한다. 구성 그룹의 `median_mismatch`와 합치지 않는다.
- `peak_hour_gap × 100`: 최대 차이 시간의 상대 격차(%p). 승차량 최대 시간 또는 공급 부족 확정 지표로 설명하지 않는다.
- 두 시간 비중의 분모는 각 권역의 90일·24시간 승차·운행 누적 총량으로 각각 다르다.
- `monthly_min_max_ratio`: 3개월 일평균 승차량의 최소/최대 비율. `monthly_cv`: 같은 3개 일평균의 표본 표준편차(ddof=1)/평균. 월 관측일 30·31·29일; 6월 11일 제외.
- 4개 시나리오의 `score_*`는 26개 권역 안에서 구한 백분위 지표의 가중합이다. 기존 CSV만 읽고 웹에서 다시 계산하지 않는다. 점수는 도입 효과·운영 효율의 절대 평가가 아니다. `rank_*`와 최종 검토 순서를 구분한다.

### 생성·수정 파일

- 생성: `src/types/zones.ts`, `src/data/zones.ts`, `src/hooks/use-zones.ts`, `src/pages/zones-page.tsx`.
- 생성: `src/components/zones/zone-map.tsx`, `zone-list.tsx`, `zone-detail.tsx`, `zone-comparison.tsx`.
- 생성: `tests/zones.test.ts`, `tests/zones-browser.mjs`.
- 수정: `src/App.tsx`, `src/components/layout.tsx`, `src/index.css`, `src/pages/overview-page.tsx`, `src/pages/temporal-page.tsx`, `tests/browser.mjs`, `package.json`, `README.md`.
- 자동 생성: `dist/`, `test-results/zones-desktop.png`, `test-results/zones-mobile.png`와 검증 로그. 기존 Git 제외 규칙을 따른다.
- CSV 동기화 스크립트·원본 CSV·Notebook·기존 분석 결과는 수정하지 않았다.

실행은 `npm run dev`, 빌드는 `npm run build`, 단위 검증은 `npm test`다. `npm run test:browser`는 실행 중인 로컬 서버에 대해 종합 현황·시간대별·권역 탐색 3개 검증을 순서대로 실행한다. 다른 포트는 `DASHBOARD_URL`로 지정한다.

후속 범위는 `/analysis` 구현이다. 이번 요청 범위의 권역 탐색 기능은 모두 구현했으며, 신규 군집화·AI 재학습·OD/이동 경로 추정·실제 운영 경계·백엔드/DB는 범위에서 제외했다.

### 3차 검증 결과 (2026-10-13)

- `npm test`: 기존 17개 + 권역 계약 13개, 총 30개 통과. 실제 26개 전체의 수치·그룹·좌표, 후보 6/나머지 20, 최종 순서, 필터·검색, 중복·잘못된 참조, 결측·범위 밖 좌표·대표점 불일치, 빈 자료를 검증했다.
- `npm run build`: TypeScript 및 Vite 프로덕션 빌드 성공. 권역 페이지와 지도는 별도 청크로 지연 로딩한다. 환경의 기존 출력 정리 문제를 피하려고 경로 검증 후 생성된 `dist/`만 정리해 표준 빌드를 실행했다.
- Chrome 개발 서버: 기존 종합 현황 회귀와 시간대별 페이지 검증 통과. 지도·목록·표, 시간대별 선택·차트, 라우팅·직접 새로고침, 모바일·오류·빈 상태·재시도를 확인했다.
- Chrome 최종 프로덕션 미리보기: 권역 탐색 자동 검증 통과. 26개 전부 선택하여 실제 CSV 지표·구성 그룹과 대조했고, 26/6/20 마커·목록, ID·이름 검색과 빈 결과, 그룹 대표점, 6/7개 비교 및 시나리오 전환을 확인했다.
- 종합 현황 → 권역 → 시간대별 페이지의 선택 전달, 쿼리 포함 직접 새로고침, CSV HTTP 실패·재시도·빈 파일, 비후보 좌표 결측, 타일 실패 중 마커·선택 유지도 통과했다.
- 데스크톱 1536px, 모바일 390px 스크린샷을 확인했다. 문서 가로 넘침 없음, 모바일 팝업 지도 경계 안 유지. 처리되지 않은 브라우저 JavaScript 오류 0건.
- 구성 그룹 레이어 기호의 CSS 클래스는 생성 시 옵션으로 전달하여 개발/프로덕션 렌더링 차이를 해소했다.
- 최종 캡처: `test-results/zones-desktop.png`, `test-results/zones-mobile.png`. 검증용 서버는 종료하고 로컬 산출물을 유지한다.

## 4차 구현: AI 분석 및 선정 근거

`/analysis`는 최종 STEP 1~7의 기존 결과를 설명하는 화면이다. 새로운 분석·학습·후보 선정·점수 계산은 하지 않는다. 기존 디자인과 데이터 계약을 재사용하며, 각 페이지는 라우트별로 지연 로딩한다.

### 화면과 근거

- 실제 규모 카드: 90일, 286개 정류장명 그룹, 26개 평가 권역, 6개 예비 후보. 확장 특징의 대표 좌표로 확보 249/미확보 37개를 검증한다. 6월 11일 제외와 물리 정류장 단위와의 차이를 명시한다.
- STEP 1~7을 잇는 선택형 프로세스: 각 단계의 목적·방법·실제 결과·다음 단계·한계와 근거 Notebook 파일명을 표시한다. STEP 1은 EDA·상관분석·특성 확장, STEP 2는 K-means 비교이며 STEP 2.5의 군집 진단을 함께 설명한다.
- STEP 3: KMeans_FULL8 레이블을 집계한 196/65/25개 막대와 비율, 원본 프로필의 군집별 중앙값. GMM_ROUTE6는 별도 비교 모델이며 56/208/22개, PCA 차원·실루엣을 펼쳐 볼 수 있다. 군집 번호는 순위가 아니고 군집 1도 자동 후보가 아니다.
- STEP 4: 실제 4개 지표의 컬럼·방향·단위 및 가중치 표. 수요 기준 3개(286/214/143개) × 가중치 4개 = 12개 조건으로 설명한다. 전체 286개 안에서 `rank(pct=True, method='average') × 100`으로 정규화한 기존 분석이다. 군집 레이블은 점수 가산에 사용하지 않았다.
- STEP 5: Haversine DBSCAN, min_samples=1, 20/40/60개 풀과 300/500/800m 비교를 설명한다. 기준 40개·500m의 22개 탐색 단위를 최종 권역과 구분한다. 동일 풀을 비교한 STEP 6의 DBSCAN 최대 지름 1,254.2m는 연쇄 연결의 예로 제시한다.
- STEP 6: 같은 40개 그룹에서 Complete Linkage 500m 결과 26개(다중 12/단일 14)로 연결한다. 500m는 구성 그룹 대표점 사이의 최대 거리 조건이며 도보권·서비스 반경이 아니다. `/zones` 링크 제공.
- STEP 7: 최종 6개 × 4개 시나리오 순위 히트맵, 상위 6위 포함 횟수 막대, 실제 순위 중앙값·balanced 점수, 가중치 설명. 전체 26개 점수 차트·표는 펼쳐서 4개 시나리오를 전환한다. 비교 차트는 ID순으로 고정하며 후보를 재선정하지 않는다.
- 후보별 `/zones?zone=Zxx`, `/temporal?zone=Zxx` 연결. 기존 종합 현황의 분석 과정 링크와 공통 사이드바를 그대로 사용한다.
- 예비 검토·시간 분포 격차의 한계, OD·운영 시뮬레이션 부재를 상단·관련 단계·하단에서 구분해 설명한다.

### 실제 사용 CSV와 컬럼

기존 브라우저용 `groups.csv`에는 군집 레이블이 없고 `memberships.csv`의 군집 레이블은 공간 후보 40개에 한정된다. 전체 286개를 설명하기 위해 STEP 3 최종 할당 원본을 1개 추가했다. 데이터셋 폴더의 같은 할당 사본을 중복 복사하지 않는다. 다음 5개 작은 근거 파일만 기존 동기화 스크립트에 추가했다.

| 원본 (STEP 결과 폴더) | 행 수 | 배포용 파일 | 사용 컬럼 |
|---|---:|---|---|
| STEP 3 `02_station_assignments_286.csv` | 286 | `cluster-assignments.csv` | `station_name`, `stop_group_id`, `KMeans_FULL8`, `GMM_ROUTE6` |
| STEP 3 `03_cluster_profiles_KMeans_FULL8.csv` | 3 | `cluster-profiles.csv` | `KMeans_FULL8`, `count`, `avg_daily_passengers`, `avg_daily_operations`, `temporal_mismatch` (군집별 중앙값) |
| STEP 3 `01_candidate_model_metrics.csv` | 2 | `model-metrics.csv` | `model`, `silhouette_in_PCA`, `pca_components`, `cluster_sizes`, `min_cluster` |
| STEP 4 `01_eligibility_summary.csv` | 3 | `eligibility.csv` | `scenario`, `cutoff`, `eligible_count` |
| STEP 6 `01_algorithm_radius_comparison.csv` | 6 | `spatial-comparison.csv` | `method`, `radius_m`, `n_groups`, `n_multistop`, `n_singletons`, `max_group_diameter_m`; `largest_group`도 스키마 확인 |

STEP 3 전체 경로는 `STEP별 결과 파일/Michuhol_IMOD_STEP3_Interpretation_Results/`, STEP 4는 `Michuhol_IMOD_STEP4_Candidate_Screening_Results/`, STEP 6은 기존 `Michuhol_IMOD_STEP6_Spatial_Stability_Results/`다. 정확한 원본·사본 매핑은 `src/data/analysis-sources.ts`와 `public/data/manifest.json`에 기록한다.

기존 6개 공통 CSV는 그대로 재사용한다. 확장 특징의 `representative_latitude`·`representative_longitude`로 좌표 확보 그룹 수를 세고, STEP 6 할당·권역 프로필로 40개→26개 및 12/14 구성을 대조한다. STEP 7 전체 평가·최종 후보의 `median_rank`를 추가로 읽고 기존 `score_*`, `rank_*`, `top6_*`, `top6_frequency`, `provisional_review_order`와 함께 표시한다. 정확한 점수·순위 필드는 앞 절의 3차 구현 표와 같다.

`loadOverviewTables` → `buildZones`의 기존 26개 검증을 재사용한다. 군집 할당은 `stop_group_id`로 그룹 마스터와 1:1 대응시키고 `station_name`도 일치해야 한다. 군집 집계와 프로필·모델 지표의 개수를 대조하고, 권역 구성은 STEP 6 비교 결과와 대조한다. 숫자 결측은 0으로 바꾸지 않으며 누락·중복·잘못된 레이블·불일치에 오류를 표시한다.

### 최종 선정 규칙과 재계산 방지

STEP 7 Notebook의 실행 코드는 다음 순서다.

1. `top6_frequency` 내림차순.
2. `median_rank` 오름차순.
3. `score_balanced` 내림차순.

화면은 이 기준을 설명하고 CSV의 최종 검토 순서 **Z06 → Z23 → Z10 → Z22 → Z01 → Z02**를 보존한다. `mean_rank`를 동률 해소 기준으로 쓰지 않는다. 후보 여부는 최종 6개 파일로 결정하며, 히트맵은 전체 26개 안에서의 시나리오 순위를 표시한다.

가중치는 CSV에 저장되어 있지 않아 최종 Notebook의 `weights` 딕셔너리를 `analysis-methodology.ts`에 설명용으로 옮겼다. STEP 4는 `demand/mismatch/low_supply/intensity` 4개 지표, STEP 7은 `demand/mismatch/low_supply/repeat/month_stable` 5개 지표다. `p_service_intensity`는 STEP 7 가중합에 사용하지 않는다. 두 단계의 같은 시나리오 이름도 모집단·지표·가중치가 달라 별도 테이블로 표시한다. “16개로 최종 선정”이라고 합치지 않는다.

웹에서는 이 가중치를 점수 계산에 사용하지 않는다. 점수·순위·중앙값은 CSV에서 읽는다. 비율은 군집 개수/286×100, 그룹·권역 수는 기존 결과의 개수이며 순위 중앙값은 기존 값의 검증만 한다. STEP 3 프로필 중앙값도 새로 산출하지 않고 원본을 읽는다.

### 변경 파일과 구현하지 않은 항목

- 생성: `src/data/analysis-sources.ts`, `analysis-methodology.ts`, `analysis.ts`, `src/hooks/use-analysis.ts`, `src/pages/analysis-page.tsx`.
- 생성: `src/components/analysis/method-sections.tsx`, `cluster-section.tsx`, `selection-section.tsx`.
- 생성: `tests/analysis.test.ts`, `tests/analysis-browser.mjs`.
- 수정: `scripts/sync-data.mjs`, `src/App.tsx`, `src/components/layout.tsx`, `tests/browser.mjs`, `package.json`, `README.md`.
- 자동 생성: 5개 배포 CSV와 manifest, `dist/`, `test-results/analysis-desktop.png`, `analysis-mobile.png`. 기존 Git 제외 규칙을 따른다.
- 기존 원본 CSV·Notebook·분석 보고서는 변경하지 않았다.

최종 STEP 3 모델의 개별 PC1·PC2 좌표 CSV가 없으므로 PCA 산점도를 생성하지 않았다. STEP 2.5의 다른 전처리 실험 PNG를 최종 좌표로 대신하지도 않았다. OD 추정, 실제 운행 시뮬레이션, 신규 모델·공간 분석, 백엔드·DB는 요청 범위에서 제외했다. 이전 STEP 8 산출물은 읽지 않는다.

실행은 `npm run dev`, 단위 검증은 `npm test`, 빌드는 `npm run build`다. 실행 중인 개발 또는 미리보기 서버를 대상으로 `npm run test:browser`를 실행하면 네 페이지의 검증을 순서대로 수행한다. 다른 주소는 `DASHBOARD_URL` 환경변수로 지정한다.

### 4차 검증 결과 (2026-10-14)

- `npm test`: 총 38개 통과. 기존 30개와 분석 근거 8개를 포함한다.
- 군집 196/65/25, GMM 56/208/22, 좌표 확보/미확보 249/37, 관측 90일, 공간 40→26(12/14), 최종 순서와 포함 횟수를 실제 CSV에서 확인했다.
- STEP 4의 12개 조건·2,572행을 원본 순위 CSV와 확인하고 STEP 5의 40개·500m 결과 8개 다중/14개 단일을 원본 공간 요약과 대조했다. 이 두 검증 전용 CSV는 브라우저에 추가 다운로드하지 않는다.
- STEP 4·7 가중치를 Notebook 코드에서 읽어 설명용 설정과 비교했다. STEP 7 실제 정렬 코드의 `top6_frequency`, `median_rank`, `score_balanced`와 방향도 확인했다.
- `npm run build`: TypeScript·Vite 프로덕션 빌드 성공. 데이터 13개 사본은 총 230,015바이트이며 원본 바이트·SHA-256 검증을 통과했다.
- 최종 프로덕션 미리보기의 Chrome에서 기존 종합 현황·시간대별·권역 탐색 3개 회귀 검증 통과.
- 분석 페이지: 7개 과정 선택, 군집 규모, 6×4 순위·점수 툴팁, 26×4 전체 점수/순위 대조, 시나리오 전환, 페이지 간 선택 전달, 새로고침, HTTP 오류·재시도·빈 자료·중복 거부 통과.
- 데스크톱 1536px / 모바일 390px 화면을 캡처하고 확인했다. 문서 가로 넘침 없음, 모바일 순위 표 내부 가로 스크롤 확인, 처리되지 않은 브라우저 JavaScript 오류 0건.
- 대용량 원천 파일 검증은 `StopGroup_Hourly`·STEP 8·`final_dataset` 요청을 구분해 확인한다. 기존 `/temporal` 링크가 사용하는 경량 `hourly-zone-shares.csv`는 정상 요청이다.
- 캡처: `test-results/analysis-desktop.png`, `test-results/analysis-mobile.png`. 검증용 서버는 종료했다.
