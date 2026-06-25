import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { Category } from './categories/models/category.model'
import { Transaction } from './transactions/models/transaction.model'
import { CategoriesModule } from './categories/categories.module'
import { TransactionsModule } from './transactions/transactions.module'
import { SummaryModule } from './summary/summary.module'
import { ConfigModule, ConfigService } from '@nestjs/config';
import { RecurringModule } from './recurring/recurring.module';

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
        models: [Category, Transaction],
      }),
    }),
    CategoriesModule,
    TransactionsModule,
    SummaryModule,
    RecurringModule
  ],
})
export class AppModule {}
