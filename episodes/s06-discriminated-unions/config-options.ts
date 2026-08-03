// exactOptionalPropertyTypes는 이 화 전용 tsconfig.exact.json에서만 켠다.
// 루트 tsconfig에 켜면 §4의 param-vs-optional.ts가 함께 걸려 저장소 전체 타입 검사가 깨지는데,
// 그 화는 "옵셔널 프로퍼티에 undefined를 명시해도 통과한다"는 것 자체가 교육 내용이라 지울 수 없다.
// 검사: npx tsc --noEmit -p episodes/s06-discriminated-unions/tsconfig.exact.json

type ConfigOptional = { host: string; port?: number };
type ConfigWithUndefinedUnion = { host: string; port: number | undefined };

const withoutPort: ConfigOptional = { host: "localhost" };

// 플래그를 켜면 옵셔널 프로퍼티에 undefined를 명시하는 대입이 막힌다.
// const withUndefinedPort: ConfigOptional = {
//   host: "localhost",
//   port: undefined,
// };
// error TS2375: Type '{ host: string; port: undefined; }' is not assignable to type 'ConfigOptional' with 'exactOptionalPropertyTypes: true'. Consider adding 'undefined' to the types of the target's properties.

// undefined 유니온은 플래그와 무관하게 키 자체를 생략할 수 없다.
// const missingKey: ConfigWithUndefinedUnion = { host: "localhost" };
// error TS2741: Property 'port' is missing in type '{ host: string; }' but required in type 'ConfigWithUndefinedUnion'.

// undefined를 값으로 받겠다고 타입에 명시하면 플래그를 켜도 통과한다.
const explicitUndefined: ConfigWithUndefinedUnion = {
  host: "localhost",
  port: undefined,
};

// 플래그가 켜진 상태에서도 깨끗하게 통과하는 실제 설정 객체 — port는 아예 생략한다.
const serverConfig: ConfigOptional = { host: "api.internal" };

console.log("port" in withoutPort);
console.log("port" in explicitUndefined);
console.log("port" in serverConfig);

export {};
