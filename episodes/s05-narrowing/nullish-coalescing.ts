function readTimeout(raw: number | null | undefined): number {
  const timeout = raw ?? 5000;
  // 여기서 timeout을 호버하면 number다 — null과 undefined가 제거됐다.
  return timeout;
}

function readRetryCountWrong(raw: number | undefined): number {
  return raw || 3; // 0도 fallback으로 바뀐다 — 버그다.
}

function readRetryCountRight(raw: number | undefined): number {
  return raw ?? 3; // 0은 그대로 남는다.
}

console.log("timeout:", readTimeout(undefined));
console.log("wrong with 0 retries:", readRetryCountWrong(0));
console.log("right with 0 retries:", readRetryCountRight(0));

let retries: number | undefined = undefined;
retries ??= 3;
// 여기서 retries를 호버하면 number다 — undefined일 때만 대입이 실제로 일어났다.
console.log("defaulted retries:", retries);

let zeroRetries: number | undefined = 0;
zeroRetries ??= 3;
console.log("zero retries kept:", zeroRetries);
