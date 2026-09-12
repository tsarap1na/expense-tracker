import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken, getConnectionToken } from '@nestjs/sequelize';
import { RecurringService } from './recurring.service';
import { RecurringRepository } from './recurring.repository';
import { BudgetsService } from '@budgets/budgets.service';
import { Category } from '@categories/models/category.model';
import { Transaction } from '@transactions/models/transaction.model';
import { TransactionType } from '@common/enums';
import { Frequency } from './models/recurring.model';

describe('RecurringService', () => {
    let service: RecurringService;
    let recurringRepository: jest.Mocked<RecurringRepository>;
    let transactionModel: { create: jest.Mock };
    let sequelize: { transaction: jest.Mock };
    let budgetsService: { invalidateSummaryCache: jest.Mock };

    const userId = 1;

    beforeEach(async () => {
        transactionModel = { create: jest.fn() };
        sequelize = {
            transaction: jest.fn(async (fn: (t: unknown) => Promise<unknown>) => fn({})),
        };
        budgetsService = { invalidateSummaryCache: jest.fn().mockResolvedValue(undefined) };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                RecurringService,
                {
                    provide: RecurringRepository,
                    useValue: {
                        findActiveDue: jest.fn(),
                        findAllActiveDue: jest.fn(),
                        update: jest.fn(),
                    },
                },
                { provide: BudgetsService, useValue: budgetsService },
                { provide: getModelToken(Category), useValue: { findOne: jest.fn() } },
                { provide: getModelToken(Transaction), useValue: transactionModel },
                { provide: getConnectionToken(), useValue: sequelize },
            ],
        }).compile();

        service = module.get(RecurringService);
        recurringRepository = module.get(RecurringRepository);
    });

    afterEach(() => jest.clearAllMocks());

    it('generate creates a transaction for the current user and keeps the HTTP response shape', async () => {
        const template = {
            id: 5,
            userId,
            categoryId: 2,
            amount: 100,
            type: TransactionType.expense,
            description: 'Rent',
            nextRunAt: new Date('2026-09-01'),
            frequency: Frequency.month,
        };
        recurringRepository.findActiveDue.mockResolvedValue([template] as any);
        const createdTx = { id: 10 };
        transactionModel.create.mockResolvedValue(createdTx);

        const result = await service.generate(userId);

        expect(recurringRepository.findActiveDue).toHaveBeenCalledWith(userId, expect.any(Date));
        expect(result).toEqual({ count: 1, transactions: [createdTx] });
        expect(budgetsService.invalidateSummaryCache).toHaveBeenCalledWith(userId, '2026-09-01');
    });

    it('generateDue processes due templates for all users', async () => {
        recurringRepository.findAllActiveDue.mockResolvedValue([]);

        const result = await service.generateDue();

        expect(recurringRepository.findAllActiveDue).toHaveBeenCalledWith(expect.any(Date));
        expect(result).toEqual({ count: 0 });
    });
});
