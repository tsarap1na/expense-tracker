import { TransactionType } from '@common/enums';
import { RawImportRow } from '../types/raw-import-row.type';

export interface ValidatedRow {
    amount: number;
    description: string;
    date: string;
    type: TransactionType;
    categoryName: string;
}

export function validateImportRow(raw: RawImportRow): ValidatedRow {
    if (!raw.categoryName || raw.categoryName.trim() === '') {
        throw new Error('Category is not specified');
    }

    if (!raw.type || !Object.values(TransactionType).includes(raw.type as TransactionType)) {
        throw new Error(`Invalid type: "${raw.type}"`);
    }

    const amount = Number(raw.amount);
    if (!raw.amount || isNaN(amount) || amount <= 0) {
        throw new Error(`Invalid amount: "${raw.amount}"`);
    }

    if (!raw.date || isNaN(Date.parse(raw.date))) {
        throw new Error(`Invalid date: "${raw.date}"`);
    }
    if (new Date(raw.date) > new Date()) {
        throw new Error('Transaction date cannot be in the future');
    }

    return {
        amount,
        description: raw.description ?? '',
        date: raw.date,
        type: raw.type as TransactionType,
        categoryName: raw.categoryName.trim(),
    };
}