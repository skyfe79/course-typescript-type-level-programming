function parseJSON<T = unknown>(raw: string): T {
  // 이 as T가 이 함수의 유일한 경계 지점이다. 나머지는 전부 타입을 지킨다.
  return JSON.parse(raw) as T;
}

const raw = '{"port": 4000}';
const config = parseJSON<{ port: number }>(raw);

console.log(config.port);

function readSetting<T = string>(key: string): T {
  const raw = process.env[key] ?? "";
  return raw as T;
}

// 개발자는 boolean을 기대했지만 <T>를 적지 않았다.
const debugFlag = readSetting("DEBUG");

// 추론이 후보를 하나도 못 찾아 기본값 string이 조용히 채워졌다.
// const debugFlagBoolean: boolean = debugFlag;
// error TS2322: Type 'string' is not assignable to type 'boolean'.

// "false"도 비어 있지 않은 문자열이라 참으로 평가된다. 그래서 DEBUG=false도 debug mode를 켠다.
if (debugFlag) {
  console.log("debug mode is on");
}

export {};
