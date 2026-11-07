# QA 결과

검증일: 2026-11-08 (Asia/Seoul)
환경: Windows, Python 3.12, Streamlit 1.63.0, 실제 인앱 브라우저의 iframe 내부 UI. 독립 Playwright 패키지는 설치되지 않았으나 브라우저 도구가 제공하는 Playwright locator로 실제 클릭과 DOM 측정을 수행했습니다.

## 통과

- 초기 `Tiny Survey` 제목과 설문 첫 화면 표시
- 시작 → 설문 3문항(서로 다른 선택지 포함) → 분석 → 첫 뽑기 → 꽝
- 포기하기 만류 메시지
- 가짜 광고 → 어두운 편지 전환
- 편지 타이핑, 터치로 현재 문장 완성, 전체 보기, 자연 완료
- 추가 기회 → 두 번째 뽑기 → 당첨 → 3/2/1 → 피날레
- 축하 다시 보기, 편지 다시 읽기 후 피날레 복귀, 처음부터 다시 하기
- 브라우저 리로드 후 초기화
- 로드된 GIF 7개 확인: 주요 3개와 추가 친구 모음 3개를 DOM naturalWidth로 확인하고 우사기 정면은 추가 기회 화면에서 표시 확인
- GIF 원본은 복사만 수행. 정적 경로 HTTP 200, Content-Type image/gif
- 최종 콘솔 error 로그 없음
- JavaScript `node --check` 통과

## 모바일 측정

| Viewport | 앱 clientWidth / scrollWidth | 피날레 버튼 최하단 |
|---|---|---|
| 360 × 800 | 360 / 360 | 약 675px |
| 390 × 844 | 390 / 390 | 약 705px |
| 430 × 932 | 430 / 430 | 약 745px |

360px 첫 화면 시작 버튼 최하단 약 628px. 질문은 스크롤 없이 표시됐으며 모든 버튼은 최소 44px입니다. 피날레 타이틀과 GIF는 각각 별도 레이아웃 행에 배치됩니다.

## 구현 확인 / 미실측

이벤트 잠금과 전환마다 타이머 취소는 코드에 구현했으나 실제 초당 연속 탭 부하 테스트는 하지 않았습니다. 이미지 오류 하트 대체, 전역 JS 오류 안내, reduced-motion CSS는 구현했으나 브라우저 오류 주입 테스트와 OS 동작 줄이기 설정 테스트는 하지 않았습니다. 실제 iOS Safari/Android 기기, 저성능 기기, Community Cloud 배포 검증은 하지 않았습니다. GIF의 움직임은 동작 줄이기 설정으로 정지하지 않습니다. 첨부되지 않은 메타몽 PNG는 포함되지 않습니다.

추가로 Streamlit AppTest는 기본 3초 제한에서 타임아웃되어 통과로 간주하지 않았습니다. 사용자 흐름 검증은 실행 중인 서버와 실제 브라우저에서 수행했습니다.

## 배포 준비 재검증 — Python 3.11

검증일: 2026-11-08 (Asia/Seoul). 이 항목은 위의 Python 3.12 검증과 구분한 이번 작업의 결과입니다.

| 항목 | 결과 | 근거 / 한계 |
|---|---|---|
| 저장소 / 미커밋 변경 | PASS | 시작 시 `codex/project-setup`, `069ee84`, clean. 원격에는 main이 없어 동일 커밋으로 main 생성 및 일반 push |
| 작업 브랜치 | PASS | `codex/deployment-qa`, 기존 폴더에서 작업. 프로젝트 복사본/ZIP 생성 없음 |
| Streamlit 1.63.0 설치 | PASS | 격리된 CPython 3.11.18 가상환경에 requirements의 의존성 36개 실제 설치 |
| Python 3.11 앱 실행 | PASS | Windows CPython 3.11.18로 서버 실행, 브라우저 전체 흐름 확인 |
| Linux/Python 3.11 의존성 | PASS | uv의 `--python-version 3.11 --python-platform x86_64-unknown-linux-gnu` 대상 해결 성공. Linux 실제 설치/실행은 미실행 |
| 공식 st.iframe HTML/JS | PASS | 로컬 3.11 서버의 srcdoc에서 설문 시작 및 모든 장면 전환 확인 |
| CSS / JS / JSON 로딩 | PASS | app.py의 ROOT 기반 파일 읽기, iframe에 전달한 스타일/스크립트 실행 |
| Linux 경로 대소문자 | PASS | 각 디렉터리의 실제 파일명과 설정 경로를 case-sensitive 문자열로 비교 |
| GIF 7개 | PASS | 실제 정적 요청 모두 200 / image/gif, 응답 바이트가 저장소 파일과 동일 |
| 메타몽 PNG | 누락 | `assets.ditto=null`, PNG 요청 없음. 설정된 이미지의 오류 처리 fallback 유지. 삭제/대체 없음 |
| 시작 → 설문 3개 → 분석 → 첫 꽝 | PASS | 실제 클릭으로 확인. 코드의 첫 뽑기는 고정 LOSE 전환 |
| 광고 → 시네마틱 편지 | PASS | 광고 패러디 표시, 어두운 배경, 문장 타이핑, 종이 터치, 자연 완료 |
| 추가 기회 → 두 번째 당첨 → 피날레 | PASS | 실제 클릭 및 자동 전환 확인. 두 번째 뽑기는 고정 WIN 전환 |
| 편지 다시 읽기 / 전체 보기 / 피날레 복귀 | PASS | 실제 클릭으로 확인 |
| 피날레 다시 보기 / 처음부터 시작 / reload | PASS | 실제 클릭 및 reload 후 초기 화면 확인 |
| JS 콘솔 오류 | PASS | 이번 세션의 error 로그 0건 |
| 불필요한 의존성 / 인증 | PASS | 직접 의존성은 streamlit 1개, 앱 자체 로그인/API 키/DB 없음. Cloud 관리 로그인과는 별개 |
| Cloud 관리 접근 | 사용자 작업 필요 | share.streamlit.io에서 로그인/약관 안내 화면 관찰. 로그인, 약관 동의, 비공개 저장소 OAuth 권한은 진행하지 않음 |
| 실제 Cloud 배포 / 로그 / URL / 배포 후 흐름 | 미실행 | 인증된 Cloud 세션이 없어 배포 URL 없음. 아래 로컬 결과를 Cloud 결과로 간주하지 않음 |

### 이번 모바일 측정

| Viewport | 앱 width / scrollWidth | iframe 안 앱 높이 | 피날레 주요 버튼 최하단 |
|---|---|---|---|
| 360 × 800 | 360 / 360 | 800 | 약 675px |
| 390 × 844 | 390 / 390 | 844 | 약 705px 이하 |
| 430 × 932 | 430 / 430 | 932 | 약 745px |

360px 시작 버튼 최하단 약 628px, 첫 질문 선택지 최하단 약 532px. 기본 피날레 버튼 가림과 가로 넘침 없음. 친구 모음 펼치기, GIF naturalWidth 로딩도 확인했습니다. 모든 viewport에서 전체 흐름을 각각 반복한 것은 아니며, 전체 흐름은 360px, 나머지는 피날레와 다시 보기 중심으로 검증했습니다. 실제 iOS/Android, Safari 주소 표시줄과 notch, Linux 런타임, Cloud 로그는 미실행입니다.

실행 코드에서 재현된 배포 오류가 없으므로 app.py, requirements.txt, .streamlit/config.toml, JS/CSS 및 GIF는 변경하지 않았습니다. README의 Python 3.11 배포 설정과 실제 저장소/배포 상태만 바로잡았습니다.

Streamlit 1.63.0 배포 파일 및 Python 지원 메타데이터: https://pypi.org/project/streamlit/1.63.0/ (Requires-Python >=3.10, Python 3.11 classifier 포함).
