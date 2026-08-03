// noUncheckedIndexedAccess는 이 화 전용 tsconfig.unchecked-index.json에서만 켠다.
// 루트 tsconfig에 켜면 기존 68개 화 파일 전체가 함께 재검사된다.
// 검사: npx tsc --noEmit -p episodes/s11-keyof-mapped/tsconfig.unchecked-index.json

// 지난 화와 같은 값 객체를 이 파일 안에 다시 둔다.
const user = {
  id: 1,
  name: "Ada",
  email: "ada@example.com",
};

// 지난 시간의 get도 다시 선언한다.
function get<T extends object, K extends keyof T>(obj: T, key: K) {
  return obj[key];
}

// 단일 키로 인덱싱하면 그 프로퍼티의 값 타입이 나온다.
type UserNameType = (typeof user)["name"];

const checkName: UserNameType = "Ada";

// 그 타입이 정확히 string이라는 것은 어긋나는 대입을 막아 두면 컴파일러가 말해 준다.
// const wrongName: (typeof user)["name"] = 1;
// error TS2322: Type 'number' is not assignable to type 'string'.

// 키 유니온으로 인덱싱하면 값 타입도 유니온이 된다.
type UserIdOrEmailType = (typeof user)["id" | "email"];

const checkId: UserIdOrEmailType = 1;
const checkEmail: UserIdOrEmailType = "ada@example.com";

// 검사기가 이 유니온을 어떤 순서로 표시하는지도 진단이 알려 준다.
// const wrongIdOrEmail: (typeof user)["id" | "email"] = true;
// error TS2322: Type 'boolean' is not assignable to type 'string | number'.

// 지난 시간 get()의 반환 타입으로 떴던 T[K]가 바로 이 인덱스 접근이다.
const nameAgain: UserNameType = get(user, "name");
console.log(nameAgain);

// 배열에 number로 인덱싱하면 원소 타입이 나온다.
const scores: number[] = [10, 20, 30];
type ScoreElem = (typeof scores)[number];

const checkScoreElem: ScoreElem = 10;

// noUncheckedIndexedAccess를 켜고 반환 타입을 number로 두면 인덱스 실패 가능성이 드러난다.
// function readScore(list: number[], index: number): number {
//   return list[index];
// }
// error TS2322: Type 'number | undefined' is not assignable to type 'number'.
//   Type 'undefined' is not assignable to type 'number'.

// 그래서 인덱스로 읽은 결과에는 undefined를 포함한다.
function readScore(list: number[], index: number): number | undefined {
  return list[index];
}

// 범위 밖 인덱스라 실행하면 undefined가 찍힌다.
console.log(readScore(scores, 10));

export {};
