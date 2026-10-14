# 최종 문구 및 정적 배포 준비

## 변경 내용

- 후보 요약을 선정 이유와 추가 확인의 필요성 중심으로 수정했다. 최종 후보는 실제 `top6Frequency`를 사용하고, 4회면 ‘4가지 평가 방식 모두’, 그 외에는 실제 횟수로 설명한다. STEP 7 종합 결과로 선정되었음을 명시한다.
- 시간은 실제 `peakHour`를 오전/오후로 표현한다. 승차 비중−운행 비중의 차이가 최대인 시간이며 최적 운영 시간으로 단정하지 않는다.
- 비후보는 선정 문구 대신 관측 분포를 비교할 수 있다는 설명과 해석의 한계를 표시한다. 기존 지표 카드와 상세 분석을 유지한다.
- 선정 규칙 앞에 ‘왜 승차량만으로 선정하지 않았을까요?’ 카드를 추가했다. STEP 7 정렬 규칙·데이터 설명은 그대로 유지한다.
- 루트 `README.md`를 새로 작성했다. 소개·문제 정의·기간·분석 흐름·4개 페이지·스택·실행·폴더·출처·한계·배포 설정·스크린샷 자리를 제공한다. 개발 README의 기존 내용은 보존한다.

## 발견한 배포 조건과 대응

1. `prebuild`가 상위 `dataset/` 및 `STEP별 결과 파일/`에서 CSV 13개를 읽는다. 앱 폴더만 배포 소스로 가져오면 실패한다. Vercel Root Directory는 `dashboard`로 설정하고 **Include source files outside of the Root Directory in the Build Step**을 켜야 한다. 별도 CSV 사본을 Git에 중복 저장하지 않는다.
2. BrowserRouter의 직접 경로 접근을 위해 `dashboard/vercel.json`에 SPA rewrite를 추가했다. Netlify용 `public/_redirects`도 추가했다. Vite 기본 base `/` 및 `BASE_URL` 기반 데이터 로더는 유지한다. GitHub Pages의 저장소 하위 경로 배포는 이번 설정의 대상이 아니다.
3. 원천 정류장 CSV는 Git에서 제외되어 새 체크아웃의 테스트 한 개가 실패할 수 있었다. 원천 파일이 있을 때만 502개 물리 정류장 검증을 실행하도록 `skipIf`를 명시했다. 분석용 13개 CSV의 필수 검증은 건너뛰지 않는다. 테스트 정의 40개를 유지한다.
4. `.vercel/`, `.netlify/` 로컬 메타데이터를 Git 제외에 추가했다. 기존 원천·대용량 시간별 데이터, `node_modules`, `dist`, 생성 CSV 및 검증 산출물 제외 규칙은 유지했다. 추적 중인 원천 파일은 없고, 가장 큰 추적 파일도 약 1.14MB로 확인했다.

5. 클린 환경에서 CSS 산출량이 달라지는 것을 확인했다. `src/index.css`의 Tailwind source를 `./`(현재 src 디렉터리)로 지정해 문서·검증 폴더가 클래스 탐색에 섞이지 않도록 했다. 재빌드 후 두 환경의 전체 출력 30개 파일이 동일했다. [Tailwind source 설정](https://tailwindcss.com/docs/detecting-classes-in-source-files)에 따른 범위 지정이며 UI 스타일은 유지한다.

## 경로와 데이터

- 출력: `dashboard/dist/`.
- 브라우저 데이터: `/data/*.csv`, 원본 대응·SHA-256은 `/data/manifest.json`.
- `npm run build`는 `prebuild` 동기화를 자동 실행한다. `vite build`만 직접 실행하면 이 단계를 건너뛰므로 배포 명령으로 사용하지 않는다.
- `/temporal`, `/zones`, `/analysis`는 SPA rewrite 이후 React Router에서 처리하며 `?zone=Zxx` 선택은 유지한다.
- 지도는 `tile.openstreetmap.org` 외부 타일을 사용한다. 실패 시 오류·재시도와 좌표·목록을 제공한다. 실제 배포에서는 네트워크와 타일 이용 정책도 확인해야 한다.
- 분석 원본, Notebook, CSV와 최종 후보·점수·순위를 수정하지 않았다.

## 배포 설정

Vercel: 저장소 Import → Vite → Root `dashboard` → Install `npm ci` → Build `npm run build` → Output `dist` → Node 24.x → 상위 소스 포함 확인. 필수 환경변수는 없다. 이 단계까지 설정을 검토한 뒤 사용자가 배포를 실행한다.

Netlify: 전체 저장소 연결, Base `dashboard`, Build `npm run build`, Publish `dist`. 빌드에 복사되는 `_redirects`를 사용한다. 이 작업에서는 두 호스팅 서비스에 로그인하거나 배포하지 않았다.

배포 후 사용자 확인: `/`, 세 개 하위 라우트 직접 진입·새로고침, `/zones?zone=Z23`와 시간대별 전달, `/data/top6.csv`가 HTML이 아닌 CSV로 반환되는지, 지도 타일과 오류 복구. 이후 루트 README의 배포 URL·스크린샷 자리를 채운다.

공식 참고: [Vercel Vite SPA](https://vercel.com/docs/frameworks/frontend/vite), [Vercel 상위 소스 포함](https://vercel.com/docs/monorepos/monorepo-faq), [Netlify 디렉터리 설정](https://docs.netlify.com/build/configure-builds/monorepos/).

## Git에 반영할 파일

루트 README·`.gitignore`, 두 문구 컴포넌트·Tailwind 탐색 범위, 수정된 브라우저 테스트와 원천 조건부 테스트, `dashboard/vercel.json`, `dashboard/public/_redirects`, 이 보고서와 개발 README 링크를 포함한다. 기존 최종 CSV·Notebook·잠금 파일은 계속 추적한다.

`node_modules/`, `dist/`, `public/data/`, `test-results/`, `.env*`, 로그·호스팅 메타데이터·원천 파일은 포함하지 않는다. 클린 빌드 검사용 복사본은 Git에서 제외된 `dashboard/test-results/deploy-clean-20261014/`에 있다. 커밋·푸시·실제 배포는 수행하지 않았다.


## 검증 결과 (2026-10-14)

- 작업 폴더 `npm test`: 40개 통과.
- Git 추적 파일과 신규 배포 설정만 복사한 격리 환경에서 `npm install --no-audit --no-fund` 성공. 기존 node_modules·dist·생성 CSV·원천 자료 없이 시작했다. 설치 전후 의존성 버전 변화 없음. 원래 저장소의 잠금 파일은 수정하지 않았다.
- 클린 환경 `npm test`: 39개 통과, 미배포 원천 자료 검증 1개 명시적 skip.
- 작업 폴더와 클린 환경 모두 `npm run build` 성공. 최종 출력 30개 파일의 SHA-256이 모두 동일했다.
- 정적 HTTP 요청으로 CSV 13개가 manifest의 원본 SHA-256과 일치함을 확인. `_redirects`의 dist 복사 및 하위 라우트·쿼리의 미리보기 응답 확인.
- Chrome 프로덕션 미리보기에서 `npm run test:browser` 전체 통과. 1536px·390px에서 가로 넘침 및 정상 탐색의 콘솔·JavaScript 오류 없음. 26개 권역의 새 설명은 실제 포함 횟수·최대 시간과 대조하며 비후보에 선정 문구가 없음을 검증한다. 최종 UX 캡처는 `dashboard/test-results/final-*.png`에 저장한다.
- 실제 Vercel/Netlify 배포 환경은 실행하지 않았으므로 호스팅 rewrite의 최종 동작은 배포 후 확인해야 한다. 클린 빌드 검증은 Windows/Node 24 환경이다.
