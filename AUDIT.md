# 개인 웹페이지 v2 — 검토·개선·검증 보고서

검토 대상: 사용자가 첨부한 `kyunghunnam.github.io-main(2).zip`의 실제 소스.
기록일: 2026-09-07. 이번 릴리스는 원본을 보존한 별도 복사본에서 작업했습니다.

## 1. 검토 결론과 범위

원본은 이미 연구 소개와 FOAM을 중심으로 구성된, 빌드 과정이 없는 HTML/CSS/JavaScript 단일 페이지였습니다. 이 구조는 유지했습니다. 이번에 다중 페이지를 단일 페이지로 전환하거나 다른 논문을 삭제한 것이 아닙니다. 원본 `AUDIT.md`의 과거 작업 설명을 이번 변경 실적으로 재사용하지 않았습니다.

연구 방향, 소개, 연락처, 외부 프로필, 논문 제목·저자·학회 메타데이터, 기존 페이지 리디렉션은 유지했습니다. FOAM is the only publication displayed on the website. 확인되지 않은 논문·경력·CV·연구 성과는 추가하지 않았습니다. 논문 서지와 연구 주장 자체의 학술적 사실 검증은 이번 코드 검토 범위가 아니며, 원본 기재 내용을 보존했습니다.

## 2. 실제 확인한 문제와 조치

| 원본/회귀 테스트에서 확인한 문제 | 적용한 수정 |
| --- | --- |
| 주요 제목이 `main` 밖에 있고 큰 hero를 포함한 헤더로 인해 상단 탐색의 고정 동작이 불안정 | hero를 `main`으로 이동, 헤더에는 탐색만 유지, 섹션 제목·랜드마크 연결 |
| 첫 화면의 제목·도식 크기와 배경 격자가 본문·논문 접근을 압도 | 제목 위계·여백·도식 크기·배경 강도를 조정하고 주요 버튼을 첫 화면에 배치 |
| 모바일 메뉴를 비모달 탐색으로 사용하면서 Tab 포커스를 내부에 가두는 동작 | 일반 Tab 순서를 보존하는 disclosure로 변경, Escape·포커스 이탈·바깥 클릭·크기 변경 처리 |
| 스크립트가 실패할 때 메뉴나 선택 기능이 작동하지 않는 상태로 표시될 가능성 | 이벤트 설치 후에만 메뉴를 접고, JS 전용 버튼은 준비되기 전까지 숨김; 본문은 항상 표시 |
| 잘못된 저장 테마 값, 저장소 접근 거부, 시스템 테마 변경의 조합 | 저장 값 검증, 저장소 예외 분리, 세션 내 선택 유지, 시스템 테마 복귀와 탭 간 동기화 |
| Clipboard API 거절 시 유용한 후속 경로와 수동 복사 안내 부족 | 호환 복사 경로, 임시 textarea 확실한 정리·포커스 복원, 최종 실패 시 인용문 선택·지속 안내, `.bib` 다운로드 |
| BibTeX를 펼친 작은 화면에서 가로 넘침 | grid/flex 최소 너비 및 긴 문자열 줄바꿈 수정; 본문 넘침을 숨겨 문제를 가리지 않음 |
| 다크 테마 주요 버튼 대비와 인쇄 색상 | 버튼 전경/배경 대비 수정; 저장된 다크 모드와 관계없이 인쇄 시 흰 배경·어두운 글자 |
| 중첩된 존재하지 않는 URL에서 404의 상대 경로 자산·홈 링크가 잘못 해석됨 | 프로젝트 접두사를 포함하는 루트 상대 경로 사용, 현재 페이지의 skip fragment 유지 |
| 200% 글자 확대에서 데스크톱 내비게이션 너비 초과 | 내비게이션 링크 줄바꿈 허용; 확대 및 다양한 너비로 재검증 |
| 외부 웹폰트 요청에 의존 | 시스템 글꼴 스택으로 교체, 외부 font/preconnect 제거; 글꼴 파일 미포함 |
| 배포 주소가 여러 문서에 흩어져 있고 재현 가능한 검증·포장 경로 부족 | URL 동기화/검사 도구, 공개 파일 허용 목록, 로컬 HTTP 서버, 배포 전용 ZIP, 검증용 CI 추가 |

이외에 외부 창 열림 안내, 명시적 PDF 표시, 키보드 focus, 현재 섹션 `aria-current`, reduced-motion, 실제 JS 비활성화 상황을 점검했습니다. JSON-LD의 출판 권·학술지 표현을 정리하고 원본 PDF의 MediaObject 연결을 추가했습니다. 검색 순위 향상이나 구조화 데이터 리치 결과 노출을 보장하지 않습니다.

## 3. 콘텐츠와 자산 보존

`#research`, `#foam`, `#questions`, `#about`의 구조와 기존 4개 레거시 URL을 유지했습니다. FOAM PDF와 기존 favicon/OG 자산 등 9개 파일의 SHA-256이 첨부 원본과 일치합니다. 새 `foam.bib`는 원본 화면의 BibTeX와 일치하도록 추가했습니다.

기준 주소는 원본 그대로입니다.

```text
https://namkyunghun.github.io/kyunghunnam.github.io/
```

이 주소가 지금 실제 배포 주소인지 별도로 확인하거나 원격 설정을 조회하지는 않았습니다. 압축 이름만으로 다른 사용자명·호스트를 추정하지 않았습니다. 배포 주소가 다르면 `tools/set_site_url.py --url 실제_HTTPS_주소`로 먼저 변경해야 합니다.

## 4. 검증 결과

| 검증 | 결과 및 범위 |
| --- | --- |
| 정적·자산·HTTP·도구 테스트 | **41개 통과**: 원본 중심 테스트 21개 + 무결성 10개 + HTTP/도구 10개 |
| Chromium 동작 회귀 테스트 | **28개 통과**: 메모리 문서 모드; 아래 환경 제한 참고 |
| JavaScript 문법 | `node --check common.js` 통과 |
| 배포 URL 일관성 | `python tools/set_site_url.py --check` 통과 |
| 반응형 | 320, 390, 560, 768, 840, 1024, 1440, 1920 CSS px에서 BibTeX를 펼쳐도 문서 가로 넘침 없음 |
| 글자 확대 | 루트 글자 크기 200% 조건에서 문서 가로 넘침 없음; 모든 브라우저의 페이지 확대를 대체하지 않음 |
| 독립 HTTP 검증 | 공개 파일 22개를 루트와 프로젝트 접두사에서 각각 확인, 본문 바이트·MIME·HEAD·404 및 경로 차단 검사 |
| 원본 보존 | 9개 자산 SHA-256 일치; 원본 PDF 그대로 유지 |
| 시각 확인 | 실제 Chromium 렌더링의 데스크톱 1440×1000, 모바일 390×844, 다크 모드 및 전체 페이지 확인 |

새 브라우저 회귀 테스트를 원본에 적용해 실패를 확인한 후 수정했습니다. 원본에 초기 브라우저 테스트 20개를 실행했을 때 너비별 하위 검사를 포함해 17건의 실패가 기록되었으며, 수정 과정에서 크기 변경·200% 글자·전체 실패 대응 등의 검증을 확대했습니다. 최종 실행 로그는 `docs/validation/`에 있습니다. 이 수치는 테스트 메서드 수이며, 화면 너비별 하위 검사를 별도 테스트 수에 더하지 않았습니다.

## 5. 검증 환경의 제한 — 중요

이 작업 환경의 관리형 Chromium은 정책에 의해 URL 탐색이 차단되며 localhost도 예외가 아닙니다. 따라서 브라우저 검증과 캡처는 **실제 소스 HTML/CSS/JavaScript를 메모리 문서에 로드**하여 수행했습니다. 실제 HTTP 응답은 별도의 로컬 HTTP 서버 및 Python 클라이언트로 검증했습니다. 화면을 별도로 재구현하거나 합성한 것이 아닙니다.

두 검증을 조합했지만, 배포된 사이트에 브라우저로 접속한 종단간 검증과 동일하지는 않습니다. 기본 HTTP 모드의 브라우저 테스트 및 CI 설정은 함께 제공하지만 이 제한된 환경에서 그 전체 경로를 실행한 결과라고 주장하지 않습니다.

클립보드 성공·거부·예외와 저장소 실패는 테스트에서 브라우저 API를 명시적으로 대체해 확인했습니다. 실제 사용자의 운영체제 클립보드 권한, 물리적 터치 장치, 실제 스크린리더, Firefox/Safari는 검증하지 않았습니다. Lighthouse 점수, Core Web Vitals, axe 자동진단, WCAG 인증, 실제 인쇄물 품질을 측정·보장하지 않습니다. 인쇄 테스트는 브라우저 print media의 계산된 스타일 검증입니다. 외부 연구 링크는 보존 및 마크업 검사 대상이며 모든 외부 서버의 현재 응답을 확인한 것은 아닙니다.

## 6. 배포와 유지보수

운영 사이트에는 런타임 프레임워크·패키지 설치·빌드가 필요 없습니다. Python 도구와 Playwright는 개발·검증용입니다. 기본 로컬 서버는 루프백에만 바인딩하며 운영 서버 용도가 아닙니다. 명시적 허용 목록에 포함된 파일만 배포용 ZIP에 넣고 로컬 서버에서도 제공하므로, 새로 추가한 `.env`나 내부 문서가 자동 공개되지 않습니다. 전체 소스 트리를 그대로 branch-source로 게시할 경우 개발 문서도 공개될 수 있으므로 배포용 ZIP을 구분해 사용합니다.

`.github/workflows/validate.yml`은 push/PR 수신 시 검증하는 읽기 전용 구성입니다. checkout/setup-python의 공식 v7 예시를 확인해 사용했으며, 실제 원격 실행 또는 배포는 하지 않았습니다. 이 워크플로만으로 별도의 브랜치 기반 Pages 게시가 테스트 결과에 연동되어 차단되는 것은 아닙니다.

검증에 참고한 공식 문서:

```text
https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site
https://docs.github.com/en/pages/getting-started-with-github-pages/creating-a-custom-404-page-for-your-github-pages-site
https://www.w3.org/WAI/ARIA/apg/patterns/disclosure/examples/disclosure-navigation/
https://developer.mozilla.org/en-US/docs/Web/API/Clipboard/writeText
https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-motion
https://playwright.dev/python/docs/browsers
https://github.com/actions/checkout
https://github.com/actions/setup-python
```

자동 분석·추적, contact backend, 쿠키 배너, 서비스 워커, 다국어 번역, 추가 논문, CV는 새 요구사항이나 자료 없이 추가하지 않았습니다. 별도의 코드/콘텐츠 라이선스도 임의로 설정하지 않았습니다.
