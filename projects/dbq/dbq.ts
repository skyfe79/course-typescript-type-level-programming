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
  // codeStep 378에서는 rows가 이 배열을 순회해 실제 행도 같은 조건으로 거른다.
  private filters: { column: keyof Row; operator: ComparisonOp; value: unknown }[];
  private order?: { column: keyof Row; direction: "asc" | "desc" };

  constructor(
    tableName: string,
    selectedCols: Selected = [] as unknown as Selected,
    filters: { column: keyof Row; operator: ComparisonOp; value: unknown }[] = [],
    order?: { column: keyof Row; direction: "asc" | "desc" },
  ) {
    this.tableName = tableName;
    this.selectedCols = selectedCols;
    this.filters = filters;
    this.order = order;
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
      // orderBy도 같은 이유로 select가 만드는 새 인스턴스에 현재 정렬 상태를 넘겨야 한다.
      // 넘기지 않으면 orderBy(...).select(...)가 오류 없이 실행되면서 정렬만 조용히 사라진다.
      // filters는 push로 같은 배열에 조건을 쌓으므로 사본을 넘기지만, order는 orderBy를
      // 호출할 때마다 새 객체로 교체되는 값이라 그대로 전달해도 앞 빌더의 배열 상태를 공유하지 않는다.
      this.order,
    );
  }

  // column으로 추론한 K 하나가 operator의 ColumnOperators<Row, K>와 value의 Row[K]를
  // 함께 결정한다. 따라서 선택한 컬럼에 맞는 연산자와 값만 같은 호출에 넣을 수 있다.
  // this를 그대로 반환하므로 where 뒤에 select나 where를 이어서 호출할 수 있다.
  where<K extends keyof Row>(column: K, operator: ColumnOperators<Row, K>, value: Row[K]): this {
    this.filters.push({ column, operator, value });
    return this;
  }

  // 아래 두 줄은 호출부가 볼 수 있는 orderBy의 오버로드 시그니처다.
  // 바깥에서는 컬럼 참조만 넘기거나, 컬럼 참조와 정렬 방향을 함께 넘기는 두 형태만 허용된다.
  orderBy(column: ColumnRef<Row>): this;
  orderBy(column: ColumnRef<Row>, direction: "asc" | "desc"): this;
  // 구현 시그니처는 클래스 안에서 두 호출 형태를 처리하기 위한 몸체일 뿐이고,
  // 호출부가 직접 고를 수 있는 시그니처로 노출되지 않는다.
  // direction의 기본값을 "asc"로 두어 방향을 생략한 호출도 같은 구현에서 처리한다.
  orderBy(column: ColumnRef<Row>, direction: "asc" | "desc" = "asc"): this {
    // ColumnRef<Row>는 keyof Row에 브랜드를 인터섹션으로 덧붙인 타입이다.
    // 따라서 브랜드가 붙은 값은 여전히 keyof Row 자리에 그대로 들어가며,
    // 타입 안전을 흐리는 불필요한 단언 없이 정렬 컬럼으로 저장할 수 있다.
    this.order = { column, direction };
    return this;
  }

  // column은 Row에 실제로 있는 컬럼 이름만 받아 ColumnRef로 감싼 타입을 돌려준다.
  // 실행 시점에는 문자열 값을 그대로 반환하고, 브랜드 표시는 타입 레벨에만 남는다.
  column<K extends keyof Row>(name: K): ColumnRef<Row, K> {
    return name as ColumnRef<Row, K>;
  }

  // 저장된 테이블을 읽은 뒤 selectedCols에 기록된 컬럼만 새 객체로 옮겨 담는다.
  // select를 호출하지 않아 선택 목록이 비어 있으면 JSON 첫 행의 모든 컬럼을 사용한다.
  rows(): Pick<Row, Selected[number]>[] {
    const table = loadTable<Row>(this.tableName);
    // 선택할 컬럼 목록은 필터링 결과가 아니라 원본 테이블의 첫 행에서 알아낸다.
    // 조건에 맞는 행이 하나도 없더라도 filteredRows[0]을 읽지 않으므로 컬럼을 알아내는 과정이 깨지지 않는다.
    const cols = (this.selectedCols.length > 0
      ? this.selectedCols
      : Object.keys(table[0] as object)) as readonly Selected[number][];
    // every를 사용하므로 조건이 여러 개 쌓였을 때 모든 조건을 만족하는 행만 남는다.
    // where의 타입 검사를 통과한 연산자와 값이 filters에 쌓이고, 실행 시점의 비교도 바로 그 배열을 사용한다.
    const filteredRows = table.filter((row) =>
      this.filters.every((filter) => matchesFilter(row[filter.column], filter.operator, filter.value)),
    );
    return filteredRows.map((row) => {
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

// filters에 저장된 조건 하나를 실제 행의 값과 비교한다.
// ComparisonOp의 여섯 갈래를 switch가 빠짐없이 다루므로 별도의 default 분기는 필요하지 않다.
function matchesFilter(left: unknown, operator: ComparisonOp, right: unknown): boolean {
  switch (operator) {
    case "=":
      return left === right;
    case "!=":
      return left !== right;
    case ">":
      // 타입 시스템이 부등호를 숫자 컬럼에만 허용하므로 이 갈래에 도달한 두 값은 숫자다.
      // 따라서 unknown을 number로 좁혀 실행 시점의 크기 비교를 하는 것이 안전하다.
      return (left as number) > (right as number);
    case "<":
      return (left as number) < (right as number);
    case ">=":
      return (left as number) >= (right as number);
    case "<=":
      return (left as number) <= (right as number);
  }
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

// codeStep 378 — 쌓인 조건으로 실제 행 필터링하기

// number 컬럼 id에는 여섯 비교 연산자가 모두 허용된다. >= 3 조건을 실제 데이터에 적용하면
// id가 3, 5, 4인 세 행만 남아, filters가 타입 검사에만 쓰이는 것이 아니라 실행 결과도 거른다.
const idAtLeastThree = from("users").where("id", ">=", 3).select("id", "name").rows();
console.log(idAtLeastThree);

// select를 먼저 호출하고 같은 where를 뒤에 이어도 바로 위와 완전히 같은 세 행이 나온다.
// codeStep 376에서 select가 새 빌더를 만들 때 생성자에 기존 filters의 사본을 넘기도록 고친 덕분이다.
// 그 전달이 없었다면 반대 순서인 where(...).select(...)에서 조건이 사라져 다섯 행이 나왔을 것이다.
const idAtLeastThreeSelectFirst = from("users").select("id", "name").where("id", ">=", 3).rows();
console.log(idAtLeastThreeSelectFirst);

// 연산자 자체는 number 컬럼 id에 허용되는 ">"이지만, 값 자리에는 number가 와야 한다.
// 따라서 문자열 "3"은 연산자가 아니라 세 번째 인자인 값 자리에서 막힌다.
// @ts-expect-error - error TS2345: Argument of type 'string' is not assignable to parameter of type 'number'.
from("users").where("id", ">", "3");

// string 컬럼 name에는 같은지와 다른지만 뜻이 있으므로 "!="는 허용되고 실제로 민준 한 행을 제외한다.
// number, string, boolean이라는 서로 다른 세 컬럼 타입에도 ColumnOperators의 같은 규칙이 일관되게 적용된다.
const namesExceptMinjun = from("users").where("name", "!=", "민준").select("name").rows();
console.log(namesExceptMinjun);

// string 컬럼은 boolean 컬럼과 같은 이유로 크기 비교를 허용하지 않아 두 번째 인자에서 막힌다.
// @ts-expect-error - error TS2345: Argument of type '">"' is not assignable to parameter of type '"!=" | "="'.
from("users").where("name", ">", "민준");

// boolean 컬럼 isActive에는 "="가 허용되고 true인 세 행만 남는다. 앞에서 확인한 금지된 ">"와
// 이 허용 호출을 함께 보면 string과 boolean에는 "="와 "!="만 허용된다는 규칙이 동일하게 작동한다.
const activeUserRows = from("users").where("isActive", "=", true).select("id", "name").rows();
console.log(activeUserRows);

// filters에 조건이 둘 이상 쌓이면 every가 AND로 결합한다. 따라서 isActive가 true이면서
// id가 3보다 큰 행만 남아 id 5와 4인 두 행이 반환된다.
const activeUsersAfterIdThree = from("users")
  .where("isActive", "=", true)
  .where("id", ">", 3)
  .select("id", "name")
  .rows();
console.log(activeUsersAfterIdThree);

// codeStep 379 — 컬럼 참조 타입에 브랜드 적용하기

declare const ColumnBrand: unique symbol;

type ColumnRef<Row, K extends keyof Row = keyof Row> = K & { readonly [ColumnBrand]: Row };

// declare const는 타입 선언일 뿐이라 자바스크립트 출력에서는 지워진다.
// 그래서 erasableSyntaxOnly 설정과 node의 타입 스트리핑을 모두 통과하면서도
// 타입 검사기에는 ColumnBrand라는 고유한 표시 이름을 남길 수 있다.
// 인터섹션으로 붙은 [ColumnBrand] 프로퍼티는 런타임에 존재하지 않는다.
// 값 차원에서는 그냥 문자열이고, 이 표시는 오직 타입 검사기만 본다.
// 그래서 구조적으로 같은 문자열 "name"이어도 column을 거친 값과 맨 문자열은 다른 타입이 된다.
// Row가 브랜드 안에 들어 있으므로 어느 테이블의 컬럼인지까지 타입에 기록된다.
// 이 성질은 뒤 스텝에서 다른 테이블의 참조를 걸러 내는 근거가 된다.
const nameRef = from("users").column("name");
// Eq 단언을 두면 호버로 눈으로 확인하는 대신 컴파일러 검사로 ColumnRef의 정확한 결과를 고정할 수 있다.
const nameRefMatch: Eq<typeof nameRef, ColumnRef<UsersSchema, "name">> = true;

// 이 저장소는 태그 시점마다 npx tsc --noEmit이 0 오류여야 하므로, 일부러 막히는 예제는
// 바로 아래 지시어로 소비해 오류가 그 한 줄에서 기대된다는 사실을 함께 기록한다.
// 설명하는 산문에는 지시어 이름을 골뱅이와 함께 적지 않는다. 주석이 골뱅이 ts-expect-error로
// 시작하면 뒤에 한국어가 붙어 있어도 타입 검사기가 그것을 또 하나의 지시어로 읽어,
// 아무 오류도 덮지 않은 지시어라며 TS2578을 낸다.
// @ts-expect-error - error TS2322: Type '"name"' is not assignable to type 'ColumnRef<UsersSchema, keyof UsersSchema>'.
const bareStringRef: ColumnRef<UsersSchema> = "name";

// codeStep 380 — orderBy 오버로드 시그니처 작성하기

// column은 인스턴스 메서드이므로 컬럼 참조를 만들려면 먼저 빌더를 변수에 담아야 한다.
// orderQuery.orderBy(orderQuery.column("name"))처럼 같은 빌더에서 만든 참조를 같은 빌더에 넘긴다.
const orderQuery = from("users");
const orderedByName = orderQuery.orderBy(orderQuery.column("name"));
const orderedByNameDesc = orderQuery.orderBy(orderQuery.column("name"), "desc");

// 두 호출이 모두 오류 없이 통과하므로 orderBy 오버로드가 방향 생략 호출과 방향 명시 호출을
// 둘 다 받아들인다는 사실을 확인할 수 있다.
// 반환 타입이 this라서 where처럼 Row와 Selected를 바꾸지 않고 같은 빌더 타입으로 체인이 이어진다.
const orderedByNameMatch: Eq<typeof orderedByName, QueryBuilder<UsersSchema, []>> = true;
const orderedByNameDescMatch: Eq<typeof orderedByNameDesc, QueryBuilder<UsersSchema, []>> = true;

// rows는 아직 order 필드를 읽지 않는다. 실제 정렬 로직은 codeStep 381에서 추가하므로,
// 이 스텝을 실행해도 콘솔 출력은 앞 스텝과 완전히 같다.

export {};
