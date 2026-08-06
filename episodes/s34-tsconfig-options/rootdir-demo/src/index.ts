// 이 프로젝트는 출력 경로의 차이에만 집중할 수 있도록 소스 파일을 하나만 둡니다.
// 같은 파일을 세 config로 컴파일하면서 rootDir와 noEmit이 산출물에 미치는 영향을 비교합니다.

export function greet(name: string): string {
  return `Hello, ${name}`;
}

console.log(greet("world"));
