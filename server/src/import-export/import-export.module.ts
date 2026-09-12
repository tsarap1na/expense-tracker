import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { Transaction } from '@transactions/models/transaction.model';
import { Category } from '@categories/models/category.model';
import { ImportExportController } from './import-export.controller';
import { ImportExportService } from './import-export.service';
import { ImportExportRepository } from './import-export.repository';

@Module({
    imports: [SequelizeModule.forFeature([Transaction, Category])],
    controllers: [ImportExportController],
    providers: [ImportExportService, ImportExportRepository],
})
export class ImportExportModule {}