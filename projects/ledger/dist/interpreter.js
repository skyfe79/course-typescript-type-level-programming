import * as fs from "node:fs";
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
function runFileCommand(cmd) {
    if (cmd.kind === "readJournal") {
        if (!fs.existsSync(cmd.path))
            return "[]";
        return fs.readFileSync(cmd.path, "utf-8");
    }
    fs.writeFileSync(cmd.path, cmd.content, "utf-8");
}
/*
 * readClock 커맨드는 필드가 하나도 없으므로 cmd 매개변수를 실제로 읽지 않습니다.
 * 그래도 매개변수를 남겨 두면 파일, 시계, 표준출력 실행 함수가 모두 커맨드 하나를
 * 받아 실행하는 같은 모양을 갖게 됩니다.
 *
 * 시계 읽기는 호출할 때마다 다른 값을 돌려주는 대표적인 부수 효과입니다. 그래서
 * 순수 코어가 아니라 바깥세상과 만나는 이 인터프리터 파일에 둡니다.
 */
function runClockCommand(cmd) {
    return new Date().toISOString();
}
/*
 * 표준출력은 console.log가 아니라 process.stdout.write로 직접 실행합니다.
 * 출력할 문자열은 커맨드 안에 이미 완성되어 있으므로, 인터프리터는 줄바꿈 하나를
 * 붙여 그 문자열을 그대로 흘려보냅니다.
 *
 * 이제 파일, 시계, 표준출력 세 종류의 실제 부수 효과가 모두 이 파일 안에 있습니다.
 */
function runPrintCommand(cmd) {
    process.stdout.write(cmd.text + "\n");
}
function runCommand(cmd) {
    switch (cmd.kind) {
        case "readJournal":
        case "writeJournal":
            return runFileCommand(cmd);
        case "readClock":
            return runClockCommand(cmd);
        case "print":
            return runPrintCommand(cmd);
        default: {
            const _exhaustive = cmd;
            throw new Error("알 수 없는 커맨드");
        }
    }
}
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
