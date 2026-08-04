// 타입 계산도 컴파일 타임에 실행되는 프로그램이며, 너무 깊어지면 검사기가 멈춰 세운다는 점을 보인다.
// 실행: node episodes/s20-why-type-level/instantiation-depth-limit.ts
// 검사: npx tsc -p episodes/s20-why-type-level/tsconfig.depth-limit.json
//       (일부러 실패하는 파일이라 저장소 전체 검사에서는 빠져 있습니다)

// 누산기 없이 재귀해 문자열 순서를 거꾸로 만드는 조건부 타입입니다.
// 결과가 템플릿 리터럴 안에 감싸여 있으므로 재귀 호출이 꼬리 위치에 있지 않습니다.
type ReverseString<S extends string> = S extends `${infer Head}${infer Rest}`
  ? `${ReverseString<Rest>}${Head}`
  : S;

// 먼저 짧은 입력에서는 타입 계산이 제대로 끝난다는 사실을 확인합니다.
// 아래 대입이 통과한다는 것은 ReverseString<"typescript">가 실제로 "tpircsepyt"까지 계산됐다는 뜻입니다.
type Short = ReverseString<"typescript">;
const short: Short = "tpircsepyt";

console.log("짧은 문자열은 뒤집힌다:", short);

// 26자 × 5 = 130자인 문자열 리터럴 타입입니다.
type LongAlphabet = "abcdefghijklmnopqrstuvwxyzabcdefghijklmnopqrstuvwxyzabcdefghijklmnopqrstuvwxyzabcdefghijklmnopqrstuvwxyzabcdefghijklmnopqrstuvwxyz";

// 여기서 검사기는 ReverseString을 계속 펼치다가 인스턴스화 깊이 제한에 걸립니다.
// 즉, 타입 자체가 틀린 것이 아니라 계산해야 할 깊이가 너무 깊어진 것입니다.
type ReversedAlphabet = ReverseString<LongAlphabet>;
// error TS2589: Type instantiation is excessively deep and possibly infinite.
// 진단은 이 줄의 25번째 칸, 즉 ReverseString<LongAlphabet>을 가리킵니다. 별칭 이름이 아니라
// 검사기가 실제로 펼치다 만 그 자리입니다.

console.log("이 줄은 컴파일 타임 타입 계산과 무관하게 그대로 실행된다");

export {};
