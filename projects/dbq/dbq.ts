// 임의의 스키마와 메서드 호출 체인에 통하는 타입 안전 쿼리 빌더의 뼈대를 세운다.
// 실행: node projects/dbq/dbq.ts
// 검사: npx tsc --noEmit

import { readFileSync } from "node:fs";

// codeStep 369 — 스키마 타입 정의하기

// Eq는 두 타입이 정확히 같은지를 판별해, 호버로 확인하던 결과를 컴파일러 검사로 고정하는 장치다.
type Eq<X, Y> = (<T>() => T extends X ? 1 : 2) extends (<T>() => T extends Y ? 1 : 2) ? true : false;

// 객체 타입 하나에 테이블의 컬럼 이름과 각 컬럼에 들어갈 값의 타입을 함께 기록한다.
type UsersSchema = {
  id: number;
  name: string;
  email: string;
  isActive: boolean;
};

// keyof UsersSchema는 스키마에 적힌 키를 "id" | "name" | "email" | "isActive"라는
// 컬럼 이름 유니온으로 그대로 꺼내 준다.
type ColumnName = keyof UsersSchema;

// 호버를 열지 않아도 컬럼 이름 유니온이 의도한 결과인지 타입 검사에서 계속 확인할 수 있다.
const columnNamesMatch: Eq<ColumnName, "id" | "name" | "email" | "isActive"> = true;

// codeStep 370 — 빌더의 타입 매개변수 뼈대 만들기

// Row는 사용할 테이블의 행 모양을, Selected는 지금까지 고른 컬럼의 이름과 순서를 튜플로 기억한다.
// 아직 아무 컬럼도 고르지 않은 상태는 빈 튜플 []로 시작한다.
class QueryBuilder<Row, Selected extends readonly (keyof Row)[] = []> {
  // codeStep 371의 from 함수가 어떤 테이블에서 출발했는지를 런타임 객체에도 넘길 수 있도록 보관한다.
  // erasableSyntaxOnly 설정을 지키기 위해 생성자 매개변수 프로퍼티 대신 필드를 따로 선언한다.
  private tableName: string;
  // 선택한 컬럼의 실제 값도 타입 매개변수 Selected와 같은 튜플 모양으로 보관한다.
  private selectedCols: Selected;
  // codeStep 376에서 추가하는 조건 배열은 다음 스텝의 비교 로직이 모든 연산자 갈래를
  // 빠짐없이 다룰 수 있도록 operator를 넓은 string이 아니라 ComparisonOp로 제한한다.
  // 실제 필터링은 아직 하지 않으며 codeStep 378에서 rows가 이 배열을 사용한다.
  private filters: { column: keyof Row; operator: ComparisonOp; value: unknown }[];

  constructor(
    tableName: string,
    selectedCols: Selected = [] as unknown as Selected,
    filters: { column: keyof Row; operator: ComparisonOp; value: unknown }[] = [],
  ) {
    this.tableName = tableName;
    this.selectedCols = selectedCols;
    this.filters = filters;
  }

  // select는 Row에 실제로 존재하는 컬럼만 가변 인자로 받고, 기존 선택 뒤에 새 선택을 이어 붙인다.
  // 이 단계에서는 행 타입 자체를 좁히지 않고 선택한 컬럼 이름과 호출 순서만 새 빌더에 누적한다.
  select<Cols extends readonly (keyof Row)[]>(...cols: Cols): QueryBuilder<Row, [...Selected, ...Cols]> {
    return new QueryBuilder<Row, [...Selected, ...Cols]>(
      this.tableName,
      [...this.selectedCols, ...cols] as [...Selected, ...Cols],
      // select는 새 인스턴스를 반환한다. 기존 조건의 사본을 생성자에 넘기지 않으면
      // where(...).select(...)가 오류 없이 실행되면서 조건만 조용히 사라지게 된다.
      [...this.filters],
    );
  }

  // column으로 추론한 K 하나가 operator의 ColumnOperators<Row, K>와 value의 Row[K]를
  // 함께 결정한다. 따라서 선택한 컬럼에 맞는 연산자와 값만 같은 호출에 넣을 수 있다.
  // this를 그대로 반환하므로 where 뒤에 select나 where를 이어서 호출할 수 있다.
  where<K extends keyof Row>(column: K, operator: ColumnOperators<Row, K>, value: Row[K]): this {
    this.filters.push({ column, operator, value });
    return this;
  }

  // 저장된 테이블을 읽은 뒤 selectedCols에 기록된 컬럼만 새 객체로 옮겨 담는다.
  // select를 호출하지 않아 선택 목록이 비어 있으면 JSON 첫 행의 모든 컬럼을 사용한다.
  rows(): Pick<Row, Selected[number]>[] {
    const table = loadTable<Row>(this.tableName);
    const cols = (this.selectedCols.length > 0
      ? this.selectedCols
      : Object.keys(table[0] as object)) as readonly Selected[number][];
    return table.map((row) => {
      const picked = {} as Record<PropertyKey, unknown>;
      for (const col of cols) picked[col as PropertyKey] = row[col];
      return picked as Pick<Row, Selected[number]>;
    });
  }
}

// codeStep 371 — from으로 스키마 고정하기

// users와 다른 컬럼 구성을 가진 posts 테이블의 행 타입을 별도 스키마로 정의한다.
type PostsSchema = {
  id: number;
  title: string;
  authorId: number;
  views: number;
};

// 테이블 이름을 키로, 해당 테이블에서 조회할 행 타입을 값으로 연결한다.
// 기존 UsersSchema를 그대로 재사용해 테이블별 스키마의 기준점을 한곳에 모은다.
interface TableSchemas {
  users: UsersSchema;
  posts: PostsSchema;
}

// T는 tableName 인자에서 자동으로 추론된다. 따라서 호출부는 타입 인자를 직접 적지 않아도
// 선택한 테이블에 맞는 행 타입과 아직 컬럼을 고르지 않은 빈 튜플 상태를 얻게 된다.
function from<T extends keyof TableSchemas>(tableName: T): QueryBuilder<TableSchemas[T], []> {
  return new QueryBuilder<TableSchemas[T], []>(tableName);
}

const qb = from("users");
const afterId = qb.select("id");
const afterName = afterId.select("name");

// Eq 단언으로 호출할 때마다 Selected 튜플 뒤에 컬럼 이름이 순서대로 누적된다는 사실을 고정한다.
const afterIdMatch: Eq<typeof afterId, QueryBuilder<UsersSchema, ["id"]>> = true;
const afterNameMatch: Eq<typeof afterName, QueryBuilder<UsersSchema, ["id", "name"]>> = true;

// 같은 컬럼들을 한 번에 선택해도 나눠 호출한 afterName과 동일한 Selected 튜플이 만들어진다.
const atOnce = qb.select("id", "name");
const atOnceMatch: Eq<typeof atOnce, QueryBuilder<UsersSchema, ["id", "name"]>> = true;

// posts를 넘기면 users와 완전히 다른 PostsSchema를 기준으로 삼는 빌더가 만들어진다.
const postsQuery = from("posts");
const postsQueryMatch: Eq<typeof postsQuery, QueryBuilder<PostsSchema, []>> = true;

// 앞 화에서는 select가 this를 그대로 돌려주는 자리표시자였기 때문에 이 비교가 true였다.
// 이제 select가 선택값을 담은 새 인스턴스를 만들어 돌려주므로 false가 출력된다.
// 두 변수를 곧바로 비교하면 타입 검사기가 TS2367로 "겹치는 값이 없는 비교"라고 알려 준다.
// 그 경고 자체가 afterName과 qb의 타입이 이미 갈라졌다는 증거이고, 여기서 확인하려는 것은
// 타입이 아니라 런타임 객체의 동일성이므로 object로 넓혀서 비교한다.
console.log((afterName as object) === (qb as object));

// @ts-expect-error - 스키마에 없는 컬럼 이름은 select에 넘길 수 없다.
qb.select("nope");

// codeStep 373 — 선택된 컬럼만 남도록 행 타입 좁히기

// 테이블 이름과 같은 JSON 파일을 현재 모듈 기준 data 디렉터리에서 찾아 행 배열로 읽는다.
// JSON은 TableSchemas에 맞춰 관리하며, 이 단계에서는 파싱 결과를 해당 Row 배열로 해석한다.
// data/users.json은 뒤 화에서 필터와 정렬을 눈으로 확인할 수 있도록 isActive 값을 섞어 두었고,
// id도 파일 안에서 오름차순이 되지 않게 배치했다. posts의 authorId는 모두 users의 id를 가리킨다.
function loadTable<Row>(tableName: string): Row[] {
  const url = new URL(`./data/${tableName}.json`, import.meta.url);
  return JSON.parse(readFileSync(url, "utf8")) as Row[];
}

const pickedRows = qb.select("id", "name").rows();
const pickedRowsMatch: Eq<typeof pickedRows, Pick<UsersSchema, "id" | "name">[]> = true;
console.log(pickedRows); // id와 name만 담긴 객체 배열

// select를 생략하면 런타임은 JSON 첫 행에서 얻은 전체 컬럼을 돌려준다.
// 그러나 Selected가 빈 튜플이므로 정적 타입은 Pick<UsersSchema, never>[], 즉 {}[]로 남는다.
// 이 단계에서 생기는 런타임 결과와 정적 타입의 차이를 Eq 단언으로 숨김없이 고정한다.
const allRows = from("users").rows();
const allRowsMatch: Eq<typeof allRows, {}[]> = true;
console.log(allRows); // 원본 테이블 전체 컬럼

// codeStep 374 — row.email 접근이 컴파일 에러가 되는지 확인하기

// id와 name만 선택한 결과는 두 컬럼으로 좁혀지므로, 각 행에서도 그 값들만 안전하게 읽힌다.
const narrowed = from("users").select("id", "name").rows();
for (const row of narrowed) {
  console.log(row.id, row.name); // 선택한 id와 name만 행별로 보여 주는 출력이다.
  // @ts-expect-error - error TS2339: Property 'email' does not exist on type 'Pick<UsersSchema, "id" | "name">'.
  // 타입 오류를 덮고 실제로 실행하면 undefined가 찍힌다. rows가 선택한 컬럼만 새 객체에 옮겨
  // 담았으므로, 이 행에는 email이라는 값 자체가 아예 존재하지 않는다.
  console.log(row.email);
}

// 같은 조회에 email을 추가하면 반환 행 타입에도 email이 포함되어 같은 접근이 오류 없이 통과한다.
const withEmail = from("users").select("id", "name", "email").rows();
const withEmailMatch: Eq<typeof withEmail, Pick<UsersSchema, "id" | "name" | "email">[]> = true;
for (const row of withEmail) {
  console.log(row.id, row.name, row.email); // 선택한 세 컬럼을 모두 행별로 보여 주는 출력이다.
}

// codeStep 375 — 컬럼 타입에서 연산자 유니온 뽑아내기

// 비교에 사용할 수 있는 여섯 연산자를 하나의 유니온으로 모아 둔다.
type ComparisonOp = "=" | "!=" | ">" | "<" | ">=" | "<=";

// OperatorsFor는 값 타입 V를 검사해 그 타입에 맞는 연산자 유니온을 고르는 조건부 타입이다.
// 숫자 컬럼은 값의 크기를 비교하는 데 뜻이 있으므로 여섯 연산자를 모두 허용한다.
// 문자열과 불리언 컬럼은 같다거나 다르다는 비교만 뜻이 있으므로 "="와 "!="만 남긴다.
// boolean은 사실 true | false 유니온이라 조건부 타입이 두 갈래로 분배되지만,
// 두 갈래가 모두 "=" | "!="로 계산되므로 다시 합쳐도 결과는 그대로이다.
type OperatorsFor<V> = V extends number
  ? ComparisonOp
  : V extends string | boolean
  ? "=" | "!="
  : never;

// ColumnOperators는 Row와 컬럼 키 K만 받아 Row[K]로 실제 컬럼 값 타입을 꺼낸다.
// 꺼낸 값 타입을 OperatorsFor에 넘기므로 호출부는 값 타입을 따로 적지 않아도 된다.
type ColumnOperators<Row, K extends keyof Row> = OperatorsFor<Row[K]>;

// 각 컬럼에서 계산된 연산자 유니온을 Eq 단언으로 고정해 타입 규칙을 확인한다.
const idOperatorsMatch: Eq<ColumnOperators<UsersSchema, "id">, ComparisonOp> = true;
const nameOperatorsMatch: Eq<ColumnOperators<UsersSchema, "name">, "=" | "!="> = true;
const isActiveOperatorsMatch: Eq<ColumnOperators<UsersSchema, "isActive">, "=" | "!="> = true;
const viewsOperatorsMatch: Eq<ColumnOperators<PostsSchema, "views">, ComparisonOp> = true;

// codeStep 376 — 컬럼에 맞는 조건을 빌더에 쌓기

// column으로 정해진 K가 연산자와 값 타입을 함께 결정하므로, 각 컬럼의 값 타입에 맞는
// 연산자와 값으로 조건을 추가한다. where는 같은 빌더를 반환해 호출 체인을 유지한다.
const activeUsers = from("users").where("isActive", "=", true);
const namedUsers = from("users").where("name", "=", "민준");
const olderIds = from("users").where("id", ">", 3);

// where가 this를 반환해 Row와 Selected 상태를 바꾸지 않는다는 사실을 타입 검사로 고정한다.
const whereKeepsBuilderMatch: Eq<typeof activeUsers, QueryBuilder<UsersSchema, []>> = true;
const whereThenSelectMatch: Eq<
  typeof olderIds extends QueryBuilder<infer R, infer S> ? [R, S] : never,
  [UsersSchema, []]
> = true;

// select는 새 인스턴스를 만들기 때문에 생성자가 filters를 받고 그 사본을 전달해야 한다.
// 전달하지 않으면 where(...).select(...)에서 오류 없이 조건만 조용히 사라진다.
// rows가 이 조건 배열로 실제 행을 거르는 동작은 codeStep 378에서 추가한다.

// codeStep 377 — 불리언 컬럼에 > 연산자를 써서 에러 확인하기

// 이 화 도입에서 아무 제지 없이 통과하던 바로 그 호출이 이제 컴파일 단계에서 막힌다.
// 오류가 나는 자리는 두 번째 인자인 연산자이고, 컬럼 이름 "isActive" 자체는 올바르다.
// isActive가 boolean이므로 ColumnOperators<UsersSchema, "isActive">는 "=" | "!="로 계산되고,
// ">"는 그 유니온에 속하지 않는다.
// 이 저장소는 태그 시점마다 npx tsc --noEmit이 0 오류여야 하므로 일부러 틀린 코드는
// `@ts-expect-error`로 소비해 오류를 이 한 줄에 가둔다. 이 호출이 언젠가 오류가 아니게 되면
// 해당 지시어 자체가 사용되지 않았다는 오류를 내므로 타입 규칙이 달라졌다는 사실도 알 수 있다.
// @ts-expect-error - error TS2345: Argument of type '">"' is not assignable to parameter of type '"!=" | "="'.
from("users").where("isActive", ">", true);

// 같은 컬럼을 그대로 두고 연산자 하나만 "="로 바꾸면 통과한다. 따라서 문제는 컬럼 이름이
// 아니라 연산자 하나뿐이라는 사실을 바로 아래 호출과 Eq 단언이 함께 증명한다.
const activeExactly = from("users").where("isActive", "=", true);
const activeExactlyMatch: Eq<typeof activeExactly, QueryBuilder<UsersSchema, []>> = true;

export {};
