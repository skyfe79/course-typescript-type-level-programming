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

export {};
