// 타입 선언을 함께 배포하지 않는 작은 CLI 도구 패키지를 본뜬 벤더 사본입니다.
// 베어 이름 import가 실제 패키지처럼 해석되도록 package.json과 함께 둡니다.

export function banner(text, options = {}) {
  const width = options.width ?? 30;
  const line = "=".repeat(width);

  return `${line}\n${text}\n${line}`;
}

export function divider(char = "-", width = 30) {
  return char.repeat(width);
}

export function box(text) {
  return `[ ${text} ]`;
}

export function gradient(text) {
  return text.split("").join(" ");
}
