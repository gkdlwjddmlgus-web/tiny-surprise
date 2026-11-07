# Tiny Surprise

모바일 세로 화면용 생일 서프라이즈. 브라우저 제목과 첫 화면은 **Tiny Survey**입니다.

## 실행

Python 3.12를 권장합니다. 이 폴더에서 실행하세요.

```sh
python -m pip install -r requirements.txt
streamlit run app.py
```

모바일에서 같은 네트워크의 컴퓨터 IP와 포트로 접속하거나 Community Cloud에 배포합니다.

## Streamlit Community Cloud

1. 이 폴더의 내용(`app.py`, `.streamlit`, `frontend`, `config`, `static`, `requirements.txt`)을 GitHub `tiny-surprise` 저장소 루트에 올립니다.
2. Streamlit Community Cloud에서 저장소와 브랜치를 선택하고 Main file path를 `app.py`로 지정합니다.
3. Python 3.12로 배포합니다. 별도 비밀키나 API는 필요 없습니다.

이 작업에서 GitHub 업로드 및 실제 Cloud 배포는 수행하지 않았습니다.

## 설정

`config/birthday.json`만 수정하면 이름, 애칭, 3개 질문/선택지, 편지, 문구, 이미지, 재생 시간을 변경할 수 있습니다. 시간 단위는 밀리초입니다. JSON은 유효한 문법으로 유지하고 질문은 3개를 유지하세요.

- `letter_char_ms`: 한 글자 출력 간격
- `letter_pause_ms`: 문장 사이 간격
- `timing`: 분석, 뽑기, 가짜 광고, 카운트다운 간격
- `assets`: `static/` 기준 상대 경로
- 축하 문구의 `{name}`, `{nickname}`은 자동 치환됩니다.

편지는 임시로 작성한 기본 문구입니다. 선물하기 전에 개인 메시지로 바꿔 주세요. **공개 GitHub 저장소에 올리면 개인 편지와 이름도 공개됩니다.** 비공개 저장소라도 방문자는 브라우저로 전달된 설정을 읽을 수 있으므로 비밀 정보를 넣지 마세요.

첨부된 GIF 7개는 업로드 순서대로 의미 있는 이름으로 복사했으며 원본 바이트와 애니메이션을 보존했습니다. PNG는 제공되지 않았습니다. 추후 `static/assets/ditto.png`를 넣고 `assets.ditto`를 `assets/ditto.png`로 바꾸면 친구 모음에 나타납니다. 이미지 오류는 하트 대체 그래픽으로 처리합니다.

## 구현 선택

설치된 Streamlit 1.63.0의 `st.html(..., unsafe_allow_javascript=True)` API를 확인하고 실행을 시도했습니다. 이 환경의 실제 브라우저에서 HTML만 표시되고 초기화 스크립트가 실행되지 않아, 공식 `st.iframe`의 HTML 문자열 입력으로 전환했습니다. 1.63.0을 고정해 이 동작을 재현할 수 있게 했습니다. 구버전 legacy `components.v1.html`은 사용하지 않습니다.

iframe은 화면 전체 크기로 표시되며 HTML/CSS/Vanilla JS가 상태와 타이머를 소유합니다. Python 위젯이나 rerun에 의존하는 장면 전환은 없습니다. 리로드 시 처음부터 시작하며 서버 저장은 없습니다. Streamlit의 개발 파일 감지로 코드가 바뀌면 앱이 재실행될 수 있습니다.

공식 static serving은 `.streamlit/config.toml`의 `server.enableStaticServing=true`로 활성화합니다. 이미지 URL은 `app/static/assets/...`이며 로컬에서 HTTP 200 / `image/gif` 응답을 확인했습니다. 외부 CDN, 웹 폰트, 광고, 분석 코드, 소리, API 호출은 없습니다. Streamlit 자체 사용량 통계도 비활성화했습니다.

## 파일

- `app.py`: Streamlit 진입점, JSON 로딩, iframe 구성
- `frontend/app.js`: 이벤트 기반 상태 머신과 타이머 정리, 편지, 다시 보기
- `frontend/style.css`: 모바일 레이아웃, 가챠 머신, 등장/파티 효과
- `config/birthday.json`: 사용자 설정
- `static/assets/`: 원본 GIF
- `QA.md`: 실제 검증 결과와 한계

편지는 한 번에 한 문단씩 타이핑됩니다. 종이를 탭하면 타이핑 중인 문단을 완성하고, 완성된 문단에서 다시 탭하면 다음 문단으로 이동합니다. 연속 탭은 450ms 동안 무시하며 자동 진행 타이머는 수동 진행 시 취소됩니다. 마지막 서명 전 1.2초 대기는 유지됩니다. `편지 전체 보기`는 타이머를 정리하고 원문 전체를 스크롤 가능한 종이에 표시합니다. OS의 동작 줄이기 설정에서는 CSS 애니메이션과 타이핑 지연을 줄입니다. GIF 자체의 원본 애니메이션은 계속 재생됩니다.

## 수동 확인

시작 → 세 질문 → 결과 뽑기 → 꽝 → 포기하기 만류 확인 → 광고 → 편지 터치/전체 보기 → 추가 기회 → 다시 뽑기 → 당첨 카운트다운 → 피날레 순으로 진행합니다. 피날레의 세 버튼을 각각 확인하세요. Safari와 실제 휴대폰에서는 주소 표시줄 변화, 노치 safe-area, 긴 편지 스크롤을 한 번 더 확인하는 것을 권장합니다.


## Cinematic Letter v2

`config/birthday.json`의 `cinematic`에서 오프닝을, `letter_lines`에서 편지를 관리합니다. 기존 설문/가챠/피날레와 원본 GIF는 유지합니다. 기본 원문은 나뇽이가 규령에게 쓴 12문단입니다. 마지막 항목은 서명으로 표시됩니다.

- `opening_lines`: 태초 → 빛 → 존재 → 바로 → 너! 순서의 5문장
- `blackout_ms`, `opening_durations_ms`(첫 3문장), `pause_before_you_ms`, `you_ms`: 오프닝 타이밍
- `envelope_ms`: 봉투 등장·개봉·편지지 상승 시간
- `signature_pause_ms`, `reward_delay_ms`: 서명 전 대기 및 서명 후 보상 대기
- `enable_stars`, `enable_envelope`: 별빛/봉투 연출 사용 여부
- `letter_char_ms`, `letter_pause_ms`: 글자 및 문단 출력 간격

기본값은 암전 0.7초, 첫 세 문장 2.6/3.2/2.8초, ‘바로’ 등장 0.8초 + 정적 1.2초, ‘너!’ 1.8초, 봉투 2.5초입니다. 편지가 시작되기까지 약 15.6초이며, 12문단 자동 재생은 서명과 보상 대기까지 약 24.7초입니다(전체 약 40.3초). 탭이나 전체 보기로 단축할 수 있습니다. 브라우저가 백그라운드 탭의 타이머를 제한하면 더 길어질 수 있습니다.

편지 재열람은 우주 오프닝을 생략하고 봉투부터 시작합니다. 첫 편지 완료 시 `선물 받으러 가기 🎁`는 두 번째 뽑기로, 재열람 완료 시 버튼은 피날레로 이동합니다. 보상은 별도의 누적 카운터 없이 기존 상태 전환으로 한 번만 처리합니다.

회귀 테스트는 앱 의존성 추가 없이 Node 내장 테스트 러너로 실행합니다.

```sh
node --test tests/cinematic.test.cjs
```

이 테스트는 가상 DOM과 가상 시간을 이용한 컨트롤러 테스트입니다. 실제 모바일 화면의 레이아웃 검증과 별개이며 결과는 `QA.md`에 구분해 기록합니다. Streamlit 배포에는 Node가 필요하지 않습니다.
