export {};

// 이 파일은 현재 컴파일러와 6.0 컴파일러가 함께 검사하는 중립적인 소스다.
// 두 npm 스크립트는 바이너리만 바꾸고 같은 설정과 이 파일을 그대로 사용한다.
type CompilerCheck = {
  readonly label: string;
  readonly binary: "tsc" | "tsc6";
  readonly config: string;
};

const sharedConfig =
  "episodes/s33-release-history/tsconfig.dual-check.json";

const checks: readonly CompilerCheck[] = [
  {
    label: "current compiler",
    binary: "tsc",
    config: sharedConfig,
  },
  {
    label: "TypeScript 6.0 compiler",
    binary: "tsc6",
    config: sharedConfig,
  },
];

function printChecks(compilerChecks: readonly CompilerCheck[]): void {
  console.log("same source, same config, different binaries:");
  for (const check of compilerChecks) {
    console.log(`- ${check.label}: ${check.binary} -p ${check.config}`);
  }
}

printChecks(checks);
