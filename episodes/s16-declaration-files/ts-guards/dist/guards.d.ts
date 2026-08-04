import type { GuardResult } from "./types.js";
export declare function isNonEmptyString(value: unknown): value is string;
export declare function assertDefined<T>(value: T, message?: string): asserts value is NonNullable<T>;
export declare function checkGuard(value: unknown): GuardResult;
