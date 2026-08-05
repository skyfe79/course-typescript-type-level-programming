// 인터섹션 타입 별칭을 이름 있는 interface로 재작성했을 때의 캐싱 효과를 보는 전용 벤치입니다.
// 측정: npx tsc --noEmit --extendedDiagnostics --ignoreConfig --strict episodes/s29-diagnostics/interface-cache.ts
//
// 확인하려면 아래의 interface MergedRow 선언을 주석 처리하고, 바로 위에서 주석 처리된
// type MergedRow 인터섹션 별칭을 풀어 같은 명령을 다시 실행합니다. 인터섹션 별칭에서는
// 참조 개수만큼 인스턴스화가 늘지만, interface에서는 참조가 많아져도 그 비용이 늘지 않습니다.
//
// 이 데모를 fast-reverse.ts와 분리한 이유는 그 파일의 50만이 넘는 인스턴스화에 섞이면
// 여기서 관찰할 1,000 안팎의 차이가 진단 숫자에 묻히기 때문입니다. 반드시 이 파일만 따로 잽니다.

// 합쳐지는 구조의 멤버가 충분히 많아야 체커가 구조를 실제로 펼치고 비교하는 상황을 재현할 수 있습니다.
// 그래서 값 하나만 담는 예제 대신 감사 필드와 소프트 삭제 필드를 각각 정확히 40개 둡니다.
interface BaseRow<T> {
  id: string;
  value: T;
}

interface AuditFields<T> {
  a0: T;
  a1: T;
  a2: T;
  a3: T;
  a4: T;
  a5: T;
  a6: T;
  a7: T;
  a8: T;
  a9: T;
  a10: T;
  a11: T;
  a12: T;
  a13: T;
  a14: T;
  a15: T;
  a16: T;
  a17: T;
  a18: T;
  a19: T;
  a20: T;
  a21: T;
  a22: T;
  a23: T;
  a24: T;
  a25: T;
  a26: T;
  a27: T;
  a28: T;
  a29: T;
  a30: T;
  a31: T;
  a32: T;
  a33: T;
  a34: T;
  a35: T;
  a36: T;
  a37: T;
  a38: T;
  a39: T;
}

interface SoftDeleteFields<T> {
  d0: T;
  d1: T;
  d2: T;
  d3: T;
  d4: T;
  d5: T;
  d6: T;
  d7: T;
  d8: T;
  d9: T;
  d10: T;
  d11: T;
  d12: T;
  d13: T;
  d14: T;
  d15: T;
  d16: T;
  d17: T;
  d18: T;
  d19: T;
  d20: T;
  d21: T;
  d22: T;
  d23: T;
  d24: T;
  d25: T;
  d26: T;
  d27: T;
  d28: T;
  d29: T;
  d30: T;
  d31: T;
  d32: T;
  d33: T;
  d34: T;
  d35: T;
  d36: T;
  d37: T;
  d38: T;
  d39: T;
}

// 재작성 전 — 인터섹션 타입 별칭. 참조할 때마다 세 타입을 다시 펼쳐 합칩니다.
// type MergedRow<T> = BaseRow<T> & AuditFields<T> & SoftDeleteFields<T>;

// 재작성 후 — 이름 있는 interface. 참조가 몇 개든 인스턴스화가 늘지 않습니다.
interface MergedRow<T> extends BaseRow<T>, AuditFields<T>, SoftDeleteFields<T> {}

// 타입 인자를 모두 다르게 두어야 캐시에 맞지 않고, 각 항목의 참조 비용이 진단에 드러납니다.
// 아래 400개 참조를 유지한 채 MergedRow 선언 방식만 바꾸어 두 결과를 비교합니다.
type MergedBench = [
  MergedRow<[0]>, MergedRow<[1]>, MergedRow<[2]>, MergedRow<[3]>, MergedRow<[4]>,
  MergedRow<[5]>, MergedRow<[6]>, MergedRow<[7]>, MergedRow<[8]>, MergedRow<[9]>,
  MergedRow<[10]>, MergedRow<[11]>, MergedRow<[12]>, MergedRow<[13]>, MergedRow<[14]>,
  MergedRow<[15]>, MergedRow<[16]>, MergedRow<[17]>, MergedRow<[18]>, MergedRow<[19]>,
  MergedRow<[20]>, MergedRow<[21]>, MergedRow<[22]>, MergedRow<[23]>, MergedRow<[24]>,
  MergedRow<[25]>, MergedRow<[26]>, MergedRow<[27]>, MergedRow<[28]>, MergedRow<[29]>,
  MergedRow<[30]>, MergedRow<[31]>, MergedRow<[32]>, MergedRow<[33]>, MergedRow<[34]>,
  MergedRow<[35]>, MergedRow<[36]>, MergedRow<[37]>, MergedRow<[38]>, MergedRow<[39]>,
  MergedRow<[40]>, MergedRow<[41]>, MergedRow<[42]>, MergedRow<[43]>, MergedRow<[44]>,
  MergedRow<[45]>, MergedRow<[46]>, MergedRow<[47]>, MergedRow<[48]>, MergedRow<[49]>,
  MergedRow<[50]>, MergedRow<[51]>, MergedRow<[52]>, MergedRow<[53]>, MergedRow<[54]>,
  MergedRow<[55]>, MergedRow<[56]>, MergedRow<[57]>, MergedRow<[58]>, MergedRow<[59]>,
  MergedRow<[60]>, MergedRow<[61]>, MergedRow<[62]>, MergedRow<[63]>, MergedRow<[64]>,
  MergedRow<[65]>, MergedRow<[66]>, MergedRow<[67]>, MergedRow<[68]>, MergedRow<[69]>,
  MergedRow<[70]>, MergedRow<[71]>, MergedRow<[72]>, MergedRow<[73]>, MergedRow<[74]>,
  MergedRow<[75]>, MergedRow<[76]>, MergedRow<[77]>, MergedRow<[78]>, MergedRow<[79]>,
  MergedRow<[80]>, MergedRow<[81]>, MergedRow<[82]>, MergedRow<[83]>, MergedRow<[84]>,
  MergedRow<[85]>, MergedRow<[86]>, MergedRow<[87]>, MergedRow<[88]>, MergedRow<[89]>,
  MergedRow<[90]>, MergedRow<[91]>, MergedRow<[92]>, MergedRow<[93]>, MergedRow<[94]>,
  MergedRow<[95]>, MergedRow<[96]>, MergedRow<[97]>, MergedRow<[98]>, MergedRow<[99]>,
  MergedRow<[100]>, MergedRow<[101]>, MergedRow<[102]>, MergedRow<[103]>, MergedRow<[104]>,
  MergedRow<[105]>, MergedRow<[106]>, MergedRow<[107]>, MergedRow<[108]>, MergedRow<[109]>,
  MergedRow<[110]>, MergedRow<[111]>, MergedRow<[112]>, MergedRow<[113]>, MergedRow<[114]>,
  MergedRow<[115]>, MergedRow<[116]>, MergedRow<[117]>, MergedRow<[118]>, MergedRow<[119]>,
  MergedRow<[120]>, MergedRow<[121]>, MergedRow<[122]>, MergedRow<[123]>, MergedRow<[124]>,
  MergedRow<[125]>, MergedRow<[126]>, MergedRow<[127]>, MergedRow<[128]>, MergedRow<[129]>,
  MergedRow<[130]>, MergedRow<[131]>, MergedRow<[132]>, MergedRow<[133]>, MergedRow<[134]>,
  MergedRow<[135]>, MergedRow<[136]>, MergedRow<[137]>, MergedRow<[138]>, MergedRow<[139]>,
  MergedRow<[140]>, MergedRow<[141]>, MergedRow<[142]>, MergedRow<[143]>, MergedRow<[144]>,
  MergedRow<[145]>, MergedRow<[146]>, MergedRow<[147]>, MergedRow<[148]>, MergedRow<[149]>,
  MergedRow<[150]>, MergedRow<[151]>, MergedRow<[152]>, MergedRow<[153]>, MergedRow<[154]>,
  MergedRow<[155]>, MergedRow<[156]>, MergedRow<[157]>, MergedRow<[158]>, MergedRow<[159]>,
  MergedRow<[160]>, MergedRow<[161]>, MergedRow<[162]>, MergedRow<[163]>, MergedRow<[164]>,
  MergedRow<[165]>, MergedRow<[166]>, MergedRow<[167]>, MergedRow<[168]>, MergedRow<[169]>,
  MergedRow<[170]>, MergedRow<[171]>, MergedRow<[172]>, MergedRow<[173]>, MergedRow<[174]>,
  MergedRow<[175]>, MergedRow<[176]>, MergedRow<[177]>, MergedRow<[178]>, MergedRow<[179]>,
  MergedRow<[180]>, MergedRow<[181]>, MergedRow<[182]>, MergedRow<[183]>, MergedRow<[184]>,
  MergedRow<[185]>, MergedRow<[186]>, MergedRow<[187]>, MergedRow<[188]>, MergedRow<[189]>,
  MergedRow<[190]>, MergedRow<[191]>, MergedRow<[192]>, MergedRow<[193]>, MergedRow<[194]>,
  MergedRow<[195]>, MergedRow<[196]>, MergedRow<[197]>, MergedRow<[198]>, MergedRow<[199]>,
  MergedRow<[200]>, MergedRow<[201]>, MergedRow<[202]>, MergedRow<[203]>, MergedRow<[204]>,
  MergedRow<[205]>, MergedRow<[206]>, MergedRow<[207]>, MergedRow<[208]>, MergedRow<[209]>,
  MergedRow<[210]>, MergedRow<[211]>, MergedRow<[212]>, MergedRow<[213]>, MergedRow<[214]>,
  MergedRow<[215]>, MergedRow<[216]>, MergedRow<[217]>, MergedRow<[218]>, MergedRow<[219]>,
  MergedRow<[220]>, MergedRow<[221]>, MergedRow<[222]>, MergedRow<[223]>, MergedRow<[224]>,
  MergedRow<[225]>, MergedRow<[226]>, MergedRow<[227]>, MergedRow<[228]>, MergedRow<[229]>,
  MergedRow<[230]>, MergedRow<[231]>, MergedRow<[232]>, MergedRow<[233]>, MergedRow<[234]>,
  MergedRow<[235]>, MergedRow<[236]>, MergedRow<[237]>, MergedRow<[238]>, MergedRow<[239]>,
  MergedRow<[240]>, MergedRow<[241]>, MergedRow<[242]>, MergedRow<[243]>, MergedRow<[244]>,
  MergedRow<[245]>, MergedRow<[246]>, MergedRow<[247]>, MergedRow<[248]>, MergedRow<[249]>,
  MergedRow<[250]>, MergedRow<[251]>, MergedRow<[252]>, MergedRow<[253]>, MergedRow<[254]>,
  MergedRow<[255]>, MergedRow<[256]>, MergedRow<[257]>, MergedRow<[258]>, MergedRow<[259]>,
  MergedRow<[260]>, MergedRow<[261]>, MergedRow<[262]>, MergedRow<[263]>, MergedRow<[264]>,
  MergedRow<[265]>, MergedRow<[266]>, MergedRow<[267]>, MergedRow<[268]>, MergedRow<[269]>,
  MergedRow<[270]>, MergedRow<[271]>, MergedRow<[272]>, MergedRow<[273]>, MergedRow<[274]>,
  MergedRow<[275]>, MergedRow<[276]>, MergedRow<[277]>, MergedRow<[278]>, MergedRow<[279]>,
  MergedRow<[280]>, MergedRow<[281]>, MergedRow<[282]>, MergedRow<[283]>, MergedRow<[284]>,
  MergedRow<[285]>, MergedRow<[286]>, MergedRow<[287]>, MergedRow<[288]>, MergedRow<[289]>,
  MergedRow<[290]>, MergedRow<[291]>, MergedRow<[292]>, MergedRow<[293]>, MergedRow<[294]>,
  MergedRow<[295]>, MergedRow<[296]>, MergedRow<[297]>, MergedRow<[298]>, MergedRow<[299]>,
  MergedRow<[300]>, MergedRow<[301]>, MergedRow<[302]>, MergedRow<[303]>, MergedRow<[304]>,
  MergedRow<[305]>, MergedRow<[306]>, MergedRow<[307]>, MergedRow<[308]>, MergedRow<[309]>,
  MergedRow<[310]>, MergedRow<[311]>, MergedRow<[312]>, MergedRow<[313]>, MergedRow<[314]>,
  MergedRow<[315]>, MergedRow<[316]>, MergedRow<[317]>, MergedRow<[318]>, MergedRow<[319]>,
  MergedRow<[320]>, MergedRow<[321]>, MergedRow<[322]>, MergedRow<[323]>, MergedRow<[324]>,
  MergedRow<[325]>, MergedRow<[326]>, MergedRow<[327]>, MergedRow<[328]>, MergedRow<[329]>,
  MergedRow<[330]>, MergedRow<[331]>, MergedRow<[332]>, MergedRow<[333]>, MergedRow<[334]>,
  MergedRow<[335]>, MergedRow<[336]>, MergedRow<[337]>, MergedRow<[338]>, MergedRow<[339]>,
  MergedRow<[340]>, MergedRow<[341]>, MergedRow<[342]>, MergedRow<[343]>, MergedRow<[344]>,
  MergedRow<[345]>, MergedRow<[346]>, MergedRow<[347]>, MergedRow<[348]>, MergedRow<[349]>,
  MergedRow<[350]>, MergedRow<[351]>, MergedRow<[352]>, MergedRow<[353]>, MergedRow<[354]>,
  MergedRow<[355]>, MergedRow<[356]>, MergedRow<[357]>, MergedRow<[358]>, MergedRow<[359]>,
  MergedRow<[360]>, MergedRow<[361]>, MergedRow<[362]>, MergedRow<[363]>, MergedRow<[364]>,
  MergedRow<[365]>, MergedRow<[366]>, MergedRow<[367]>, MergedRow<[368]>, MergedRow<[369]>,
  MergedRow<[370]>, MergedRow<[371]>, MergedRow<[372]>, MergedRow<[373]>, MergedRow<[374]>,
  MergedRow<[375]>, MergedRow<[376]>, MergedRow<[377]>, MergedRow<[378]>, MergedRow<[379]>,
  MergedRow<[380]>, MergedRow<[381]>, MergedRow<[382]>, MergedRow<[383]>, MergedRow<[384]>,
  MergedRow<[385]>, MergedRow<[386]>, MergedRow<[387]>, MergedRow<[388]>, MergedRow<[389]>,
  MergedRow<[390]>, MergedRow<[391]>, MergedRow<[392]>, MergedRow<[393]>, MergedRow<[394]>,
  MergedRow<[395]>, MergedRow<[396]>, MergedRow<[397]>, MergedRow<[398]>, MergedRow<[399]>,
];

// 독립 실습 파일의 타입 이름이 저장소의 다른 전역 선언과 섞이지 않도록 모듈 범위로 격리합니다.
export {};

console.log("인터페이스 캐싱 비교 파일을 실행했습니다.");
