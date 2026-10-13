# I-MOD 인사이트 — 종합 현황·시간대별 분석

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

`predev`, `prebuild`, `pretest`는 필요한 CSV 8개를 `public/data/`로 자동 동기화한다. 같은 바이트의 파일은 다시 쓰지 않는다. 원본 파일과 상대 경로가 있는 **저장소 전체**에서 실행해야 한다. `dashboard/`만 별도로 복사하면 데이터 동기화에 실패한다. 운영 시에는 `dist/`만 정적 호스팅하면 된다.

## 구현 범위

| 경로 | 현재 구현 |
|---|---|
| `/` | 프로젝트 소개, 실제 CSV 기반 KPI 4개, 최종 후보 지도·목록·비교표·수요 비교 차트, 시간대별 분석 안내, 데이터 출처 |
| `/temporal` | 6개 후보 선택, 시간별 비중 선그래프·상대 격차 막대, 월별 일평균·운행 표, 동적 해석·집계 기준 |
| `/zones` | 라우팅과 후속 개발 안내 |
| `/analysis` | 라우팅과 후속 개발 안내 |
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
- Recharts: 최종 6개 후보의 일평균 승차량 가로 막대
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
      placeholder-page.tsx           후속 3페이지·404
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

시간·월별 CSV를 포함한 총 용량은 196,925바이트다. 100MiB가 넘는 시간대 원천은 화면에 로드하지 않는다.

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

9개 데이터 계약 테스트는 실제 원본 CSV를 읽는다. 최종 값·순서·좌표·구성 그룹, 행 순서 변경 시 조인, 중복 키, 좌표 결측, 그룹 이름 불일치, 최종 결과 불일치, 빈 CSV, CSV 파싱 오류, 복사본 SHA-256을 검증한다.

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

스크린샷은 `test-results/overview-desktop.png`, `test-results/overview-mobile.png`에 저장한다.

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
- 이후 `/zones`에는 26개 평가 단위의 상세 탐색을 구현할 수 있다.
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
