import * as fs from "node:fs";

/*
 * §17 ledger 프로젝트의 이펙트 인터프리터 파일입니다.
 *
 * 실행 위치:
 *   cd projects/ledger
 *   node src/interpreter.ts
 *
 * 타입 검사는 두 위치에서 모두 통과해야 합니다.
 *   저장소 루트: npx tsc --noEmit
 *   projects/ledger: npx tsc -p .
 *
 * 지난 화에서 순수 코어는 실제 일을 바로 하지 않고, 무엇을 할지만 커맨드 값으로
 * 돌려주게 바뀌었습니다. 이 파일은 그 커맨드 중 파일 시스템 이펙트를 실제 호출로
 * 바꾸는 첫 인터프리터입니다.
 *
 * ledger 프로젝트에서 node:fs를 부르는 자리는 이 파일 하나입니다. 다른 파일은
 * 파일을 읽고 쓰는 방법을 알 필요가 없습니다. 도메인과 CLI가 파일 시스템을 직접
 * import하지 않으면, "무엇을 할지"를 정하는 코드와 "바깥세상에 어떻게 적용할지"를
 * 정하는 코드가 한 줄 안에서 섞이지 않습니다.
 */

type ReadJournalCommand = { readonly kind: "readJournal"; readonly path: string };
type WriteJournalCommand = { readonly kind: "writeJournal"; readonly path: string; readonly content: string };

/*
 * 읽기 커맨드는 저널 내용을 문자열로 돌려주고, 쓰기 커맨드는 파일에 기록한 뒤
 * 돌려줄 값이 없습니다. 그래서 반환 타입은 string | void입니다.
 *
 * 지금은 이 모양 그대로 두고, 호출하는 쪽에서 readJournal 결과를 as string으로
 * 받아 사용합니다. 나중에 커맨드 종류와 반환 타입을 더 정교하게 연결할 수 있지만,
 * 이번 화의 초점은 타입 모델링을 끝까지 밀어붙이는 것이 아니라 이펙트 경계가
 * 어디에 놓이는지를 눈으로 확인하는 데 있습니다.
 *
 * readJournal은 파일이 아직 없을 때도 예외를 던지지 않고 빈 저널을 뜻하는 문자열
 * "[]"를 돌려줍니다. 그래서 호출하는 쪽은 "파일이 있는가"를 다시 묻지 않아도 되고,
 * 읽은 문자열을 곧바로 저널 JSON으로 다룰 수 있습니다.
 *
 * 여기서는 readFileSync와 writeFileSync를 씁니다. 이 화의 주제는 비동기 제어 흐름이
 * 아니라 경계의 위치입니다. 동기 API로 두면 파일을 확인하고, 읽고, 쓰는 실행 순서를
 * 위에서 아래로 그대로 따라갈 수 있습니다.
 */
function runFileCommand(cmd: ReadJournalCommand | WriteJournalCommand): string | void {
  if (cmd.kind === "readJournal") {
    if (!fs.existsSync(cmd.path)) return "[]";
    return fs.readFileSync(cmd.path, "utf-8");
  }

  fs.writeFileSync(cmd.path, cmd.content, "utf-8");
}

type ReadClockCommand = { readonly kind: "readClock" };
type PrintCommand = { readonly kind: "print"; readonly text: string };

/*
 * readClock 커맨드는 필드가 하나도 없으므로 cmd 매개변수를 실제로 읽지 않습니다.
 * 그래도 매개변수를 남겨 두면 파일, 시계, 표준출력 실행 함수가 모두 커맨드 하나를
 * 받아 실행하는 같은 모양을 갖게 됩니다.
 *
 * 시계 읽기는 호출할 때마다 다른 값을 돌려주는 대표적인 부수 효과입니다. 그래서
 * 순수 코어가 아니라 바깥세상과 만나는 이 인터프리터 파일에 둡니다.
 */
function runClockCommand(cmd: ReadClockCommand): string {
  return new Date().toISOString();
}

/*
 * 표준출력은 console.log가 아니라 process.stdout.write로 직접 실행합니다.
 * 출력할 문자열은 커맨드 안에 이미 완성되어 있으므로, 인터프리터는 줄바꿈 하나를
 * 붙여 그 문자열을 그대로 흘려보냅니다.
 *
 * 이제 파일, 시계, 표준출력 세 종류의 실제 부수 효과가 모두 이 파일 안에 있습니다.
 */
function runPrintCommand(cmd: PrintCommand): void {
  process.stdout.write(cmd.text + "\n");
}

/*
 * runCommand는 ledger의 모든 부수 효과가 지나가는 단 하나의 문입니다.
 * readJournal과 writeJournal이 같은 case 묶음으로 내려가면 cmd는 두 갈래의
 * 유니온으로 좁혀지고, 그래서 runFileCommand에 그대로 넘길 수 있습니다.
 *
 * default의 never 대입은 cli.ts에서 이미 배운 완전성 검사와 같은 장치입니다.
 * 나중에 커맨드 종류를 더하고 분기를 빠뜨리면, 타입 검사 단계에서 이 줄이
 * 먼저 걸립니다.
 */
type EffectCommand = ReadJournalCommand | WriteJournalCommand | ReadClockCommand | PrintCommand;

function runCommand(cmd: EffectCommand): string | void {
  switch (cmd.kind) {
    case "readJournal":
    case "writeJournal":
      return runFileCommand(cmd);
    case "readClock":
      return runClockCommand(cmd);
    case "print":
      return runPrintCommand(cmd);
    default: {
      const _exhaustive: never = cmd;
      throw new Error("알 수 없는 커맨드");
    }
  }
}

// 이 파일은 최상위 실행문을 두지 않으므로, import 되어도 아무 일도 일어나지 않습니다.

export type { EffectCommand, ReadJournalCommand, WriteJournalCommand, ReadClockCommand, PrintCommand };
export { runCommand };

/*
 * 실측 기록
 *
 * 실행 위치: projects/ledger
 *
 * $ node src/interpreter.ts
 * 출력 없음
 * 종료 코드: 0
 *
 * 최상위 실행문이 없으므로 직접 실행해도 아무것도 출력하지 않습니다. 이 파일이
 * 실제로 무엇을 하는지는 cli.ts가 add 명령을 처리할 때 드러납니다.
 *
 * $ npx tsc -p .
 * 출력 없음
 * 종료 코드: 0
 *
 * 실행 위치: 저장소 루트
 *
 * $ npx tsc --noEmit
 * 출력 없음
 * 종료 코드: 0
 */
