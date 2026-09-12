import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { Transaction } from './models/transaction.model';
import { Category } from '@categories/models/category.model';
import { Tag } from '@tags/models/tag.model';
import { TransactionTag } from '@tags/models/transaction-tag.model';
import { BudgetsModule } from '@budgets/budgets.module';
import { TransactionsController } from './transactions.controller';
import { TransactionsService } from './transactions.service';
import { TransactionRepository } from './transaction.repository';

@Module({
    imports: [
        SequelizeModule.forFeature([Transaction, Category, Tag, TransactionTag]),
        BudgetsModule,
    ],
    controllers: [TransactionsController],
    providers: [TransactionsService, TransactionRepository],
})
export class TransactionsModule {}