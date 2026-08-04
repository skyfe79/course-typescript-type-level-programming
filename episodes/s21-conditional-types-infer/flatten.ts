// Flatten이 여러 겹 중첩된 배열 타입을 가장 안쪽 원소의 배열 타입으로 줄이는지 확인한다.
// 실행: node episodes/s21-conditional-types-infer/flatten.ts
// 검사: npx tsc --noEmit

// T가 배열이면 infer U로 원소 타입을 꺼낸다.
// U가 다시 배열이면 Flatten<U>를 그대로 반환하고, 더 이상 배열이 아니면 U[]가 최종 결과다.
// 재귀 호출 결과를 다른 타입으로 감싸지 않는 꼬리 자리라 꽤 깊은 입력까지 계산할 수 있다.
export type Flatten<T> = T extends Array<infer U>
  ? U extends Array<any>
    ? Flatten<U>
    : U[]
  : never;

type Nested = Array<Array<Array<number>>>;
type MoreNested = Array<Array<Array<Array<number>>>>;

type Flat = Flatten<Nested>;           // number[]
type MoreFlat = Flatten<MoreNested>;   // number[]

// any로 넓히지 않고 number[]로 남는지 값 대입으로 확인한다.
// 문자열을 섞으면 number[] 조건을 만족하지 못하므로 컴파일이 막힌다.
const xs: Flat = [1, 2, 3];
const ys: MoreFlat = [4, 5, 6];

console.log(`Flatten 확인: ${xs.join(", ")} / ${ys.join(", ")} 모두 number[]입니다.`);
