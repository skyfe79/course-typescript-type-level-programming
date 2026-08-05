// 하나의 샘플 테이블로 시작해, 선택한 컬럼만 결과 행 타입에 남기는 dbq의 약속을 먼저 확인한다.
// 실행: node projects/dbq/dbq.ts
// 검사: npx tsc --noEmit

// codeStep 367 — Users 테이블에서 부른 컬럼만 고르기

type UsersRow = { id: number; name: string; email: string };

const users: UsersRow[] = [
  { id: 1, name: "Ada", email: "ada@example.com" },
  { id: 2, name: "Grace", email: "grace@example.com" },
];

// keyof UsersRow는 "id" | "name" | "email"이라는 컬럼 이름 유니온을 그대로 준다.
// 호출부가 타입 인자를 손으로 쓰지 않아도, 넘긴 문자열들로부터 K가 정해진다.
// 반환 타입의 Pick<UsersRow, K>는 원래 행에서 K에 해당하는, 부른 컬럼만 남은 행 타입이다.
function selectFrom<K extends keyof UsersRow>(rows: UsersRow[], ...cols: K[]): Pick<UsersRow, K>[] {
  return rows.map((row) => {
    // 빈 객체는 아직 Pick<UsersRow, K> 모양이 아니지만, 아래 반복문이 끝나면 그 모양이 된다.
    // 이 단언은 모든 cols를 빠짐없이 채우겠다는 구현의 약속을 컴파일러에 대신 전한다.
    const picked = {} as Pick<UsersRow, K>;
    for (const col of cols) picked[col] = row[col];
    return picked;
  });
}

const rows = selectFrom(users, "id", "name");
console.log(rows);

// Eq는 두 타입이 정확히 같은지를 판별해 호버로 확인하던 결과를 컴파일러 검사로 고정하는 장치다.
type Eq<X, Y> = (<T>() => T extends X ? 1 : 2) extends (<T>() => T extends Y ? 1 : 2) ? true : false;

// 호버는 화면에서만 보이고 터미널 검사에는 남지 않으므로, 부른 컬럼만 남았다는 결과를 타입 게이트로 고정한다.
const rowsMatch: Eq<typeof rows, Pick<UsersRow, "id" | "name">[]> = true;

// codeStep 368 — 부르지 않은 컬럼에 접근하면 그 자리가 막히는지 확인하기

// 아래 주석은 다음 줄에 타입 오류가 하나 난다고 미리 예고해 두는 표시다. 예고한 오류가 실제로 나면
// 그 오류는 여기서 소비되고 검사는 통과한다. 주석을 지우고 다시 검사하면
// error TS2339: Property 'email' does not exist on type 'Pick<UsersRow, "id" | "name">'가
// 정확히 이 줄을 가리킨다. 실행해 보면 런타임에도 그 키가 없어 undefined가 찍힌다.
// @ts-expect-error - rows는 id와 name만 고른 행이라, email 키가 없다.
console.log(rows[0].email);

export {};
