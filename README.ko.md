# 개인 웹페이지 v2 — 사용 및 배포 안내

원본의 연구 소개와 FOAM 중심 단일 페이지를 유지하면서 화면 구성, 접근성, 오류 대응, 배포·검증 도구를 개선한 버전입니다. 웹사이트 자체에는 설치할 패키지나 빌드 과정이 없습니다. 개발 도구를 사용할 때만 Python 3.10 이상이 필요합니다.

## 제공 파일 구분

**전체 소스 ZIP**에는 HTML/CSS/JavaScript, 원본 자산, 테스트, 로컬 서버, URL 수정 도구, 검증용 GitHub Actions, 문서가 들어 있습니다. 수정·유지보수할 때 사용합니다.

**배포 전용 ZIP**에는 웹사이트 공개에 필요한 22개 파일만 들어 있습니다. 압축 안의 `index.html`, `.nojekyll`, `assets/` 등이 배포 브랜치의 최상위에 놓이도록 압축을 풀어 사용합니다. 압축 파일 자체를 저장소에 올리거나, 한 단계 상위 폴더째 올리는 방식이 아닙니다. 테스트·문서·개발 도구는 이 ZIP에서 제외했습니다.

## 로컬에서 보기

전체 소스 압축을 풀고 `index.html`이 있는 폴더에서 실행합니다.

```bash
python tools/serve.py
```

브라우저 주소:

```text
http://127.0.0.1:8000/
```

원래 프로젝트 경로를 붙인 주소도 동작합니다. Ctrl+C로 종료합니다. 이 서버는 개발용이며 기본적으로 자신의 컴퓨터에서만 접속할 수 있습니다. HTML 파일을 직접 열어도 본문은 보이지만, 실제 배포 경로·404·클립보드 권한 검증을 대신하지는 못합니다.

## GitHub Pages에 반영하기

먼저 현재 저장소를 백업하거나 변경 전 커밋을 남기세요. 배포 전용 ZIP의 내용을 실제 게시 브랜치 루트에 반영한 뒤, 저장소의 **Settings → Pages → Build and deployment → Deploy from a branch**에서 사용할 브랜치와 `/(root)`를 선택합니다. 이미 정상 배포 중인 저장소라면 설정을 불필요하게 바꾸지 말고 소스 변경만 반영하세요. 기존 커스텀 도메인의 `CNAME`이 있다면 보존합니다.

원본 소스에 기재되어 있던 기준 주소를 그대로 유지했습니다.

```text
https://namkyunghun.github.io/kyunghunnam.github.io/
```

압축 파일명에서 추측한 주소가 아니라, **첨부 소스의 기존 canonical 설정**입니다. 현재 실제 게시 주소가 다르다면 아래 도구로 먼저 맞춰야 합니다. 이번 작업에서는 원격 저장소 수정, Pages 설정 변경, 공개 배포를 실행하지 않았습니다.

GitHub 공식 게시 설정 안내:

```text
https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site
```

## 주소·저장소명이 바뀔 때

예를 들어 개인 루트 주소로 옮길 경우:

```bash
python tools/set_site_url.py --url https://namkyunghun.github.io/
python tools/set_site_url.py --check
python tools/package_site.py
```

마지막 명령은 `dist/site-publish.zip`을 만듭니다. 실제 커스텀 도메인을 사용할 경우 해당 HTTPS 주소를 넘기면 됩니다. canonical, OG/Twitter, JSON-LD, robots, sitemap, 기존 페이지 canonical, 404의 경로가 함께 갱신됩니다. `site.config.json`만 수동으로 수정하면 HTML까지 갱신되지 않으므로 위 명령을 사용하세요.

이 도구가 GitHub 저장소명, DNS, HTTPS, Pages 설정, `CNAME`을 자동 변경하지는 않습니다.

## 주로 수정할 곳

| 수정 목적 | 파일 |
| --- | --- |
| 연구 소개·논문·연락처·프로필 | `index.html` |
| 색상·글꼴·간격·반응형·인쇄 | `styles.css` |
| 테마·모바일 메뉴·BibTeX 복사 | `common.js` |
| 논문 PDF | `assets/papers/FOAM_ICML2026.pdf` |
| BibTeX 다운로드 | `assets/papers/foam.bib` |
| 배포 주소 변경 | `tools/set_site_url.py` 명령 |
| 공개 파일 추가 | `tools/site_utils.py`의 허용 목록 |

새 논문을 추가하면 화면과 JSON-LD를 함께 수정합니다. BibTeX는 화면에 표시되는 내용과 다운로드 파일을 동일하게 유지합니다. 원본 자산을 의도적으로 교체할 때만 `tests/asset-baseline.json`의 SHA-256 기준도 검토 후 갱신합니다.

## 검증 명령

추가 패키지 없이 실행되는 정적·HTTP 테스트:

```bash
python -m unittest discover -s tests -p 'test_site*.py' -v
python tools/set_site_url.py --check
```

Node가 설치되어 있다면 JavaScript 문법도 검사할 수 있습니다.

```bash
node --check common.js
```

브라우저 회귀 테스트를 실행할 때만 개발 의존성을 설치합니다.

```bash
python -m pip install -r requirements-dev.txt
python -m playwright install chromium
python tests/test_browser.py
```

테스트 기본 모드는 로컬 HTTP 서버에 실제 Chromium으로 접속하는 방식입니다. 동봉된 CI도 이 모드를 사용하도록 구성했습니다. **CI를 원격에서 실행해 확인한 것은 아닙니다.** `validate.yml`은 검증 전용이며 자동 배포 기능이 없습니다. 별도의 브랜치 기반 게시를 자동 차단하는 설정도 아닙니다.

이번 작업 환경은 브라우저의 URL 접속이 정책상 차단되어, 실제 HTML/CSS/JS를 메모리 문서에 넣어 28개 브라우저 테스트를 실행하고 HTTP 전달은 별도 서버 테스트로 확인했습니다. 정적·HTTP 테스트 41개와 합쳐 69개가 통과했습니다. 이는 실서비스 종단간 검증, 다른 브라우저 검증, 실제 OS 클립보드 권한 검증이나 접근성 인증을 의미하지 않습니다. 상세 내역은 `AUDIT.md`에 있습니다.
