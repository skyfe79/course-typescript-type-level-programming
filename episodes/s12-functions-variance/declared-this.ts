// 메서드를 값으로 떼어 내면 원래 객체 리시버도 함께 따라온다고 착각하기 쉽다.
// TypeScript의 가짜 this 매개변수는 이 착각을 호출 시점의 타입 계약으로 드러낸다.
// 리시버를 잃은 호출이 런타임까지 가지 않고 컴파일 시점에 잡히는지 확인한다.
// 검사: npx tsc --noEmit
// 실행: node episodes/s12-functions-variance/declared-this.ts

// codeStep 173 — 메서드가 요구하는 this 타입을 가짜 매개변수로 선언

interface Button {
  label: string;
  onClick(this: Button, event: string): void;
}

const button: Button = {
  label: "제출",
  onClick(event) {
    console.log(`${this.label} 버튼이 ${event} 이벤트로 클릭됨`);
  },
};

button.onClick("click"); // this는 button — 정상 호출

// this: Button은 실제 인자가 아니라 컴파일러만 보는 가짜 매개변수다.
// 컴파일된 자바스크립트에서는 지워지므로 구현 쪽 매개변수 목록에는 event만 둔다.

export {};
