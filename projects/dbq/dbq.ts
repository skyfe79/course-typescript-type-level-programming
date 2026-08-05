// 임의의 스키마와 메서드 호출 체인에 통하는 타입 안전 쿼리 빌더의 뼈대를 세운다.
// 실행: node projects/dbq/dbq.ts
// 검사: npx tsc --noEmit

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

  constructor(tableName: string, selectedCols: Selected = [] as unknown as Selected) {
    this.tableName = tableName;
    this.selectedCols = selectedCols;
  }

  // select는 Row에 실제로 존재하는 컬럼만 가변 인자로 받고, 기존 선택 뒤에 새 선택을 이어 붙인다.
  // 이 단계에서는 행 타입 자체를 좁히지 않고 선택한 컬럼 이름과 호출 순서만 새 빌더에 누적한다.
  select<Cols extends readonly (keyof Row)[]>(...cols: Cols): QueryBuilder<Row, [...Selected, ...Cols]> {
    return new QueryBuilder<Row, [...Selected, ...Cols]>(
      this.tableName,
      [...this.selectedCols, ...cols] as [...Selected, ...Cols],
    );
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

export {};
