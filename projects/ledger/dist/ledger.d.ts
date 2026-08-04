declare const accountIdBrand: unique symbol;
type AccountId = string & {
    readonly [accountIdBrand]: true;
};
declare const isoDateBrand: unique symbol;
type IsoDate = string & {
    readonly [isoDateBrand]: true;
};
declare const moneyBrand: unique symbol;
type Money = {
    readonly amountMinor: number;
    readonly currency: "KRW";
} & {
    readonly [moneyBrand]: true;
};
type EntryLine = {
    readonly accountId: AccountId;
    readonly amount: Money;
    readonly side: "debit" | "credit";
};
type SimpleTransaction = {
    readonly kind: "simple";
    readonly id: string;
    readonly date: IsoDate;
    readonly memo: string;
    readonly debit: EntryLine;
    readonly credit: EntryLine;
};
type SplitTransaction = {
    readonly kind: "split";
    readonly id: string;
    readonly date: IsoDate;
    readonly memo: string;
    readonly debits: readonly EntryLine[];
    readonly credits: readonly EntryLine[];
};
type RefundTransaction = {
    readonly kind: "refund";
    readonly id: string;
    readonly date: IsoDate;
    readonly memo: string;
    readonly refundOf: string;
    readonly debit: EntryLine;
    readonly credit: EntryLine;
};
type Transaction = SimpleTransaction | SplitTransaction | RefundTransaction;
type Result<T> = {
    readonly ok: true;
    readonly value: T;
} | {
    readonly ok: false;
    readonly error: string;
};
type RawTransaction = {
    kind?: unknown;
    id?: unknown;
    date?: unknown;
    memo?: unknown;
    refundOf?: unknown;
    debit?: unknown;
    credit?: unknown;
};
declare function parseTransaction(raw: RawTransaction): Result<Transaction>;
declare function parseJournal(raw: unknown): Result<readonly Transaction[]>;
type Command = {
    readonly kind: "appendTransaction";
    readonly transaction: Transaction;
} | {
    readonly kind: "printReport";
    readonly report: string;
} | {
    readonly kind: "exit";
    readonly code: 0 | 1;
};
declare function decide(existing: readonly Transaction[], input: Result<Transaction>): readonly Command[];
export type { Command, Transaction, RawTransaction, Result };
export { decide, parseJournal, parseTransaction };
