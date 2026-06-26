import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { Recurring } from './models/recurring.model';
import { Transaction } from '@transactions/models/transaction.model';
import { Category } from '@categories/models/category.model';
import { RecurringController } from './recurring.controller';
import { RecurringService } from './recurring.service';
import { RecurringRepository } from './recurring.repository';

@Module({
    imports: [SequelizeModule.forFeature([Recurring, Transaction, Category])],
    controllers: [RecurringController],
    providers: [RecurringService, RecurringRepository],
})
export class RecurringModule {}