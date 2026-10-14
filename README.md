# I-MOD insight

공공데이터 기반 인천 미추홀구 버스 이용·운행 패턴을 살펴보고, **I-MOD 운영을 추가 검토할 예비 후보 권역**을 탐색하는 데이터 분석 대시보드입니다. 공공데이터 활용 AI 데이터 분석 경진대회 프로젝트의 기존 STEP 1–7 결과 CSV를 React 웹 화면으로 전달합니다.

> 배포 URL: **배포 후 이곳에 추가 예정** — 현재 공개 서비스 주소를 등록하지 않았습니다.

## 문제 정의와 분석 범위

버스 이용자가 많다는 사실만으로 교통 서비스가 부족하다고 판단할 수는 없습니다. 이용 규모뿐 아니라 이용·운행의 시간적 분포, 월별 변동 등 여러 특성을 비교하여 현장 검토 대상을 좁혔습니다. 화면은 이미 완료된 분석 결과를 읽으며, 모델 재학습이나 후보 재선정은 수행하지 않습니다.

- 지역: 인천광역시 미추홀구
- 기간: **2026년 4–6월, 유효 관측일 90일**(6월 11일 제외)
- 흐름: **정류장명 그룹 286개 → 공간 검토 그룹 40개 → 평가 권역 26개 → 예비 후보 6개**
- 최종 검토 순서: **Z06 → Z23 → Z10 → Z22 → Z01 → Z02**

단순 승차량 순위가 아니라 그룹 특성 분석·후보 선별·공간 권역화 후 4개 가중치 시나리오를 종합한 결과입니다. 정류장명 그룹은 물리 정류장 ID와 다른 분석 단위입니다.

## 대시보드

| 경로 | 내용 |
| --- | --- |
| `/` 종합 현황 | 분석 규모, 최종 후보 지도·목록·비교 |
| `/temporal` 시간대별 분석 | 후보별 24시간 승차·운행 비중과 차이, 월별 일평균 |
| `/zones` 후보 권역 탐색 | 26개 권역 지도·검색·필터, 선택 권역 요약과 상세 비교 |
| `/analysis` AI 분석 및 선정 근거 | 286→40→26→6 흐름, 선정 규칙·후보, 펼쳐 보는 STEP 1–7 근거 |

`/zones?zone=Z06`, `/temporal?zone=Z06`처럼 URL로 선택 권역을 전달합니다.

## 기술 스택

React · TypeScript · Vite · Tailwind CSS · shadcn/ui 방식의 로컬 컴포넌트 · Recharts · React Leaflet · React Router. CSV 파싱은 Papa Parse, 검증은 Vitest와 Playwright를 사용합니다. 별도 백엔드·데이터베이스·API 키는 필요하지 않습니다.

## 설치·실행·검증

Node.js **22.12 이상**이 필요하며 검증 환경은 Node.js 24입니다. 저장소 전체를 내려받아야 합니다. `dashboard/`만 복사하면 상위 폴더의 분석 CSV를 읽을 수 없습니다.

프로젝트 루트의 터미널에서:

```powershell
cd dashboard
npm ci
npm run dev
```

처음 설치할 때 `npm install`도 사용할 수 있습니다. 잠금 파일의 동일 버전 설치에는 `npm ci`를 권장합니다. 터미널의 로컬 주소(기본 `http://127.0.0.1:5173`)를 열어 주세요.

루트에 `package.json`은 없습니다. 설치 후 루트에서 바로 실행하려면 `npm --prefix dashboard run dev`를 사용하세요.

```powershell
# dashboard/에서 실행
npm test
npm run build
npm run preview -- --port 4177 --strictPort
```

빌드 결과는 `dashboard/dist/`입니다. `dev`, `build`, `test` 전에 13개 최종 CSV를 `public/data/`에 원본 바이트 그대로 동기화합니다. 원본은 수정하지 않으며 `manifest.json`에 경로와 SHA-256을 기록합니다.

브라우저 검증은 설치된 Google Chrome을 사용합니다. 미리보기 서버가 실행 중일 때 **별도 터미널**에서:

```powershell
cd dashboard
$env:DASHBOARD_URL='http://127.0.0.1:4177'
npm run test:browser
```

단위·통합 테스트는 40개입니다. Git에서 제외한 `dataset_raw/3. 미추홀구 버스 정류장.csv`가 없는 새 체크아웃에서는 원천 물리 정류장 개수 검증 1개만 명시적으로 건너뜁니다. 나머지 39개는 배포용 CSV와 추적된 Notebook으로 검증합니다. 원천 파일이 있으면 40개 모두 실행합니다.

## 폴더 구조

```text
README.md                 프로젝트 소개·실행 안내
 dashboard/               웹 애플리케이션
   src/                   페이지·컴포넌트·데이터 로더
   public/                정적 파일 (data/는 자동 생성)
   scripts/sync-data.mjs   최종 CSV 동기화
   tests/                 데이터·브라우저 검증
   docs/                  개선·배포 검수 보고서
   README.md              개발·데이터 계약 상세 문서
 dataset/                 전처리·분석용 CSV
 dataset_raw/             원천 자료 (로컬 보관, Git 제외)
 COLAB code/              분석 Notebook
 docs/                    분석 과정·결과 문서
 STEP별 결과 파일/         단계별 최종 CSV·시각화
```

## 데이터 출처와 한계

프로젝트 연구 문서에 정리된 인천 대중교통 통계 API, 전국 버스정류장 표준정보, 인천 버스노선별 정류장 현황 등을 활용한 기존 분석입니다. 정류장별 이용승객 현황과 버스정보관리시스템 노드현황은 보완·참고 자료입니다. 상세 수집·결합 과정은 [연구 정리본](docs/연구%20정리본/연구%20정리본%20565b43a48dc58234a95f01b21f9dd2ba.md), 실제 CSV 경로·컬럼은 [개발 README](dashboard/README.md)에 있습니다. 배경 지도는 OpenStreetMap 타일을 사용합니다.

- 예비 후보는 **도입 확정 지역이 아닙니다**. 순위는 상대 평가 결과이며 효과나 성공 확률이 아닙니다.
- 시간별 승차 비중은 해당 권역의 90일·24시간 누적 승차량, 운행 비중은 같은 범위의 누적 운행 건수를 각각 분모로 사용합니다. 두 비중 차이는 %p이며 실제 공급 부족·미충족 수요를 직접 입증하지 않습니다.
- 월별 일평균은 각 월 관측일 30/31/29일 기준입니다. 운행 건수는 고유 차량 대수가 아닙니다.
- Complete Linkage 500m는 그룹 대표점 간 최대 거리 조건이며 운행 반경·서비스 경계가 아닙니다.
- OD·차량 수용력·현장 접근성·실제 운영 효과는 이 화면에서 검증하지 않습니다. 결측을 임의로 0으로 만들지 않습니다.

## Vercel 배포 준비

저장소를 GitHub에 반영하고 Vercel에서 Import할 때 다음 설정을 사용합니다. **현재는 준비만 수행했으며 배포는 실행하지 않았습니다.**

| 설정 | 값 |
| --- | --- |
| Framework Preset | Vite |
| Root Directory | `dashboard` |
| Install Command | `npm ci` |
| Build Command | `npm run build` |
| Output Directory | `dist` |
| Node.js | 24.x |
| Environment Variables | 필수 값 없음 |
| Include source files outside of the Root Directory in the Build Step | **켜짐 확인 필수** |

동기화가 상위 `dataset/`, `STEP별 결과 파일/`을 읽습니다. 앱 폴더만 포함하면 `prebuild`가 실패합니다. [Vercel 상위 소스 포함 설정](https://vercel.com/docs/monorepos/monorepo-faq)을 확인하세요.

`dashboard/vercel.json`에는 [Vercel Vite SPA 안내](https://vercel.com/docs/frameworks/frontend/vite)에 따른 rewrite를 추가했습니다. `/temporal`, `/zones`, `/analysis` 직접 접근·새로고침을 React Router가 처리합니다. CSV는 `dist/data/`, 자산은 `dist/assets/`로 복사되며 `?zone=Zxx`는 클라이언트가 읽습니다.

Import → 설정 검토 → 사용자가 배포 실행 → 공개 URL에서 직접 경로·쿼리·CSV·지도·새로고침 확인 → 상단 배포 URL 업데이트 순서로 마무리합니다. 로컬 미리보기 검증은 실제 호스팅 검증을 대신하지 않습니다.

Netlify도 전체 저장소를 연결하고 Base directory `dashboard`, Build command `npm run build`, Publish directory `dist`로 지정할 수 있습니다. `public/_redirects`가 빌드에 복사되어 SPA 경로를 처리합니다. [Netlify Base/Publish 설정](https://docs.netlify.com/build/configure-builds/monorepos/)을 참고하세요. 배경 지도 타일 실패 시 오류 안내·재시도를 표시하고 후보 좌표·목록은 유지합니다.

## 화면 스크린샷

실제 화면을 첨부할 자리입니다. 브라우저 검증이 생성한 `dashboard/test-results/final-*-desktop.png`, `final-*-mobile.png` 중 최종 화면을 골라 `docs/screenshots/`에 복사한 후 아래 주석을 이미지 링크로 바꾸세요. 현재 존재하지 않는 이미지 링크는 노출하지 않았습니다.

<!-- ![종합 현황](docs/screenshots/overview-desktop.png) -->
<!-- ![시간대별 분석](docs/screenshots/temporal-desktop.png) -->
<!-- ![후보 권역 탐색](docs/screenshots/zones-desktop.png) -->
<!-- ![AI 분석 및 선정 근거](docs/screenshots/analysis-desktop.png) -->

## Git 포함·제외

포함: 웹 소스·설정·테스트·문서·`package-lock.json`, 동기화에 필요한 기존 최종 CSV, 분석 근거 Notebook. 분석 파일의 기존 위치는 유지합니다.

제외: `node_modules/`, `dist/`, 자동 생성 `public/data/`, `test-results/`, 로그·캐시·`.env*`·`.vercel/`·`.netlify/`, `dataset_raw/`, 대용량 `dataset/04_StopGroup_Hourly_2026Q2.csv`. 공개용으로 선별한 스크린샷만 별도 문서 폴더에 포함하세요.

자세한 구현·데이터 계약은 [dashboard/README.md](dashboard/README.md)에 보존합니다.
