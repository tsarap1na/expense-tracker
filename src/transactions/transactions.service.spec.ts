import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { getModelToken } from '@nestjs/sequelize';
import { TransactionsService } from './transactions.service';
import { TransactionRepository } from './transaction.repository';
import { BudgetsService } from '@budgets/budgets.service';
import { Category } from '@categories/models/category.model';
import { Tag } from '@tags/models/tag.model';
import { TransactionType } from '@common/enums';

describe('TransactionsService', () => {
    let service: TransactionsService;
    let transactionRepository: jest.Mocked<TransactionRepository>;
    let budgetsService: jest.Mocked<BudgetsService>;
    let categoryModel: any;
    let tagModel: any;

    beforeEach(async () => {
        const mockTransactionRepository = {
            create: jest.fn(),
            findById: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
            setTags: jest.fn(),
            findAll: jest.fn(),
        };
        const mockBudgetsService = { checkLimit: jest.fn() };
        const mockCategoryModel = { findByPk: jest.fn() };
        const mockTagModel = { findAll: jest.fn() };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                TransactionsService,
                { provide: TransactionRepository, useValue: mockTransactionRepository },
                { provide: BudgetsService, useValue: mockBudgetsService },
                { provide: getModelToken(Category), useValue: mockCategoryModel },
                { provide: getModelToken(Tag), useValue: mockTagModel },
            ],
        }).compile();

        service = module.get(TransactionsService);
        transactionRepository = module.get(TransactionRepository);
        budgetsService = module.get(BudgetsService);
        categoryModel = module.get(getModelToken(Category));
        tagModel = module.get(getModelToken(Tag));
    });

    afterEach(() => jest.clearAllMocks());

    describe('create', () => {
        it('throws BadRequestException if the category is not found', async () => {
            categoryModel.findByPk.mockResolvedValue(null);

            await expect(
                service.create({ categoryId: 999, amount: 100, type: TransactionType.expense, date: '2026-09-01' } as any),
            ).rejects.toThrow(BadRequestException);
        });

        it('throws NotFoundException if non-existent tagIds are passed', async () => {
            categoryModel.findByPk.mockResolvedValue({ id: 1 });
            tagModel.findAll.mockResolvedValue([{ id: 1 }]);

            await expect(
                service.create({
                    categoryId: 1, amount: 100, type: TransactionType.expense, date: '2026-09-01', tagIds: [1, 2],
                } as any),
            ).rejects.toThrow('Tags not found: 2');
        });

        it('adds a budgetWarning if the limit is exceeded', async () => {
            categoryModel.findByPk.mockResolvedValue({ id: 1 });
            const createdTransaction = { id: 10, categoryId: 1, type: TransactionType.expense, date: new Date('2026-09-01') };
            transactionRepository.create.mockResolvedValue(createdTransaction as any);
            transactionRepository.findById.mockResolvedValue(createdTransaction as any);
            budgetsService.checkLimit.mockResolvedValue({ exceeded: true, limitAmount: 10000, spent: 11000 });

            const result = await service.create({
                categoryId: 1, amount: 6000, type: TransactionType.expense, date: '2026-09-01',
            } as any);

            expect(result.budgetWarning).toBeDefined();
            expect(result.budgetWarning?.spent).toBe(11000);
        });

        it('Does NOT add a budgetWarning for income transactions', async () => {
            categoryModel.findByPk.mockResolvedValue({ id: 1 });
            const createdTransaction = { id: 10, categoryId: 1, type: TransactionType.income, date: new Date('2026-09-01') };
            transactionRepository.create.mockResolvedValue(createdTransaction as any);
            transactionRepository.findById.mockResolvedValue(createdTransaction as any);

            const result = await service.create({
                categoryId: 1, amount: 100000, type: TransactionType.income, date: '2026-09-01',
            } as any);

            expect(result.budgetWarning).toBeUndefined();
            expect(budgetsService.checkLimit).not.toHaveBeenCalled();
        });
    });
});