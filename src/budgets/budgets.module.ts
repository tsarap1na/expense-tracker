import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { Budget } from './models/budget.model';
import { Transaction } from '@transactions/models/transaction.model';
import { BudgetsController } from './budgets.controller';
import { BudgetsService } from './budgets.service';
import { BudgetRepository } from './budget.repository';

@Module({
    imports: [SequelizeModule.forFeature([Budget, Transaction])],
    controllers: [BudgetsController],
    providers: [BudgetsService, BudgetRepository],
    exports: [BudgetsService],
})
export class BudgetsModule {}