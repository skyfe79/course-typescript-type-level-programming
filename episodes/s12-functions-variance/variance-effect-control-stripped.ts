// in/out 어노테이션의 검사 비용을 재는 대조군. 어노테이션이 있는 파일과 없는 파일의 본문은 한 글자도 다르지 않다.
// 확인: diff episodes/s12-functions-variance/variance-effect-control-annotated.ts episodes/s12-functions-variance/variance-effect-control-stripped.ts
//       (Producer의 `out `, Consumer의 `in ` 두 줄만 다르다)
// 측정: npx tsc --noEmit --extendedDiagnostics --ignoreConfig --strict episodes/s12-functions-variance/variance-effect-control-annotated.ts
//       npx tsc --noEmit --extendedDiagnostics --ignoreConfig --strict episodes/s12-functions-variance/variance-effect-control-stripped.ts
//       Types와 Instantiations는 두 파일이 같아야 하고, Check time 같은 시간 항목만 실행마다 오르내린다. 절대값은 컴파일러 버전에 따라 달라진다.
// 구성: 호환성을 검사하는 대입(`let …Target = …` 줄) 300개(Producer 150개 · Consumer 150개), 중첩은 1단계부터 8단계까지 돌아가며 깊어진다.
//       Consumer는 짝수 단계에서 안팎이 뒤집히므로 대입 방향도 함께 뒤집는다.
//       Consumer의 set은 속성 함수 문법으로 둔다. 메서드 문법이면 어노테이션이 없는 쪽이 in을 추론하지 못해 구조 비교로
//       내려가고, 그때는 타입 수가 몇 개 달라져서 어노테이션만의 효과를 잴 수 없다.

interface Animal {
  name: string;
}

interface Cat extends Animal {
  meow(): string;
}

interface Producer<T> {
  get(): T;
}

interface Consumer<T> {
  set: (v: T) => void;
}

const producer1: Producer<Cat> = {} as Producer<Cat>;
let producerTarget1: Producer<Animal> = producer1;

const consumer2: Consumer<Consumer<Cat>> = {} as Consumer<Consumer<Cat>>;
let consumerTarget2: Consumer<Consumer<Animal>> = consumer2;

const producer3: Producer<Producer<Producer<Cat>>> = {} as Producer<Producer<Producer<Cat>>>;
let producerTarget3: Producer<Producer<Producer<Animal>>> = producer3;

const consumer4: Consumer<Consumer<Consumer<Consumer<Cat>>>> = {} as Consumer<Consumer<Consumer<Consumer<Cat>>>>;
let consumerTarget4: Consumer<Consumer<Consumer<Consumer<Animal>>>> = consumer4;

const producer5: Producer<Producer<Producer<Producer<Producer<Cat>>>>> = {} as Producer<Producer<Producer<Producer<Producer<Cat>>>>>;
let producerTarget5: Producer<Producer<Producer<Producer<Producer<Animal>>>>> = producer5;

const consumer6: Consumer<Consumer<Consumer<Consumer<Consumer<Consumer<Cat>>>>>> = {} as Consumer<Consumer<Consumer<Consumer<Consumer<Consumer<Cat>>>>>>;
let consumerTarget6: Consumer<Consumer<Consumer<Consumer<Consumer<Consumer<Animal>>>>>> = consumer6;

const producer7: Producer<Producer<Producer<Producer<Producer<Producer<Producer<Cat>>>>>>> = {} as Producer<Producer<Producer<Producer<Producer<Producer<Producer<Cat>>>>>>>;
let producerTarget7: Producer<Producer<Producer<Producer<Producer<Producer<Producer<Animal>>>>>>> = producer7;

const consumer8: Consumer<Consumer<Consumer<Consumer<Consumer<Consumer<Consumer<Consumer<Cat>>>>>>>> = {} as Consumer<Consumer<Consumer<Consumer<Consumer<Consumer<Consumer<Consumer<Cat>>>>>>>>;
let consumerTarget8: Consumer<Consumer<Consumer<Consumer<Consumer<Consumer<Consumer<Consumer<Animal>>>>>>>> = consumer8;

const producer9: Producer<Cat> = {} as Producer<Cat>;
let producerTarget9: Producer<Animal> = producer9;

const consumer10: Consumer<Consumer<Cat>> = {} as Consumer<Consumer<Cat>>;
let consumerTarget10: Consumer<Consumer<Animal>> = consumer10;

const producer11: Producer<Producer<Producer<Cat>>> = {} as Producer<Producer<Producer<Cat>>>;
let producerTarget11: Producer<Producer<Producer<Animal>>> = producer11;

const consumer12: Consumer<Consumer<Consumer<Consumer<Cat>>>> = {} as Consumer<Consumer<Consumer<Consumer<Cat>>>>;
let consumerTarget12: Consumer<Consumer<Consumer<Consumer<Animal>>>> = consumer12;

const producer13: Producer<Producer<Producer<Producer<Producer<Cat>>>>> = {} as Producer<Producer<Producer<Producer<Producer<Cat>>>>>;
let producerTarget13: Producer<Producer<Producer<Producer<Producer<Animal>>>>> = producer13;

const consumer14: Consumer<Consumer<Consumer<Consumer<Consumer<Consumer<Cat>>>>>> = {} as Consumer<Consumer<Consumer<Consumer<Consumer<Consumer<Cat>>>>>>;
let consumerTarget14: Consumer<Consumer<Consumer<Consumer<Consumer<Consumer<Animal>>>>>> = consumer14;

const producer15: Producer<Producer<Producer<Producer<Producer<Producer<Producer<Cat>>>>>>> = {} as Producer<Producer<Producer<Producer<Producer<Producer<Producer<Cat>>>>>>>;
let producerTarget15: Producer<Producer<Producer<Producer<Producer<Producer<Producer<Animal>>>>>>> = producer15;

const consumer16: Consumer<Consumer<Consumer<Consumer<Consumer<Consumer<Consumer<Consumer<Cat>>>>>>>> = {} as Consumer<Consumer<Consumer<Consumer<Consumer<Consumer<Consumer<Consumer<Cat>>>>>>>>;
let consumerTarget16: Consumer<Consumer<Consumer<Consumer<Consumer<Consumer<Consumer<Consumer<Animal>>>>>>>> = consumer16;

const producer17: Producer<Cat> = {} as Producer<Cat>;
let producerTarget17: Producer<Animal> = producer17;

const consumer18: Consumer<Consumer<Cat>> = {} as Consumer<Consumer<Cat>>;
let consumerTarget18: Consumer<Consumer<Animal>> = consumer18;

const producer19: Producer<Producer<Producer<Cat>>> = {} as Producer<Producer<Producer<Cat>>>;
let producerTarget19: Producer<Producer<Producer<Animal>>> = producer19;

const consumer20: Consumer<Consumer<Consumer<Consumer<Cat>>>> = {} as Consumer<Consumer<Consumer<Consumer<Cat>>>>;
let consumerTarget20: Consumer<Consumer<Consumer<Consumer<Animal>>>> = consumer20;

const producer21: Producer<Producer<Producer<Producer<Producer<Cat>>>>> = {} as Producer<Producer<Producer<Producer<Producer<Cat>>>>>;
let producerTarget21: Producer<Producer<Producer<Producer<Producer<Animal>>>>> = producer21;

const consumer22: Consumer<Consumer<Consumer<Consumer<Consumer<Consumer<Cat>>>>>> = {} as Consumer<Consumer<Consumer<Consumer<Consumer<Consumer<Cat>>>>>>;
let consumerTarget22: Consumer<Consumer<Consumer<Consumer<Consumer<Consumer<Animal>>>>>> = consumer22;

const producer23: Producer<Producer<Producer<Producer<Producer<Producer<Producer<Cat>>>>>>> = {} as Producer<Producer<Producer<Producer<Producer<Producer<Producer<Cat>>>>>>>;
let producerTarget23: Producer<Producer<Producer<Producer<Producer<Producer<Producer<Animal>>>>>>> = producer23;

const consumer24: Consumer<Consumer<Consumer<Consumer<Consumer<Consumer<Consumer<Consumer<Cat>>>>>>>> = {} as Consumer<Consumer<Consumer<Consumer<Consumer<Consumer<Consumer<Consumer<Cat>>>>>>>>;
let consumerTarget24: Consumer<Consumer<Consumer<Consumer<Consumer<Consumer<Consumer<Consumer<Animal>>>>>>>> = consumer24;

const producer25: Producer<Cat> = {} as Producer<Cat>;
let producerTarget25: Producer<Animal> = producer25;

const consumer26: Consumer<Consumer<Cat>> = {} as Consumer<Consumer<Cat>>;
let consumerTarget26: Consumer<Consumer<Animal>> = consumer26;

const producer27: Producer<Producer<Producer<Cat>>> = {} as Producer<Producer<Producer<Cat>>>;
let producerTarget27: Producer<Producer<Producer<Animal>>> = producer27;

const consumer28: Consumer<Consumer<Consumer<Consumer<Cat>>>> = {} as Consumer<Consumer<Consumer<Consumer<Cat>>>>;
let consumerTarget28: Consumer<Consumer<Consumer<Consumer<Animal>>>> = consumer28;

const producer29: Producer<Producer<Producer<Producer<Producer<Cat>>>>> = {} as Producer<Producer<Producer<Producer<Producer<Cat>>>>>;
let producerTarget29: Producer<Producer<Producer<Producer<Producer<Animal>>>>> = producer29;

const consumer30: Consumer<Consumer<Consumer<Consumer<Consumer<Consumer<Cat>>>>>> = {} as Consumer<Consumer<Consumer<Consumer<Consumer<Consumer<Cat>>>>>>;
let consumerTarget30: Consumer<Consumer<Consumer<Consumer<Consumer<Consumer<Animal>>>>>> = consumer30;

const producer31: Producer<Producer<Producer<Producer<Producer<Producer<Producer<Cat>>>>>>> = {} as Producer<Producer<Producer<Producer<Producer<Producer<Producer<Cat>>>>>>>;
let producerTarget31: Producer<Producer<Producer<Producer<Producer<Producer<Producer<Animal>>>>>>> = producer31;

const consumer32: Consumer<Consumer<Consumer<Consumer<Consumer<Consumer<Consumer<Consumer<Cat>>>>>>>> = {} as Consumer<Consumer<Consumer<Consumer<Consumer<Consumer<Consumer<Consumer<Cat>>>>>>>>;
let consumerTarget32: Consumer<Consumer<Consumer<Consumer<Consumer<Consumer<Consumer<Consumer<Animal>>>>>>>> = consumer32;

const producer33: Producer<Cat> = {} as Producer<Cat>;
let producerTarget33: Producer<Animal> = producer33;

const consumer34: Consumer<Consumer<Cat>> = {} as Consumer<Consumer<Cat>>;
let consumerTarget34: Consumer<Consumer<Animal>> = consumer34;

const producer35: Producer<Producer<Producer<Cat>>> = {} as Producer<Producer<Producer<Cat>>>;
let producerTarget35: Producer<Producer<Producer<Animal>>> = producer35;

const consumer36: Consumer<Consumer<Consumer<Consumer<Cat>>>> = {} as Consumer<Consumer<Consumer<Consumer<Cat>>>>;
let consumerTarget36: Consumer<Consumer<Consumer<Consumer<Animal>>>> = consumer36;

const producer37: Producer<Producer<Producer<Producer<Producer<Cat>>>>> = {} as Producer<Producer<Producer<Producer<Producer<Cat>>>>>;
let producerTarget37: Producer<Producer<Producer<Producer<Producer<Animal>>>>> = producer37;

const consumer38: Consumer<Consumer<Consumer<Consumer<Consumer<Consumer<Cat>>>>>> = {} as Consumer<Consumer<Consumer<Consumer<Consumer<Consumer<Cat>>>>>>;
let consumerTarget38: Consumer<Consumer<Consumer<Consumer<Consumer<Consumer<Animal>>>>>> = consumer38;

const producer39: Producer<Producer<Producer<Producer<Producer<Producer<Producer<Cat>>>>>>> = {} as Producer<Producer<Producer<Producer<Producer<Producer<Producer<Cat>>>>>>>;
let producerTarget39: Producer<Producer<Producer<Producer<Producer<Producer<Producer<Animal>>>>>>> = producer39;

const consumer40: Consumer<Consumer<Consumer<Consumer<Consumer<Consumer<Consumer<Consumer<Cat>>>>>>>> = {} as Consumer<Consumer<Consumer<Consumer<Consumer<Consumer<Consumer<Consumer<Cat>>>>>>>>;
let consumerTarget40: Consumer<Consumer<Consumer<Consumer<Consumer<Consumer<Consumer<Consumer<Animal>>>>>>>> = consumer40;

const producer41: Producer<Cat> = {} as Producer<Cat>;
let producerTarget41: Producer<Animal> = producer41;

const consumer42: Consumer<Consumer<Cat>> = {} as Consumer<Consumer<Cat>>;
let consumerTarget42: Consumer<Consumer<Animal>> = consumer42;

const producer43: Producer<Producer<Producer<Cat>>> = {} as Producer<Producer<Producer<Cat>>>;
let producerTarget43: Producer<Producer<Producer<Animal>>> = producer43;

const consumer44: Consumer<Consumer<Consumer<Consumer<Cat>>>> = {} as Consumer<Consumer<Consumer<Consumer<Cat>>>>;
let consumerTarget44: Consumer<Consumer<Consumer<Consumer<Animal>>>> = consumer44;

const producer45: Producer<Producer<Producer<Producer<Producer<Cat>>>>> = {} as Producer<Producer<Producer<Producer<Producer<Cat>>>>>;
let producerTarget45: Producer<Producer<Producer<Producer<Producer<Animal>>>>> = producer45;

const consumer46: Consumer<Consumer<Consumer<Consumer<Consumer<Consumer<Cat>>>>>> = {} as Consumer<Consumer<Consumer<Consumer<Consumer<Consumer<Cat>>>>>>;
let consumerTarget46: Consumer<Consumer<Consumer<Consumer<Consumer<Consumer<Animal>>>>>> = consumer46;

const producer47: Producer<Producer<Producer<Producer<Producer<Producer<Producer<Cat>>>>>>> = {} as Producer<Producer<Producer<Producer<Producer<Producer<Producer<Cat>>>>>>>;
let producerTarget47: Producer<Producer<Producer<Producer<Producer<Producer<Producer<Animal>>>>>>> = producer47;

const consumer48: Consumer<Consumer<Consumer<Consumer<Consumer<Consumer<Consumer<Consumer<Cat>>>>>>>> = {} as Consumer<Consumer<Consumer<Consumer<Consumer<Consumer<Consumer<Consumer<Cat>>>>>>>>;
let consumerTarget48: Consumer<Consumer<Consumer<Consumer<Consumer<Consumer<Consumer<Consumer<Animal>>>>>>>> = consumer48;

const producer49: Producer<Cat> = {} as Producer<Cat>;
let producerTarget49: Producer<Animal> = producer49;

const consumer50: Consumer<Consumer<Cat>> = {} as Consumer<Consumer<Cat>>;
let consumerTarget50: Consumer<Consumer<Animal>> = consumer50;

const producer51: Producer<Producer<Producer<Cat>>> = {} as Producer<Producer<Producer<Cat>>>;
let producerTarget51: Producer<Producer<Producer<Animal>>> = producer51;

const consumer52: Consumer<Consumer<Consumer<Consumer<Cat>>>> = {} as Consumer<Consumer<Consumer<Consumer<Cat>>>>;
let consumerTarget52: Consumer<Consumer<Consumer<Consumer<Animal>>>> = consumer52;

const producer53: Producer<Producer<Producer<Producer<Producer<Cat>>>>> = {} as Producer<Producer<Producer<Producer<Producer<Cat>>>>>;
let producerTarget53: Producer<Producer<Producer<Producer<Producer<Animal>>>>> = producer53;

const consumer54: Consumer<Consumer<Consumer<Consumer<Consumer<Consumer<Cat>>>>>> = {} as Consumer<Consumer<Consumer<Consumer<Consumer<Consumer<Cat>>>>>>;
let consumerTarget54: Consumer<Consumer<Consumer<Consumer<Consumer<Consumer<Animal>>>>>> = consumer54;

const producer55: Producer<Producer<Producer<Producer<Producer<Producer<Producer<Cat>>>>>>> = {} as Producer<Producer<Producer<Producer<Producer<Producer<Producer<Cat>>>>>>>;
let producerTarget55: Producer<Producer<Producer<Producer<Producer<Producer<Producer<Animal>>>>>>> = producer55;

const consumer56: Consumer<Consumer<Consumer<Consumer<Consumer<Consumer<Consumer<Consumer<Cat>>>>>>>> = {} as Consumer<Consumer<Consumer<Consumer<Consumer<Consumer<Consumer<Consumer<Cat>>>>>>>>;
let consumerTarget56: Consumer<Consumer<Consumer<Consumer<Consumer<Consumer<Consumer<Consumer<Animal>>>>>>>> = consumer56;

const producer57: Producer<Cat> = {} as Producer<Cat>;
let producerTarget57: Producer<Animal> = producer57;

const consumer58: Consumer<Consumer<Cat>> = {} as Consumer<Consumer<Cat>>;
let consumerTarget58: Consumer<Consumer<Animal>> = consumer58;

const producer59: Producer<Producer<Producer<Cat>>> = {} as Producer<Producer<Producer<Cat>>>;
let producerTarget59: Producer<Producer<Producer<Animal>>> = producer59;

const consumer60: Consumer<Consumer<Consumer<Consumer<Cat>>>> = {} as Consumer<Consumer<Consumer<Consumer<Cat>>>>;
let consumerTarget60: Consumer<Consumer<Consumer<Consumer<Animal>>>> = consumer60;

const producer61: Producer<Producer<Producer<Producer<Producer<Cat>>>>> = {} as Producer<Producer<Producer<Producer<Producer<Cat>>>>>;
let producerTarget61: Producer<Producer<Producer<Producer<Producer<Animal>>>>> = producer61;

const consumer62: Consumer<Consumer<Consumer<Consumer<Consumer<Consumer<Cat>>>>>> = {} as Consumer<Consumer<Consumer<Consumer<Consumer<Consumer<Cat>>>>>>;
let consumerTarget62: Consumer<Consumer<Consumer<Consumer<Consumer<Consumer<Animal>>>>>> = consumer62;

const producer63: Producer<Producer<Producer<Producer<Producer<Producer<Producer<Cat>>>>>>> = {} as Producer<Producer<Producer<Producer<Producer<Producer<Producer<Cat>>>>>>>;
let producerTarget63: Producer<Producer<Producer<Producer<Producer<Producer<Producer<Animal>>>>>>> = producer63;

const consumer64: Consumer<Consumer<Consumer<Consumer<Consumer<Consumer<Consumer<Consumer<Cat>>>>>>>> = {} as Consumer<Consumer<Consumer<Consumer<Consumer<Consumer<Consumer<Consumer<Cat>>>>>>>>;
let consumerTarget64: Consumer<Consumer<Consumer<Consumer<Consumer<Consumer<Consumer<Consumer<Animal>>>>>>>> = consumer64;

const producer65: Producer<Cat> = {} as Producer<Cat>;
let producerTarget65: Producer<Animal> = producer65;

const consumer66: Consumer<Consumer<Cat>> = {} as Consumer<Consumer<Cat>>;
let consumerTarget66: Consumer<Consumer<Animal>> = consumer66;

const producer67: Producer<Producer<Producer<Cat>>> = {} as Producer<Producer<Producer<Cat>>>;
let producerTarget67: Producer<Producer<Producer<Animal>>> = producer67;

const consumer68: Consumer<Consumer<Consumer<Consumer<Cat>>>> = {} as Consumer<Consumer<Consumer<Consumer<Cat>>>>;
let consumerTarget68: Consumer<Consumer<Consumer<Consumer<Animal>>>> = consumer68;

const producer69: Producer<Producer<Producer<Producer<Producer<Cat>>>>> = {} as Producer<Producer<Producer<Producer<Producer<Cat>>>>>;
let producerTarget69: Producer<Producer<Producer<Producer<Producer<Animal>>>>> = producer69;

const consumer70: Consumer<Consumer<Consumer<Consumer<Consumer<Consumer<Cat>>>>>> = {} as Consumer<Consumer<Consumer<Consumer<Consumer<Consumer<Cat>>>>>>;
let consumerTarget70: Consumer<Consumer<Consumer<Consumer<Consumer<Consumer<Animal>>>>>> = consumer70;

const producer71: Producer<Producer<Producer<Producer<Producer<Producer<Producer<Cat>>>>>>> = {} as Producer<Producer<Producer<Producer<Producer<Producer<Producer<Cat>>>>>>>;
let producerTarget71: Producer<Producer<Producer<Producer<Producer<Producer<Producer<Animal>>>>>>> = producer71;

const consumer72: Consumer<Consumer<Consumer<Consumer<Consumer<Consumer<Consumer<Consumer<Cat>>>>>>>> = {} as Consumer<Consumer<Consumer<Consumer<Consumer<Consumer<Consumer<Consumer<Cat>>>>>>>>;
let consumerTarget72: Consumer<Consumer<Consumer<Consumer<Consumer<Consumer<Consumer<Consumer<Animal>>>>>>>> = consumer72;

const producer73: Producer<Cat> = {} as Producer<Cat>;
let producerTarget73: Producer<Animal> = producer73;

const consumer74: Consumer<Consumer<Cat>> = {} as Consumer<Consumer<Cat>>;
let consumerTarget74: Consumer<Consumer<Animal>> = consumer74;

const producer75: Producer<Producer<Producer<Cat>>> = {} as Producer<Producer<Producer<Cat>>>;
let producerTarget75: Producer<Producer<Producer<Animal>>> = producer75;

const consumer76: Consumer<Consumer<Consumer<Consumer<Cat>>>> = {} as Consumer<Consumer<Consumer<Consumer<Cat>>>>;
let consumerTarget76: Consumer<Consumer<Consumer<Consumer<Animal>>>> = consumer76;

const producer77: Producer<Producer<Producer<Producer<Producer<Cat>>>>> = {} as Producer<Producer<Producer<Producer<Producer<Cat>>>>>;
let producerTarget77: Producer<Producer<Producer<Producer<Producer<Animal>>>>> = producer77;

const consumer78: Consumer<Consumer<Consumer<Consumer<Consumer<Consumer<Cat>>>>>> = {} as Consumer<Consumer<Consumer<Consumer<Consumer<Consumer<Cat>>>>>>;
let consumerTarget78: Consumer<Consumer<Consumer<Consumer<Consumer<Consumer<Animal>>>>>> = consumer78;

const producer79: Producer<Producer<Producer<Producer<Producer<Producer<Producer<Cat>>>>>>> = {} as Producer<Producer<Producer<Producer<Producer<Producer<Producer<Cat>>>>>>>;
let producerTarget79: Producer<Producer<Producer<Producer<Producer<Producer<Producer<Animal>>>>>>> = producer79;

const consumer80: Consumer<Consumer<Consumer<Consumer<Consumer<Consumer<Consumer<Consumer<Cat>>>>>>>> = {} as Consumer<Consumer<Consumer<Consumer<Consumer<Consumer<Consumer<Consumer<Cat>>>>>>>>;
let consumerTarget80: Consumer<Consumer<Consumer<Consumer<Consumer<Consumer<Consumer<Consumer<Animal>>>>>>>> = consumer80;

const producer81: Producer<Cat> = {} as Producer<Cat>;
let producerTarget81: Producer<Animal> = producer81;

const consumer82: Consumer<Consumer<Cat>> = {} as Consumer<Consumer<Cat>>;
let consumerTarget82: Consumer<Consumer<Animal>> = consumer82;

const producer83: Producer<Producer<Producer<Cat>>> = {} as Producer<Producer<Producer<Cat>>>;
let producerTarget83: Producer<Producer<Producer<Animal>>> = producer83;

const consumer84: Consumer<Consumer<Consumer<Consumer<Cat>>>> = {} as Consumer<Consumer<Consumer<Consumer<Cat>>>>;
let consumerTarget84: Consumer<Consumer<Consumer<Consumer<Animal>>>> = consumer84;

const producer85: Producer<Producer<Producer<Producer<Producer<Cat>>>>> = {} as Producer<Producer<Producer<Producer<Producer<Cat>>>>>;
let producerTarget85: Producer<Producer<Producer<Producer<Producer<Animal>>>>> = producer85;

const consumer86: Consumer<Consumer<Consumer<Consumer<Consumer<Consumer<Cat>>>>>> = {} as Consumer<Consumer<Consumer<Consumer<Consumer<Consumer<Cat>>>>>>;
let consumerTarget86: Consumer<Consumer<Consumer<Consumer<Consumer<Consumer<Animal>>>>>> = consumer86;

const producer87: Producer<Producer<Producer<Producer<Producer<Producer<Producer<Cat>>>>>>> = {} as Producer<Producer<Producer<Producer<Producer<Producer<Producer<Cat>>>>>>>;
let producerTarget87: Producer<Producer<Producer<Producer<Producer<Producer<Producer<Animal>>>>>>> = producer87;

const consumer88: Consumer<Consumer<Consumer<Consumer<Consumer<Consumer<Consumer<Consumer<Cat>>>>>>>> = {} as Consumer<Consumer<Consumer<Consumer<Consumer<Consumer<Consumer<Consumer<Cat>>>>>>>>;
let consumerTarget88: Consumer<Consumer<Consumer<Consumer<Consumer<Consumer<Consumer<Consumer<Animal>>>>>>>> = consumer88;

const producer89: Producer<Cat> = {} as Producer<Cat>;
let producerTarget89: Producer<Animal> = producer89;

const consumer90: Consumer<Consumer<Cat>> = {} as Consumer<Consumer<Cat>>;
let consumerTarget90: Consumer<Consumer<Animal>> = consumer90;

const producer91: Producer<Producer<Producer<Cat>>> = {} as Producer<Producer<Producer<Cat>>>;
let producerTarget91: Producer<Producer<Producer<Animal>>> = producer91;

const consumer92: Consumer<Consumer<Consumer<Consumer<Cat>>>> = {} as Consumer<Consumer<Consumer<Consumer<Cat>>>>;
let consumerTarget92: Consumer<Consumer<Consumer<Consumer<Animal>>>> = consumer92;

const producer93: Producer<Producer<Producer<Producer<Producer<Cat>>>>> = {} as Producer<Producer<Producer<Producer<Producer<Cat>>>>>;
let producerTarget93: Producer<Producer<Producer<Producer<Producer<Animal>>>>> = producer93;

const consumer94: Consumer<Consumer<Consumer<Consumer<Consumer<Consumer<Cat>>>>>> = {} as Consumer<Consumer<Consumer<Consumer<Consumer<Consumer<Cat>>>>>>;
let consumerTarget94: Consumer<Consumer<Consumer<Consumer<Consumer<Consumer<Animal>>>>>> = consumer94;

const producer95: Producer<Producer<Producer<Producer<Producer<Producer<Producer<Cat>>>>>>> = {} as Producer<Producer<Producer<Producer<Producer<Producer<Producer<Cat>>>>>>>;
let producerTarget95: Producer<Producer<Producer<Producer<Producer<Producer<Producer<Animal>>>>>>> = producer95;

const consumer96: Consumer<Consumer<Consumer<Consumer<Consumer<Consumer<Consumer<Consumer<Cat>>>>>>>> = {} as Consumer<Consumer<Consumer<Consumer<Consumer<Consumer<Consumer<Consumer<Cat>>>>>>>>;
let consumerTarget96: Consumer<Consumer<Consumer<Consumer<Consumer<Consumer<Consumer<Consumer<Animal>>>>>>>> = consumer96;

const producer97: Producer<Cat> = {} as Producer<Cat>;
let producerTarget97: Producer<Animal> = producer97;

const consumer98: Consumer<Consumer<Cat>> = {} as Consumer<Consumer<Cat>>;
let consumerTarget98: Consumer<Consumer<Animal>> = consumer98;

const producer99: Producer<Producer<Producer<Cat>>> = {} as Producer<Producer<Producer<Cat>>>;
let producerTarget99: Producer<Producer<Producer<Animal>>> = producer99;

const consumer100: Consumer<Consumer<Consumer<Consumer<Cat>>>> = {} as Consumer<Consumer<Consumer<Consumer<Cat>>>>;
let consumerTarget100: Consumer<Consumer<Consumer<Consumer<Animal>>>> = consumer100;

const producer101: Producer<Producer<Producer<Producer<Producer<Cat>>>>> = {} as Producer<Producer<Producer<Producer<Producer<Cat>>>>>;
let producerTarget101: Producer<Producer<Producer<Producer<Producer<Animal>>>>> = producer101;

const consumer102: Consumer<Consumer<Consumer<Consumer<Consumer<Consumer<Cat>>>>>> = {} as Consumer<Consumer<Consumer<Consumer<Consumer<Consumer<Cat>>>>>>;
let consumerTarget102: Consumer<Consumer<Consumer<Consumer<Consumer<Consumer<Animal>>>>>> = consumer102;

const producer103: Producer<Producer<Producer<Producer<Producer<Producer<Producer<Cat>>>>>>> = {} as Producer<Producer<Producer<Producer<Producer<Producer<Producer<Cat>>>>>>>;
let producerTarget103: Producer<Producer<Producer<Producer<Producer<Producer<Producer<Animal>>>>>>> = producer103;

const consumer104: Consumer<Consumer<Consumer<Consumer<Consumer<Consumer<Consumer<Consumer<Cat>>>>>>>> = {} as Consumer<Consumer<Consumer<Consumer<Consumer<Consumer<Consumer<Consumer<Cat>>>>>>>>;
let consumerTarget104: Consumer<Consumer<Consumer<Consumer<Consumer<Consumer<Consumer<Consumer<Animal>>>>>>>> = consumer104;

const producer105: Producer<Cat> = {} as Producer<Cat>;
let producerTarget105: Producer<Animal> = producer105;

const consumer106: Consumer<Consumer<Cat>> = {} as Consumer<Consumer<Cat>>;
let consumerTarget106: Consumer<Consumer<Animal>> = consumer106;

const producer107: Producer<Producer<Producer<Cat>>> = {} as Producer<Producer<Producer<Cat>>>;
let producerTarget107: Producer<Producer<Producer<Animal>>> = producer107;

const consumer108: Consumer<Consumer<Consumer<Consumer<Cat>>>> = {} as Consumer<Consumer<Consumer<Consumer<Cat>>>>;
let consumerTarget108: Consumer<Consumer<Consumer<Consumer<Animal>>>> = consumer108;

const producer109: Producer<Producer<Producer<Producer<Producer<Cat>>>>> = {} as Producer<Producer<Producer<Producer<Producer<Cat>>>>>;
let producerTarget109: Producer<Producer<Producer<Producer<Producer<Animal>>>>> = producer109;

const consumer110: Consumer<Consumer<Consumer<Consumer<Consumer<Consumer<Cat>>>>>> = {} as Consumer<Consumer<Consumer<Consumer<Consumer<Consumer<Cat>>>>>>;
let consumerTarget110: Consumer<Consumer<Consumer<Consumer<Consumer<Consumer<Animal>>>>>> = consumer110;

const producer111: Producer<Producer<Producer<Producer<Producer<Producer<Producer<Cat>>>>>>> = {} as Producer<Producer<Producer<Producer<Producer<Producer<Producer<Cat>>>>>>>;
let producerTarget111: Producer<Producer<Producer<Producer<Producer<Producer<Producer<Animal>>>>>>> = producer111;

const consumer112: Consumer<Consumer<Consumer<Consumer<Consumer<Consumer<Consumer<Consumer<Cat>>>>>>>> = {} as Consumer<Consumer<Consumer<Consumer<Consumer<Consumer<Consumer<Consumer<Cat>>>>>>>>;
let consumerTarget112: Consumer<Consumer<Consumer<Consumer<Consumer<Consumer<Consumer<Consumer<Animal>>>>>>>> = consumer112;

const producer113: Producer<Cat> = {} as Producer<Cat>;
let producerTarget113: Producer<Animal> = producer113;

const consumer114: Consumer<Consumer<Cat>> = {} as Consumer<Consumer<Cat>>;
let consumerTarget114: Consumer<Consumer<Animal>> = consumer114;

const producer115: Producer<Producer<Producer<Cat>>> = {} as Producer<Producer<Producer<Cat>>>;
let producerTarget115: Producer<Producer<Producer<Animal>>> = producer115;

const consumer116: Consumer<Consumer<Consumer<Consumer<Cat>>>> = {} as Consumer<Consumer<Consumer<Consumer<Cat>>>>;
let consumerTarget116: Consumer<Consumer<Consumer<Consumer<Animal>>>> = consumer116;

const producer117: Producer<Producer<Producer<Producer<Producer<Cat>>>>> = {} as Producer<Producer<Producer<Producer<Producer<Cat>>>>>;
let producerTarget117: Producer<Producer<Producer<Producer<Producer<Animal>>>>> = producer117;

const consumer118: Consumer<Consumer<Consumer<Consumer<Consumer<Consumer<Cat>>>>>> = {} as Consumer<Consumer<Consumer<Consumer<Consumer<Consumer<Cat>>>>>>;
let consumerTarget118: Consumer<Consumer<Consumer<Consumer<Consumer<Consumer<Animal>>>>>> = consumer118;

const producer119: Producer<Producer<Producer<Producer<Producer<Producer<Producer<Cat>>>>>>> = {} as Producer<Producer<Producer<Producer<Producer<Producer<Producer<Cat>>>>>>>;
let producerTarget119: Producer<Producer<Producer<Producer<Producer<Producer<Producer<Animal>>>>>>> = producer119;

const consumer120: Consumer<Consumer<Consumer<Consumer<Consumer<Consumer<Consumer<Consumer<Cat>>>>>>>> = {} as Consumer<Consumer<Consumer<Consumer<Consumer<Consumer<Consumer<Consumer<Cat>>>>>>>>;
let consumerTarget120: Consumer<Consumer<Consumer<Consumer<Consumer<Consumer<Consumer<Consumer<Animal>>>>>>>> = consumer120;

const producer121: Producer<Cat> = {} as Producer<Cat>;
let producerTarget121: Producer<Animal> = producer121;

const consumer122: Consumer<Consumer<Cat>> = {} as Consumer<Consumer<Cat>>;
let consumerTarget122: Consumer<Consumer<Animal>> = consumer122;

const producer123: Producer<Producer<Producer<Cat>>> = {} as Producer<Producer<Producer<Cat>>>;
let producerTarget123: Producer<Producer<Producer<Animal>>> = producer123;

const consumer124: Consumer<Consumer<Consumer<Consumer<Cat>>>> = {} as Consumer<Consumer<Consumer<Consumer<Cat>>>>;
let consumerTarget124: Consumer<Consumer<Consumer<Consumer<Animal>>>> = consumer124;

const producer125: Producer<Producer<Producer<Producer<Producer<Cat>>>>> = {} as Producer<Producer<Producer<Producer<Producer<Cat>>>>>;
let producerTarget125: Producer<Producer<Producer<Producer<Producer<Animal>>>>> = producer125;

const consumer126: Consumer<Consumer<Consumer<Consumer<Consumer<Consumer<Cat>>>>>> = {} as Consumer<Consumer<Consumer<Consumer<Consumer<Consumer<Cat>>>>>>;
let consumerTarget126: Consumer<Consumer<Consumer<Consumer<Consumer<Consumer<Animal>>>>>> = consumer126;

const producer127: Producer<Producer<Producer<Producer<Producer<Producer<Producer<Cat>>>>>>> = {} as Producer<Producer<Producer<Producer<Producer<Producer<Producer<Cat>>>>>>>;
let producerTarget127: Producer<Producer<Producer<Producer<Producer<Producer<Producer<Animal>>>>>>> = producer127;

const consumer128: Consumer<Consumer<Consumer<Consumer<Consumer<Consumer<Consumer<Consumer<Cat>>>>>>>> = {} as Consumer<Consumer<Consumer<Consumer<Consumer<Consumer<Consumer<Consumer<Cat>>>>>>>>;
let consumerTarget128: Consumer<Consumer<Consumer<Consumer<Consumer<Consumer<Consumer<Consumer<Animal>>>>>>>> = consumer128;

const producer129: Producer<Cat> = {} as Producer<Cat>;
let producerTarget129: Producer<Animal> = producer129;

const consumer130: Consumer<Consumer<Cat>> = {} as Consumer<Consumer<Cat>>;
let consumerTarget130: Consumer<Consumer<Animal>> = consumer130;

const producer131: Producer<Producer<Producer<Cat>>> = {} as Producer<Producer<Producer<Cat>>>;
let producerTarget131: Producer<Producer<Producer<Animal>>> = producer131;

const consumer132: Consumer<Consumer<Consumer<Consumer<Cat>>>> = {} as Consumer<Consumer<Consumer<Consumer<Cat>>>>;
let consumerTarget132: Consumer<Consumer<Consumer<Consumer<Animal>>>> = consumer132;

const producer133: Producer<Producer<Producer<Producer<Producer<Cat>>>>> = {} as Producer<Producer<Producer<Producer<Producer<Cat>>>>>;
let producerTarget133: Producer<Producer<Producer<Producer<Producer<Animal>>>>> = producer133;

const consumer134: Consumer<Consumer<Consumer<Consumer<Consumer<Consumer<Cat>>>>>> = {} as Consumer<Consumer<Consumer<Consumer<Consumer<Consumer<Cat>>>>>>;
let consumerTarget134: Consumer<Consumer<Consumer<Consumer<Consumer<Consumer<Animal>>>>>> = consumer134;

const producer135: Producer<Producer<Producer<Producer<Producer<Producer<Producer<Cat>>>>>>> = {} as Producer<Producer<Producer<Producer<Producer<Producer<Producer<Cat>>>>>>>;
let producerTarget135: Producer<Producer<Producer<Producer<Producer<Producer<Producer<Animal>>>>>>> = producer135;

const consumer136: Consumer<Consumer<Consumer<Consumer<Consumer<Consumer<Consumer<Consumer<Cat>>>>>>>> = {} as Consumer<Consumer<Consumer<Consumer<Consumer<Consumer<Consumer<Consumer<Cat>>>>>>>>;
let consumerTarget136: Consumer<Consumer<Consumer<Consumer<Consumer<Consumer<Consumer<Consumer<Animal>>>>>>>> = consumer136;

const producer137: Producer<Cat> = {} as Producer<Cat>;
let producerTarget137: Producer<Animal> = producer137;

const consumer138: Consumer<Consumer<Cat>> = {} as Consumer<Consumer<Cat>>;
let consumerTarget138: Consumer<Consumer<Animal>> = consumer138;

const producer139: Producer<Producer<Producer<Cat>>> = {} as Producer<Producer<Producer<Cat>>>;
let producerTarget139: Producer<Producer<Producer<Animal>>> = producer139;

const consumer140: Consumer<Consumer<Consumer<Consumer<Cat>>>> = {} as Consumer<Consumer<Consumer<Consumer<Cat>>>>;
let consumerTarget140: Consumer<Consumer<Consumer<Consumer<Animal>>>> = consumer140;

const producer141: Producer<Producer<Producer<Producer<Producer<Cat>>>>> = {} as Producer<Producer<Producer<Producer<Producer<Cat>>>>>;
let producerTarget141: Producer<Producer<Producer<Producer<Producer<Animal>>>>> = producer141;

const consumer142: Consumer<Consumer<Consumer<Consumer<Consumer<Consumer<Cat>>>>>> = {} as Consumer<Consumer<Consumer<Consumer<Consumer<Consumer<Cat>>>>>>;
let consumerTarget142: Consumer<Consumer<Consumer<Consumer<Consumer<Consumer<Animal>>>>>> = consumer142;

const producer143: Producer<Producer<Producer<Producer<Producer<Producer<Producer<Cat>>>>>>> = {} as Producer<Producer<Producer<Producer<Producer<Producer<Producer<Cat>>>>>>>;
let producerTarget143: Producer<Producer<Producer<Producer<Producer<Producer<Producer<Animal>>>>>>> = producer143;

const consumer144: Consumer<Consumer<Consumer<Consumer<Consumer<Consumer<Consumer<Consumer<Cat>>>>>>>> = {} as Consumer<Consumer<Consumer<Consumer<Consumer<Consumer<Consumer<Consumer<Cat>>>>>>>>;
let consumerTarget144: Consumer<Consumer<Consumer<Consumer<Consumer<Consumer<Consumer<Consumer<Animal>>>>>>>> = consumer144;

const producer145: Producer<Cat> = {} as Producer<Cat>;
let producerTarget145: Producer<Animal> = producer145;

const consumer146: Consumer<Consumer<Cat>> = {} as Consumer<Consumer<Cat>>;
let consumerTarget146: Consumer<Consumer<Animal>> = consumer146;

const producer147: Producer<Producer<Producer<Cat>>> = {} as Producer<Producer<Producer<Cat>>>;
let producerTarget147: Producer<Producer<Producer<Animal>>> = producer147;

const consumer148: Consumer<Consumer<Consumer<Consumer<Cat>>>> = {} as Consumer<Consumer<Consumer<Consumer<Cat>>>>;
let consumerTarget148: Consumer<Consumer<Consumer<Consumer<Animal>>>> = consumer148;

const producer149: Producer<Producer<Producer<Producer<Producer<Cat>>>>> = {} as Producer<Producer<Producer<Producer<Producer<Cat>>>>>;
let producerTarget149: Producer<Producer<Producer<Producer<Producer<Animal>>>>> = producer149;

const consumer150: Consumer<Consumer<Consumer<Consumer<Consumer<Consumer<Cat>>>>>> = {} as Consumer<Consumer<Consumer<Consumer<Consumer<Consumer<Cat>>>>>>;
let consumerTarget150: Consumer<Consumer<Consumer<Consumer<Consumer<Consumer<Animal>>>>>> = consumer150;

const producer151: Producer<Producer<Producer<Producer<Producer<Producer<Producer<Cat>>>>>>> = {} as Producer<Producer<Producer<Producer<Producer<Producer<Producer<Cat>>>>>>>;
let producerTarget151: Producer<Producer<Producer<Producer<Producer<Producer<Producer<Animal>>>>>>> = producer151;

const consumer152: Consumer<Consumer<Consumer<Consumer<Consumer<Consumer<Consumer<Consumer<Cat>>>>>>>> = {} as Consumer<Consumer<Consumer<Consumer<Consumer<Consumer<Consumer<Consumer<Cat>>>>>>>>;
let consumerTarget152: Consumer<Consumer<Consumer<Consumer<Consumer<Consumer<Consumer<Consumer<Animal>>>>>>>> = consumer152;

const producer153: Producer<Cat> = {} as Producer<Cat>;
let producerTarget153: Producer<Animal> = producer153;

const consumer154: Consumer<Consumer<Cat>> = {} as Consumer<Consumer<Cat>>;
let consumerTarget154: Consumer<Consumer<Animal>> = consumer154;

const producer155: Producer<Producer<Producer<Cat>>> = {} as Producer<Producer<Producer<Cat>>>;
let producerTarget155: Producer<Producer<Producer<Animal>>> = producer155;

const consumer156: Consumer<Consumer<Consumer<Consumer<Cat>>>> = {} as Consumer<Consumer<Consumer<Consumer<Cat>>>>;
let consumerTarget156: Consumer<Consumer<Consumer<Consumer<Animal>>>> = consumer156;

const producer157: Producer<Producer<Producer<Producer<Producer<Cat>>>>> = {} as Producer<Producer<Producer<Producer<Producer<Cat>>>>>;
let producerTarget157: Producer<Producer<Producer<Producer<Producer<Animal>>>>> = producer157;

const consumer158: Consumer<Consumer<Consumer<Consumer<Consumer<Consumer<Cat>>>>>> = {} as Consumer<Consumer<Consumer<Consumer<Consumer<Consumer<Cat>>>>>>;
let consumerTarget158: Consumer<Consumer<Consumer<Consumer<Consumer<Consumer<Animal>>>>>> = consumer158;

const producer159: Producer<Producer<Producer<Producer<Producer<Producer<Producer<Cat>>>>>>> = {} as Producer<Producer<Producer<Producer<Producer<Producer<Producer<Cat>>>>>>>;
let producerTarget159: Producer<Producer<Producer<Producer<Producer<Producer<Producer<Animal>>>>>>> = producer159;

const consumer160: Consumer<Consumer<Consumer<Consumer<Consumer<Consumer<Consumer<Consumer<Cat>>>>>>>> = {} as Consumer<Consumer<Consumer<Consumer<Consumer<Consumer<Consumer<Consumer<Cat>>>>>>>>;
let consumerTarget160: Consumer<Consumer<Consumer<Consumer<Consumer<Consumer<Consumer<Consumer<Animal>>>>>>>> = consumer160;

const producer161: Producer<Cat> = {} as Producer<Cat>;
let producerTarget161: Producer<Animal> = producer161;

const consumer162: Consumer<Consumer<Cat>> = {} as Consumer<Consumer<Cat>>;
let consumerTarget162: Consumer<Consumer<Animal>> = consumer162;

const producer163: Producer<Producer<Producer<Cat>>> = {} as Producer<Producer<Producer<Cat>>>;
let producerTarget163: Producer<Producer<Producer<Animal>>> = producer163;

const consumer164: Consumer<Consumer<Consumer<Consumer<Cat>>>> = {} as Consumer<Consumer<Consumer<Consumer<Cat>>>>;
let consumerTarget164: Consumer<Consumer<Consumer<Consumer<Animal>>>> = consumer164;

const producer165: Producer<Producer<Producer<Producer<Producer<Cat>>>>> = {} as Producer<Producer<Producer<Producer<Producer<Cat>>>>>;
let producerTarget165: Producer<Producer<Producer<Producer<Producer<Animal>>>>> = producer165;

const consumer166: Consumer<Consumer<Consumer<Consumer<Consumer<Consumer<Cat>>>>>> = {} as Consumer<Consumer<Consumer<Consumer<Consumer<Consumer<Cat>>>>>>;
let consumerTarget166: Consumer<Consumer<Consumer<Consumer<Consumer<Consumer<Animal>>>>>> = consumer166;

const producer167: Producer<Producer<Producer<Producer<Producer<Producer<Producer<Cat>>>>>>> = {} as Producer<Producer<Producer<Producer<Producer<Producer<Producer<Cat>>>>>>>;
let producerTarget167: Producer<Producer<Producer<Producer<Producer<Producer<Producer<Animal>>>>>>> = producer167;

const consumer168: Consumer<Consumer<Consumer<Consumer<Consumer<Consumer<Consumer<Consumer<Cat>>>>>>>> = {} as Consumer<Consumer<Consumer<Consumer<Consumer<Consumer<Consumer<Consumer<Cat>>>>>>>>;
let consumerTarget168: Consumer<Consumer<Consumer<Consumer<Consumer<Consumer<Consumer<Consumer<Animal>>>>>>>> = consumer168;

const producer169: Producer<Cat> = {} as Producer<Cat>;
let producerTarget169: Producer<Animal> = producer169;

const consumer170: Consumer<Consumer<Cat>> = {} as Consumer<Consumer<Cat>>;
let consumerTarget170: Consumer<Consumer<Animal>> = consumer170;

const producer171: Producer<Producer<Producer<Cat>>> = {} as Producer<Producer<Producer<Cat>>>;
let producerTarget171: Producer<Producer<Producer<Animal>>> = producer171;

const consumer172: Consumer<Consumer<Consumer<Consumer<Cat>>>> = {} as Consumer<Consumer<Consumer<Consumer<Cat>>>>;
let consumerTarget172: Consumer<Consumer<Consumer<Consumer<Animal>>>> = consumer172;

const producer173: Producer<Producer<Producer<Producer<Producer<Cat>>>>> = {} as Producer<Producer<Producer<Producer<Producer<Cat>>>>>;
let producerTarget173: Producer<Producer<Producer<Producer<Producer<Animal>>>>> = producer173;

const consumer174: Consumer<Consumer<Consumer<Consumer<Consumer<Consumer<Cat>>>>>> = {} as Consumer<Consumer<Consumer<Consumer<Consumer<Consumer<Cat>>>>>>;
let consumerTarget174: Consumer<Consumer<Consumer<Consumer<Consumer<Consumer<Animal>>>>>> = consumer174;

const producer175: Producer<Producer<Producer<Producer<Producer<Producer<Producer<Cat>>>>>>> = {} as Producer<Producer<Producer<Producer<Producer<Producer<Producer<Cat>>>>>>>;
let producerTarget175: Producer<Producer<Producer<Producer<Producer<Producer<Producer<Animal>>>>>>> = producer175;

const consumer176: Consumer<Consumer<Consumer<Consumer<Consumer<Consumer<Consumer<Consumer<Cat>>>>>>>> = {} as Consumer<Consumer<Consumer<Consumer<Consumer<Consumer<Consumer<Consumer<Cat>>>>>>>>;
let consumerTarget176: Consumer<Consumer<Consumer<Consumer<Consumer<Consumer<Consumer<Consumer<Animal>>>>>>>> = consumer176;

const producer177: Producer<Cat> = {} as Producer<Cat>;
let producerTarget177: Producer<Animal> = producer177;

const consumer178: Consumer<Consumer<Cat>> = {} as Consumer<Consumer<Cat>>;
let consumerTarget178: Consumer<Consumer<Animal>> = consumer178;

const producer179: Producer<Producer<Producer<Cat>>> = {} as Producer<Producer<Producer<Cat>>>;
let producerTarget179: Producer<Producer<Producer<Animal>>> = producer179;

const consumer180: Consumer<Consumer<Consumer<Consumer<Cat>>>> = {} as Consumer<Consumer<Consumer<Consumer<Cat>>>>;
let consumerTarget180: Consumer<Consumer<Consumer<Consumer<Animal>>>> = consumer180;

const producer181: Producer<Producer<Producer<Producer<Producer<Cat>>>>> = {} as Producer<Producer<Producer<Producer<Producer<Cat>>>>>;
let producerTarget181: Producer<Producer<Producer<Producer<Producer<Animal>>>>> = producer181;

const consumer182: Consumer<Consumer<Consumer<Consumer<Consumer<Consumer<Cat>>>>>> = {} as Consumer<Consumer<Consumer<Consumer<Consumer<Consumer<Cat>>>>>>;
let consumerTarget182: Consumer<Consumer<Consumer<Consumer<Consumer<Consumer<Animal>>>>>> = consumer182;

const producer183: Producer<Producer<Producer<Producer<Producer<Producer<Producer<Cat>>>>>>> = {} as Producer<Producer<Producer<Producer<Producer<Producer<Producer<Cat>>>>>>>;
let producerTarget183: Producer<Producer<Producer<Producer<Producer<Producer<Producer<Animal>>>>>>> = producer183;

const consumer184: Consumer<Consumer<Consumer<Consumer<Consumer<Consumer<Consumer<Consumer<Cat>>>>>>>> = {} as Consumer<Consumer<Consumer<Consumer<Consumer<Consumer<Consumer<Consumer<Cat>>>>>>>>;
let consumerTarget184: Consumer<Consumer<Consumer<Consumer<Consumer<Consumer<Consumer<Consumer<Animal>>>>>>>> = consumer184;

const producer185: Producer<Cat> = {} as Producer<Cat>;
let producerTarget185: Producer<Animal> = producer185;

const consumer186: Consumer<Consumer<Cat>> = {} as Consumer<Consumer<Cat>>;
let consumerTarget186: Consumer<Consumer<Animal>> = consumer186;

const producer187: Producer<Producer<Producer<Cat>>> = {} as Producer<Producer<Producer<Cat>>>;
let producerTarget187: Producer<Producer<Producer<Animal>>> = producer187;

const consumer188: Consumer<Consumer<Consumer<Consumer<Cat>>>> = {} as Consumer<Consumer<Consumer<Consumer<Cat>>>>;
let consumerTarget188: Consumer<Consumer<Consumer<Consumer<Animal>>>> = consumer188;

const producer189: Producer<Producer<Producer<Producer<Producer<Cat>>>>> = {} as Producer<Producer<Producer<Producer<Producer<Cat>>>>>;
let producerTarget189: Producer<Producer<Producer<Producer<Producer<Animal>>>>> = producer189;

const consumer190: Consumer<Consumer<Consumer<Consumer<Consumer<Consumer<Cat>>>>>> = {} as Consumer<Consumer<Consumer<Consumer<Consumer<Consumer<Cat>>>>>>;
let consumerTarget190: Consumer<Consumer<Consumer<Consumer<Consumer<Consumer<Animal>>>>>> = consumer190;

const producer191: Producer<Producer<Producer<Producer<Producer<Producer<Producer<Cat>>>>>>> = {} as Producer<Producer<Producer<Producer<Producer<Producer<Producer<Cat>>>>>>>;
let producerTarget191: Producer<Producer<Producer<Producer<Producer<Producer<Producer<Animal>>>>>>> = producer191;

const consumer192: Consumer<Consumer<Consumer<Consumer<Consumer<Consumer<Consumer<Consumer<Cat>>>>>>>> = {} as Consumer<Consumer<Consumer<Consumer<Consumer<Consumer<Consumer<Consumer<Cat>>>>>>>>;
let consumerTarget192: Consumer<Consumer<Consumer<Consumer<Consumer<Consumer<Consumer<Consumer<Animal>>>>>>>> = consumer192;

const producer193: Producer<Cat> = {} as Producer<Cat>;
let producerTarget193: Producer<Animal> = producer193;

const consumer194: Consumer<Consumer<Cat>> = {} as Consumer<Consumer<Cat>>;
let consumerTarget194: Consumer<Consumer<Animal>> = consumer194;

const producer195: Producer<Producer<Producer<Cat>>> = {} as Producer<Producer<Producer<Cat>>>;
let producerTarget195: Producer<Producer<Producer<Animal>>> = producer195;

const consumer196: Consumer<Consumer<Consumer<Consumer<Cat>>>> = {} as Consumer<Consumer<Consumer<Consumer<Cat>>>>;
let consumerTarget196: Consumer<Consumer<Consumer<Consumer<Animal>>>> = consumer196;

const producer197: Producer<Producer<Producer<Producer<Producer<Cat>>>>> = {} as Producer<Producer<Producer<Producer<Producer<Cat>>>>>;
let producerTarget197: Producer<Producer<Producer<Producer<Producer<Animal>>>>> = producer197;

const consumer198: Consumer<Consumer<Consumer<Consumer<Consumer<Consumer<Cat>>>>>> = {} as Consumer<Consumer<Consumer<Consumer<Consumer<Consumer<Cat>>>>>>;
let consumerTarget198: Consumer<Consumer<Consumer<Consumer<Consumer<Consumer<Animal>>>>>> = consumer198;

const producer199: Producer<Producer<Producer<Producer<Producer<Producer<Producer<Cat>>>>>>> = {} as Producer<Producer<Producer<Producer<Producer<Producer<Producer<Cat>>>>>>>;
let producerTarget199: Producer<Producer<Producer<Producer<Producer<Producer<Producer<Animal>>>>>>> = producer199;

const consumer200: Consumer<Consumer<Consumer<Consumer<Consumer<Consumer<Consumer<Consumer<Cat>>>>>>>> = {} as Consumer<Consumer<Consumer<Consumer<Consumer<Consumer<Consumer<Consumer<Cat>>>>>>>>;
let consumerTarget200: Consumer<Consumer<Consumer<Consumer<Consumer<Consumer<Consumer<Consumer<Animal>>>>>>>> = consumer200;

const producer201: Producer<Cat> = {} as Producer<Cat>;
let producerTarget201: Producer<Animal> = producer201;

const consumer202: Consumer<Consumer<Cat>> = {} as Consumer<Consumer<Cat>>;
let consumerTarget202: Consumer<Consumer<Animal>> = consumer202;

const producer203: Producer<Producer<Producer<Cat>>> = {} as Producer<Producer<Producer<Cat>>>;
let producerTarget203: Producer<Producer<Producer<Animal>>> = producer203;

const consumer204: Consumer<Consumer<Consumer<Consumer<Cat>>>> = {} as Consumer<Consumer<Consumer<Consumer<Cat>>>>;
let consumerTarget204: Consumer<Consumer<Consumer<Consumer<Animal>>>> = consumer204;

const producer205: Producer<Producer<Producer<Producer<Producer<Cat>>>>> = {} as Producer<Producer<Producer<Producer<Producer<Cat>>>>>;
let producerTarget205: Producer<Producer<Producer<Producer<Producer<Animal>>>>> = producer205;

const consumer206: Consumer<Consumer<Consumer<Consumer<Consumer<Consumer<Cat>>>>>> = {} as Consumer<Consumer<Consumer<Consumer<Consumer<Consumer<Cat>>>>>>;
let consumerTarget206: Consumer<Consumer<Consumer<Consumer<Consumer<Consumer<Animal>>>>>> = consumer206;

const producer207: Producer<Producer<Producer<Producer<Producer<Producer<Producer<Cat>>>>>>> = {} as Producer<Producer<Producer<Producer<Producer<Producer<Producer<Cat>>>>>>>;
let producerTarget207: Producer<Producer<Producer<Producer<Producer<Producer<Producer<Animal>>>>>>> = producer207;

const consumer208: Consumer<Consumer<Consumer<Consumer<Consumer<Consumer<Consumer<Consumer<Cat>>>>>>>> = {} as Consumer<Consumer<Consumer<Consumer<Consumer<Consumer<Consumer<Consumer<Cat>>>>>>>>;
let consumerTarget208: Consumer<Consumer<Consumer<Consumer<Consumer<Consumer<Consumer<Consumer<Animal>>>>>>>> = consumer208;

const producer209: Producer<Cat> = {} as Producer<Cat>;
let producerTarget209: Producer<Animal> = producer209;

const consumer210: Consumer<Consumer<Cat>> = {} as Consumer<Consumer<Cat>>;
let consumerTarget210: Consumer<Consumer<Animal>> = consumer210;

const producer211: Producer<Producer<Producer<Cat>>> = {} as Producer<Producer<Producer<Cat>>>;
let producerTarget211: Producer<Producer<Producer<Animal>>> = producer211;

const consumer212: Consumer<Consumer<Consumer<Consumer<Cat>>>> = {} as Consumer<Consumer<Consumer<Consumer<Cat>>>>;
let consumerTarget212: Consumer<Consumer<Consumer<Consumer<Animal>>>> = consumer212;

const producer213: Producer<Producer<Producer<Producer<Producer<Cat>>>>> = {} as Producer<Producer<Producer<Producer<Producer<Cat>>>>>;
let producerTarget213: Producer<Producer<Producer<Producer<Producer<Animal>>>>> = producer213;

const consumer214: Consumer<Consumer<Consumer<Consumer<Consumer<Consumer<Cat>>>>>> = {} as Consumer<Consumer<Consumer<Consumer<Consumer<Consumer<Cat>>>>>>;
let consumerTarget214: Consumer<Consumer<Consumer<Consumer<Consumer<Consumer<Animal>>>>>> = consumer214;

const producer215: Producer<Producer<Producer<Producer<Producer<Producer<Producer<Cat>>>>>>> = {} as Producer<Producer<Producer<Producer<Producer<Producer<Producer<Cat>>>>>>>;
let producerTarget215: Producer<Producer<Producer<Producer<Producer<Producer<Producer<Animal>>>>>>> = producer215;

const consumer216: Consumer<Consumer<Consumer<Consumer<Consumer<Consumer<Consumer<Consumer<Cat>>>>>>>> = {} as Consumer<Consumer<Consumer<Consumer<Consumer<Consumer<Consumer<Consumer<Cat>>>>>>>>;
let consumerTarget216: Consumer<Consumer<Consumer<Consumer<Consumer<Consumer<Consumer<Consumer<Animal>>>>>>>> = consumer216;

const producer217: Producer<Cat> = {} as Producer<Cat>;
let producerTarget217: Producer<Animal> = producer217;

const consumer218: Consumer<Consumer<Cat>> = {} as Consumer<Consumer<Cat>>;
let consumerTarget218: Consumer<Consumer<Animal>> = consumer218;

const producer219: Producer<Producer<Producer<Cat>>> = {} as Producer<Producer<Producer<Cat>>>;
let producerTarget219: Producer<Producer<Producer<Animal>>> = producer219;

const consumer220: Consumer<Consumer<Consumer<Consumer<Cat>>>> = {} as Consumer<Consumer<Consumer<Consumer<Cat>>>>;
let consumerTarget220: Consumer<Consumer<Consumer<Consumer<Animal>>>> = consumer220;

const producer221: Producer<Producer<Producer<Producer<Producer<Cat>>>>> = {} as Producer<Producer<Producer<Producer<Producer<Cat>>>>>;
let producerTarget221: Producer<Producer<Producer<Producer<Producer<Animal>>>>> = producer221;

const consumer222: Consumer<Consumer<Consumer<Consumer<Consumer<Consumer<Cat>>>>>> = {} as Consumer<Consumer<Consumer<Consumer<Consumer<Consumer<Cat>>>>>>;
let consumerTarget222: Consumer<Consumer<Consumer<Consumer<Consumer<Consumer<Animal>>>>>> = consumer222;

const producer223: Producer<Producer<Producer<Producer<Producer<Producer<Producer<Cat>>>>>>> = {} as Producer<Producer<Producer<Producer<Producer<Producer<Producer<Cat>>>>>>>;
let producerTarget223: Producer<Producer<Producer<Producer<Producer<Producer<Producer<Animal>>>>>>> = producer223;

const consumer224: Consumer<Consumer<Consumer<Consumer<Consumer<Consumer<Consumer<Consumer<Cat>>>>>>>> = {} as Consumer<Consumer<Consumer<Consumer<Consumer<Consumer<Consumer<Consumer<Cat>>>>>>>>;
let consumerTarget224: Consumer<Consumer<Consumer<Consumer<Consumer<Consumer<Consumer<Consumer<Animal>>>>>>>> = consumer224;

const producer225: Producer<Cat> = {} as Producer<Cat>;
let producerTarget225: Producer<Animal> = producer225;

const consumer226: Consumer<Consumer<Cat>> = {} as Consumer<Consumer<Cat>>;
let consumerTarget226: Consumer<Consumer<Animal>> = consumer226;

const producer227: Producer<Producer<Producer<Cat>>> = {} as Producer<Producer<Producer<Cat>>>;
let producerTarget227: Producer<Producer<Producer<Animal>>> = producer227;

const consumer228: Consumer<Consumer<Consumer<Consumer<Cat>>>> = {} as Consumer<Consumer<Consumer<Consumer<Cat>>>>;
let consumerTarget228: Consumer<Consumer<Consumer<Consumer<Animal>>>> = consumer228;

const producer229: Producer<Producer<Producer<Producer<Producer<Cat>>>>> = {} as Producer<Producer<Producer<Producer<Producer<Cat>>>>>;
let producerTarget229: Producer<Producer<Producer<Producer<Producer<Animal>>>>> = producer229;

const consumer230: Consumer<Consumer<Consumer<Consumer<Consumer<Consumer<Cat>>>>>> = {} as Consumer<Consumer<Consumer<Consumer<Consumer<Consumer<Cat>>>>>>;
let consumerTarget230: Consumer<Consumer<Consumer<Consumer<Consumer<Consumer<Animal>>>>>> = consumer230;

const producer231: Producer<Producer<Producer<Producer<Producer<Producer<Producer<Cat>>>>>>> = {} as Producer<Producer<Producer<Producer<Producer<Producer<Producer<Cat>>>>>>>;
let producerTarget231: Producer<Producer<Producer<Producer<Producer<Producer<Producer<Animal>>>>>>> = producer231;

const consumer232: Consumer<Consumer<Consumer<Consumer<Consumer<Consumer<Consumer<Consumer<Cat>>>>>>>> = {} as Consumer<Consumer<Consumer<Consumer<Consumer<Consumer<Consumer<Consumer<Cat>>>>>>>>;
let consumerTarget232: Consumer<Consumer<Consumer<Consumer<Consumer<Consumer<Consumer<Consumer<Animal>>>>>>>> = consumer232;

const producer233: Producer<Cat> = {} as Producer<Cat>;
let producerTarget233: Producer<Animal> = producer233;

const consumer234: Consumer<Consumer<Cat>> = {} as Consumer<Consumer<Cat>>;
let consumerTarget234: Consumer<Consumer<Animal>> = consumer234;

const producer235: Producer<Producer<Producer<Cat>>> = {} as Producer<Producer<Producer<Cat>>>;
let producerTarget235: Producer<Producer<Producer<Animal>>> = producer235;

const consumer236: Consumer<Consumer<Consumer<Consumer<Cat>>>> = {} as Consumer<Consumer<Consumer<Consumer<Cat>>>>;
let consumerTarget236: Consumer<Consumer<Consumer<Consumer<Animal>>>> = consumer236;

const producer237: Producer<Producer<Producer<Producer<Producer<Cat>>>>> = {} as Producer<Producer<Producer<Producer<Producer<Cat>>>>>;
let producerTarget237: Producer<Producer<Producer<Producer<Producer<Animal>>>>> = producer237;

const consumer238: Consumer<Consumer<Consumer<Consumer<Consumer<Consumer<Cat>>>>>> = {} as Consumer<Consumer<Consumer<Consumer<Consumer<Consumer<Cat>>>>>>;
let consumerTarget238: Consumer<Consumer<Consumer<Consumer<Consumer<Consumer<Animal>>>>>> = consumer238;

const producer239: Producer<Producer<Producer<Producer<Producer<Producer<Producer<Cat>>>>>>> = {} as Producer<Producer<Producer<Producer<Producer<Producer<Producer<Cat>>>>>>>;
let producerTarget239: Producer<Producer<Producer<Producer<Producer<Producer<Producer<Animal>>>>>>> = producer239;

const consumer240: Consumer<Consumer<Consumer<Consumer<Consumer<Consumer<Consumer<Consumer<Cat>>>>>>>> = {} as Consumer<Consumer<Consumer<Consumer<Consumer<Consumer<Consumer<Consumer<Cat>>>>>>>>;
let consumerTarget240: Consumer<Consumer<Consumer<Consumer<Consumer<Consumer<Consumer<Consumer<Animal>>>>>>>> = consumer240;

const producer241: Producer<Cat> = {} as Producer<Cat>;
let producerTarget241: Producer<Animal> = producer241;

const consumer242: Consumer<Consumer<Cat>> = {} as Consumer<Consumer<Cat>>;
let consumerTarget242: Consumer<Consumer<Animal>> = consumer242;

const producer243: Producer<Producer<Producer<Cat>>> = {} as Producer<Producer<Producer<Cat>>>;
let producerTarget243: Producer<Producer<Producer<Animal>>> = producer243;

const consumer244: Consumer<Consumer<Consumer<Consumer<Cat>>>> = {} as Consumer<Consumer<Consumer<Consumer<Cat>>>>;
let consumerTarget244: Consumer<Consumer<Consumer<Consumer<Animal>>>> = consumer244;

const producer245: Producer<Producer<Producer<Producer<Producer<Cat>>>>> = {} as Producer<Producer<Producer<Producer<Producer<Cat>>>>>;
let producerTarget245: Producer<Producer<Producer<Producer<Producer<Animal>>>>> = producer245;

const consumer246: Consumer<Consumer<Consumer<Consumer<Consumer<Consumer<Cat>>>>>> = {} as Consumer<Consumer<Consumer<Consumer<Consumer<Consumer<Cat>>>>>>;
let consumerTarget246: Consumer<Consumer<Consumer<Consumer<Consumer<Consumer<Animal>>>>>> = consumer246;

const producer247: Producer<Producer<Producer<Producer<Producer<Producer<Producer<Cat>>>>>>> = {} as Producer<Producer<Producer<Producer<Producer<Producer<Producer<Cat>>>>>>>;
let producerTarget247: Producer<Producer<Producer<Producer<Producer<Producer<Producer<Animal>>>>>>> = producer247;

const consumer248: Consumer<Consumer<Consumer<Consumer<Consumer<Consumer<Consumer<Consumer<Cat>>>>>>>> = {} as Consumer<Consumer<Consumer<Consumer<Consumer<Consumer<Consumer<Consumer<Cat>>>>>>>>;
let consumerTarget248: Consumer<Consumer<Consumer<Consumer<Consumer<Consumer<Consumer<Consumer<Animal>>>>>>>> = consumer248;

const producer249: Producer<Cat> = {} as Producer<Cat>;
let producerTarget249: Producer<Animal> = producer249;

const consumer250: Consumer<Consumer<Cat>> = {} as Consumer<Consumer<Cat>>;
let consumerTarget250: Consumer<Consumer<Animal>> = consumer250;

const producer251: Producer<Producer<Producer<Cat>>> = {} as Producer<Producer<Producer<Cat>>>;
let producerTarget251: Producer<Producer<Producer<Animal>>> = producer251;

const consumer252: Consumer<Consumer<Consumer<Consumer<Cat>>>> = {} as Consumer<Consumer<Consumer<Consumer<Cat>>>>;
let consumerTarget252: Consumer<Consumer<Consumer<Consumer<Animal>>>> = consumer252;

const producer253: Producer<Producer<Producer<Producer<Producer<Cat>>>>> = {} as Producer<Producer<Producer<Producer<Producer<Cat>>>>>;
let producerTarget253: Producer<Producer<Producer<Producer<Producer<Animal>>>>> = producer253;

const consumer254: Consumer<Consumer<Consumer<Consumer<Consumer<Consumer<Cat>>>>>> = {} as Consumer<Consumer<Consumer<Consumer<Consumer<Consumer<Cat>>>>>>;
let consumerTarget254: Consumer<Consumer<Consumer<Consumer<Consumer<Consumer<Animal>>>>>> = consumer254;

const producer255: Producer<Producer<Producer<Producer<Producer<Producer<Producer<Cat>>>>>>> = {} as Producer<Producer<Producer<Producer<Producer<Producer<Producer<Cat>>>>>>>;
let producerTarget255: Producer<Producer<Producer<Producer<Producer<Producer<Producer<Animal>>>>>>> = producer255;

const consumer256: Consumer<Consumer<Consumer<Consumer<Consumer<Consumer<Consumer<Consumer<Cat>>>>>>>> = {} as Consumer<Consumer<Consumer<Consumer<Consumer<Consumer<Consumer<Consumer<Cat>>>>>>>>;
let consumerTarget256: Consumer<Consumer<Consumer<Consumer<Consumer<Consumer<Consumer<Consumer<Animal>>>>>>>> = consumer256;

const producer257: Producer<Cat> = {} as Producer<Cat>;
let producerTarget257: Producer<Animal> = producer257;

const consumer258: Consumer<Consumer<Cat>> = {} as Consumer<Consumer<Cat>>;
let consumerTarget258: Consumer<Consumer<Animal>> = consumer258;

const producer259: Producer<Producer<Producer<Cat>>> = {} as Producer<Producer<Producer<Cat>>>;
let producerTarget259: Producer<Producer<Producer<Animal>>> = producer259;

const consumer260: Consumer<Consumer<Consumer<Consumer<Cat>>>> = {} as Consumer<Consumer<Consumer<Consumer<Cat>>>>;
let consumerTarget260: Consumer<Consumer<Consumer<Consumer<Animal>>>> = consumer260;

const producer261: Producer<Producer<Producer<Producer<Producer<Cat>>>>> = {} as Producer<Producer<Producer<Producer<Producer<Cat>>>>>;
let producerTarget261: Producer<Producer<Producer<Producer<Producer<Animal>>>>> = producer261;

const consumer262: Consumer<Consumer<Consumer<Consumer<Consumer<Consumer<Cat>>>>>> = {} as Consumer<Consumer<Consumer<Consumer<Consumer<Consumer<Cat>>>>>>;
let consumerTarget262: Consumer<Consumer<Consumer<Consumer<Consumer<Consumer<Animal>>>>>> = consumer262;

const producer263: Producer<Producer<Producer<Producer<Producer<Producer<Producer<Cat>>>>>>> = {} as Producer<Producer<Producer<Producer<Producer<Producer<Producer<Cat>>>>>>>;
let producerTarget263: Producer<Producer<Producer<Producer<Producer<Producer<Producer<Animal>>>>>>> = producer263;

const consumer264: Consumer<Consumer<Consumer<Consumer<Consumer<Consumer<Consumer<Consumer<Cat>>>>>>>> = {} as Consumer<Consumer<Consumer<Consumer<Consumer<Consumer<Consumer<Consumer<Cat>>>>>>>>;
let consumerTarget264: Consumer<Consumer<Consumer<Consumer<Consumer<Consumer<Consumer<Consumer<Animal>>>>>>>> = consumer264;

const producer265: Producer<Cat> = {} as Producer<Cat>;
let producerTarget265: Producer<Animal> = producer265;

const consumer266: Consumer<Consumer<Cat>> = {} as Consumer<Consumer<Cat>>;
let consumerTarget266: Consumer<Consumer<Animal>> = consumer266;

const producer267: Producer<Producer<Producer<Cat>>> = {} as Producer<Producer<Producer<Cat>>>;
let producerTarget267: Producer<Producer<Producer<Animal>>> = producer267;

const consumer268: Consumer<Consumer<Consumer<Consumer<Cat>>>> = {} as Consumer<Consumer<Consumer<Consumer<Cat>>>>;
let consumerTarget268: Consumer<Consumer<Consumer<Consumer<Animal>>>> = consumer268;

const producer269: Producer<Producer<Producer<Producer<Producer<Cat>>>>> = {} as Producer<Producer<Producer<Producer<Producer<Cat>>>>>;
let producerTarget269: Producer<Producer<Producer<Producer<Producer<Animal>>>>> = producer269;

const consumer270: Consumer<Consumer<Consumer<Consumer<Consumer<Consumer<Cat>>>>>> = {} as Consumer<Consumer<Consumer<Consumer<Consumer<Consumer<Cat>>>>>>;
let consumerTarget270: Consumer<Consumer<Consumer<Consumer<Consumer<Consumer<Animal>>>>>> = consumer270;

const producer271: Producer<Producer<Producer<Producer<Producer<Producer<Producer<Cat>>>>>>> = {} as Producer<Producer<Producer<Producer<Producer<Producer<Producer<Cat>>>>>>>;
let producerTarget271: Producer<Producer<Producer<Producer<Producer<Producer<Producer<Animal>>>>>>> = producer271;

const consumer272: Consumer<Consumer<Consumer<Consumer<Consumer<Consumer<Consumer<Consumer<Cat>>>>>>>> = {} as Consumer<Consumer<Consumer<Consumer<Consumer<Consumer<Consumer<Consumer<Cat>>>>>>>>;
let consumerTarget272: Consumer<Consumer<Consumer<Consumer<Consumer<Consumer<Consumer<Consumer<Animal>>>>>>>> = consumer272;

const producer273: Producer<Cat> = {} as Producer<Cat>;
let producerTarget273: Producer<Animal> = producer273;

const consumer274: Consumer<Consumer<Cat>> = {} as Consumer<Consumer<Cat>>;
let consumerTarget274: Consumer<Consumer<Animal>> = consumer274;

const producer275: Producer<Producer<Producer<Cat>>> = {} as Producer<Producer<Producer<Cat>>>;
let producerTarget275: Producer<Producer<Producer<Animal>>> = producer275;

const consumer276: Consumer<Consumer<Consumer<Consumer<Cat>>>> = {} as Consumer<Consumer<Consumer<Consumer<Cat>>>>;
let consumerTarget276: Consumer<Consumer<Consumer<Consumer<Animal>>>> = consumer276;

const producer277: Producer<Producer<Producer<Producer<Producer<Cat>>>>> = {} as Producer<Producer<Producer<Producer<Producer<Cat>>>>>;
let producerTarget277: Producer<Producer<Producer<Producer<Producer<Animal>>>>> = producer277;

const consumer278: Consumer<Consumer<Consumer<Consumer<Consumer<Consumer<Cat>>>>>> = {} as Consumer<Consumer<Consumer<Consumer<Consumer<Consumer<Cat>>>>>>;
let consumerTarget278: Consumer<Consumer<Consumer<Consumer<Consumer<Consumer<Animal>>>>>> = consumer278;

const producer279: Producer<Producer<Producer<Producer<Producer<Producer<Producer<Cat>>>>>>> = {} as Producer<Producer<Producer<Producer<Producer<Producer<Producer<Cat>>>>>>>;
let producerTarget279: Producer<Producer<Producer<Producer<Producer<Producer<Producer<Animal>>>>>>> = producer279;

const consumer280: Consumer<Consumer<Consumer<Consumer<Consumer<Consumer<Consumer<Consumer<Cat>>>>>>>> = {} as Consumer<Consumer<Consumer<Consumer<Consumer<Consumer<Consumer<Consumer<Cat>>>>>>>>;
let consumerTarget280: Consumer<Consumer<Consumer<Consumer<Consumer<Consumer<Consumer<Consumer<Animal>>>>>>>> = consumer280;

const producer281: Producer<Cat> = {} as Producer<Cat>;
let producerTarget281: Producer<Animal> = producer281;

const consumer282: Consumer<Consumer<Cat>> = {} as Consumer<Consumer<Cat>>;
let consumerTarget282: Consumer<Consumer<Animal>> = consumer282;

const producer283: Producer<Producer<Producer<Cat>>> = {} as Producer<Producer<Producer<Cat>>>;
let producerTarget283: Producer<Producer<Producer<Animal>>> = producer283;

const consumer284: Consumer<Consumer<Consumer<Consumer<Cat>>>> = {} as Consumer<Consumer<Consumer<Consumer<Cat>>>>;
let consumerTarget284: Consumer<Consumer<Consumer<Consumer<Animal>>>> = consumer284;

const producer285: Producer<Producer<Producer<Producer<Producer<Cat>>>>> = {} as Producer<Producer<Producer<Producer<Producer<Cat>>>>>;
let producerTarget285: Producer<Producer<Producer<Producer<Producer<Animal>>>>> = producer285;

const consumer286: Consumer<Consumer<Consumer<Consumer<Consumer<Consumer<Cat>>>>>> = {} as Consumer<Consumer<Consumer<Consumer<Consumer<Consumer<Cat>>>>>>;
let consumerTarget286: Consumer<Consumer<Consumer<Consumer<Consumer<Consumer<Animal>>>>>> = consumer286;

const producer287: Producer<Producer<Producer<Producer<Producer<Producer<Producer<Cat>>>>>>> = {} as Producer<Producer<Producer<Producer<Producer<Producer<Producer<Cat>>>>>>>;
let producerTarget287: Producer<Producer<Producer<Producer<Producer<Producer<Producer<Animal>>>>>>> = producer287;

const consumer288: Consumer<Consumer<Consumer<Consumer<Consumer<Consumer<Consumer<Consumer<Cat>>>>>>>> = {} as Consumer<Consumer<Consumer<Consumer<Consumer<Consumer<Consumer<Consumer<Cat>>>>>>>>;
let consumerTarget288: Consumer<Consumer<Consumer<Consumer<Consumer<Consumer<Consumer<Consumer<Animal>>>>>>>> = consumer288;

const producer289: Producer<Cat> = {} as Producer<Cat>;
let producerTarget289: Producer<Animal> = producer289;

const consumer290: Consumer<Consumer<Cat>> = {} as Consumer<Consumer<Cat>>;
let consumerTarget290: Consumer<Consumer<Animal>> = consumer290;

const producer291: Producer<Producer<Producer<Cat>>> = {} as Producer<Producer<Producer<Cat>>>;
let producerTarget291: Producer<Producer<Producer<Animal>>> = producer291;

const consumer292: Consumer<Consumer<Consumer<Consumer<Cat>>>> = {} as Consumer<Consumer<Consumer<Consumer<Cat>>>>;
let consumerTarget292: Consumer<Consumer<Consumer<Consumer<Animal>>>> = consumer292;

const producer293: Producer<Producer<Producer<Producer<Producer<Cat>>>>> = {} as Producer<Producer<Producer<Producer<Producer<Cat>>>>>;
let producerTarget293: Producer<Producer<Producer<Producer<Producer<Animal>>>>> = producer293;

const consumer294: Consumer<Consumer<Consumer<Consumer<Consumer<Consumer<Cat>>>>>> = {} as Consumer<Consumer<Consumer<Consumer<Consumer<Consumer<Cat>>>>>>;
let consumerTarget294: Consumer<Consumer<Consumer<Consumer<Consumer<Consumer<Animal>>>>>> = consumer294;

const producer295: Producer<Producer<Producer<Producer<Producer<Producer<Producer<Cat>>>>>>> = {} as Producer<Producer<Producer<Producer<Producer<Producer<Producer<Cat>>>>>>>;
let producerTarget295: Producer<Producer<Producer<Producer<Producer<Producer<Producer<Animal>>>>>>> = producer295;

const consumer296: Consumer<Consumer<Consumer<Consumer<Consumer<Consumer<Consumer<Consumer<Cat>>>>>>>> = {} as Consumer<Consumer<Consumer<Consumer<Consumer<Consumer<Consumer<Consumer<Cat>>>>>>>>;
let consumerTarget296: Consumer<Consumer<Consumer<Consumer<Consumer<Consumer<Consumer<Consumer<Animal>>>>>>>> = consumer296;

const producer297: Producer<Cat> = {} as Producer<Cat>;
let producerTarget297: Producer<Animal> = producer297;

const consumer298: Consumer<Consumer<Cat>> = {} as Consumer<Consumer<Cat>>;
let consumerTarget298: Consumer<Consumer<Animal>> = consumer298;

const producer299: Producer<Producer<Producer<Cat>>> = {} as Producer<Producer<Producer<Cat>>>;
let producerTarget299: Producer<Producer<Producer<Animal>>> = producer299;

const consumer300: Consumer<Consumer<Consumer<Consumer<Cat>>>> = {} as Consumer<Consumer<Consumer<Consumer<Cat>>>>;
let consumerTarget300: Consumer<Consumer<Consumer<Consumer<Animal>>>> = consumer300;

export {};
