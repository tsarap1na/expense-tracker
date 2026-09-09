import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { Transaction } from './models/transaction.model';
import { Category } from '@categories/models/category.model';
import { TransactionsController } from './transactions.controller';
import { TransactionsService } from './transactions.service';
import { TransactionRepository} from './transaction.repository';
import { Tag } from '@tags/models/tag.model';
import { TransactionTag } from '@tags/models/transaction-tag.model';

@Module({
    imports: [SequelizeModule.forFeature([Transaction, Category, Tag, TransactionTag])],
    controllers: [TransactionsController],
    providers: [TransactionsService, TransactionRepository],
})
export class TransactionsModule {}