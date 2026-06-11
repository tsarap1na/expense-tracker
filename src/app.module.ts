import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { Category } from './categories/models/category.model'
import { Transaction } from './transactions/models/transaction.model'

@Module({
  imports: [
    SequelizeModule.forRoot({
      dialect: 'postgres',
      host: 'localhost',
      port: 5433,
      username: 'user',
      password: 'password',
      database: 'expense_tracker',
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
