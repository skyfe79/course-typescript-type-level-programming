import ts from "@typescript/typescript6";

// @typescript/typescript6은 이 폴더의 node_modules에만 있으므로 import가 풀리는 도구도
// 같은 별도 설치 뿌리에 둔다.
// TypeScript 7.0에는 이 API가 없으므로, 이 옛 도구는 6.x 패키지 쪽 API를 직접 부른다.
console.log(`compiler API version: ${ts.version}`);

const result = ts.transpileModule("const message: string = 'hello';", {
  compilerOptions: {
    module: ts.ModuleKind.ESNext,
    target: ts.ScriptTarget.ESNext,
  },
});

console.log(result.outputText.trim());
