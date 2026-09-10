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

@Injectable()
export class TransactionsService {
    constructor(
        private readonly transactionRepository: TransactionRepository,
        private readonly budgetsService: BudgetsService,
        @InjectModel(Category) private readonly categoryModel: typeof Category,
        @InjectModel(Tag) private readonly tagModel: typeof Tag,
    ) {}

    async create(dto: CreateTransactionDto) {
        const category = await this.categoryModel.findByPk(dto.categoryId);
        if (!category) throw new BadRequestException(`Category #${dto.categoryId} not found`);

        if (dto.tagIds) {
            await this.validateTagIds(dto.tagIds);
        }

        const transaction = await this.transactionRepository.create({
            ...dto,
            date: new Date(dto.date),
        });

        if (dto.tagIds?.length) {
            await this.transactionRepository.setTags(transaction, dto.tagIds);
        }

        const full = await this.findOne(transaction.id);
        return this.buildResponseWithBudgetWarning(full);
    }

    async findAll(query: QueryTransactionDto) {
        return this.transactionRepository.findAll(query);
    }

    async findOne(id: number): Promise<Transaction> {
        const transaction = await this.transactionRepository.findById(id);
        if (!transaction) throw new NotFoundException(`Transaction #${id} not found`);
        return transaction;
    }

    async update(id: number, dto: UpdateTransactionDto) {
        const transaction = await this.findOne(id);

        if (dto.categoryId) {
            const category = await this.categoryModel.findByPk(dto.categoryId);
            if (!category) throw new BadRequestException(`Category #${dto.categoryId} not found`);
        }

        if (dto.tagIds) {
            await this.validateTagIds(dto.tagIds);
        }

        const updated = await this.transactionRepository.update(transaction, dto as Partial<Transaction>);

        if (dto.tagIds !== undefined) {
            await this.transactionRepository.setTags(updated, dto.tagIds);
        }

        const full = await this.findOne(id);
        return this.buildResponseWithBudgetWarning(full);
    }

    async remove(id: number): Promise<void> {
        const transaction = await this.findOne(id);
        await this.transactionRepository.delete(transaction);
    }

    private async validateTagIds(tagIds: number[]): Promise<void> {
        if (tagIds.length === 0) return;
        const found = await this.tagModel.findAll({
            where: { id: { [Op.in]: tagIds } },
            attributes: ['id'],
        });
        if (found.length !== tagIds.length) {
            const foundIds = found.map((t) => t.id);
            const missing = tagIds.filter((id) => !foundIds.includes(id));
            throw new NotFoundException(`Tags not found: ${missing.join(', ')}`);
        }
    }

    private async buildResponseWithBudgetWarning(transaction: Transaction) {
        if (transaction.type !== TransactionType.expense) {
            return { data: transaction };
        }

        const limitCheck = await this.budgetsService.checkLimit(
            transaction.categoryId,
            transaction.date,
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