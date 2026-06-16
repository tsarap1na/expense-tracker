import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { Transaction } from './models/transaction.model';
import { Category } from '../categories/models/category.model';
import { TransactionsController } from './transactions.controller';
import { TransactionsService } from './transactions.service';

@Module({
    imports: [SequelizeModule.forFeature([Transaction, Category])],
    controllers: [TransactionsController],
    providers: [TransactionsService],
})
export class TransactionsModule {}