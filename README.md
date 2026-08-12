# 신앙 유형 검사

`csy870617/faith-mbti`의 디자인·기능을 그대로 복제한 두 번째 사이트입니다.
검사 엔진(문항 진행 · 결과 계산 · 공동체 분석 · 블로그)은 완성되어 있고, **콘텐츠만 비어 있습니다.**

- 배포 주소: https://csy870617.github.io/faithmbti2/
- 빌드 과정 없음 — `main` 브랜치에 푸시하면 GitHub Actions가 자동 배포합니다.

## 처음 한 번만 해야 하는 설정

1. **GitHub Pages 켜기** — Settings → Pages → Source를 **GitHub Actions**로 지정
2. **Firebase 승인 도메인 추가** — [Firebase 콘솔](https://console.firebase.google.com/project/faith-mbti/authentication/settings) → Authentication → Settings → 승인된 도메인에 `csy870617.github.io` 추가
   (추가하지 않으면 '우리교회 그룹' 기능만 동작하지 않습니다. 검사 자체는 정상입니다.)
3. **카카오 플랫폼 도메인 추가** — [카카오 개발자센터](https://developers.kakao.com) → 내 애플리케이션 → 플랫폼 → Web에 `https://csy870617.github.io` 추가
4. **애드센스 사이트 등록** — 새 주소를 애드센스에 등록하기 전까지 광고는 나오지 않습니다

## 콘텐츠 채우기

### 1. `data.js` — 검사의 전부

이 파일 하나만 채우면 검사가 완성됩니다. 구조(40문항 · 4축 · 16유형)는 그대로 두고 텍스트만 바꾸세요.

| 항목 | 개수 | 설명 |
|---|---|---|
| `originalQuestions` | 40 | 축(EI·SN·TF·JP)마다 10문항 = 5쌍. `id`/`axis`/`side`는 건드리지 말고 `text`만 작성 |
| `typeResults` | 16 | 유형마다 18개 필드. 전부 결과 화면에 표시되므로 하나도 비우지 마세요 |

`[작성 필요]`가 남아 있으면 그대로 화면에 노출됩니다. 아래로 남은 자리를 확인할 수 있습니다.

```
grep -c "작성 필요" data.js
```

### 2. `blog/` — 16개 유형 소개 글 (SEO용)

`blog/index.html`의 카드 문구, `blog/about.html` 소개글, `blog/<유형>.html` 16개 페이지가
모두 골격만 있는 상태입니다. 검색 노출이 필요 없으면 `blog/` 폴더째 삭제하고
`index.html`의 "16가지 유형 보기" 링크만 지우면 됩니다.

### 3. `index.html`의 홍보 배너

도서 배너와 FAITHS 배너는 원본 사이트의 홍보 영역입니다. `TODO` 주석이 달려 있으니
새 사이트에 맞게 바꾸거나 지우세요.

## 원본 텍스트를 그대로 쓰고 싶다면

새 문항을 쓰는 대신 원본 내용에서 출발하려면 원본 저장소의 `data.js`를 덮어쓰면 됩니다.
다만 같은 문구가 두 사이트에 노출되면 검색에서 중복 콘텐츠로 불이익을 받을 수 있습니다.

```
curl -o data.js https://raw.githubusercontent.com/csy870617/faith-mbti/main/data.js
```

## 원본과 달라진 부분

복제만 하면 두 사이트가 서로 충돌하므로 다음을 분리했습니다.

| 항목 | 원본 | 이 저장소 |
|---|---|---|
| 도메인 | `faiths.life` (CNAME) | GitHub Pages 기본 주소 (CNAME 삭제) |
| localStorage 키 | `faith_*` | `ftype_*` — 같은 `csy870617.github.io` 안의 다른 사이트와 겹치지 않도록 |
| Firestore 컬렉션 | `faith_churches` | `faith_type_churches` — 그룹명 충돌 방지 |
| 브랜드 문구 | FAITH MBTI / FAITHS | 신앙 유형 검사 |

Firebase 프로젝트와 애드센스 게시자 ID는 원본과 동일한 것을 그대로 씁니다.

## 파일 구조

```
index.html      검사 · 결과 · 공동체 화면 (한 페이지)
style.css       전체 디자인
data.js         문항 40개 + 유형 16개  ← 여기만 채우면 됩니다
app.js          화면 전환, 이벤트, 공유
core.js         결과 계산, 결과 렌더링, 글자 크기
church.js       Firebase 그룹 저장 / 공동체 분석
utils.js        localStorage 안전 래퍼, 셔플, 클립보드
blog/           유형별 소개 글 (SEO)
```

## 로컬에서 확인하기

```
python3 -m http.server 8000
# http://localhost:8000
```

`file://`로 열면 ES 모듈이 차단되어 동작하지 않습니다. 반드시 서버로 띄우세요.
