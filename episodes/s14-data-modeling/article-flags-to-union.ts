// 게시 상태를 네 개의 독립 불리언 플래그로 표현할 때 생기는 조합 폭발을 보여줍니다.
// status 판별자를 가진 유니온으로 가능한 게시 상태만 남기는 방식을 비교합니다.
// 검사: npx tsc --noEmit

// codeStep 204 — 불리언 플래그 네 개가 허용하는 열여섯 가지 조합

type ArticleFlags = {
  isDraft: boolean;
  isReviewed: boolean;
  isPublished: boolean;
  isArchived: boolean;
};
// 2 * 2 * 2 * 2 = 16가지 조합

// 정상적인 조합 — 초안 상태
const draft: ArticleFlags = {
  isDraft: true,
  isReviewed: false,
  isPublished: false,
  isArchived: false,
};

// 실무에서는 있을 수 없는 조합인데도 똑같이 컴파일된다
const nonsense: ArticleFlags = {
  isDraft: true,
  isReviewed: false,
  isPublished: false,
  isArchived: true,
};

// codeStep 205 — status 판별자로 세 가지 게시 상태만 표현

// ArticleFlags와 draft, nonsense 값은 이전 커밋의 참고용으로만 남긴다
type ArticleState =
  | { status: "draft" }
  | { status: "published"; publishedAt: string }
  | { status: "archived"; archivedAt: string };

const draftState: ArticleState = { status: "draft" };
const publishedState: ArticleState = {
  status: "published",
  publishedAt: "2026-08-02",
};

// codeStep 206 — 판별 유니온이 불가능한 게시 상태 조합을 거부함

// @ts-expect-error - draft 변형에는 archivedAt 필드가 없다
const impossibleOne: ArticleState = { status: "draft", archivedAt: "2026-08-02" };

// @ts-expect-error - "reviewed"는 세 변형 어디에도 없는 리터럴이다
const impossibleTwo: ArticleState = { status: "reviewed" };

export {};
