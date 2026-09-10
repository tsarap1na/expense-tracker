import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { Transaction } from '@transactions/models/transaction.model';
import { StatsController } from './stats.controller';
import { StatsService } from './stats.service';
import { StatsRepository } from './stats.repository';

@Module({
    imports: [SequelizeModule.forFeature([Transaction])],
    controllers: [StatsController],
    providers: [StatsService, StatsRepository],
})
export class StatsModule {}