// STEP 499 — 릴리스 노트 항목을 네 성격으로 분류하고 개수를 집계하기

// 기능 추가(feature)는 이전 버전에 없던 문법이나 옵션을 새로 사용할 수 있게 된 경우입니다.
// 폐기(deprecation)는 아직 동작하지만 앞으로 제거될 예정이므로 다른 방법으로 옮겨야 하는 경우입니다.
// 기본값 변경(defaultChange)은 같은 설정을 생략해도 이전과 다른 동작을 하게 되는 경우입니다.
// 호환성 깨짐(breakingChange)은 이전에 허용되던 사용법이 새 버전에서는 이미 동작하지 않는 경우입니다.
// 특히 폐기와 호환성 깨짐은 "지금도 동작하는가"를 기준으로 구별할 수 있습니다.
type ReleaseNoteCategory =
  | "feature"
  | "deprecation"
  | "defaultChange"
  | "breakingChange";

// 릴리스 노트의 한 항목에는 버전, 변경 내용, 그리고 위 네 분류 중 하나를 기록합니다.
// category를 문자열 일반 타입이 아니라 리터럴 유니온으로 제한하므로 오타와 잘못된 분류 이름을 막습니다.
interface ReleaseNoteEntry {
  version: string;
  text: string;
  category: ReleaseNoteCategory;
}

const entries: ReleaseNoteEntry[] = [
  // 조건부 타입과 infer는 기존 코드를 금지하지 않고 새로운 타입 표현 능력을 더하므로 기능 추가입니다.
  { version: "2.8", text: "조건부 타입과 infer 키워드 추가", category: "feature" },
  // 템플릿 리터럴 타입도 문자열 타입을 조합하는 새 문법이므로 기능 추가입니다.
  { version: "4.1", text: "템플릿 리터럴 타입 추가", category: "feature" },
  // satisfies는 값의 추론을 보존하면서 타입 적합성을 검사하는 새 연산자이므로 기능 추가입니다.
  { version: "4.9", text: "satisfies 연산자 추가", category: "feature" },
  // --checkers는 이전에 없던 검사기 선택 옵션을 제공하므로 기능 추가입니다.
  { version: "7.0", text: "--checkers 플래그 추가", category: "feature" },

  // strict를 생략했을 때 선택되는 값이 달라지므로 새 기능이 아니라 기본값 변경입니다.
  { version: "6.0", text: "strict 기본값이 true로 변경", category: "defaultChange" },
  // module 역시 옵션 자체가 아니라 생략했을 때 적용되는 값이 달라지므로 기본값 변경입니다.
  { version: "6.0", text: "module 기본값이 esnext로 변경", category: "defaultChange" },

  // es5를 target으로 지정하는 기존 설정이 더는 허용되지 않으므로 호환성 깨짐입니다.
  { version: "6.0", text: "target: es5 지정 불가", category: "breakingChange" },
  // --outFile을 사용하던 명령이 더는 동작하지 않으므로 호환성 깨짐입니다.
  { version: "6.0", text: "--outFile 옵션 제거", category: "breakingChange" },

  // 제거 예정 항목이지만 ignoreDeprecations로 한 버전 동안 계속 동작하게 할 수 있으므로 폐기입니다.
  // 유예 기간이 끝나 실제로 제거된 뒤에는 같은 항목을 호환성 깨짐으로 읽어야 합니다.
  {
    version: "6.0",
    text: "제거 목록 항목에 ignoreDeprecations: '6.0' 한 버전 유예",
    category: "deprecation",
  },
];

function summarize(entries: ReleaseNoteEntry[]): Record<ReleaseNoteCategory, number> {
  // 네 키를 모두 요구하는 Record를 명시했기 때문에 카테고리가 추가되면 초기값 누락이 컴파일 오류가 됩니다.
  const counts: Record<ReleaseNoteCategory, number> = {
    feature: 0,
    deprecation: 0,
    defaultChange: 0,
    breakingChange: 0,
  };

  // category는 ReleaseNoteCategory로 제한되어 있으므로 해당 카테고리의 개수를 안전하게 증가시킵니다.
  for (const entry of entries) counts[entry.category]++;
  return counts;
}

console.log(summarize(entries));
