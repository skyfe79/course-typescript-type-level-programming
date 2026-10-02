import { createInterface } from "node:readline/promises";

// 첫 입력에서 단일 iterator를 만든다. 파이프 입력도 줄을 잃지 않고 읽는다.
let rl: ReturnType<typeof createInterface> | undefined;
let lines: AsyncIterator<string> | undefined;

export async function readInput(prompt: string): Promise<string> {
  if (!lines) {
    rl = createInterface({ input: process.stdin });
    lines = rl[Symbol.asyncIterator]();
  }
  process.stdout.write(prompt);
  const line = await lines.next();
  const value = line.done ? "q" : line.value;
  if (!process.stdin.isTTY) console.log(value);
  return value;
}

// 두 입력 프로그램이 공유하는 인터페이스를 실행이 끝날 때 닫는다.
export function closeInput(): void {
  rl?.close();
}
