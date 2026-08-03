function parseJSON<T = unknown>(raw: string): T {
  // 이 as T가 이 함수의 유일한 경계 지점이다. 나머지는 전부 타입을 지킨다.
  return JSON.parse(raw) as T;
}

const raw = '{"port": 4000}';
const config = parseJSON<{ port: number }>(raw);

console.log(config.port);

export {};
