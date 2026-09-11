import { validateImportRow } from './validate-row.util';
import { TransactionType } from '@common/enums';

describe('validateImportRow', () => {
    it('successfully validates a correct string', () => {
        const result = validateImportRow({
            amount: '1500.50',
            description: 'Lunch',
            date: '2026-09-01',
            type: TransactionType.expense,
            categoryName: 'Food',
        });
        expect(result.amount).toBe(1500.5);
    });

    it('throws an error if the category is missing', () => {
        expect(() =>
            validateImportRow({ amount: '100', date: '2026-09-01', type: TransactionType.expense, categoryName: '' }),
        ).toThrow('Category is not specified');
    });

    it('throws an error if the type is invalid', () => {
        expect(() =>
            validateImportRow({ amount: '100', date: '2026-09-01', type: 'refund', categoryName: 'Food' }),
        ).toThrow(/Invalid type/);
    });

    it('throws an error when sum <= 0', () => {
        expect(() =>
            validateImportRow({ amount: '0', date: '2026-09-01', type: TransactionType.expense, categoryName: 'Food' }),
        ).toThrow(/Invalid amount/);
    });

    it('throws an error when the date is in the future', () => {
        const futureDate = new Date();
        futureDate.setFullYear(futureDate.getFullYear() + 1);
        expect(() =>
            validateImportRow({
                amount: '100',
                date: futureDate.toISOString().slice(0, 10),
                type: TransactionType.expense,
                categoryName: 'Food',
            }),
        ).toThrow(/future/);
    });
});