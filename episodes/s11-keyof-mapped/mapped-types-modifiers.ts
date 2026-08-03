// 매핑된 타입의 +readonly, -readonly, -? 접두사를 직접 확인한다.
// readonly와 옵셔널 표시를 벗긴 뒤 다시 잠그는 흐름을 값 재대입으로 보여 준다.
// exactOptionalPropertyTypes가 켜졌을 때 옵셔널 키 생략과 undefined 명시가 어떻게 갈라지는지도 비교한다.
// 그 플래그는 이 화 전용 tsconfig.exact-modifiers.json에서만 켠다(루트 기준선은 그대로 둔다).
// 검사: npx tsc --noEmit -p episodes/s11-keyof-mapped/tsconfig.exact-modifiers.json

interface DraftAccount {
  readonly id: string;
  displayName?: string;
}

type StrippedAccount = {
  -readonly [K in keyof DraftAccount]-?: DraftAccount[K];
};

const stripped: StrippedAccount = { id: "a-1", displayName: "Ada" };
console.log("stripped (재대입 전):", stripped);

stripped.id = "a-2"; // readonly가 벗겨져 재대입이 통과한다
console.log("stripped (재대입 후):", stripped);

type RelockedAccount = {
  +readonly [K in keyof StrippedAccount]: StrippedAccount[K];
};

const relocked: RelockedAccount = stripped;
console.log("relocked (+readonly 적용):", relocked);

// (컴파일 실패 사례 — 주석 처리 + 진단 원문)
// relocked.id = "a-3";
// error TS2540: Cannot assign to 'id' because it is a read-only property.

interface Draft {
  title: string;
  subtitle?: string;
}

const omitted: Draft = { title: "제목" };
console.log("omitted (옵셔널 키 생략):", omitted);

// exactOptionalPropertyTypes: true에서는 키 생략과 undefined 명시가 다르다.
// (컴파일 실패 사례 — 주석 처리 + 진단 원문)
// const explicitUndefined: Draft = { title: "제목", subtitle: undefined };
// error TS2375: Type '{ title: string; subtitle: undefined; }' is not assignable to type 'Draft' with 'exactOptionalPropertyTypes: true'. Consider adding 'undefined' to the types of the target's properties.

type StrippedDraft = { [K in keyof Draft]-?: Draft[K] };

// 여기서 막히는 이유는 exactOptionalPropertyTypes가 아니라 -?가 옵셔널 표시를 지웠기 때문이다.
// 플래그를 꺼도 키 생략은 똑같이 TS2741로 실패한다.
// (컴파일 실패 사례 — 주석 처리 + 진단 원문)
// const missingKey: StrippedDraft = { title: "제목" };
// error TS2741: Property 'subtitle' is missing in type '{ title: string; }' but required in type 'StrippedDraft'.

// -?는 옵셔널 표시와 함께 | undefined까지 지운다 — 그래서 undefined를 명시해도 막힌다.
// (컴파일 실패 사례 — 주석 처리 + 진단 원문)
// const undefinedAfterStrip: StrippedDraft = { title: "제목", subtitle: undefined };
// error TS2322: Type 'undefined' is not assignable to type 'string'.

const provided: StrippedDraft = { title: "제목", subtitle: "" };
console.log("provided (-? 적용 후 키 제공):", provided);

export {};
