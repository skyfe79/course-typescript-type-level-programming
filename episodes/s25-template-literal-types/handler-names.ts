// 상태 모양의 키에서 핸들러 이름 타입과 런타임 값을 자동으로 만드는 과정을 확인한다.
// 실행: node episodes/s25-template-literal-types/handler-names.ts
// 검사: npx tsc --noEmit

// codeStep 354 — 상태 모양 타입 정의하기

// InteractionState는 화면에서 추적할 세 상호작용과 각 상호작용의 활성 여부를 나타낸다.
interface InteractionState {
  click: boolean;
  hover: boolean;
  focus: boolean;
  drag: boolean;
}

// 타입과 같은 모양의 값을 만들어 타입 공간의 키가 런타임에서는 어떤 값인지 함께 살펴본다.
const state: InteractionState = {
  click: false,
  hover: false,
  focus: false,
  drag: false,
};

// Object.keys는 state가 실제로 가진 키 목록을 배열로 돌려준다.
console.log(Object.keys(state));

// codeStep 355 — 템플릿 리터럴과 Capitalize로 핸들러 이름 만들기

// Capitalize는 각 상태 키의 첫 글자를 대문자로 바꾸고, 템플릿 리터럴 타입은 그 앞에 on을 붙인다.
type HandlerName<K extends string> = `on${Capitalize<K>}`;

// keyof가 만든 키 유니온을 한 번에 전달하면 HandlerName도 각 멤버를 변환한 유니온을 만든다.
type HandlerNames = HandlerName<keyof InteractionState>;

// Eq는 두 타입이 정확히 같은지를 판별해 편집기의 호버 결과를 컴파일러 검사로도 고정한다.
type Eq<X, Y> = (<T>() => T extends X ? 1 : 2) extends (<T>() => T extends Y ? 1 : 2) ? true : false;

// 상태 모양이 커졌으니 기대값도 함께 키워 네 상태 키가 빠짐없이 핸들러 이름으로 바뀌었는지 확인한다.
const handlerNamesMatchState: Eq<
  HandlerNames,
  "onClick" | "onHover" | "onFocus" | "onDrag"
> = true;

// 값 공간에는 Capitalize 함수가 없으므로 첫 글자를 직접 대문자로 바꾸고 나머지 문자열을 이어 붙인다.
// 이 프로젝트에서는 key[0]이 string이고, Object.keys(state)가 돌려주는 실제 키는 빈 문자열이 아니므로 길이 가드가 필요 없다.
function toHandlerName(key: string): string {
  return `on${key[0].toUpperCase()}${key.slice(1)}`;
}

// 타입 공간에서 만든 것과 같은 규칙을 각 실제 키에 적용해 계산된 핸들러 이름을 출력한다.
for (const key of Object.keys(state)) {
  console.log(toHandlerName(key));
}

// codeStep 356 — 새로운 상태 키 추가하고 결과 확인하기

// HandlerName과 HandlerNames를 고치지 않아도 새 drag 키에서 onDrag가 자동으로 만들어진다.
// @ts-expect-error - onDrag가 더해졌으므로 HandlerNames는 이전의 세 멤버 유니온과 같지 않다
const handlerNamesIncludeDrag: Eq<
  HandlerNames,
  "onClick" | "onHover" | "onFocus"
> = true;

export {};
