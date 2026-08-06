// utils는 core를 전혀 참조하지 않는 독립 패키지입니다. 따라서 빌드 그래프에서 core와 같은
// 단계에 놓이며, --builders 값이 허용하면 core와 나란히 동시에 빌드될 수 있습니다.
export function shout(s: string): string {
  return s.toUpperCase() + "!";
}
