// 상태 모양의 키를 as절로 리매핑해 핸들러 객체 타입과 런타임 값을 만드는 과정을 확인한다.
// 실행: node episodes/s25-template-literal-types/handler-object.ts
// 검사: npx tsc --noEmit

// codeStep 357 — as절로 키 이름 바꿔 보기

// InteractionState는 화면에서 추적할 세 상호작용과 각 상호작용의 활성 여부를 나타낸다.
interface InteractionState {
  click: boolean;
  hover: boolean;
  focus: boolean;
  // 밑줄로 시작하는 _debug는 외부 핸들러로 공개하지 않을 내부 전용 상태다.
  _debug: boolean;
}

// 기존의 { [K in keyof T]: T[K] } 형태는 원래 키 이름에 묶여 있어 click을 그대로 프로퍼티 이름으로 사용한다.
// as절을 추가하면 각 K를 템플릿 리터럴 타입으로 바꾸어 onClick과 같은 새 프로퍼티 이름을 만들 수 있다.
type Handlers = {
  [K in keyof InteractionState as `on${Capitalize<K & string>}`]: () => void;
};

// Eq는 두 타입이 정확히 같은지를 판별해 편집기의 호버 결과를 컴파일러 검사로도 고정한다.
type Eq<X, Y> = (<T>() => T extends X ? 1 : 2) extends (<T>() => T extends Y ? 1 : 2) ? true : false;

// Capitalize는 밑줄을 대문자로 바꾸지 못하므로 _debug도 on_debug라는 프로퍼티로 그대로 따라 들어온다.
// 이름만 바꾸는 as절은 어떤 키를 만들지는 정해도 어떤 키를 빼놓을지는 정하지 못한다.
const handlersMatchState: Eq<
  Handlers,
  { onClick: () => void; onHover: () => void; onFocus: () => void; on_debug: () => void }
> = true;

// codeStep 358 — 특정 키를 걸러내는 매핑된 타입 만들기

// 조건부 as절은 밑줄로 시작하는 키를 never로 바꾸고, 나머지 키만 핸들러 이름으로 리매핑한다.
// 매핑된 타입의 새 키가 never가 되면 그 프로퍼티는 결과 타입에 아예 만들어지지 않는다.
type PublicHandlers = {
  [K in keyof InteractionState as K extends `_${string}` ? never : `on${Capitalize<K & string>}`]: () => void;
};

// 같은 InteractionState를 리매핑했는데도 on_debug가 빠져 공개 상태 세 개만 핸들러로 남는다.
const publicHandlersMatchState: Eq<
  PublicHandlers,
  { onClick: () => void; onHover: () => void; onFocus: () => void }
> = true;

// 값 공간에는 Capitalize가 없으므로 첫 글자를 직접 대문자로 바꾸고 나머지 문자열을 이어 붙인다.
// 만들어진 이름을 계산된 프로퍼티 키로 사용해 각 상태에 대응하는 핸들러 함수를 담는다.
function toHandlers(state: InteractionState): Record<string, () => void> {
  const handlers: Record<string, () => void> = {};

  for (const key of Object.keys(state)) {
    // 타입에서 걸러낸 내부 키가 값에서도 나타나지 않도록 같은 밑줄 규칙으로 건너뛴다.
    if (key.startsWith("_")) continue;

    const name = `on${key[0].toUpperCase()}${key.slice(1)}`;
    handlers[name] = () => console.log(`${name} fired`);
  }

  return handlers;
}

// 타입과 같은 모양의 값을 준비해 타입 공간의 키 리매핑을 런타임에서도 재현한다.
const state: InteractionState = {
  click: false,
  hover: false,
  focus: false,
  _debug: false,
};

// 명령줄에서 받은 상태 키에도 같은 규칙을 적용하고, 인자가 없으면 hover 핸들러를 호출한다.
const handlers = toHandlers(state);
const requested = process.argv[2] ?? "hover";
const name = `on${requested[0].toUpperCase()}${requested.slice(1)}`;
handlers[name]?.();

// 런타임 객체에도 on_debug가 없고 공개 핸들러 세 개만 있는지 출력해 확인한다.
console.log(Object.keys(handlers));

export {};
