// 상태 모양의 키에서 핸들러 이름 타입과 런타임 값을 자동으로 만드는 과정을 확인한다.
// 실행: node episodes/s25-template-literal-types/handler-names.ts
// 검사: npx tsc --noEmit

// codeStep 354 — 상태 모양 타입 정의하기

// InteractionState는 화면에서 추적할 세 상호작용과 각 상호작용의 활성 여부를 나타낸다.
interface InteractionState {
  click: boolean;
  hover: boolean;
  focus: boolean;
}

// 타입과 같은 모양의 값을 만들어 타입 공간의 키가 런타임에서는 어떤 값인지 함께 살펴본다.
const state: InteractionState = {
  click: false,
  hover: false,
  focus: false,
};

// Object.keys는 state가 실제로 가진 키 목록을 배열로 돌려준다.
console.log(Object.keys(state));

export {};
