import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel, InjectConnection } from '@nestjs/sequelize';
import { Sequelize } from 'sequelize-typescript';
import { RecurringRepository } from './recurring.repository';
import { Category } from '@categories/models/category.model';
import { Transaction } from '@transactions/models/transaction.model';
import { CreateRecurringDto } from './dto/create-recurring.dto';
import { UpdateRecurringDto } from './dto/update-recurring.dto';
import { QueryRecurringDto } from './dto/query-recurring.dto';
import { Recurring, Frequency } from './models/recurring.model';
import { BudgetsService } from '@budgets/budgets.service';
import { toMonthStart } from '@budgets/utils/month.util';
import { TransactionType } from '@common/enums';

@Injectable()
export class RecurringService {
    constructor(
        private readonly recurringRepository: RecurringRepository,
        private readonly budgetsService: BudgetsService,
        @InjectModel(Category) private readonly categoryModel: typeof Category,
        @InjectModel(Transaction) private readonly transactionModel: typeof Transaction,
        @InjectConnection() private readonly sequelize: Sequelize,
    ) {}

    async create(userId: number, dto: CreateRecurringDto): Promise<Recurring> {
        const category = await this.categoryModel.findOne({ where: { id: dto.categoryId, userId } });
        if (!category) throw new BadRequestException(`Category #${dto.categoryId} not found`);
        return this.recurringRepository.create(userId, {
            ...dto,
            nextRunAt: new Date(dto.nextRunAt),
        });
    }

    async findAll(userId: number, query: QueryRecurringDto) {
        return this.recurringRepository.findAll(userId, query);
    }

    async findOne(userId: number, id: number): Promise<Recurring> {
        const recurring = await this.recurringRepository.findById(userId, id);
        if (!recurring) throw new NotFoundException(`Recurring #${id} not found`);
        return recurring;
    }

    async update(userId: number, id: number, dto: UpdateRecurringDto): Promise<Recurring> {
        const recurring = await this.findOne(userId, id);
        if (dto.categoryId) {
            const category = await this.categoryModel.findOne({ where: { id: dto.categoryId, userId } });
            if (!category) throw new BadRequestException(`Category #${dto.categoryId} not found`);
        }

        const data: Partial<Recurring> = {
            ...dto,
            ...(dto.nextRunAt && { nextRunAt: new Date(dto.nextRunAt) }),
        } as Partial<Recurring>;

        return this.recurringRepository.update(recurring, data);
    }

    async remove(userId: number, id: number): Promise<void> {
        const recurring = await this.findOne(userId, id);
        await this.recurringRepository.delete(recurring);
    }

    async generate(userId: number): Promise<{ count: number; transactions: Transaction[] }> {
        const templates = await this.recurringRepository.findActiveDue(userId, new Date());
        const transactions = await this.generateFromTemplates(templates);
        return { count: transactions.length, transactions };
    }

    async generateDue(): Promise<{ count: number }> {
        const templates = await this.recurringRepository.findAllActiveDue(new Date());
        const transactions = await this.generateFromTemplates(templates);
        return { count: transactions.length };
    }

    private async generateFromTemplates(templates: Recurring[]): Promise<Transaction[]> {
        const created: Transaction[] = [];

        for (const template of templates) {
            const runAt = template.nextRunAt;
            const transaction = await this.sequelize.transaction(async (t) => {
                const tx = await this.transactionModel.create(
                    {
                        categoryId: template.categoryId,
                        userId: template.userId,
                        amount: template.amount,
                        type: template.type,
                        description: template.description,
                        date: runAt,
                        recurringId: template.id,
                    },
                    { transaction: t },
                );

                await this.recurringRepository.update(template, {
                    nextRunAt: this.calcNextRunAt(runAt, template.frequency),
                }, t);

                return tx;
            });

            created.push(transaction);

            if (template.type === TransactionType.expense) {
                await this.budgetsService.invalidateSummaryCache(template.userId, toMonthStart(runAt));
            }
        }

        return created;
    }

    private calcNextRunAt(current: Date, frequency: Frequency): Date {
        const next = new Date(current);
        if (frequency === Frequency.day) next.setDate(next.getDate() + 1);
        if (frequency === Frequency.week) next.setDate(next.getDate() + 7);
        if (frequency === Frequency.month) next.setMonth(next.getMonth() + 1);
        return next;
    }
}
