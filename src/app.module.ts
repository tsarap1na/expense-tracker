import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { Category } from '@categories/models/category.model'
import { Transaction } from '@transactions/models/transaction.model'
import { CategoriesModule } from '@categories/categories.module'
import { TransactionsModule } from '@transactions/transactions.module'
import { SummaryModule } from '@summary/summary.module'
import { ConfigModule, ConfigService } from '@nestjs/config';
import { RecurringModule } from '@recurring/recurring.module';
import { Recurring } from '@recurring/models/recurring.model';
import { TagsModule } from '@tags/tags.module';
import { Tag } from '@tags/models/tag.model';
import { TransactionTag } from '@tags/models/transaction-tag.model';
import { BudgetsModule } from '@budgets/budgets.module';
import { StatsModule } from '@stats/stats.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    SequelizeModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        dialect: 'postgres',
        host: config.get('PGHOST'),
        port: Number(config.get('PGPORT')),
        username: config.get('PGUSER'),
        password: config.get('PGPASSWORD'),
        database: config.get('PGDATABASE'),
        autoLoadModels: true,
        sync: { alter: true },
        logging: false,
        models: [Category, Transaction, Recurring, Tag, TransactionTag],
      }),
    }),
    CategoriesModule,
    TransactionsModule,
    SummaryModule,
    RecurringModule,
    TagsModule,
    BudgetsModule,
    StatsModule
  ],
})
export class AppModule {}
