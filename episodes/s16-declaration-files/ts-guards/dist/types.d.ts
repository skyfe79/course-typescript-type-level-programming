export type GuardResult = {
    ok: true;
    value: string;
} | {
    ok: false;
    reason: string;
};
