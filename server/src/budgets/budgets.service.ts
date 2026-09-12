import { Injectable, NotFoundException, ConflictException, Inject } from '@nestjs/common';
import type { Cache } from 'cache-manager';
import { Budget } from './models/budget.model';
import { CreateBudgetDto } from './dto/create-budget.dto';
import { UpdateBudgetDto } from './dto/update-budget.dto';
import { BudgetRepository } from './budget.repository';
import { toMonthStart, getMonthRange, parseMonthParam } from './utils/month.util';
import { CACHE_MANAGER, CACHE_TTL_MS, budgetSummaryCacheKey } from '@common/cache.constants';

@Injectable()
export class BudgetsService {
    constructor(
        private readonly budgetRepository: BudgetRepository,
        @Inject(CACHE_MANAGER) private readonly cache: Cache,
    ) {}

    async create(userId: number, dto: CreateBudgetDto): Promise<Budget> {
        const month = parseMonthParam(dto.month);
        const existing = await this.budgetRepository.findByCategoryAndMonth(userId, dto.categoryId, month);
        if (existing) {
            throw new ConflictException(
                `Budget for category #${dto.categoryId} on ${dto.month} already exists`,
            );
        }
        const budget = await this.budgetRepository.create(userId, {
            categoryId: dto.categoryId,
            month,
            limitAmount: dto.limitAmount,
        });
        await this.invalidateSummaryCache(userId, month);
        return budget;
    }

    async findAll(userId: number, month?: string): Promise<Budget[]> {
        const normalized = month ? parseMonthParam(month) : undefined;
        return this.budgetRepository.findAll(userId, normalized);
    }

    async findOne(userId: number, id: number): Promise<Budget> {
        const budget = await this.budgetRepository.findById(userId, id);
        if (!budget) throw new NotFoundException(`Budget #${id} not found`);
        return budget;
    }

    async update(userId: number, id: number, dto: UpdateBudgetDto): Promise<Budget> {
        const budget = await this.findOne(userId, id);
        const previousMonth = budget.month;

        const patch: Partial<Budget> = { ...dto } as Partial<Budget>;
        if (dto.month) {
            const month = parseMonthParam(dto.month);
            const categoryId = dto.categoryId ?? budget.categoryId;
            const existing = await this.budgetRepository.findByCategoryAndMonth(userId, categoryId, month);
            if (existing && existing.id !== id) {
                throw new ConflictException(
                    `Budget for category #${categoryId} on ${dto.month} already exists`,
                );
            }
            patch.month = month;
        }

        const updated = await this.budgetRepository.update(budget, patch);
        await this.invalidateSummaryCache(userId, previousMonth);
        if (patch.month && patch.month !== previousMonth) {
            await this.invalidateSummaryCache(userId, patch.month);
        }
        return updated;
    }

    async remove(userId: number, id: number): Promise<void> {
        const budget = await this.findOne(userId, id);
        await this.budgetRepository.delete(budget);
        await this.invalidateSummaryCache(userId, budget.month);
    }

    async checkLimit(
        userId: number,
        categoryId: number,
        transactionDate: Date,
    ): Promise<{ exceeded: boolean; limitAmount: number; spent: number } | null> {
        const monthStart = toMonthStart(transactionDate);
        const budget = await this.budgetRepository.findByCategoryAndMonth(userId, categoryId, monthStart);
        if (!budget) return null;

        const { start, end } = getMonthRange(monthStart);
        const spent = await this.budgetRepository.getSpentAmount(userId, categoryId, start, end);
        const limitAmount = Number(budget.limitAmount);

        return { exceeded: spent > limitAmount, limitAmount, spent };
    }

    async getSummary(userId: number, month: string) {
        const monthStart = parseMonthParam(month);
        const cacheKey = budgetSummaryCacheKey(userId, monthStart);
        const cached = await this.cache.get(cacheKey);
        if (cached) return cached;

        const budgets = await this.budgetRepository.findAll(userId, monthStart);

        if (budgets.length === 0) {
            await this.cache.set(cacheKey, [], CACHE_TTL_MS);
            return [];
        }

        const { start, end } = getMonthRange(monthStart);
        const categoryIds = budgets.map((b) => b.categoryId);
        const spentByCategory = await this.budgetRepository.getSpentAmountsByCategories(
            userId, categoryIds, start, end,
        );

        const result = budgets.map((budget) => {
            const limitAmount = Number(budget.limitAmount);
            const spent = spentByCategory.get(budget.categoryId) ?? 0;
            const remaining = limitAmount - spent;
            const usedPercentage = limitAmount > 0 ? Math.round((spent / limitAmount) * 100) : 0;

            return {
                categoryId: budget.categoryId,
                categoryName: budget.category.name,
                limitAmount,
                spent,
                remaining,
                usedPercentage,
            };
        });

        await this.cache.set(cacheKey, result, CACHE_TTL_MS);
        return result;
    }

    async invalidateSummaryCache(userId: number, month: string): Promise<void> {
        await this.cache.del(budgetSummaryCacheKey(userId, month));
    }
}