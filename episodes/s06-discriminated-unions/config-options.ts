type ConfigOptional = { host: string; port?: number };
type ConfigWithUndefinedUnion = { host: string; port: number | undefined };

const withoutPort: ConfigOptional = { host: "localhost" };

// 기본 설정에서는 옵셔널 프로퍼티에 undefined를 명시해도 그대로 통과한다.
const withUndefinedPort: ConfigOptional = {
  host: "localhost",
  port: undefined,
};

// undefined 유니온은 플래그와 무관하게 키 자체를 생략할 수 없다.
// const missingKey: ConfigWithUndefinedUnion = { host: "localhost" };
// error TS2741: Property 'port' is missing in type '{ host: string; }' but required in type 'ConfigWithUndefinedUnion'.

const explicitUndefined: ConfigWithUndefinedUnion = {
  host: "localhost",
  port: undefined,
};

console.log("port" in withoutPort);
console.log("port" in withUndefinedPort);
console.log("port" in explicitUndefined);

export {};
