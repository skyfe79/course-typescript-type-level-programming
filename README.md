# Real! TypeScript 7 — 실습 저장소

<img width="800" height="1084" alt="image" src="https://github.com/user-attachments/assets/70c966da-6fdf-48fe-ba3b-760cac78a66a" />


타입 설계(Part 1)와 타입 레벨 프로그래밍(Part 2) 강좌의 실습 코드가 들어 있습니다.

## 강의를 따라오는 법

에피소드마다 **브랜치 하나**와 **태그 하나**가 있습니다.

```bash
# N번째 에피소드가 끝난 시점의 전체 코드
git checkout ep_007

# 그 에피소드의 개발 과정 (커밋 하나 = 강의의 실습 단계 하나)
git checkout section_2_ep_007_...
git log --oneline
```

- **태그 `ep_NNN`** — 그 에피소드를 마쳤을 때의 상태입니다. 실습을 건너뛰고 결과만 보고 싶을 때
  체크아웃하세요.
- **브랜치 `section_{섹션번호}_ep_{화번호}_{기능이름}`** — 그 에피소드를 만들어 간 과정입니다.
  커밋을 하나씩 따라가면 강의에서 코드를 쌓아 간 순서와 같습니다.

## 폴더 구조

```
episodes/     에피소드마다 혼자 실행되는 파일 하나 (다른 화를 import 하지 않습니다)
projects/     여러 화에 걸쳐 이어 만드는 CLI 프로젝트들 (각자 독립 패키지)
```

## 준비물

- **Node.js 22.18 이상** (권장 24 이상) — `node`가 `.ts` 파일을 그대로 실행합니다.
- **npm** — 이 저장소의 패키지 매니저입니다.

TypeScript는 전역이 아니라 저장소의 devDependency로 들어 있습니다.

```bash
npm install
```

## 실행

```bash
node episodes/s05-narrowing/ep_019.ts   # 에피소드 파일 하나 실행
npx tsc --noEmit                        # 타입 검사
```

강의는 `npx tsc --noEmit --watch`를 한쪽 터미널에 띄워 둔 채 `node <파일>.ts`로 결과를 확인하는
방식으로 진행합니다.
