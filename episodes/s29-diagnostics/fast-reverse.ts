// 꼬리재귀 누산자로 Reverse를 재작성했을 때 무엇이 달라지는지 측정하는 벤치마크입니다.
// 다음 두 명령을 같은 환경에서 실행하여 느린 버전과 빠른 버전의 확장 진단을 비교합니다.
// npx tsc --noEmit --extendedDiagnostics --ignoreConfig --strict episodes/s29-diagnostics/slow-reverse.ts
// npx tsc --noEmit --extendedDiagnostics --ignoreConfig --strict episodes/s29-diagnostics/fast-reverse.ts
//
// TypeScript 7에서는 파일을 명령줄에 직접 적으면 프로젝트의 tsconfig.json을 읽지 않습니다.
// 이때 --ignoreConfig 없이 실행하면 error TS5112가 나므로 명시적으로 --ignoreConfig를 붙이고,
// 저장소의 엄격한 검사 조건도 재현하도록 --strict를 함께 지정합니다.
// 깊이 천장 실험은 tail-recursion-ceiling.ts에 따로 두고, 이 파일은 두 형태의 비용만 나란히 재기 위해 느린 벤치와 같은 모양을 유지합니다.

// 결과를 반환하기 직전에 다시 조립하지 않고, 지금까지 뒤집은 결과를 Acc에 미리 쌓습니다.
// 따라서 재귀 호출 자체가 조건부 타입의 마지막 자리에 놓이는 꼬리재귀 형태가 됩니다.
type ReverseFast<
  T extends readonly unknown[],
  Acc extends readonly unknown[] = [],
> = T extends readonly [infer Head, ...infer Tail]
  ? ReverseFast<Tail, [Head, ...Acc]>
  : Acc;

// 느린 벤치와 똑같이 입력 길이를 40으로 맞추기 위한 39개짜리 공통 튜플입니다.
// 깊이 한계와 별개로, 아래에서는 서로 다른 호출 200개의 인스턴스화 비용을 비교합니다.
type Base = [
  0, 1, 2, 3, 4, 5, 6, 7, 8, 9,
  10, 11, 12, 13, 14, 15, 16, 17, 18, 19,
  20, 21, 22, 23, 24, 25, 26, 27, 28, 29,
  30, 31, 32, 33, 34, 35, 36, 37, 38,
];

// 태그를 앞이 아니라 꼬리에 붙여야 재귀 과정 전체가 매번 서로 다른 타입을 만나 캐시에 맞지 않습니다.
// [태그, ...Base]처럼 앞에 붙이면 한 단계 뒤 같은 Base로 수렴하여 비용이 거의 늘지 않습니다.
//
// 타입 별칭은 소비자가 없어도 선언만으로 계산되므로 FastBench를 다른 곳에서 사용하지 않아도
// 아래 200개의 ReverseFast 호출에 드는 인스턴스화 비용은 그대로 발생합니다.
//
// 이 벤치의 인스턴스화 수는 slow-reverse.ts와 사실상 같습니다. 꼬리재귀 누산자는 깊이 천장을
// 풀어 주지만 이 모양의 비용을 줄이지는 않습니다. 위의 두 명령으로 직접 재어 비교하십시오.
type FastBench = [
  ReverseFast<[...Base, 0]>, ReverseFast<[...Base, 1]>, ReverseFast<[...Base, 2]>, ReverseFast<[...Base, 3]>, ReverseFast<[...Base, 4]>,
  ReverseFast<[...Base, 5]>, ReverseFast<[...Base, 6]>, ReverseFast<[...Base, 7]>, ReverseFast<[...Base, 8]>, ReverseFast<[...Base, 9]>,
  ReverseFast<[...Base, 10]>, ReverseFast<[...Base, 11]>, ReverseFast<[...Base, 12]>, ReverseFast<[...Base, 13]>, ReverseFast<[...Base, 14]>,
  ReverseFast<[...Base, 15]>, ReverseFast<[...Base, 16]>, ReverseFast<[...Base, 17]>, ReverseFast<[...Base, 18]>, ReverseFast<[...Base, 19]>,
  ReverseFast<[...Base, 20]>, ReverseFast<[...Base, 21]>, ReverseFast<[...Base, 22]>, ReverseFast<[...Base, 23]>, ReverseFast<[...Base, 24]>,
  ReverseFast<[...Base, 25]>, ReverseFast<[...Base, 26]>, ReverseFast<[...Base, 27]>, ReverseFast<[...Base, 28]>, ReverseFast<[...Base, 29]>,
  ReverseFast<[...Base, 30]>, ReverseFast<[...Base, 31]>, ReverseFast<[...Base, 32]>, ReverseFast<[...Base, 33]>, ReverseFast<[...Base, 34]>,
  ReverseFast<[...Base, 35]>, ReverseFast<[...Base, 36]>, ReverseFast<[...Base, 37]>, ReverseFast<[...Base, 38]>, ReverseFast<[...Base, 39]>,
  ReverseFast<[...Base, 40]>, ReverseFast<[...Base, 41]>, ReverseFast<[...Base, 42]>, ReverseFast<[...Base, 43]>, ReverseFast<[...Base, 44]>,
  ReverseFast<[...Base, 45]>, ReverseFast<[...Base, 46]>, ReverseFast<[...Base, 47]>, ReverseFast<[...Base, 48]>, ReverseFast<[...Base, 49]>,
  ReverseFast<[...Base, 50]>, ReverseFast<[...Base, 51]>, ReverseFast<[...Base, 52]>, ReverseFast<[...Base, 53]>, ReverseFast<[...Base, 54]>,
  ReverseFast<[...Base, 55]>, ReverseFast<[...Base, 56]>, ReverseFast<[...Base, 57]>, ReverseFast<[...Base, 58]>, ReverseFast<[...Base, 59]>,
  ReverseFast<[...Base, 60]>, ReverseFast<[...Base, 61]>, ReverseFast<[...Base, 62]>, ReverseFast<[...Base, 63]>, ReverseFast<[...Base, 64]>,
  ReverseFast<[...Base, 65]>, ReverseFast<[...Base, 66]>, ReverseFast<[...Base, 67]>, ReverseFast<[...Base, 68]>, ReverseFast<[...Base, 69]>,
  ReverseFast<[...Base, 70]>, ReverseFast<[...Base, 71]>, ReverseFast<[...Base, 72]>, ReverseFast<[...Base, 73]>, ReverseFast<[...Base, 74]>,
  ReverseFast<[...Base, 75]>, ReverseFast<[...Base, 76]>, ReverseFast<[...Base, 77]>, ReverseFast<[...Base, 78]>, ReverseFast<[...Base, 79]>,
  ReverseFast<[...Base, 80]>, ReverseFast<[...Base, 81]>, ReverseFast<[...Base, 82]>, ReverseFast<[...Base, 83]>, ReverseFast<[...Base, 84]>,
  ReverseFast<[...Base, 85]>, ReverseFast<[...Base, 86]>, ReverseFast<[...Base, 87]>, ReverseFast<[...Base, 88]>, ReverseFast<[...Base, 89]>,
  ReverseFast<[...Base, 90]>, ReverseFast<[...Base, 91]>, ReverseFast<[...Base, 92]>, ReverseFast<[...Base, 93]>, ReverseFast<[...Base, 94]>,
  ReverseFast<[...Base, 95]>, ReverseFast<[...Base, 96]>, ReverseFast<[...Base, 97]>, ReverseFast<[...Base, 98]>, ReverseFast<[...Base, 99]>,
  ReverseFast<[...Base, 100]>, ReverseFast<[...Base, 101]>, ReverseFast<[...Base, 102]>, ReverseFast<[...Base, 103]>, ReverseFast<[...Base, 104]>,
  ReverseFast<[...Base, 105]>, ReverseFast<[...Base, 106]>, ReverseFast<[...Base, 107]>, ReverseFast<[...Base, 108]>, ReverseFast<[...Base, 109]>,
  ReverseFast<[...Base, 110]>, ReverseFast<[...Base, 111]>, ReverseFast<[...Base, 112]>, ReverseFast<[...Base, 113]>, ReverseFast<[...Base, 114]>,
  ReverseFast<[...Base, 115]>, ReverseFast<[...Base, 116]>, ReverseFast<[...Base, 117]>, ReverseFast<[...Base, 118]>, ReverseFast<[...Base, 119]>,
  ReverseFast<[...Base, 120]>, ReverseFast<[...Base, 121]>, ReverseFast<[...Base, 122]>, ReverseFast<[...Base, 123]>, ReverseFast<[...Base, 124]>,
  ReverseFast<[...Base, 125]>, ReverseFast<[...Base, 126]>, ReverseFast<[...Base, 127]>, ReverseFast<[...Base, 128]>, ReverseFast<[...Base, 129]>,
  ReverseFast<[...Base, 130]>, ReverseFast<[...Base, 131]>, ReverseFast<[...Base, 132]>, ReverseFast<[...Base, 133]>, ReverseFast<[...Base, 134]>,
  ReverseFast<[...Base, 135]>, ReverseFast<[...Base, 136]>, ReverseFast<[...Base, 137]>, ReverseFast<[...Base, 138]>, ReverseFast<[...Base, 139]>,
  ReverseFast<[...Base, 140]>, ReverseFast<[...Base, 141]>, ReverseFast<[...Base, 142]>, ReverseFast<[...Base, 143]>, ReverseFast<[...Base, 144]>,
  ReverseFast<[...Base, 145]>, ReverseFast<[...Base, 146]>, ReverseFast<[...Base, 147]>, ReverseFast<[...Base, 148]>, ReverseFast<[...Base, 149]>,
  ReverseFast<[...Base, 150]>, ReverseFast<[...Base, 151]>, ReverseFast<[...Base, 152]>, ReverseFast<[...Base, 153]>, ReverseFast<[...Base, 154]>,
  ReverseFast<[...Base, 155]>, ReverseFast<[...Base, 156]>, ReverseFast<[...Base, 157]>, ReverseFast<[...Base, 158]>, ReverseFast<[...Base, 159]>,
  ReverseFast<[...Base, 160]>, ReverseFast<[...Base, 161]>, ReverseFast<[...Base, 162]>, ReverseFast<[...Base, 163]>, ReverseFast<[...Base, 164]>,
  ReverseFast<[...Base, 165]>, ReverseFast<[...Base, 166]>, ReverseFast<[...Base, 167]>, ReverseFast<[...Base, 168]>, ReverseFast<[...Base, 169]>,
  ReverseFast<[...Base, 170]>, ReverseFast<[...Base, 171]>, ReverseFast<[...Base, 172]>, ReverseFast<[...Base, 173]>, ReverseFast<[...Base, 174]>,
  ReverseFast<[...Base, 175]>, ReverseFast<[...Base, 176]>, ReverseFast<[...Base, 177]>, ReverseFast<[...Base, 178]>, ReverseFast<[...Base, 179]>,
  ReverseFast<[...Base, 180]>, ReverseFast<[...Base, 181]>, ReverseFast<[...Base, 182]>, ReverseFast<[...Base, 183]>, ReverseFast<[...Base, 184]>,
  ReverseFast<[...Base, 185]>, ReverseFast<[...Base, 186]>, ReverseFast<[...Base, 187]>, ReverseFast<[...Base, 188]>, ReverseFast<[...Base, 189]>,
  ReverseFast<[...Base, 190]>, ReverseFast<[...Base, 191]>, ReverseFast<[...Base, 192]>, ReverseFast<[...Base, 193]>, ReverseFast<[...Base, 194]>,
  ReverseFast<[...Base, 195]>, ReverseFast<[...Base, 196]>, ReverseFast<[...Base, 197]>, ReverseFast<[...Base, 198]>, ReverseFast<[...Base, 199]>,
];

// 이 파일의 비교용 타입 이름이 다른 화의 전역 타입 이름과 충돌하지 않도록 모듈 범위로 격리합니다.
export {};

console.log("꼬리재귀 누산자로 재작성한 벤치마크 파일을 실행했습니다.");
