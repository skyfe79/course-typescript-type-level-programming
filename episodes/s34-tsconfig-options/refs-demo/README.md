# 프로젝트 참조 빌드 관찰하기

이 실습은 서로 독립적인 `core`와 `utils`, 그리고 둘을 사용하는 `app`을 프로젝트 참조로
연결합니다. 모든 명령은 이 `refs-demo` 폴더에서 실행하세요. `--verbose` 출력의 시간과 일부
설명은 TypeScript 버전에 따라 조금 달라질 수 있으므로, 아래에 인용한 핵심 줄을 찾아보면 됩니다.

## 1단계: 처음 빌드하기

```bash
npx tsc --build --verbose
```

처음에는 출력 파일이 없으므로 다음 순서로 표시됩니다.

```text
Project 'packages/core/tsconfig.json' is out of date because output file 'packages/core/tsconfig.tsbuildinfo' does not exist
Building project 'packages/core/tsconfig.json'...
Project 'packages/utils/tsconfig.json' is out of date because output file 'packages/utils/tsconfig.tsbuildinfo' does not exist
Building project 'packages/utils/tsconfig.json'...
Project 'packages/app/tsconfig.json' is out of date because output file 'packages/app/tsconfig.tsbuildinfo' does not exist
Building project 'packages/app/tsconfig.json'...
```

`app`이 `core`와 `utils`를 참조하므로 루트 `references`에 적은 세 항목을 나열 순서대로 무작정
만들지 않습니다. 서로 의존하지 않는 `core`와 `utils`를 먼저 빌드하고, 둘의 결과가 준비된 뒤
`app`을 빌드합니다. 빌드 뒤에는 세 패키지에 다음 파일이 생깁니다.

```text
packages/core/dist/index.js
packages/core/dist/index.d.ts
packages/core/tsconfig.tsbuildinfo
packages/utils/dist/index.js
packages/utils/dist/index.d.ts
packages/utils/tsconfig.tsbuildinfo
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
BUILD MODE!
```

## 2단계: 아무것도 고치지 않고 다시 빌드하기

```bash
npx tsc --build --verbose
```

세 프로젝트 모두 최신 상태이므로 컴파일하지 않습니다.

```text
Project 'packages/core/tsconfig.json' is up to date ...
Project 'packages/utils/tsconfig.json' is up to date ...
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
Project 'packages/utils/tsconfig.json' is up to date because newest input 'packages/utils/src/index.ts' is older than output 'packages/utils/tsconfig.tsbuildinfo'
Project 'packages/app/tsconfig.json' is up to date with .d.ts files from its dependencies
Updating output timestamps of project 'packages/app/tsconfig.json'...
```

함수 구현은 바뀌었지만 공개 선언은 여전히 `double(n: number): number`입니다. app은 core의
소스가 아니라 `core/dist/index.d.ts`를 타입 입력으로 읽으므로 다시 검사할 이유가 없습니다.
utils는 core를 참조하지 않으므로 이 실험과 무관하며, 소스를 건드리지 않습니다.

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
Project 'packages/utils/tsconfig.json' is up to date because newest input 'packages/utils/src/index.ts' is older than output 'packages/utils/tsconfig.tsbuildinfo'
Project 'packages/app/tsconfig.json' is out of date because output 'packages/app/tsconfig.tsbuildinfo' is older than input 'packages/core/dist/index.d.ts'
Building project 'packages/app/tsconfig.json'...
```

핵심은 “의존 패키지의 소스가 바뀌었는가”가 아니라 “참조하는 쪽이 보는 `.d.ts` 공개 표면이
바뀌었는가”입니다. 3단계와 마찬가지로 utils는 이 실험에 관여하지 않습니다.

## 5단계: --builders로 빌드 시간 재기

3·4단계 실험을 했다면 먼저 `packages/core/src/index.ts`를 처음 상태인
`double(n: number) { return n * 2; }`로 되돌립니다. 그런 다음 동시에 빌드할 수 있는 프로젝트
수를 바꿔 가며 시간을 잽니다.

```bash
time npx tsc --build --force --builders 1
time npx tsc --build --force --builders 4
```

`--force`를 함께 쓰는 이유는 모든 프로젝트를 매번 다시 빌드하기 위해서입니다. 증분 빌드가 최신
프로젝트를 건너뛰게 두면 두 명령이 같은 일을 하지 않을 수 있으므로 시간 비교가 성립하지 않습니다.

이 저장소에서 두 명령을 번갈아 여섯 번씩 실행해 얻은 값은 다음과 같습니다. 이 숫자는 이 컴퓨터에서
이 저장소를 잰 결과일 뿐이며, 다른 환경에서도 그대로 재현되는 고정값이 아닙니다.

```text
--builders 1 : 0.73 ~ 0.88초
--builders 4 : 0.56 ~ 0.71초
```

여기서 특히 주의할 점은 로그가 병렬 실행의 증거가 아니라는 사실입니다. 두 명령에 `--verbose`를
붙여도 `--builders 1`과 `--builders 4`의 로그는 글자 그대로 같습니다. `Building project` 줄은
항상 `core → utils → app`이라는 그래프 순서로 찍히며, 동시에 빌드되는 패키지의 로그가 서로
겹쳐 찍히거나 순서가 뒤섞이지 않습니다. 병렬 빌드가 일어났다는 차이는 로그가 아니라 걸린 시간으로
관찰해야 합니다.

`--builders`는 서로 의존하지 않는 프로젝트를 동시에 몇 개까지 빌드할지를 정합니다. 한 프로젝트
안에서 파일을 나눠 검사하는 병렬성인 `--checkers`와는 층위가 다릅니다. 실제로
`npx tsc --build --help`도 두 옵션을 각각 다음처럼 설명합니다.

```text
--builders  Set the number of projects to build concurrently.
--checkers  Set the number of checkers per project.
```

`--builders 0`은 다음 오류로 거부되지만 `--builders 1`은 정상 동작합니다.

```text
error TS5002: Option 'builders' requires value to be greater than '1'.
```

이 실습은 패키지가 셋뿐이고 각 패키지도 아주 작아서 시간 차이가 작습니다. 실제 저장소에서는
프로젝트 그래프와 작업량, 기계의 CPU 환경이 모두 다르므로 `--builders`의 최적값을 고정된 숫자로
정할 수 없습니다. 각자 자기 저장소와 기계에서 직접 시간을 재어 적절한 값을 정하세요.
