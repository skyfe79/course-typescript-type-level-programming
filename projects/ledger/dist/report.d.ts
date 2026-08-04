import type { Transaction } from "./ledger.ts";
declare function formatTransaction(tx: Transaction): string;
declare function formatReport(transactions: readonly Transaction[]): string;
export { formatReport, formatTransaction };
