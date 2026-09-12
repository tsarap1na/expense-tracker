import { Test, TestingModule } from '@nestjs/testing';
import { StatsService } from './stats.service';
import { StatsRepository } from './stats.repository';

describe('StatsService', () => {
    let service: StatsService;
    let statsRepository: jest.Mocked<StatsRepository>;

    const userId = 1;

    beforeEach(async () => {
        const mockStatsRepository = {
            getCategoryTotals: jest.fn(),
            getMonthlyTotals: jest.fn(),
            getTopCategories: jest.fn(),
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                StatsService,
                { provide: StatsRepository, useValue: mockStatsRepository },
            ],
        }).compile();

        service = module.get<StatsService>(StatsService);
        statsRepository = module.get(StatsRepository);
    });

    afterEach(() => jest.clearAllMocks());

    it('returns all 6 months in a row, even if the database does not contain data for all of them', async () => {
        statsRepository.getMonthlyTotals.mockResolvedValue([
            { month: '2026-09', type: 'expense', total: '500' },
        ]);

        const result = await service.getMonthlyDynamics(userId, 6);

        expect(result).toHaveLength(6);
        expect(result.every((r) => r.income === 0 || r.expense >= 0)).toBe(true);
        expect(result[result.length - 1]).toEqual({ month: expect.any(String), income: 0, expense: 500 });
        expect(result.slice(0, -1).some((r) => r.income === 0 && r.expense === 0)).toBe(true);
    });

    it('returns exactly N months for different count parameters', async () => {
        statsRepository.getMonthlyTotals.mockResolvedValue([]);

        const result = await service.getMonthlyDynamics(userId, 3);

        expect(result).toHaveLength(3);
    });

    it('passes userId to the repository call', async () => {
        statsRepository.getMonthlyTotals.mockResolvedValue([]);

        await service.getMonthlyDynamics(userId, 6);

        expect(statsRepository.getMonthlyTotals).toHaveBeenCalledWith(
            userId, expect.any(Date), expect.any(Date),
        );
    });
});