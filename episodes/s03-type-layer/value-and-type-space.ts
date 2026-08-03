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
