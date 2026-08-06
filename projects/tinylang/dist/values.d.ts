export type Value = {
    readonly kind: "number";
    readonly value: number;
} | {
    readonly kind: "string";
    readonly value: string;
} | {
    readonly kind: "boolean";
    readonly value: boolean;
};
export type ValueKind = Value["kind"];
