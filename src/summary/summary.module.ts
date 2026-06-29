import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { Transaction } from '@transactions/models/transaction.model';
import { SummaryController } from './summary.controller';
import { SummaryService } from './summary.service';

@Module({
    imports: [SequelizeModule.forFeature([Transaction])],
    controllers: [SummaryController],
    providers: [SummaryService],
})
export class SummaryModule {}