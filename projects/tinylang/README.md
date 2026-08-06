# tinylang

tinylang은 렉서, 파서, 타입 검사기, 코드 생성기, 런타임을 갖춘 작은 언어입니다. `.tl` 소스를 검사하거나 자바스크립트로 만들고 바로 실행할 수 있습니다.

## 설치와 실행

패키지를 빌드하고 전역 명령으로 연결하려면 다음과 같이 실행합니다.

```bash
npm run build
npm link
tinylang run examples/greet.tl
```

전역으로 연결하지 않고 저장소 안에서 실행할 수도 있습니다.

```bash
npx tinylang run examples/greet.tl
node src/cli.ts run examples/greet.tl
```

## 명령

- `tinylang check <소스.tl>`: 소스의 오류를 검사합니다.
- `tinylang build <소스.tl> [-o <출력.js>]`: 소스를 자바스크립트 파일로 만듭니다.
- `tinylang run <소스.tl> [-o <출력.js>]`: 소스를 자바스크립트로 만든 뒤 실행합니다.

`-o <출력.js>`는 `build`와 `run`에서 출력 파일 경로를 지정합니다. 생략하면 소스의 마지막 `.tl`을 `.js`로 바꾸거나, 다른 이름에는 `.js`를 덧붙입니다. `check`에는 `-o`를 사용할 수 없습니다.

## 예제

| 파일 | 보여 주는 내용 | 입력 |
| --- | --- | --- |
| `examples/greet.tl` | 함수 선언과 호출, 문자열 입력을 숫자로 바꾸기 | 숫자 하나 필요 |
| `examples/calc.tl` | 조건 분기와 사칙연산, 0으로 나누는 경우 처리 | 숫자 두 개와 연산자 필요 |
| `examples/gugudan.tl` | 중첩 `while` 반복과 문자열 조합 | 필요 없음 |
| `examples/guess.tl` | 무작위 수, 반복, `UP`/`DOWN` 분기 | 1부터 100 사이의 추측 필요 |
| `examples/recursion.tl` | 재귀 함수로 팩토리얼, 최대공약수, 피보나치 계산 | 필요 없음 |

다섯 예제를 설치된 명령으로 실행하고 빌드 결과와 대조하려면 `npm run demo:e2e`를 실행합니다.

## 라이브러리로 사용하기

명령행 인자 해석 함수 `parseArgs`, 실행 함수 `dispatch`, 사용법 문자열 `CLI_USAGE`를 내보냅니다. 공개 타입 `Command`와 `ParsedArgs`를 포함한 이 표면의 타입 선언은 빌드한 `dist/cli.d.ts`에서 확인할 수 있습니다.

## 알려진 한계

- AST에 소스 위치가 없어 타입 검사기 진단에는 줄 번호가 없습니다.
- 파서는 첫 번째 구문 오류에서 멈춥니다.
- 소스 맵을 만들지 않습니다.
- 생성 코드는 사용하지 않는 내장 함수까지 import합니다.
- `? :` 삼항식은 타입 수준으로만 등록되어 있고 아직 파싱되지 않습니다(ep_221).
