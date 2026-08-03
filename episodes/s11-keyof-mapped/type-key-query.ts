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

export {};
