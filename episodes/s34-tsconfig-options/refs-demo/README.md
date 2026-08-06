# 프로젝트 참조 빌드 관찰하기

이 실습은 `core`와 이를 사용하는 `app`을 프로젝트 참조로 연결합니다. 모든 명령은 이
`refs-demo` 폴더에서 실행하세요. `--verbose` 출력의 시간과 일부 설명은 TypeScript 버전에 따라
조금 달라질 수 있으므로, 아래에 인용한 핵심 줄을 찾아보면 됩니다.

## 1단계: 처음 빌드하기

```bash
npx tsc --build --verbose
```

처음에는 출력 파일이 없으므로 다음 순서로 표시됩니다.

```text
Project 'packages/core/tsconfig.json' is out of date ...
Building project 'packages/core/tsconfig.json'...
Project 'packages/app/tsconfig.json' is out of date ...
Building project 'packages/app/tsconfig.json'...
```

`app`이 `core`를 참조하므로 루트 `references`에 적은 두 항목을 무작정 병렬로 만들지 않고
`core → app` 순서를 지킵니다. 빌드 뒤에는 두 패키지에 다음 파일이 생깁니다.

```text
packages/core/dist/index.js
packages/core/dist/index.d.ts
packages/core/tsconfig.tsbuildinfo
packages/app/dist/index.js
packages/app/dist/index.d.ts
packages/app/tsconfig.tsbuildinfo
```

`tsconfig.tsbuildinfo`는 `dist/` 안이 아니라 각 패키지의 `tsconfig.json` 옆에 생깁니다.
이 파일에는 다음 증분 빌드가 이전 결과를 재사용하는 데 필요한 정보가 저장됩니다.

빌드된 app도 실행해 봅니다.

```bash
node packages/app/dist/index.js
```

```text
42
```

## 2단계: 아무것도 고치지 않고 다시 빌드하기

```bash
npx tsc --build --verbose
```

두 프로젝트 모두 최신 상태이므로 컴파일하지 않습니다.

```text
Project 'packages/core/tsconfig.json' is up to date ...
Project 'packages/app/tsconfig.json' is up to date ...
```

`Building project` 줄이 다시 나오지 않는지 확인하세요. 이것이 `.tsbuildinfo`를 이용한
`incremental` 빌드입니다. `composite: true`인 프로젝트는 증분 빌드를 사용합니다.

## 3단계: core의 함수 본문만 바꾸기

`packages/core/src/index.ts`에서 계산식만 다음처럼 바꿉니다.

```ts
return n + n;
```

다시 빌드합니다.

```bash
npx tsc --build --verbose
```

이번에는 core만 컴파일되고 app은 출력 타임스탬프만 갱신됩니다.

```text
Project 'packages/core/tsconfig.json' is out of date because output 'packages/core/tsconfig.tsbuildinfo' is older than input 'packages/core/src/index.ts'
Building project 'packages/core/tsconfig.json'...
Project 'packages/app/tsconfig.json' is up to date with .d.ts files from its dependencies
Updating output timestamps of project 'packages/app/tsconfig.json'...
```

함수 구현은 바뀌었지만 공개 선언은 여전히 `double(n: number): number`입니다. app은 core의
소스가 아니라 `core/dist/index.d.ts`를 타입 입력으로 읽으므로 다시 검사할 이유가 없습니다.

## 4단계: core의 공개 시그니처 바꾸기

같은 함수를 다음처럼 바꿉니다. 기본값이 있으므로 기존 `double(21)` 호출도 유효합니다.

```ts
export function double(n: number, times: number = 2): number {
  return n * times;
}
```

다시 빌드합니다.

```bash
npx tsc --build --verbose
```

이번에는 core의 선언 파일이 바뀌어 app까지 실제로 다시 빌드됩니다.

```text
Building project 'packages/core/tsconfig.json'...
Project 'packages/app/tsconfig.json' is out of date because output 'packages/app/tsconfig.tsbuildinfo' is older than input 'packages/core/dist/index.d.ts'
Building project 'packages/app/tsconfig.json'...
```

핵심은 “의존 패키지의 소스가 바뀌었는가”가 아니라 “참조하는 쪽이 보는 `.d.ts` 공개 표면이
바뀌었는가”입니다. 실험을 마친 뒤에는 `packages/core/src/index.ts`를 처음 상태인
`double(n: number) { return n * 2; }`로 되돌리면 됩니다.
