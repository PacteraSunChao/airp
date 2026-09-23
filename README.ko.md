# AIRP — AI Report Protocol（AI 리포트 프로토콜）

[🇺🇸 English](./README.md) | [🇨🇳 中文](./README.cn.md) | [🇯🇵 日本語](./README.ja.md) | [🇰🇷 한국어](./README.ko.md) | [🇩🇪 Deutsch](./README.de.md) | [🇫🇷 Français](./README.fr.md) | [🇷🇺 Русский](./README.ru.md) | [🇪🇸 Español](./README.es.md) | [🇧🇷 Português (Brasil)](./README.pt-BR.md) | [🇮🇹 Italiano](./README.it.md)

![AIRP screen capture](./screen-capture.png "AIRP screen capture")

**AI가 쓴 리포트를 더 읽기 쉽게, 그리고 고치기 쉽게.**

AI에게 Markdown을 맡기면 밋밋하고 산만해지기 쉽습니다. HTML은 봐줄 만하지만 길고 token도 많이 먹고, 나중에 고치기도 힘듭니다. AIRP 방식은 이렇습니다. 먼저 AI가 `*.airp.json` 소스를 쓰게 하고, **AIRP Renderer** 확장으로 다듬어진 HTML로 엽니다. 밖으로 보낼 때는 HTML이나 Markdown으로 내보내면 됩니다.

소스는 Notion식 **블록(Block)** 으로 짜여 있고, 지금은 **46**종입니다(히어로 지표, 비교, 의사결정, 타임라인, Mermaid, 아키텍처 개요 등). 각 블록마다 레이아웃이 있어서 계획·리뷰·회고·감사 같은 리포트가 훨씬 또렷하고, 글 덩어리로 뭉개지지 않습니다.

## 리포트는 어떻게 돌아가는가

쓰기와 읽기는 나뉩니다. 가운데 `*.airp.json`은 JSON Schema로 맞춰져 있고, 생성과 검증 모두 여기를 기준으로 합니다:

| 누가 | 무엇을 하나 |
| --- | --- |
| **`/airp` Skill** | AI가 소스를 만들거나 고치게 하고, 검증까지 |
| **VS Code 확장** | 에디터에서 읽기; HTML / Markdown 내보내기 |

실제로 얻는 것:

- 필드나 섹션이 빠지면 검증이 실패해서, 어설픈 산출물이 줄어듭니다.
- 소스는 Git·diff에 잘 맞고, HTML / Markdown은 사람이 보는 결과물입니다.
- 블록 경계가 분명해서 모델이 더 안정적이고, 손으로 쓴 긴 HTML보다 token도 보통 덜 씁니다.

## 빠른 시작

### 1. VS Code 확장 설치

[Marketplace](https://marketplace.visualstudio.com/items?itemName=airp.airp-renderer-vscode)에서 **AIRP Renderer**를 설치하세요(확장 ID: `airp.airp-renderer-vscode`).

아무 `*.airp.json`이나 열면 읽을 수 있고, HTML / Markdown으로 내보낼 수도 있습니다. VS Code 호환 에디터가 필요합니다(예: Cursor).

### 2. `/airp` Skill 설치

이미 작성된 소스만 본다면 확장만으로 충분합니다. AI에게 새 리포트를 쓰게 할 때만 Skill을 설치하세요:

```bash
npx skills add maosong-ai/airp
```

채팅에 `/airp <주제>`를 입력하면 Skill이 소스를 생성·검증합니다(기본 폴더: `.docs/airp/`). 확장으로 열어 읽으면 됩니다. 선택: `--locale ko-KR`, `--out <디렉터리>`.

## 다국어

지원 문서 언어: English(`en-US`), 简体中文(`zh-CN`), 日本語(`ja-JP`), 한국어(`ko-KR`), Deutsch(`de-DE`), Français(`fr-FR`), Русский(`ru-RU`), Español(`es-ES`), Português Brasil(`pt-BR`), Italiano(`it-IT`). 리포트를 쓸 때 `/airp --locale …`로 지정하세요.

## 블록

이 블록들을 외울 필요는 없습니다. `/airp` Skill이 내용에 맞춰 고릅니다. 직접 고르고 싶을 때만 아래 표를 보세요.

| 판형과 본문 | 대조와 목록 | 엔지니어링과 의사결정 |
| --- | --- | --- |
| **히어로 지표**(`hero`)<br>*맨 앞에 가장 중요한 지표 몇 개* | **표**(`table`)<br>*여러 행·열을 맞춰 비교* | **코드**(`code`)<br>*짧은 코드* |
| **리드**(`lead`)<br>*이 절이 무슨 이야기인지 한 문장* | **비교**(`comparison`)<br>*좌우로 바꾸기 전과 후* | **코드 차이**(`codeDiff`)<br>*어느 줄이 바뀌었는지* |
| **섹션**(`section`)<br>*주제별로 건너뛸 수 있는 큰 덩어리* | **카드 모음**(`collection`)<br>*항목을 카드로 펼침* | **파일 트리**(`fileTree`)<br>*디렉터리 구조* |
| **제목**(`heading`)<br>*소절의 단계를 표시* | **키-값 목록**(`keyValueList`)<br>*이름과 값을 짝으로* | **파일 변경**(`fileChangeList`)<br>*추가, 수정, 삭제된 파일* |
| **문단**(`paragraph`)<br>*설명 한 단락* | **정의 목록**(`definitionList`)<br>*용어와 뜻을 짝으로* | **Mermaid**(`mermaid`)<br>*흐름, 시퀀스, 상태 같은 그림* |
| **그룹**(`group`)<br>*이웃한 내용을 한 묶음으로* | **용어집**(`glossary`)<br>*글에 나온 말을 모아 설명* | **아키텍처 개요**(`architectureOverview`)<br>*전체 그림과 모듈 카드로 시스템을 봄* |
| **강조 인용**(`pullQuote`)<br>*핵심 한 줄을 따로 꺼냄* | **상태 보드**(`statusBoard`)<br>*통과, 실패, 일부를 한눈에* | **API 목록**(`apiInventory`)<br>*API와 용도* |
| **인용**(`blockquote`)<br>*원문이나 다른 사람의 말* | **체크리스트**(`checklist`)<br>*항목 완료 여부* | **테스트 결과**(`testResult`)<br>*통과와 실패 수를 모음* |
| **콜아웃**(`callout`)<br>*주의, 경고, 결론을 표시* | **타임라인**(`timeline`)<br>*일어난 일을 시간순으로* | **요구 추적**(`requirementTrace`)<br>*요구를 상태와 근거에 연결* |
| **글머리 목록**(`bulletList`)<br>*요점을 나란히* | **로드맵**(`roadmap`)<br>*단계별 목표와 진행* | **의사결정**(`decision`)<br>*무엇을 골랐고 왜인지* |
| **번호 목록**(`numberedList`)<br>*순서대로 단계나 항목* | **단계 흐름**(`flowSteps`)<br>*흐름을 앞뒤 단계로* | **위험**(`risk`)<br>*위험과 지금 상태* |
| **구분선**(`divider`)<br>*위아래 사이에 선을 긋기* | **링크 목록**(`linkList`)<br>*관련 링크* | **가정**(`assumption`)<br>*지금 기대고 있는 전제* |
| **여백**(`spacer`)<br>*블록 사이에 간격* | **출처**(`citation`)<br>*인용의 출처* | **제약**(`constraint`)<br>*넘을 수 없는 한계* |
| **이미지**(`image`)<br>*그림과 설명* | **탭**(`tabs`)<br>*한곳에서 여러 관점을 전환* | **미결 질문**(`openQuestion`)<br>*아직 정하지 않은 것* |
| **임베드**(`embed`)<br>*외부 페이지나 리소스* | **접기**(`collapsible`)<br>*덜 중요한 긴 내용을 접어 둠* | **에이전트 메모**(`agentNote`)<br>*모델용 메모. 사람에게는 기본으로 안 보임* |
| **부록**(`appendix`)<br>*보충 자료는 맨 끝으로* | | |

## 앞으로 할 일

지금 되는 것: Skill로 소스 생성 / 검증, 확장으로 HTML / Markdown 읽기·내보내기. 다음에 하려는 것:

| 방향 | 설명 |
| --- | --- |
| **시각 편집** | 확장 안에서 바로 고치기. 매번 Skill을 찾을 필요 없음 |
| **내보내기 형식 늘리기** | PDF 추가(인쇄, 보관) |
| **여러 페이지 / 여러 시트** | 긴 리포트를 장·시트로 나누고 한 페이지에 몰아넣지 않기 |

## 로컬 개발과 빌드

이 저장소를 고치는 사람을 위한 섹션입니다. 평소 VS Code 확장과 Skill만 쓴다면 클론할 필요 없습니다.

환경: Node.js **20.19+**, pnpm **10.17+**.

```bash
pnpm install
```

**검증 CLI** (`airp-validate`)

```bash
# 잠깐 돌려보기
pnpm validate-cli:sample

# 빌드 → apps/validate-cli/dist/cli.mjs
pnpm exec turbo run build --filter=@airp/validate-cli
```

**렌더 CLI** (`airp-render`)

```bash
# 잠깐 돌려보기
pnpm renderer-cli:sample

# 빌드 → apps/renderer-cli/dist/cli.mjs
pnpm exec turbo run build --filter=@airp/renderer-cli
```

**VS Code 확장**

이 저장소를 VS Code로 열고 F5(또는 **Launch AIRP Renderer**)로 Extension Development Host에 들어가면 디버깅할 수 있습니다.

```bash
# 빌드
pnpm exec turbo run build --filter=airp-renderer-vscode

# 패키지 → apps/renderer-vscode/dist/airp-renderer-vscode-<version>.vsix
pnpm --filter=airp-renderer-vscode package
```

---

## 변경 기록

[변경 기록](https://github.com/maosong-ai/airp/blob/main/CHANGELOG.md)

## 라이선스

MIT

[AIRP](https://github.com/maosong-ai/airp) | Copyright (c) 2026 毛松 <maosong-life@outlook.com>
