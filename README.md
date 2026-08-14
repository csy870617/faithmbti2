# 신앙 유형 검사

`csy870617/faith-mbti`를 통째로 복제한 두 번째 사이트입니다.
디자인·기능과 **16유형 결과 분석, 블로그 글**은 원본 내용을 그대로 쓰고,
**40문항은 이 저장소에서 새로 썼습니다** — 사역·소그룹을 열심히 하는 사람을 전제하지 않고,
교회에 다니는 누구나 자기 이야기로 읽을 수 있는 상황으로 바꿨습니다.

- 배포 주소: https://csy870617.github.io/faithmbti2/
- 빌드 과정 없음 — `main` 브랜치에 푸시하면 GitHub Actions가 자동 배포합니다.

## 처음 한 번만 해야 하는 설정

1. **GitHub Pages 켜기** — Settings → Pages → Source를 **GitHub Actions**로 지정
2. **Firebase 승인 도메인 추가** — [Firebase 콘솔](https://console.firebase.google.com/project/faith-mbti/authentication/settings) → Authentication → Settings → 승인된 도메인에 `csy870617.github.io` 추가
   (추가하지 않으면 '우리교회 그룹' 기능만 동작하지 않습니다. 검사 자체는 정상입니다.)
3. **카카오 플랫폼 도메인 추가** — [카카오 개발자센터](https://developers.kakao.com) → 내 애플리케이션 → 플랫폼 → Web에 `https://csy870617.github.io` 추가
4. **애드센스 사이트 등록** — 새 주소를 애드센스에 등록하기 전까지 광고는 나오지 않습니다

## 원본과 달라진 부분

내용은 같지만, 그대로 복사하면 두 사이트가 서로 충돌하는 항목들은 분리했습니다.

| 항목 | 원본 | 이 저장소 |
|---|---|---|
| 도메인 | `faiths.life` (CNAME) | GitHub Pages 기본 주소 (CNAME 삭제) |
| localStorage 키 | `faith_*` | `ftype_*` — 같은 `csy870617.github.io` 안의 다른 사이트와 겹치지 않도록 |
| Firestore 컬렉션 | `faith_churches` | `faith_type_churches` — 그룹명 충돌 방지 |
| 브랜드 문구 | FAITH MBTI / FAITHS | 신앙 유형 검사 |
| canonical | 없음 | 각 페이지에 자기 참조 canonical 추가 |

Firebase 프로젝트와 애드센스 게시자 ID는 원본과 동일한 것을 그대로 씁니다.
`index.html`의 도서 배너와 FAITHS 배너는 원본 사이트의 홍보 영역이라 `TODO` 주석을 달아 두었습니다.

### 검색 노출에 대한 참고

40문항은 새로 썼지만 16유형 결과 텍스트와 `blog/` 글은 아직 원본과 같습니다.
같은 문구가 두 사이트에 올라가면 구글은 둘 중 하나만 검색 결과에 남기고
나머지는 중복으로 걸러낼 수 있으니, 두 사이트 모두 검색 유입이 필요하다면
`data.js`의 결과 텍스트와 `blog/` 글도 이 저장소 쪽에서 새로 쓰는 편이 좋습니다.

## 콘텐츠 수정하기

| 파일 | 내용 |
|---|---|
| `data.js` | 문항 40개(EI·SN·TF·JP 축마다 10개)와 16유형 결과 18필드. 검사 내용은 전부 여기 |
| `blog/*.html` | 유형별 소개 글 16개 + 목록·소개 페이지 (SEO용) |

블로그가 필요 없으면 `blog/` 폴더를 지우고 `index.html`의 "16가지 유형 보기" 링크만 제거하면 됩니다.

## 파일 구조

```
index.html      검사 · 결과 · 공동체 화면 (한 페이지)
style.css       전체 디자인
data.js         문항 40개 + 유형 16개 결과
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
