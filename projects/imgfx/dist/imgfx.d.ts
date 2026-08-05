export type PixelFormat = "RGBA8" | "RGB8" | "Gray8";
export interface ImageBuffer<Format extends PixelFormat, W extends number = number, H extends number = number> {
    readonly data: Uint8ClampedArray;
    readonly width: W;
    readonly height: H;
    /** 타입에만 존재하는 표시. 실제 객체엔 절대 채우지 않는다 — 그래서 팬텀(phantom)이다. */
    readonly __format?: Format;
}
export declare function makeImageBuffer<Format extends PixelFormat, W extends number = number, H extends number = number>(data: Uint8ClampedArray, width: W, height: H): ImageBuffer<Format, W, H>;
export declare const rgba: ImageBuffer<"RGBA8">;
export declare const BYTES_PER_PIXEL: {
    readonly RGBA8: 4;
    readonly RGB8: 3;
    readonly Gray8: 1;
};
export type BytesPerPixelOf<Format extends PixelFormat> = (typeof BYTES_PER_PIXEL)[Format];
export declare function bytesPerPixel<Format extends PixelFormat>(format: Format): BytesPerPixelOf<Format>;
export declare const rgbaSize: 4;
export declare const graySize: 1;
export declare function requiresRgba(image: ImageBuffer<"RGBA8">): void;
export declare const gray: ImageBuffer<"Gray8">;
export declare function observePhantomMismatch(): void;
export declare const INPUT_URL: URL;
export declare const OUTPUT_URL: URL;
export type OddSquareLength = 1 | 9 | 25 | 49;
export interface KernelShape<W extends readonly number[]> {
    readonly weights: W;
    readonly side: number;
    /** 가중치 합으로 나눈다. 박스는 3×3이면 9·5×5면 25, 가우시안은 16, 샤픈은 1이다. */
    readonly divisor: number;
}
export interface KernelLengthMismatch<Actual extends number> {
    readonly error: "KERNEL_LENGTH_NOT_ODD_SQUARE";
    readonly allowed: OddSquareLength;
    readonly actualLength: Actual;
}
export type Kernel<W extends readonly number[]> = W["length"] extends OddSquareLength ? KernelShape<W> : KernelLengthMismatch<W["length"] & number>;
export declare const boxKernel3x3: Kernel<readonly [1, 1, 1, 1, 1, 1, 1, 1, 1]>;
export declare function brokenKernelDemo(): void;
export interface Stage<Kind extends string, In extends PixelFormat, Out extends PixelFormat> {
    readonly kind: Kind;
    readonly in: In;
    readonly out: Out;
}
export interface GrayscaleStage extends PixelStage<"grayscale", "RGBA8", "Gray8"> {
}
export interface InvertStage extends PixelStage<"invert", "RGBA8", "RGBA8"> {
}
export interface BrightnessStage extends PixelStage<"brightness", "RGBA8", "RGBA8"> {
    readonly amount: number;
}
export interface ContrastStage extends PixelStage<"contrast", "RGBA8", "RGBA8"> {
    readonly amount: number;
}
export interface ThresholdStage extends PixelStage<"threshold", "RGBA8", "RGBA8"> {
    readonly level: number;
}
export interface SaturateStage extends PixelStage<"saturate", "RGBA8", "RGBA8"> {
    readonly factor: number;
}
export interface ConvolveStage extends PixelStage<"convolve", "RGBA8", "RGBA8"> {
    readonly effect: "box" | "gaussian" | "sharpen";
    readonly side: number;
    readonly edge: EdgePolicy;
}
export type AnyStage = InvertStage | GrayscaleStage | BrightnessStage | ContrastStage | ThresholdStage | SaturateStage | ConvolveStage;
export declare function invertStage(): InvertStage;
export declare function grayscaleStage(): GrayscaleStage;
export declare function brightnessStage(amount: number): BrightnessStage;
export declare function contrastStage(amount: number): ContrastStage;
export declare function thresholdStage(level: number): ThresholdStage;
export declare function saturateStage(factor: number): SaturateStage;
export declare function boxBlurStage(size: number, edge?: EdgePolicy): ConvolveStage;
export declare function gaussianBlurStage(edge?: EdgePolicy): ConvolveStage;
export declare function sharpenStage(edge?: EdgePolicy): ConvolveStage;
export declare function rejectedStageDemo(): string;
export declare const plan: readonly AnyStage[];
export declare function describeStage(stage: AnyStage): string;
export interface FlipStage extends PixelStage<"flip", "RGBA8", "RGBA8"> {
    readonly direction: Direction;
}
export type AnyStageWithFlip = AnyStage | FlipStage;
export declare function flipStage(direction: Direction): FlipStage;
export declare function flipHorizontalStage(): FlipStage;
export declare function flipVerticalStage(): FlipStage;
export declare function describeStageMissingFlip(stage: AnyStageWithFlip): string;
export declare function describeStageWithFlip(stage: AnyStageWithFlip): string;
export declare function pipeline<Stages extends readonly [AnyStage, ...AnyStage[]]>(...stages: Stages): PipelineResult<Stages>;
export declare const previewPipeline: {
    readonly in: "RGBA8";
    readonly out: "Gray8";
};
export declare function spreadPlanArrayDemo(): void;
export interface PipelineMismatch<Expected extends PixelFormat, Failing extends AnyStage> {
    readonly error: "PIPELINE_FORMAT_MISMATCH";
    readonly expectedFormat: Expected;
    readonly failingStage: Failing["kind"];
}
export type CheckAdjacent<Stages extends readonly AnyStage[], Acc extends PixelFormat> = Stages extends readonly [infer Head extends AnyStage, ...infer Tail extends AnyStage[]] ? Head["in"] extends Acc ? CheckAdjacent<Tail, Head["out"]> : PipelineMismatch<Acc, Head> : Acc;
export type GoodResult = CheckAdjacent<[InvertStage, GrayscaleStage], "RGBA8">;
export type BadResult = CheckAdjacent<[GrayscaleStage, BrightnessStage], "RGBA8">;
export type PipelineResult<Stages extends readonly [AnyStage, ...AnyStage[]]> = CheckAdjacent<Stages, Stages[0]["in"]> extends PixelFormat ? {
    readonly in: Stages[0]["in"];
    readonly out: CheckAdjacent<Stages, Stages[0]["in"]>;
} : CheckAdjacent<Stages, Stages[0]["in"]>;
export interface RunnablePipeline<In extends PixelFormat, Out extends PixelFormat> {
    readonly in: In;
    readonly out: Out;
}
export declare function run<In extends PixelFormat, Out extends PixelFormat>(p: RunnablePipeline<In, Out>): void;
export declare function brokenPipelineDemo(): void;
export interface PixelTupleOf {
    RGBA8: readonly [number, number, number, number];
    RGB8: readonly [number, number, number];
    Gray8: readonly [number];
}
export type Pixel<Format extends PixelFormat> = PixelTupleOf[Format];
export type PixelKernel<In extends PixelFormat, Out extends PixelFormat> = (pixel: Pixel<In>) => Pixel<Out>;
export declare function mapPixels<In extends PixelFormat, Out extends PixelFormat>(source: ImageBuffer<In>, outFormat: Out, kernel: PixelKernel<In, Out>): ImageBuffer<Out>;
export declare function luma(r: number, g: number, b: number): number;
export declare const toGrayscale: PixelKernel<"RGBA8", "Gray8">;
export interface PixelStage<Kind extends string, In extends PixelFormat, Out extends PixelFormat> extends Stage<Kind, In, Out> {
    readonly run: (source: ImageBuffer<In>) => ImageBuffer<Out>;
}
export declare const invertPixel: PixelKernel<"RGBA8", "RGBA8">;
export declare const brightnessKernel: (delta: number) => PixelKernel<"RGBA8", "RGBA8">;
export declare const contrastKernel: (factor: number) => PixelKernel<"RGBA8", "RGBA8">;
export declare const thresholdKernel: (level: number) => PixelKernel<"RGBA8", "RGBA8">;
export declare const saturateKernel: (factor: number) => PixelKernel<"RGBA8", "RGBA8">;
export interface ScratchBuffer {
    readonly data: Float64Array;
    readonly width: number;
    readonly height: number;
}
export type ConvolveAxis = "row" | "column";
export type EdgePolicy = "clamp" | "wrap" | "mirror";
export type Direction = "horizontal" | "vertical";
export type Rotation = "90" | "180" | "270";
export interface RotateStage extends PixelStage<"rotate", "RGBA8", "RGBA8"> {
    readonly rotation: Rotation;
}
export type ExecutableStage = AnyStageWithFlip | RotateStage;
export declare function describeExecutableStage(stage: ExecutableStage): string;
export declare function planPipeline(stages: readonly ExecutableStage[]): string[];
export declare function resolveAxisCoord(v: number, limit: number, policy: EdgePolicy): number;
export declare function clampCoord(x: number, y: number, width: number, height: number, policy: EdgePolicy): readonly [number, number];
export declare function remapCoord(x: number, y: number, width: number, height: number, direction: Direction): readonly [number, number];
export declare function rotateCoord(ox: number, oy: number, sourceWidth: number, sourceHeight: number, rotation: Rotation): readonly [number, number];
export declare function pixelIndex(width: number, x: number, y: number): number;
export declare function readPixel(buf: ImageBuffer<"RGBA8">, x: number, y: number): Pixel<"RGBA8">;
export declare function copyPixel(source: ImageBuffer<"RGBA8">, sourceX: number, sourceY: number, target: Uint8ClampedArray, targetWidth: number, targetX: number, targetY: number): void;
export declare function rotatePixels(buf: ImageBuffer<"RGBA8">, rotation: Rotation): Uint8ClampedArray;
export declare function rotate90<W extends number, H extends number>(buf: ImageBuffer<"RGBA8", W, H>): ImageBuffer<"RGBA8", H, W>;
export declare function rotate270<W extends number, H extends number>(buf: ImageBuffer<"RGBA8", W, H>): ImageBuffer<"RGBA8", H, W>;
export declare function rotate180<W extends number, H extends number>(buf: ImageBuffer<"RGBA8", W, H>): ImageBuffer<"RGBA8", W, H>;
export declare function rotateStage(rotation: Rotation): RotateStage;
export interface StageRun {
    readonly image: ImageBuffer<PixelFormat>;
    /** 이웃 픽셀을 읽어 제자리에서 계산할 수 없는 스테이지인가. */
    readonly readsNeighbors: boolean;
}
export declare function runStage(source: ImageBuffer<"RGBA8">, stage: ExecutableStage): StageRun;
export declare let decodeCount: number;
export declare let encodeCount: number;
export declare let neighborStageCount: number;
export declare function resetPipelineCounts(): void;
export declare function runPipeline(pngBytes: Buffer, stages: readonly ExecutableStage[]): Buffer;
export declare function rejectedPipelineFormatDemo(pngBytes: Buffer): string;
export declare function runStageMissingConvolve(source: ImageBuffer<"RGBA8">, stage: ExecutableStage): StageRun;
export declare function sampleEdge(buf: ImageBuffer<"RGBA8">, x: number, y: number, policy: EdgePolicy): Pixel<"RGBA8">;
export declare let multiplyCount: number;
export declare function resetMultiplyCount(): void;
export declare function convolve1D(source: ImageBuffer<"RGBA8"> | ScratchBuffer, size: number, axis: ConvolveAxis, edge?: EdgePolicy): ScratchBuffer;
export declare function scratchToImage(scratch: ScratchBuffer): ImageBuffer<"RGBA8">;
export declare const boxKernel5x5: Kernel<readonly [
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    1
]>;
export declare function convolve(source: ImageBuffer<"RGBA8">, kernel: KernelShape<readonly number[]>, edge?: EdgePolicy): ImageBuffer<"RGBA8">;
export declare function boxBlurSeparable(buf: ImageBuffer<"RGBA8">, size: number, edge?: EdgePolicy): ImageBuffer<"RGBA8">;
export declare function maxChannelDifference(a: ImageBuffer<"RGBA8">, b: ImageBuffer<"RGBA8">): number;
export declare const gaussianKernel: Kernel<readonly [1, 2, 1, 2, 4, 2, 1, 2, 1]>;
export declare const sharpenKernel: Kernel<readonly [0, -1, 0, -1, 5, -1, 0, -1, 0]>;
export declare function inPlaceCorruptionDemo(): string;
export declare function clampingContrast(): string;
export declare function readPng(path: string | URL): import("pngjs").PNGWithMetadata;
export declare function writePng(path: string | URL, width: number, height: number, data: Uint8Array | Uint8ClampedArray): void;
