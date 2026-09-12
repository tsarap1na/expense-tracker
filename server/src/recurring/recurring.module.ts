import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { BullModule } from '@nestjs/bullmq';
import { Recurring } from './models/recurring.model';
import { Transaction } from '@transactions/models/transaction.model';
import { Category } from '@categories/models/category.model';
import { RecurringController } from './recurring.controller';
import { RecurringService } from './recurring.service';
import { RecurringRepository } from './recurring.repository';
import { RecurringProcessor } from './recurring.processor';
import { RecurringScheduler } from './recurring.scheduler';
import { BudgetsModule } from '@budgets/budgets.module';
import { RECURRING_QUEUE } from './recurring.constants';

@Module({
    imports: [
        SequelizeModule.forFeature([Recurring, Transaction, Category]),
        BullModule.registerQueue({ name: RECURRING_QUEUE }),
        BudgetsModule,
    ],
    controllers: [RecurringController],
    providers: [RecurringService, RecurringRepository, RecurringProcessor, RecurringScheduler],
})
export class RecurringModule {}
