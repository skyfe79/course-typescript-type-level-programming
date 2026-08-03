const deployPlain = {
  env: "production",
  region: "us-east-1",
  replicas: 3,
  tags: ["blue-green", "canary"],
  limits: { cpu: 2, memory: 512 },
};

// as const가 없으면 속성의 리터럴이 넓어진다.
const anyEnvValue: typeof deployPlain.env = "staging";

const deployFrozen = {
  env: "production",
  region: "us-east-1",
  replicas: 3,
  tags: ["blue-green", "canary"],
  limits: { cpu: 2, memory: 512 },
} as const;

const onlyProduction: typeof deployFrozen.env = "production";

// 최상위 속성의 리터럴이 고정된다.
// const notAllowed: typeof deployFrozen.env = "staging";
// error TS2322: Type '"staging"' is not assignable to type '"production"'.

// 중첩 속성의 리터럴도 고정된다.
// const notTwo: typeof deployFrozen.limits.cpu = 4;
// error TS2322: Type '4' is not assignable to type '2'.

// 같은 리터럴 2를 다시 넣어도 읽기 전용이라 막힌다.
// deployFrozen.limits.cpu = 2;
// error TS2540: Cannot assign to 'cpu' because it is a read-only property.

export {};
