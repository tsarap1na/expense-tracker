import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { Category } from './categories/models/category.model'
import { Transaction } from './transactions/models/transaction.model'

@Module({
  imports: [
    SequelizeModule.forRoot({
      dialect: 'postgres',
      host: process.env.PGHOST || 'localhost',
      port: parseInt(process.env.PGPORT || '5433'),
      username: process.env.PGUSER || 'user',
      password: process.env.PGPASSWORD || 'password',
      database: process.env.PGDATABASE || 'expense_tracker',
      autoLoadModels: true,
      sync: { alter: true },
      logging: false,
      models: [Category, Transaction],
    })
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
