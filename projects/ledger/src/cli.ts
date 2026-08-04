/*
 * §17 ledger 프로젝트의 첫 파일입니다.
 *
 * 실행 위치:
 *   cd projects/ledger
 *   node src/cli.ts add 100 groceries
 *
 * 타입 검사는 두 위치에서 모두 통과해야 합니다.
 *   저장소 루트: npx tsc --noEmit
 *   projects/ledger: npx tsc -p .
 *
 * 이 프로젝트가 지켜 갈 세 가지 보장:
 *   1. 불균형 항목을 만들 수 없습니다.
 *      저널 항목을 만드는 통로를 스마트 생성자 하나로 제한하고,
 *      그 함수 안에서 두 계정 금액의 합이 0인지 확인한 뒤 값을 돌려줍니다.
 *
 *   2. 파싱 경계를 둡니다.
 *      명령행 문자열은 경계에서 한 번만 파싱하고,
 *      검증되지 않은 원시 문자열이 도메인 로직 안으로 다시 들어가지 않게 합니다.
 *
 *   3. 이펙트 경계를 둡니다.
 *      파일 쓰기와 화면 출력 같은 이펙트는 도메인 안에서 바로 실행하지 않고,
 *      커맨드라는 값으로 미뤘다가 인터프리터 계층 하나에서만 실행합니다.
 *
 * 이번 화는 아직 그 보장들을 구현하지 않습니다. 먼저 명령의 표면을
 * 판별 유니온으로 만들고, 나중에 실제 파싱과 도메인 로직이 들어갈 위치를 남깁니다.
 */

type Command =
  | { kind: "add"; args: string[] }
  | { kind: "report"; args: string[] }
  | { kind: "budget"; args: string[] };

function parseCommand(argv: string[]): Command {
  const [kind, ...args] = argv;

  /*
   * 보장 2가 아직 들어오지 않은 거친 스텁입니다.
   *
   * 아래 단언은 "argv[0]이 add, report, budget 중 하나다"라고
   * 타입 검사기에게만 말합니다. 실제 문자열을 확인하지는 않습니다.
   * 그래서 nonsense 같은 값도 Command로 만들어져 main까지 넘어갑니다.
   * 다음 단계에서는 이 자리를 진짜 파싱으로 바꿉니다.
   */
  return { kind: kind as Command["kind"], args };
}

function main(command: Command): void {
  switch (command.kind) {
    case "add":
      console.log("add 명령은 아직 구현되지 않았습니다.");
      console.log(`인자: ${command.args.join(", ")}`);
      break;
    case "report":
      console.log("report 명령은 아직 구현되지 않았습니다.");
      console.log(`인자: ${command.args.join(", ")}`);
      break;
    case "budget":
      console.log("budget 명령은 아직 구현되지 않았습니다.");
      console.log(`인자: ${command.args.join(", ")}`);
      break;
    default: {
      /*
       * 위 세 case가 Command 유니온을 모두 소진하면, 이 위치의 command는
       * never로 좁혀집니다. 그래서 지금은 아래 대입이 컴파일됩니다.
       *
       * 나중에 Command에 네 번째 kind를 더하고 switch 분기를 빠뜨리면,
       * command가 더 이상 never가 아니므로 이 줄이 곧바로 컴파일 오류가 됩니다.
       * 빠진 분기를 타입 검사 단계에서 확인하게 해 주는 완전성 검사입니다.
       */
      const _exhaustive: never = command;
      throw new Error("알 수 없는 명령");
    }
  }
}
main(parseCommand(process.argv.slice(2)));

/*
 * 실측 기록
 *
 * 실행 위치: projects/ledger
 *
 * $ node src/cli.ts add 100 groceries
 * add 명령은 아직 구현되지 않았습니다.
 * 인자: 100, groceries
 * 종료 코드: 0
 *
 * $ node src/cli.ts report
 * report 명령은 아직 구현되지 않았습니다.
 * 인자:
 * 종료 코드: 0
 *
 * $ node src/cli.ts budget
 * budget 명령은 아직 구현되지 않았습니다.
 * 인자:
 * 종료 코드: 0
 *
 * 아래 두 명령은 타입 검사를 통과한 코드가 런타임에 죽는 자리입니다.
 * 스텁이 argv[0]을 확인하지 않고 단언만 하므로, 세 명령이 아닌 문자열도
 * 인자가 아예 없는 경우도 그대로 Command가 되어 default 분기까지 내려옵니다.
 * 보장 2가 왜 필요한지를 이 두 줄이 그대로 보여 줍니다.
 * (파일 경로는 실행하는 컴퓨터마다 다르므로 <저장소>로 줄여 적었습니다.)
 *
 * $ node src/cli.ts nonsense
 * file://<저장소>/projects/ledger/src/cli.ts:72
 *       throw new Error("알 수 없는 명령");
 *             ^
 *
 * Error: 알 수 없는 명령
 *     at main (file://<저장소>/projects/ledger/src/cli.ts:72:13)
 *     at file://<저장소>/projects/ledger/src/cli.ts:76:1
 *     at ModuleJob.run (node:internal/modules/esm/module_job:430:25)
 *     at async onImport.tracePromise.__proto__ (node:internal/modules/esm/loader:639:26)
 *     at async asyncRunEntryPointWithESMLoader (node:internal/modules/run_main:101:5)
 *
 * Node.js v25.8.0
 * 종료 코드: 1
 *
 * $ node src/cli.ts
 * 위와 글자 하나 다르지 않은 오류가 같은 72번째 줄에서 납니다.
 * 인자가 없으면 argv[0]이 undefined인데, 단언이 그것마저 Command["kind"]로
 * 통과시키기 때문입니다.
 * 종료 코드: 1
 *
 * 실행 위치: 저장소 루트
 *
 * $ npx tsc --noEmit
 * 출력 없음
 * 종료 코드: 0
 *
 * 실행 위치: projects/ledger
 *
 * $ npx tsc -p .
 * 출력 없음
 * 종료 코드: 0
 */
