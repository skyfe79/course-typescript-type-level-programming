interface ServiceSpec {
  name: string;
  port: number;
  env: Record<string, string>;
}

const spec = {
  name: "envcheck",
  port: 4000,
  env: { NODE_ENV: "production", LOG_LEVEL: "info" },
};

const widePort: number = spec.port;
const wideEnvValue: string = spec.env.NODE_ENV;

// 넓은 타입은 좁은 리터럴 자리에 넣을 수 없다.
// const narrowPort: 4000 = spec.port;
// error TS2322: Type 'number' is not assignable to type '4000'.
// const narrowEnvValue: "production" = spec.env.NODE_ENV;
// error TS2322: Type 'string' is not assignable to type '"production"'.

console.log("plain", widePort, wideEnvValue);

const specFrozen = {
  name: "envcheck",
  port: 4000,
  env: { NODE_ENV: "production", LOG_LEVEL: "info" },
} as const;

const exactPort: 4000 = specFrozen.port;
const exactEnvValue: "production" = specFrozen.env.NODE_ENV;

// as const는 값을 얼릴 뿐 ServiceSpec과 맞는지는 검사하지 않는다.
const specFrozenWrong = {
  name: "envcheck",
  port: "4000",
  env: { NODE_ENV: "production" },
} as const;

console.log("frozen", exactPort, exactEnvValue, specFrozenWrong.port);

const specComplete = {
  name: "envcheck",
  port: 4000,
  env: { NODE_ENV: "production", LOG_LEVEL: "info" },
} as const satisfies ServiceSpec;

const exactPortComplete: 4000 = specComplete.port;
const exactEnvComplete: "production" = specComplete.env.NODE_ENV;

// as const가 조용히 통과시킨 같은 실수는 satisfies 자리에서 잡힌다.
// const specWrongComplete = {
//   name: "envcheck",
//   port: "4000",
//   env: { NODE_ENV: "production" },
// } as const satisfies ServiceSpec;
// error TS2322: Type 'string' is not assignable to type 'number'.

console.log("complete", exactPortComplete, exactEnvComplete);

export {};
