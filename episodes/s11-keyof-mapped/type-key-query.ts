// keyof는 타입이 가진 프로퍼티 이름을 문자열 리터럴 유니온으로 돌려준다.
// 값 객체를 as const로 얼려 두면, 그 값 하나에서 곧바로 키 유니온을 얻을 수 있다.
const defaultConfig = {
  retries: 3,
  timeoutMs: 1000,
  baseUrl: "https://api.example.com",
} as const;

// typeof가 값을 타입 공간으로 끌어오고, keyof가 거기서 이름만 꺼낸다.
type ConfigKey = keyof typeof defaultConfig;

// 세 이름이 모두 ConfigKey에 들어간다.
const checkKeys: ConfigKey[] = ["retries", "timeoutMs", "baseUrl"];

// 그리고 ConfigKey는 그 셋 밖으로 넓어지지 않았다 — string이 아니라 세 리터럴의 유니온이다.
const checkNarrow: "retries" | "timeoutMs" | "baseUrl" = checkKeys[0];

// 목록에 없는 이름은 ConfigKey가 될 수 없다. 그래서 아래 줄은 막아 두었다.
// const typo: ConfigKey = "retry";
// error TS2322: Type '"retry"' is not assignable to type '"baseUrl" | "retries" | "timeoutMs"'.

// 어떤 객체 타입에도 쓸 수 있는 키 목록 헬퍼.
function listConfigKeys<T extends object>(obj: T): (keyof T)[] {
  // Object.keys는 런타임에 언제나 string[]을 돌려준다. keyof T는 타입 검사기 안에만 있는
  // 이름이라 런타임에는 흔적이 없고, 그래서 둘을 맞추려면 이 자리에 단언이 필요하다.
  return Object.keys(obj) as (keyof T)[];
}

const keys = listConfigKeys(defaultConfig);

console.log(checkNarrow, keys);

// 타입 자리의 typeof는 실행되지 않는다. 이미 선언된 값의 타입을 그대로 읽어 올 뿐이다.
// 그래서 이 별칭을 만들면서 프로퍼티 타입을 한 글자도 손으로 적지 않았다.
type DefaultConfig = typeof defaultConfig;

// 끌어온 것은 number나 string이 아니라 값에 적힌 리터럴 그대로다.
const checkConfig: DefaultConfig = {
  retries: 3,
  timeoutMs: 1000,
  baseUrl: "https://api.example.com",
};

// 값 하나만 달라져도 대입은 막힌다. 그래서 아래 줄은 막아 두었다.
// const wrongValue: DefaultConfig = { ...checkConfig, retries: 4 };
// error TS2322: Type '4' is not assignable to type '3'.

// as const로 얼린 값에서 끌어온 타입이라 프로퍼티도 readonly다. 그래서 아래 줄도 막아 두었다.
// checkConfig.retries = 4;
// error TS2540: Cannot assign to 'retries' because it is a read-only property.

// 매개변수 타입 자리에도 같은 typeof를 쓴다. 값과 타입이 따로 놀 자리가 없다.
function describeConfig(cfg: typeof defaultConfig) {
  for (const key of listConfigKeys(cfg)) {
    console.log(`${String(key)}: ${cfg[key]}`);
  }
}

describeConfig(defaultConfig);

export {};
