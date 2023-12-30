interface TransactionBase {
  id: string;
  arrangementId: string;
  reference: string;
  description: string;
  typeGroup: string;
  category: 'Spending' | 'Income';
  bookingDate: string;
  valueDate: string;
  creditDebitIndicator: string;
  transactionAmountCurrency: TransactionAmountCurrency;
  checkImageAvailability: string;
  creationTime: string;
  state: string;
}

export interface TransactionAmountCurrency {
  amount: string;
  currencyCode: string;
}

export interface Additions {
  creditBank: string;
  debitAcctName: string;
  creditAcctNo: string;
  debitBank: string;
  debitAcctNo: string;
  creditAcctName: string;
}

export interface DebitTransaction extends TransactionBase {
  type: 'CRDT' | 'DBIT';
  counterPartyName: string;
  counterPartyAccountNumber: string;
  counterPartyBankName: string;
  runningBalance: number;
  additions: Additions;
}

export interface CreditTransaction extends TransactionBase {
  type: 'CREDIT CARD';
  additions: Additions;
}

export type Transaction = DebitTransaction | CreditTransaction;

export interface PaymentReceiptRecord {
  id: string;
  name: string;
  amount: number;
  date: string;
  note: string;
  autoMetadata: string;
  bankNo: string;
}
