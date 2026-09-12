import { Test, TestingModule } from '@nestjs/testing';
import { CACHE_MANAGER } from '@common/cache.constants';
import { BudgetsService } from './budgets.service';
import { BudgetRepository } from './budget.repository';

describe('BudgetsService', () => {
    let service: BudgetsService;
    let budgetRepository: jest.Mocked<BudgetRepository>;
    let cache: { get: jest.Mock; set: jest.Mock; del: jest.Mock };

    const userId = 1;

    beforeEach(async () => {
        const mockBudgetRepository = {
            findByCategoryAndMonth: jest.fn(),
            getSpentAmount: jest.fn(),
            findAll: jest.fn(),
            getSpentAmountsByCategories: jest.fn(),
            create: jest.fn(),
        };

        const mockCache = { get: jest.fn().mockResolvedValue(undefined), set: jest.fn(), del: jest.fn() };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                BudgetsService,
                { provide: BudgetRepository, useValue: mockBudgetRepository },
                { provide: CACHE_MANAGER, useValue: mockCache },
            ],
        }).compile();

        service = module.get<BudgetsService>(BudgetsService);
        budgetRepository = module.get(BudgetRepository);
        cache = module.get(CACHE_MANAGER);
    });

    afterEach(() => jest.clearAllMocks());

    describe('checkLimit', () => {
        it('returns null if there is no budget for the category/month', async () => {
            budgetRepository.findByCategoryAndMonth.mockResolvedValue(null);

            const result = await service.checkLimit(userId, 1, new Date('2026-09-15'));

            expect(result).toBeNull();
            expect(budgetRepository.getSpentAmount).not.toHaveBeenCalled();
        });

        it('DOES NOT consider the limit exceeded if less than the limit is spent', async () => {
            budgetRepository.findByCategoryAndMonth.mockResolvedValue({ limitAmount: '10000.00' } as any);
            budgetRepository.getSpentAmount.mockResolvedValue(5000);

            const result = await service.checkLimit(userId, 1, new Date('2026-09-15'));

            expect(result).toEqual({ exceeded: false, limitAmount: 10000, spent: 5000 });
        });

        it('considers the limit exceeded if more than the limit is spent', async () => {
            budgetRepository.findByCategoryAndMonth.mockResolvedValue({ limitAmount: '10000.00' } as any);
            budgetRepository.getSpentAmount.mockResolvedValue(11000);

            const result = await service.checkLimit(userId, 1, new Date('2026-09-15'));

            expect(result?.exceeded).toBe(true);
        });

        it('boundary case: EXACTLY the limit spent - not exceeded', async () => {
            budgetRepository.findByCategoryAndMonth.mockResolvedValue({ limitAmount: '10000.00' } as any);
            budgetRepository.getSpentAmount.mockResolvedValue(10000);

            const result = await service.checkLimit(userId, 1, new Date('2026-09-15'));

            expect(result?.exceeded).toBe(false);
        });
    });

    describe('getSummary', () => {
        it('returns an empty array if there is no budget for the month', async () => {
            budgetRepository.findAll.mockResolvedValue([]);

            const result = await service.getSummary(userId, '2026-09');

            expect(result).toEqual([]);
            expect(budgetRepository.getSpentAmountsByCategories).not.toHaveBeenCalled();
        });

        it('correctly calculates usedPercentage with rounding', async () => {
            budgetRepository.findAll.mockResolvedValue([
                { categoryId: 1, limitAmount: '10000.00', category: { name: 'Food' } } as any,
            ]);
            budgetRepository.getSpentAmountsByCategories.mockResolvedValue(new Map([[1, 3333]]));

            const result = await service.getSummary(userId, '2026-09');

            expect(result[0].usedPercentage).toBe(33);
            expect(cache.set).toHaveBeenCalledWith(
                'budgets:summary:1:2026-09-01',
                expect.any(Array),
                15_000,
            );
        });

        it('returns cached summary without querying the repository', async () => {
            const cached = [{ categoryId: 1, usedPercentage: 50 }];
            cache.get.mockResolvedValue(cached);

            const result = await service.getSummary(userId, '2026-09');

            expect(result).toEqual(cached);
            expect(budgetRepository.findAll).not.toHaveBeenCalled();
        });
    });

    describe('create', () => {
        it('throws ConflictException when re-creating for the same category/month', async () => {
            budgetRepository.findByCategoryAndMonth.mockResolvedValue({ id: 1 } as any);

            await expect(
                service.create(userId, { categoryId: 1, month: '2026-09', limitAmount: 5000 }),
            ).rejects.toThrow('already exists');
        });
    });
});