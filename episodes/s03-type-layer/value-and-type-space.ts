class Envelope {
  payload: string;
  constructor(payload: string) {
    this.payload = payload;
  }
}

const e: Envelope = new Envelope("hello"); // 앞의 Envelope=타입, 뒤의 Envelope=값
const ctor: typeof Envelope = Envelope; // typeof Envelope=Envelope의 타입 공간 쪽 타입

// 두 공간을 바꿔 쓰면 tsc가 두 이름을 나란히 불러 준다
// const bad: Envelope = Envelope; // TS2741: Property 'payload' is missing in type 'typeof Envelope' but required in type 'Envelope'.

interface Shape {
  area(): number;
}

// console.log(Shape); // TS2693: 'Shape' only refers to a type, but is being used as a value here.
console.log(Envelope); // Envelope는 값 공간에도 존재하므로 그대로 출력된다
