// 이 파일은 체커의 확장 진단과 트레이스로 느린 타입을 찾기 위한 벤치마크입니다.
// 일부러 검사 비용이 크게 들도록 만들었으며, 다음 화에서 이 타입을 더 빠르게 고칩니다.
// 실행: node episodes/s29-diagnostics/slow-reverse.ts
// 검사: npx tsc -p episodes/s29-diagnostics --extendedDiagnostics

// 재귀 호출의 결과 뒤에 Head를 스프레드로 다시 조립하므로 재귀 호출이 꼬리 위치에 있지 않습니다.
// 매 단계에서 점점 길어지는 튜플을 다시 만들기 때문에 원소 수에 대한 비용이 제곱에 가깝게 늘어납니다.
type ReverseSlow<T extends readonly unknown[]> =
  T extends readonly [infer Head, ...infer Tail]
    ? [...ReverseSlow<Tail>, Head]
    : [];

// 비꼬리 재귀인 ReverseSlow는 길이 50에서 TS2589(인스턴스화가 지나치게 깊음)에 걸립니다.
// 따라서 Base 39개와 꼬리 태그 1개를 합쳐 입력 길이를 정확히 40으로 맞춥니다.
// 깊이를 더 늘릴 수 없으므로 이 실습에서는 서로 다른 인스턴스화의 "개수"로 검사 비용을 만듭니다.
type Base = [
  0, 1, 2, 3, 4, 5, 6, 7, 8, 9,
  10, 11, 12, 13, 14, 15, 16, 17, 18, 19,
  20, 21, 22, 23, 24, 25, 26, 27, 28, 29,
  30, 31, 32, 33, 34, 35, 36, 37, 38,
];

// 태그 k를 앞이 아니라 꼬리에 붙여야 재귀 과정 전체가 매번 서로 다른 타입을 만납니다.
// [k, ...Base]처럼 앞에 붙이면 한 단계 뒤 곧바로 같은 Base로 수렴하여 캐시에 맞으므로
// 인스턴스화 비용이 거의 늘지 않습니다.
//
// 타입 별칭은 소비자가 없어도 선언만으로 계산됩니다. 따라서 Bench를 값이나 다른 타입에서
// 참조하지 않아도 아래 200개의 ReverseSlow 인스턴스화에 드는 검사 시간은 그대로 발생합니다.
type Bench = [
  ReverseSlow<[...Base, 0]>, ReverseSlow<[...Base, 1]>, ReverseSlow<[...Base, 2]>, ReverseSlow<[...Base, 3]>, ReverseSlow<[...Base, 4]>,
  ReverseSlow<[...Base, 5]>, ReverseSlow<[...Base, 6]>, ReverseSlow<[...Base, 7]>, ReverseSlow<[...Base, 8]>, ReverseSlow<[...Base, 9]>,
  ReverseSlow<[...Base, 10]>, ReverseSlow<[...Base, 11]>, ReverseSlow<[...Base, 12]>, ReverseSlow<[...Base, 13]>, ReverseSlow<[...Base, 14]>,
  ReverseSlow<[...Base, 15]>, ReverseSlow<[...Base, 16]>, ReverseSlow<[...Base, 17]>, ReverseSlow<[...Base, 18]>, ReverseSlow<[...Base, 19]>,
  ReverseSlow<[...Base, 20]>, ReverseSlow<[...Base, 21]>, ReverseSlow<[...Base, 22]>, ReverseSlow<[...Base, 23]>, ReverseSlow<[...Base, 24]>,
  ReverseSlow<[...Base, 25]>, ReverseSlow<[...Base, 26]>, ReverseSlow<[...Base, 27]>, ReverseSlow<[...Base, 28]>, ReverseSlow<[...Base, 29]>,
  ReverseSlow<[...Base, 30]>, ReverseSlow<[...Base, 31]>, ReverseSlow<[...Base, 32]>, ReverseSlow<[...Base, 33]>, ReverseSlow<[...Base, 34]>,
  ReverseSlow<[...Base, 35]>, ReverseSlow<[...Base, 36]>, ReverseSlow<[...Base, 37]>, ReverseSlow<[...Base, 38]>, ReverseSlow<[...Base, 39]>,
  ReverseSlow<[...Base, 40]>, ReverseSlow<[...Base, 41]>, ReverseSlow<[...Base, 42]>, ReverseSlow<[...Base, 43]>, ReverseSlow<[...Base, 44]>,
  ReverseSlow<[...Base, 45]>, ReverseSlow<[...Base, 46]>, ReverseSlow<[...Base, 47]>, ReverseSlow<[...Base, 48]>, ReverseSlow<[...Base, 49]>,
  ReverseSlow<[...Base, 50]>, ReverseSlow<[...Base, 51]>, ReverseSlow<[...Base, 52]>, ReverseSlow<[...Base, 53]>, ReverseSlow<[...Base, 54]>,
  ReverseSlow<[...Base, 55]>, ReverseSlow<[...Base, 56]>, ReverseSlow<[...Base, 57]>, ReverseSlow<[...Base, 58]>, ReverseSlow<[...Base, 59]>,
  ReverseSlow<[...Base, 60]>, ReverseSlow<[...Base, 61]>, ReverseSlow<[...Base, 62]>, ReverseSlow<[...Base, 63]>, ReverseSlow<[...Base, 64]>,
  ReverseSlow<[...Base, 65]>, ReverseSlow<[...Base, 66]>, ReverseSlow<[...Base, 67]>, ReverseSlow<[...Base, 68]>, ReverseSlow<[...Base, 69]>,
  ReverseSlow<[...Base, 70]>, ReverseSlow<[...Base, 71]>, ReverseSlow<[...Base, 72]>, ReverseSlow<[...Base, 73]>, ReverseSlow<[...Base, 74]>,
  ReverseSlow<[...Base, 75]>, ReverseSlow<[...Base, 76]>, ReverseSlow<[...Base, 77]>, ReverseSlow<[...Base, 78]>, ReverseSlow<[...Base, 79]>,
  ReverseSlow<[...Base, 80]>, ReverseSlow<[...Base, 81]>, ReverseSlow<[...Base, 82]>, ReverseSlow<[...Base, 83]>, ReverseSlow<[...Base, 84]>,
  ReverseSlow<[...Base, 85]>, ReverseSlow<[...Base, 86]>, ReverseSlow<[...Base, 87]>, ReverseSlow<[...Base, 88]>, ReverseSlow<[...Base, 89]>,
  ReverseSlow<[...Base, 90]>, ReverseSlow<[...Base, 91]>, ReverseSlow<[...Base, 92]>, ReverseSlow<[...Base, 93]>, ReverseSlow<[...Base, 94]>,
  ReverseSlow<[...Base, 95]>, ReverseSlow<[...Base, 96]>, ReverseSlow<[...Base, 97]>, ReverseSlow<[...Base, 98]>, ReverseSlow<[...Base, 99]>,
  ReverseSlow<[...Base, 100]>, ReverseSlow<[...Base, 101]>, ReverseSlow<[...Base, 102]>, ReverseSlow<[...Base, 103]>, ReverseSlow<[...Base, 104]>,
  ReverseSlow<[...Base, 105]>, ReverseSlow<[...Base, 106]>, ReverseSlow<[...Base, 107]>, ReverseSlow<[...Base, 108]>, ReverseSlow<[...Base, 109]>,
  ReverseSlow<[...Base, 110]>, ReverseSlow<[...Base, 111]>, ReverseSlow<[...Base, 112]>, ReverseSlow<[...Base, 113]>, ReverseSlow<[...Base, 114]>,
  ReverseSlow<[...Base, 115]>, ReverseSlow<[...Base, 116]>, ReverseSlow<[...Base, 117]>, ReverseSlow<[...Base, 118]>, ReverseSlow<[...Base, 119]>,
  ReverseSlow<[...Base, 120]>, ReverseSlow<[...Base, 121]>, ReverseSlow<[...Base, 122]>, ReverseSlow<[...Base, 123]>, ReverseSlow<[...Base, 124]>,
  ReverseSlow<[...Base, 125]>, ReverseSlow<[...Base, 126]>, ReverseSlow<[...Base, 127]>, ReverseSlow<[...Base, 128]>, ReverseSlow<[...Base, 129]>,
  ReverseSlow<[...Base, 130]>, ReverseSlow<[...Base, 131]>, ReverseSlow<[...Base, 132]>, ReverseSlow<[...Base, 133]>, ReverseSlow<[...Base, 134]>,
  ReverseSlow<[...Base, 135]>, ReverseSlow<[...Base, 136]>, ReverseSlow<[...Base, 137]>, ReverseSlow<[...Base, 138]>, ReverseSlow<[...Base, 139]>,
  ReverseSlow<[...Base, 140]>, ReverseSlow<[...Base, 141]>, ReverseSlow<[...Base, 142]>, ReverseSlow<[...Base, 143]>, ReverseSlow<[...Base, 144]>,
  ReverseSlow<[...Base, 145]>, ReverseSlow<[...Base, 146]>, ReverseSlow<[...Base, 147]>, ReverseSlow<[...Base, 148]>, ReverseSlow<[...Base, 149]>,
  ReverseSlow<[...Base, 150]>, ReverseSlow<[...Base, 151]>, ReverseSlow<[...Base, 152]>, ReverseSlow<[...Base, 153]>, ReverseSlow<[...Base, 154]>,
  ReverseSlow<[...Base, 155]>, ReverseSlow<[...Base, 156]>, ReverseSlow<[...Base, 157]>, ReverseSlow<[...Base, 158]>, ReverseSlow<[...Base, 159]>,
  ReverseSlow<[...Base, 160]>, ReverseSlow<[...Base, 161]>, ReverseSlow<[...Base, 162]>, ReverseSlow<[...Base, 163]>, ReverseSlow<[...Base, 164]>,
  ReverseSlow<[...Base, 165]>, ReverseSlow<[...Base, 166]>, ReverseSlow<[...Base, 167]>, ReverseSlow<[...Base, 168]>, ReverseSlow<[...Base, 169]>,
  ReverseSlow<[...Base, 170]>, ReverseSlow<[...Base, 171]>, ReverseSlow<[...Base, 172]>, ReverseSlow<[...Base, 173]>, ReverseSlow<[...Base, 174]>,
  ReverseSlow<[...Base, 175]>, ReverseSlow<[...Base, 176]>, ReverseSlow<[...Base, 177]>, ReverseSlow<[...Base, 178]>, ReverseSlow<[...Base, 179]>,
  ReverseSlow<[...Base, 180]>, ReverseSlow<[...Base, 181]>, ReverseSlow<[...Base, 182]>, ReverseSlow<[...Base, 183]>, ReverseSlow<[...Base, 184]>,
  ReverseSlow<[...Base, 185]>, ReverseSlow<[...Base, 186]>, ReverseSlow<[...Base, 187]>, ReverseSlow<[...Base, 188]>, ReverseSlow<[...Base, 189]>,
  ReverseSlow<[...Base, 190]>, ReverseSlow<[...Base, 191]>, ReverseSlow<[...Base, 192]>, ReverseSlow<[...Base, 193]>, ReverseSlow<[...Base, 194]>,
  ReverseSlow<[...Base, 195]>, ReverseSlow<[...Base, 196]>, ReverseSlow<[...Base, 197]>, ReverseSlow<[...Base, 198]>, ReverseSlow<[...Base, 199]>,
];

console.log("진단용 느린 타입 벤치마크 파일을 실행했습니다.");

