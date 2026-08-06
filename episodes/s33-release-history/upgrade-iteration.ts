export {};

// TypeScript 5.x 시절에는 ES5로 내리면서도 Set과 Map 같은 이터러블을 for...of로 순회하려면
// target: "es5"와 downlevelIteration: true를 함께 사용하는 설정이 흔했습니다.
// 이 예제는 예전 설정 항목들이 실제로 필요했던 문법을 작은 실행 코드로 남깁니다.
const legacySettings = new Set([
  "target: es5",
  "moduleResolution: node",
  "baseUrl",
  "outFile",
  "downlevelIteration",
]);

const replacements = new Map([
  ["module", "nodenext"],
  ["moduleResolution", "nodenext"],
]);

console.log("legacy settings:");
for (const option of legacySettings) {
  console.log(`- ${option}`);
}

console.log("compatible module pair:");
for (const [option, value] of replacements) {
  console.log(`- ${option}: ${value}`);
}
