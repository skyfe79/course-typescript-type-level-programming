// Partial, Required, Mutable을 직접 작성해 본다.
// 같은 매핑된 타입 루프에서 수정자만 바꾸면 세 유틸리티 타입이 만들어진다.

interface DraftPost {
  title: string;
  body: string;
  publishedAt: Date;
}

// ?를 붙여 모든 프로퍼티를 옵셔널로 바꾼다.
type MyPartial<T> = {
  [K in keyof T]?: T[K];
};

const draft: MyPartial<DraftPost> = { title: "초안 제목" };
// body, publishedAt 없이도 통과한다 — 모든 필드가 옵셔널로 바뀌었다

const sameByBuiltin: Partial<DraftPost> = draft;
// 내장 Partial과 같은 자리에서 그대로 통한다

console.log("draft (title만):", draft);

export {};
