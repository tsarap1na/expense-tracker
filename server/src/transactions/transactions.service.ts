import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Op } from 'sequelize';
import { Transaction } from './models/transaction.model';
import { Category } from '@categories/models/category.model';
import { Tag } from '@tags/models/tag.model';
import { TransactionType } from '@common/enums';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';
import { QueryTransactionDto } from './dto/query-transaction.dto';
import { TransactionRepository } from './transaction.repository';
import { BudgetsService } from '@budgets/budgets.service';
import { toMonthStart } from '@budgets/utils/month.util';

@Injectable()
export class TransactionsService {
    constructor(
        private readonly transactionRepository: TransactionRepository,
        private readonly budgetsService: BudgetsService,
        @InjectModel(Category) private readonly categoryModel: typeof Category,
        @InjectModel(Tag) private readonly tagModel: typeof Tag,
    ) {}

    async create(userId: number, dto: CreateTransactionDto) {
        const category = await this.categoryModel.findOne({ where: { id: dto.categoryId, userId } });
        if (!category) throw new BadRequestException(`Category #${dto.categoryId} not found`);

        if (dto.tagIds) {
            await this.validateTagIds(userId, dto.tagIds);
        }

        const transaction = await this.transactionRepository.create(userId, {
            ...dto,
            date: new Date(dto.date),
        });

        if (dto.tagIds?.length) {
            await this.transactionRepository.setTags(transaction, dto.tagIds);
        }

        const full = await this.findOne(userId, transaction.id);
        await this.budgetsService.invalidateSummaryCache(userId, toMonthStart(full.date));
        return this.buildResponseWithBudgetWarning(userId, full);
    }

    async findAll(userId: number, query: QueryTransactionDto) {
        return this.transactionRepository.findAll(userId, query);
    }

    async findOne(userId: number, id: number): Promise<Transaction> {
        const transaction = await this.transactionRepository.findById(userId, id);
        if (!transaction) throw new NotFoundException(`Transaction #${id} not found`);
        return transaction;
    }

    async update(userId: number, id: number, dto: UpdateTransactionDto) {
        const transaction = await this.findOne(userId, id);

        if (dto.categoryId) {
            const category = await this.categoryModel.findOne({ where: { id: dto.categoryId, userId } });
            if (!category) throw new BadRequestException(`Category #${dto.categoryId} not found`);
        }

        if (dto.tagIds) {
            await this.validateTagIds(userId, dto.tagIds);
        }

        const previousMonth = toMonthStart(transaction.date);
        const updated = await this.transactionRepository.update(transaction, dto as Partial<Transaction>);

        if (dto.tagIds !== undefined) {
            await this.transactionRepository.setTags(updated, dto.tagIds);
        }

        const full = await this.findOne(userId, id);
        await this.budgetsService.invalidateSummaryCache(userId, previousMonth);
        const nextMonth = toMonthStart(full.date);
        if (nextMonth !== previousMonth) {
            await this.budgetsService.invalidateSummaryCache(userId, nextMonth);
        }
        return this.buildResponseWithBudgetWarning(userId, full);
    }

    async remove(userId: number, id: number): Promise<void> {
        const transaction = await this.findOne(userId, id);
        await this.transactionRepository.delete(transaction);
        await this.budgetsService.invalidateSummaryCache(userId, toMonthStart(transaction.date));
    }

    private async validateTagIds(userId: number, tagIds: number[]): Promise<void> {
        if (tagIds.length === 0) return;
        const found = await this.tagModel.findAll({
            where: { id: { [Op.in]: tagIds }, userId },
            attributes: ['id'],
        });
        if (found.length !== tagIds.length) {
            const foundIds = found.map((t) => t.id);
            const missing = tagIds.filter((id) => !foundIds.includes(id));
            throw new NotFoundException(`Tags not found: ${missing.join(', ')}`);
        }
    }

    private async buildResponseWithBudgetWarning(userId: number, transaction: Transaction) {
        if (transaction.type !== TransactionType.expense) return { data: transaction };

        const limitCheck = await this.budgetsService.checkLimit(
            userId, transaction.categoryId, transaction.date,
        );

        if (!limitCheck || !limitCheck.exceeded) {
            return { data: transaction };
        }

        return {
            data: transaction,
            budgetWarning: {
                categoryId: transaction.categoryId,
                limitAmount: limitCheck.limitAmount,
                spent: limitCheck.spent,
                message: `Budget exceeded: spent ${limitCheck.spent} out of ${limitCheck.limitAmount}`,
            },
        };
    }
}