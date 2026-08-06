// 이 파일의 함수들은 호출한 자리에서 결과가 정해질 때까지 기다리는 동기 함수다.
// input도 Promise를 돌려주지 않고 한 줄이 준비될 때까지 실행을 멈춘다는 점에서 같은 규약을 따른다.
import { readSync } from "node:fs";
export function print(value) {
    // tinylang의 런타임 값은 number | string | boolean뿐이고 console.log가 세 값을
    // 이미 알맞게 표시한다. 별도 포맷을 덧씌우지 않아 소스에서 만든 값을 그대로 보여 준다.
    console.log(value);
}
export function toNumber(text) {
    // Number는 빈 문자열과 공백뿐인 문자열을 0으로 바꾼다. 그대로 허용하면 input에서
    // 엔터만 누른 경우와 실제 숫자 0을 입력한 경우를 구별할 수 없으므로 먼저 거부한다.
    if (text.trim() === "") {
        throw new Error(`숫자로 바꿀 수 없습니다: ${JSON.stringify(text)}`);
    }
    const converted = Number(text);
    if (Number.isNaN(converted)) {
        throw new Error(`숫자로 바꿀 수 없습니다: ${JSON.stringify(text)}`);
    }
    return converted;
}
export function random(max) {
    // 0 이하이거나 유한하지 않은 상한에는 0 이상 max 미만인 정수가 없다. Math.random의
    // 계산에 그대로 넘겨 이상한 값을 조용히 돌려주지 않고 호출한 tinylang 프로그램에 알린다.
    if (max <= 0 || !Number.isFinite(max)) {
        throw new Error(`무작위 정수의 최댓값으로 사용할 수 없습니다: ${max}`);
    }
    return Math.floor(Math.random() * max);
}
export function toString(value) {
    // tinylang의 런타임 값은 이 세 종류뿐이므로 String의 기본 변환이 언어의 모든
    // 값 타입을 빠짐없이 문자열로 옮기며, 타입별 분기를 따로 둘 필요가 없다.
    return String(value);
}
export function input(prompt) {
    if (prompt !== undefined) {
        // print는 console.log를 사용해 프롬프트 뒤에 줄바꿈을 붙인다. 그러면 `이름: `과 실제
        // 입력 칸이 서로 다른 줄에 놓이므로, 프롬프트만은 stdout에 줄바꿈 없이 직접 쓴다.
        process.stdout.write(prompt);
    }
    const byte = Buffer.alloc(1);
    const bytes = [];
    while (true) {
        let bytesRead;
        try {
            bytesRead = readSync(0, byte, 0, 1, null);
        }
        catch (error) {
            // 터미널의 stdin은 아직 사용자가 입력하지 않았을 때 EAGAIN을 던질 수 있다. 입력 실패가
            // 아니라 "아직 준비된 바이트가 없음"이라는 뜻이므로 이 경우만 다시 읽고, 다른 오류는
            // 원인을 숨기지 않도록 호출자에게 그대로 돌려보낸다.
            if (typeof error === "object"
                && error !== null
                && "code" in error
                && error.code === "EAGAIN") {
                continue;
            }
            throw error;
        }
        // 파이프나 파일의 끝에서는 더 읽을 바이트가 없으므로, 개행이 없어도 지금까지 받은
        // 내용을 한 줄의 마지막 내용으로 인정한다.
        if (bytesRead === 0) {
            break;
        }
        if (byte[0] === 10) {
            const lastByte = bytes[bytes.length - 1];
            // 윈도우의 줄 끝은 CRLF이므로 LF 바로 앞의 CR 하나만 제거한다. trimEnd를 쓰면 사용자가
            // 일부러 입력한 끝 공백까지 사라져 "입력한 문자열 그대로"라는 약속을 깨뜨린다.
            if (lastByte !== undefined && lastByte[0] === 13) {
                bytes.pop();
            }
            break;
        }
        // byte 버퍼는 다음 readSync에서 다시 쓰이므로 그 순간의 한 바이트를 복사해 보관한다.
        bytes.push(Buffer.from(byte));
    }
    // UTF-8의 한글처럼 여러 바이트인 문자도 조각마다 디코딩하지 않고 모두 이어 붙인 뒤 한 번에
    // 문자열로 바꾸면 문자 경계가 보존되어 온전한 값이 된다.
    return Buffer.concat(bytes).toString("utf8");
}
