# PRD — 네이버 뉴스 검색 사이트

| 항목 | 내용 |
|---|---|
| 문서 버전 | v1.1 (2026-08-18 API 이관 반영) |
| 작성일 | 2026-08-18 |
| 프로젝트명 | (가칭) News Finder |
| 상태 | 개발 진행 중 — NAVER API HUB(NCP) 이관 반영 완료 |

---

## 1. 개요

네이버 검색 API(뉴스)를 이용해 키워드로 뉴스를 검색하고, 결과를 카드 리스트로 보여주는 단일 페이지 웹 서비스.
로그인·DB 없이 동작하는 클라이언트 중심 서비스이며, API 키 보호를 위한 서버 프록시만 최소한으로 둔다.

### 1.1 핵심 목표
1. 키워드 검색 → 뉴스 결과 노출까지 3초 이내 완료
2. **네이버 API 키가 브라우저·깃허브에 절대 노출되지 않을 것** (최우선 비기능 요구사항)
3. 모바일/데스크톱 모두에서 깨지지 않는 반응형 UI
4. 로딩·결과없음·에러 등 모든 상태를 명시적으로 처리

### 1.2 범위 밖 (Out of Scope)
- 회원가입 / 로그인 / 즐겨찾기 / 스크랩
- 실시간 인기 검색어 순위 (네이버 검색 API가 제공하지 않음)
- 뉴스 본문 크롤링 및 사이트 내 전문 표시 (저작권 이슈 — 원문 링크로 이동시킨다)
- 댓글, 공유, 통계 대시보드

---

## 2. 기술 스택 (확정)

| 구분 | 선택 |
|---|---|
| 프레임워크 | Next.js (App Router) |
| 언어 | JavaScript |
| 스타일링 | Tailwind CSS |
| 서버 | Next.js Route Handler (`/api/news`) |
| 상태 관리 | React `useState` / `useCallback` (외부 라이브러리 없음) |
| 배포 | Vercel |
| 데이터 저장소 | 없음 (DB·캐시 서버 미사용) |

> **왜 서버 프록시가 필수인가**
> 네이버 오픈 API는 CORS를 허용하지 않아 브라우저에서 직접 호출하면 요청이 차단된다.
> 또한 클라이언트에서 호출하면 Client Secret이 네트워크 탭에 그대로 노출된다.
> 따라서 브라우저 → Next.js Route Handler → 네이버 API 구조를 반드시 따른다.

---

## 3. 보안 요구사항 — 키 노출 방지 (최우선)

### 3.1 환경변수 설계

`.env.local` (프로젝트 루트, **절대 커밋 금지**)

```bash
NAVER_CLIENT_ID=여기에_발급받은_Client_ID
NAVER_CLIENT_SECRET=여기에_발급받은_Client_Secret
```

**규칙**
- 변수명에 `NEXT_PUBLIC_` 접두사를 **절대 붙이지 않는다.**
  Next.js는 `NEXT_PUBLIC_`이 붙은 변수를 빌드 시 클라이언트 번들에 그대로 인라인한다.
- `process.env.NAVER_CLIENT_ID` 접근은 **Route Handler 등 서버 코드 안에서만** 한다.
  `'use client'` 파일에서는 어떤 경우에도 참조하지 않는다.
- 팀 공유용으로 `.env.example`을 만들되 **값은 비워둔다.** 이 파일은 커밋한다.

`.env.example` (커밋 대상)

```bash
NAVER_CLIENT_ID=
NAVER_CLIENT_SECRET=
```

### 3.2 `.gitignore`

```gitignore
# dependencies
/node_modules
/.pnp
.pnp.js

# next.js
/.next/
/out/
/build

# production
/dist

# 환경변수 — 키 유출 방지 (핵심)
.env
.env.local
.env.*.local
.env.development.local
.env.test.local
.env.production.local

# 단, 값이 비어 있는 예시 파일은 추적한다
!.env.example

# misc
.DS_Store
*.pem
npm-debug.log*
yarn-debug.log*
yarn-error.log*
.pnpm-debug.log*

# vercel
.vercel

# editor
.idea/
.vscode/
*.swp
```

### 3.3 커밋 전 체크리스트 (개발자 준수 항목)

1. **`.gitignore`를 가장 먼저 작성하고 커밋한다.** `.env.local` 생성보다 먼저.
   (한 번이라도 커밋되면 히스토리에 남아 파일 삭제만으로는 지워지지 않는다.)
2. 첫 커밋 전 `git status`로 `.env.local`이 목록에 없는지 눈으로 확인한다.
3. `git check-ignore -v .env.local` 실행 시 `.gitignore` 규칙이 매칭되는지 확인한다.
4. 실수로 이미 스테이징된 경우: `git rm --cached .env.local` 후 다시 커밋한다.
5. 이미 원격에 올라갔다면 → **파일 삭제로 끝내지 말고 네이버 개발자센터에서 키를 즉시 재발급한다.**

### 3.4 Vercel 배포 시

- Vercel 대시보드 → Project → Settings → Environment Variables 에 `NAVER_CLIENT_ID`, `NAVER_CLIENT_SECRET`을 등록한다.
- 적용 환경: Production / Preview / Development 모두 체크.
- `.env.local`은 업로드하지 않는다 (Vercel이 빌드 시 환경변수를 주입).
- (구) 네이버 개발자센터 앱은 **웹 서비스 URL**에 배포 도메인을 등록했다. NAVER API HUB로 이관된 이후에는 도메인 등록 절차가 NCP 콘솔 UI에 따라 달라질 수 있으므로, 배포 전 NCP 콘솔에서 별도 도메인/서비스 URL 등록이 필요한지 확인한다.

---

## 4. API 연동 명세

### 4.1 외부 API — 네이버 뉴스 검색

> **⚠️ 2026-07 API 이관 반영**
> 뉴스 검색 API가 기존 네이버 개발자센터(`developers.naver.com`)에서 **NAVER API HUB(네이버 클라우드 플랫폼)**로 이관되었다. 신규 키 발급은 더 이상 개발자센터에서 할 수 없고 NCP 콘솔의 NAVER API HUB에서 진행한다(발급처만 바뀌고, `.env.local`에 저장하는 프로젝트 내부 변수명 `NAVER_CLIENT_ID`/`NAVER_CLIENT_SECRET`은 그대로 사용). 기존 개발자센터 키 보유자는 2027-06-30까지 구 엔드포인트 호환 호출이 한시적으로 가능하나, 신규 프로젝트는 아래 신규 명세를 기준으로 한다.

- **Endpoint**: `GET https://naverapihub.apigw.ntruss.com/search/v1/news`
- **Headers**: `X-NCP-APIGW-API-KEY-ID`(Client ID), `X-NCP-APIGW-API-KEY`(Client Secret)
  - Route Handler 내부에서는 `process.env.NAVER_CLIENT_ID`/`NAVER_CLIENT_SECRET` 값을 이 두 헤더로 매핑해서 보낸다.

**Query Parameters**

| 파라미터 | 필수 | 설명 | 본 프로젝트 사용값 |
|---|---|---|---|
| `query` | O | 검색어 (UTF-8 URL 인코딩) | 사용자 입력 |
| `display` | X | 한 번에 표시할 건수 (1~100, 기본 10) | `10` |
| `start` | X | 검색 시작 위치 (1~1000, 기본 1) | `1`, `11`, `21` … |
| `sort` | X | `sim`(정확도순) / `date`(날짜순) | 사용자 선택 |

**Response 주요 필드**

| 필드 | 설명 |
|---|---|
| `total` | 총 검색 결과 개수 |
| `start`, `display` | 현재 요청의 시작 위치 / 건수 |
| `items[].title` | 기사 제목 (**HTML `<b>` 태그, HTML 엔티티 포함**) |
| `items[].description` | 요약 (동일하게 태그·엔티티 포함) |
| `items[].originallink` | 언론사 원문 URL |
| `items[].link` | 네이버 뉴스 URL (없을 수 있음) |
| `items[].pubDate` | 발행일시 (RFC 1123, 예: `Mon, 17 Aug 2026 09:12:00 +0900`) |

**주의: 데이터 가공 필수**
- `title`/`description`에는 검색어 강조용 `<b></b>` 태그와 `&quot; &amp; &lt; &gt; &#39;` 같은 HTML 엔티티가 섞여 들어온다.
- **XSS 방지를 위해 `dangerouslySetInnerHTML`을 쓰지 않는다.** 태그를 제거(strip)하고 엔티티를 디코딩한 순수 텍스트로 렌더링한다.
- `pubDate`는 `new Date()`로 파싱 후 `YYYY.MM.DD HH:mm` 형태로 포맷한다.

**업스트림 에러 응답 (NAVER API HUB)**

| HTTP 상태 | errorCode | 의미 |
|---|---|---|
| 400 | `SE01`~`SE04`, `SE06` | 파라미터/URL/인코딩 오류 |
| 404 | `SE05` | API URL 오류 |
| 500 | `SE99` | 서버 내부 오류 |
| 401 / 403 | (게이트웨이 인증 오류) | 키 무효 — NCP API HUB에서 재발급 필요 |

Route Handler는 이 상태코드를 그대로 노출하지 않고 4.2절의 사용자 메시지로 변환해서 응답한다.

**제약**
- `start` 최대값이 1000이므로, `display=10` 기준 최대 100페이지까지만 조회 가능하다. 그 이후엔 '더보기' 버튼을 숨긴다.
- NAVER API HUB는 검색 카테고리 전체에 월 단위 호출 한도가 있으므로(콘솔에서 실사용량 확인) 불필요한 중복 호출을 피한다.

### 4.2 내부 API — `/api/news` (Route Handler)

```
GET /api/news?query={검색어}&sort={sim|date}&start={number}
```

**서버 처리 순서**
1. `query` 파라미터 존재 여부 검증 → 없으면 400 반환
2. `sort` 값이 `sim` 또는 `date`인지 검증 → 아니면 `sim`으로 보정
3. `start`를 정수로 파싱, 1~1000 범위로 클램프
4. 환경변수에서 키를 읽어 헤더에 실어 네이버 API 호출
5. 응답의 `title`/`description` 정제(태그 제거·엔티티 디코딩), `pubDate` 포맷 변환
6. 클라이언트에 필요한 필드만 골라 반환 (**키·원본 헤더는 절대 포함하지 않음**)

**정상 응답 형태**

```json
{
  "total": 12345,
  "start": 1,
  "display": 10,
  "items": [
    {
      "id": "고유키(link 또는 index 기반)",
      "title": "정제된 제목",
      "description": "정제된 요약",
      "link": "https://…",
      "press": "도메인에서 추출한 출처(선택)",
      "pubDate": "2026.08.17 09:12"
    }
  ]
}
```

**에러 응답 형태**

```json
{ "error": { "code": "UPSTREAM_ERROR", "message": "사용자에게 보여줄 메시지" } }
```

| 상황 | 내부 상태코드 | 사용자 노출 메시지 |
|---|---|---|
| 검색어 누락 | 400 | 검색어를 입력해 주세요. |
| 인증 실패 (키 오류/만료) | 500 | 일시적인 오류가 발생했습니다. 잠시 후 다시 시도해 주세요. |
| 호출 한도 초과 | 429 | 요청이 많아 잠시 지연되고 있습니다. 잠시 후 다시 시도해 주세요. |
| 네이버 API 장애/타임아웃 | 502 | 뉴스를 불러오지 못했습니다. |
| 네트워크 단절 | — (클라이언트) | 네트워크 연결을 확인해 주세요. |

> 사용자에게는 **원본 에러 메시지를 그대로 노출하지 않는다.** 내부 상세는 서버 로그에만 남긴다.

---

## 5. 기능 요구사항

### F-01. 검색창
- 화면 상단 중앙 배치, 입력 후 Enter 또는 검색 버튼 클릭으로 실행
- 공백만 입력 시 요청을 보내지 않고 안내 문구 표시
- 입력값 앞뒤 공백 trim 처리
- 입력 중 우측에 X 버튼(전체 지우기) 노출
- 검색 실행 시 결과 목록을 초기화하고 1페이지부터 다시 조회
- 검색 중에는 버튼 비활성화 (중복 요청 방지)

### F-02. 인기 키워드 칩
- 개발자가 지정한 **고정 목록 상수**를 사용 (예: `경제`, `AI`, `날씨`, `스포츠`, `증시`, `부동산`, `연예`, `IT`)
- 상수 파일 위치: `src/constants/keywords.js`
- 칩 클릭 시 해당 키워드로 즉시 검색 실행 + 검색창에 값 반영
- 현재 검색어와 일치하는 칩은 활성(선택됨) 스타일 적용
- 모바일에서는 가로 스크롤, 데스크톱에서는 줄바꿈(wrap) 배치

### F-03. 기사 카드 리스트
카드 1개당 표시 항목:
- 제목 (2줄 말줄임)
- 요약 (2줄 말줄임)
- 출처(언론사) — 링크 도메인에서 추출, 실패 시 생략
- 발행일시 (`YYYY.MM.DD HH:mm`)

동작:
- 카드 전체가 클릭 영역이며, 클릭 시 원문을 **새 탭**으로 연다 (`target="_blank"`, `rel="noopener noreferrer"`)
- `originallink`를 우선 사용하고, 비어 있으면 `link`로 대체
- hover 시 그림자·배경 변화로 클릭 가능함을 시각적으로 표시

### F-04. 정렬 (최신순 / 정확도순)
- 두 개의 토글 버튼: **정확도순**(`sim`, 기본값) / **최신순**(`date`)
- 정렬 변경 시 현재 검색어로 **1페이지부터 다시 조회** (기존 결과 초기화)
- 검색 결과가 없을 때는 정렬 컨트롤을 숨긴다
- 현재 선택된 정렬은 시각적으로 구분

### F-05. 더보기 (페이지네이션)
- 결과 목록 하단에 '더보기' 버튼 배치
- 클릭 시 `start`를 10씩 증가시켜 추가 조회하고, **기존 목록 아래에 이어 붙인다**
- 로딩 중에는 버튼을 비활성화하고 스피너 표시
- 다음 조건 중 하나라도 해당되면 버튼을 숨긴다
  - 불러온 개수 ≥ `total`
  - 다음 `start`가 1000을 초과
- 결과 개수 표시: "총 N건 중 M건 표시"

### F-06. 상태 화면

| 상태 | 조건 | 화면 |
|---|---|---|
| **초기(Idle)** | 아직 검색 전 | 인기 키워드 칩과 함께 "관심 있는 키워드로 뉴스를 검색해 보세요" 안내 |
| **로딩(Loading)** | 첫 검색 요청 진행 중 | 스켈레톤 카드 3~5개 표시 (레이아웃 밀림 방지) |
| **추가 로딩** | 더보기 진행 중 | 기존 목록 유지 + 하단 스피너 |
| **결과 없음(Empty)** | `total === 0` | "'{검색어}'에 대한 검색 결과가 없습니다" + "다른 키워드로 검색해 보세요" + 인기 키워드 칩 재노출 |
| **에러(Error)** | 요청 실패 | 안내 메시지 + **[다시 시도]** 버튼 (마지막 요청 파라미터로 재시도) |

### F-07. 반응형 디자인

| 브레이크포인트 | 폭 | 레이아웃 |
|---|---|---|
| Mobile | ~ 639px | 카드 1열, 검색창 전체 폭, 칩 가로 스크롤, 상하 여백 축소 |
| Tablet (`sm`~`md`) | 640 ~ 1023px | 카드 1열(넓은 폭) 또는 2열, 칩 wrap |
| Desktop (`lg` 이상) | 1024px ~ | 최대 폭 컨테이너 중앙 정렬(약 768~960px), 카드 1열 리스트형 |

- Tailwind 기본 브레이크포인트(`sm` 640 / `md` 768 / `lg` 1024) 사용
- 모든 클릭 요소의 터치 타깃 최소 44×44px 확보
- 텍스트 말줄임은 `line-clamp` 사용

---

## 6. 비기능 요구사항

| 항목 | 기준 |
|---|---|
| 보안 | Client ID/Secret이 클라이언트 번들·네트워크 응답·Git 히스토리 어디에도 존재하지 않을 것 |
| XSS | API 응답 텍스트는 태그 제거 후 렌더링. `dangerouslySetInnerHTML` 사용 금지 |
| 성능 | 검색 결과 표시까지 3초 이내(정상 네트워크 기준), 로딩 중 레이아웃 시프트 없음 |
| 접근성 | 검색 input에 label(또는 aria-label), 버튼에 명확한 텍스트, 키보드만으로 전체 조작 가능 |
| 브라우저 | 최신 Chrome / Safari / Edge, iOS Safari, Android Chrome |
| 에러 내성 | 어떤 실패 상황에서도 흰 화면 없이 안내 문구를 보여줄 것 |

---

## 7. 프로젝트 구조 (제안)

```
news-finder/
├─ .gitignore              # 3.2 내용 — 가장 먼저 생성·커밋
├─ .env.example            # 값 없는 예시 (커밋)
├─ .env.local              # 실제 키 (커밋 금지)
├─ next.config.js
├─ tailwind.config.js
├─ package.json
├─ prd.md
└─ src/
   ├─ app/
   │  ├─ layout.js
   │  ├─ page.js                  # 메인 페이지 (클라이언트 컴포넌트)
   │  ├─ globals.css
   │  └─ api/
   │     └─ news/
   │        └─ route.js           # 서버 프록시 — 여기서만 env 접근
   ├─ components/
   │  ├─ SearchBar.js
   │  ├─ KeywordChips.js
   │  ├─ SortTabs.js
   │  ├─ NewsCard.js
   │  ├─ NewsList.js
   │  ├─ LoadMoreButton.js
   │  ├─ SkeletonCard.js
   │  ├─ EmptyState.js
   │  └─ ErrorState.js
   ├─ constants/
   │  └─ keywords.js              # 인기 키워드 고정 목록
   └─ lib/
      ├─ formatDate.js            # pubDate 포맷
      └─ sanitize.js              # HTML 태그 제거 / 엔티티 디코딩
```

---

## 8. 개발 순서 (권장)

1. `.gitignore` 작성 → **첫 커밋** (키 유출 원천 차단)
2. `create-next-app` 프로젝트 생성 (JavaScript + Tailwind + App Router)
3. NAVER API HUB(네이버 클라우드 플랫폼 콘솔)에서 애플리케이션 등록 → 검색(뉴스) API 사용 설정 → Client ID/Secret 발급 (구 개발자센터 키 발급은 종료됨)
4. `.env.local` / `.env.example` 작성, `git status`로 무시 여부 확인
5. `/api/news` Route Handler 구현 + 브라우저에서 직접 호출해 응답 확인
6. `sanitize.js`, `formatDate.js` 유틸 구현
7. SearchBar → NewsList → NewsCard 순으로 UI 구현 (기본 검색 동작 완성)
8. 정렬 토글, 더보기 버튼 연결
9. 로딩 / 결과 없음 / 에러 상태 화면 구현
10. 반응형 점검 (모바일 → 데스크톱 순서로)
11. Vercel 환경변수 등록 후 배포, 배포 도메인을 네이버 개발자센터에 등록

---

## 9. 완료 기준 (Acceptance Criteria)

- [ ] 키워드 검색 시 뉴스 10건이 카드 형태로 표시된다
- [ ] 인기 키워드 칩 클릭만으로 검색이 실행된다
- [ ] 정렬을 바꾸면 결과가 1페이지부터 다시 조회된다
- [ ] 더보기 클릭 시 기존 목록 아래에 10건이 추가된다
- [ ] 결과가 없을 때 전용 안내 화면이 뜬다
- [ ] API 실패 시 에러 화면과 다시 시도 버튼이 동작한다
- [ ] 제목·요약에 `<b>` 태그나 `&quot;` 같은 문자열이 그대로 보이지 않는다
- [ ] 375px 폭에서 가로 스크롤 없이 모든 요소가 정상 표시된다
- [ ] 브라우저 개발자도구 Network/Source 어디에서도 Client Secret이 검색되지 않는다
- [ ] 깃허브 저장소 전체 파일 목록에 `.env.local`이 존재하지 않는다
