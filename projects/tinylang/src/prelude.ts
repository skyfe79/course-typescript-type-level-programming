// 이 파일의 세 함수는 값을 받으면 기다리는 과정 없이 즉시 결과를 돌려주는 동기 함수다.
// 다음에 추가할 input은 사용자의 입력을 기다려야 하므로 이 함수들과 실행 방식이 다르다.

export function print(value: unknown): void {
  // tinylang의 런타임 값은 number | string | boolean뿐이고 console.log가 세 값을
  // 이미 알맞게 표시한다. 별도 포맷을 덧씌우지 않아 소스에서 만든 값을 그대로 보여 준다.
  console.log(value);
}

export function toNumber(text: string): number {
  // Number는 빈 문자열과 공백뿐인 문자열을 0으로 바꾼다. 그대로 허용하면 input에서
  // 엔터만 누른 경우와 실제 숫자 0을 입력한 경우를 구별할 수 없으므로 먼저 거부한다.
  if (text.trim() === "") {
    throw new Error(`숫자로 바꿀 수 없습니다: ${JSON.stringify(text)}`);
  }

  const converted = Number(text);
  if (Number.isNaN(converted)) {
    throw new Error(`숫자로 바꿀 수 없습니다: ${JSON.stringify(text)}`);
  }

  return converted;
}

export function random(max: number): number {
  // 0 이하이거나 유한하지 않은 상한에는 0 이상 max 미만인 정수가 없다. Math.random의
  // 계산에 그대로 넘겨 이상한 값을 조용히 돌려주지 않고 호출한 tinylang 프로그램에 알린다.
  if (max <= 0 || !Number.isFinite(max)) {
    throw new Error(`무작위 정수의 최댓값으로 사용할 수 없습니다: ${max}`);
  }

  return Math.floor(Math.random() * max);
}
