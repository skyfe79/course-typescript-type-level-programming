// 표준 라이브러리에는 이미 전역 TypeError 인터페이스가 있습니다. 모듈 안에서 같은 이름의
// 제네릭 인터페이스를 선언하면 전역 선언과 병합되지는 않지만, 전역 TypeError를 파일 전체에서
// 가려 진짜 런타임 에러 타입을 쓸 수 없습니다. 모듈이 아닌 파일이라면 전역 선언과 병합되어
// 타입 매개변수가 충돌합니다. 두 문제를 모두 피하려고 TypeLevelError라는 이름을 사용합니다.
interface TypeLevelError<Message extends string, Detail = unknown> {
  // unique symbol은 구조가 우연히 같은 평범한 객체와 이 에러 타입을 구별하는 브랜드입니다.
  readonly __typeError: unique symbol;
  message: Message;
  detail: Detail;
}

// 키가 있으면 해당 값의 타입을, 없으면 never 대신 읽을 수 있는 실패 정보를 돌려줍니다.
type Lookup<T, K extends PropertyKey> =
  K extends keyof T ? T[K] : TypeLevelError<"KeyNotFound", K>;

function lookup<T extends object, K extends PropertyKey>(
  obj: T,
  key: K,
): Lookup<T, K> {
  if (key in obj) {
    // 런타임 검사로 키의 존재를 확인했지만, 제네릭 조건부 타입의 어느 분기인지는
    // 컴파일러가 확정하지 못합니다. any를 쓰지 않고 실제 객체의 키로 접근한 뒤 단언합니다.
    return obj[key as unknown as keyof T] as Lookup<T, K>;
  }

  // __typeError는 타입에서만 쓰는 브랜드이므로 런타임 객체에는 만들지 않습니다.
  // 따라서 실제로 필요한 message와 detail만 만든 뒤 unknown을 거쳐 반환 타입으로 단언합니다.
  return { message: "KeyNotFound", detail: key } as unknown as Lookup<T, K>;
}

const row = { id: 1, name: "ada" };

console.log(lookup(row, "name"));
console.log(lookup(row, "ghost"));

// STEP 417 — Expand<T>로 복잡한 타입 결과 펼쳐서 읽기

// 조건부 타입으로 T를 한 번 받아 낸 뒤 모든 프로퍼티를 다시 매핑하면,
// 에디터가 겹겹이 쌓인 별칭 대신 한 단계의 객체 모양을 표시하기 쉬워집니다.
type Expand<T> = T extends infer O ? { [K in keyof O]: O[K] } : never;

// RowError의 검사기 표시: TypeLevelError<"KeyNotFound", "ghost">
type RowError = Lookup<typeof row, "ghost">;
// ReadableRowError의 검사기 표시: { readonly __typeError: unique symbol; message: "KeyNotFound"; detail: "ghost"; }
// 같은 타입에서 Expand가 바꾸는 것은 의미가 아니라 검사기 표시뿐입니다.
type ReadableRowError = Expand<RowError>;

// 다른 화의 타입을 가져오지 않고, 인터섹션 표시를 비교하는 데 필요한 작은 구조만 다시 정의합니다.
interface RowCore {
  id: number;
  name: string;
}

interface AuditFields {
  createdBy: string;
  updatedBy: string;
}

interface SoftDeleteFields {
  deleted: boolean;
  deletedAt: string | null;
}

// MergedRow의 검사기 표시: MergedRow — 별칭 이름만 보여 필드는 드러나지 않습니다.
type MergedRow = RowCore & AuditFields & SoftDeleteFields;
// ReadableMergedRow의 검사기 표시: { id: number; name: string; createdBy: string; updatedBy: string; deleted: boolean; deletedAt: string | null; }
// 같은 타입에서 Expand가 바꾸는 것은 의미가 아니라 검사기 표시뿐이며, 여기서는 여섯 필드가 드러납니다.
type ReadableMergedRow = Expand<MergedRow>;

// Expand 전후가 양방향으로 할당 가능해야 값과 의미가 그대로라고 볼 수 있습니다.
// Expect의 제약 덕분에 둘 중 하나라도 달라지면 이 별칭 선언 자체가 컴파일되지 않습니다.
type IsMutuallyAssignable<A, B> =
  [A] extends [B] ? ([B] extends [A] ? true : false) : false;
type Expect<T extends true> = T;
type ExpandKeepsMeaning = Expect<
  IsMutuallyAssignable<RowError, ReadableRowError> extends true
    ? IsMutuallyAssignable<MergedRow, ReadableMergedRow>
    : false
>;

const readableMergedRow: ReadableMergedRow = {
  id: 1,
  name: "ada",
  createdBy: "system",
  updatedBy: "system",
  deleted: false,
  deletedAt: null,
};

console.log(readableMergedRow);

// 이 파일의 타입 이름이 다른 화의 전역 선언과 섞이지 않도록 모듈 범위로 격리합니다.
export {};
