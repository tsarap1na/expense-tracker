import { Injectable } from '@nestjs/common';
import { stringify } from 'csv-stringify/sync';
import { Op, WhereOptions } from 'sequelize';
import { Transaction } from '@transactions/models/transaction.model';
import { ImportExportRepository } from './import-export.repository';
import { ExportQueryDto } from './dto/export-query.dto';
import { ExportRow } from './types/export-row.type';
import { parseImportFile } from './utils/parse-file.util';
import { validateImportRow, ValidatedRow } from './utils/validate-row.util';
import { ImportReportDto } from './dto/import-report.dto';
import { validateDateRange } from '@common/validate-date-range.util';

@Injectable()
export class ImportExportService {
    constructor(private readonly importExportRepository: ImportExportRepository) {}

    async exportTransactions(
        query: ExportQueryDto,
    ): Promise<{ content: string; contentType: string; filename: string }> {
        validateDateRange(query.dateFrom, query.dateTo);

        const where: WhereOptions<Transaction> = {};
        if (query.dateFrom || query.dateTo) {
            const dateFilter: any = {};
            if (query.dateFrom) dateFilter[Op.gte] = new Date(query.dateFrom);
            if (query.dateTo) {
                const end = new Date(query.dateTo);
                end.setHours(23, 59, 59, 999);
                dateFilter[Op.lte] = end;
            }
            where.date = dateFilter;
        }

        const transactions = await this.importExportRepository.findForExport(where);

        const rows: ExportRow[] = transactions.map((t: any) => ({
            amount: Number(t.amount).toFixed(2),
            description: t.description ?? '',
            date: t.date instanceof Date ? t.date.toISOString().slice(0, 10) : t.date,
            type: t.type,
            categoryName: t.category.name,
        }));

        if (query.format === 'csv') {
            const csv = stringify(rows, {
                header: true,
                columns: ['amount', 'description', 'date', 'type', 'categoryName'],
            });
            return { content: csv, contentType: 'text/csv', filename: 'transactions.csv' };
        }

        return {
            content: JSON.stringify(rows, null, 2),
            contentType: 'application/json',
            filename: 'transactions.json',
        };
    }

    async importTransactions(file: Express.Multer.File): Promise<ImportReportDto> {
        const rawRows = parseImportFile(file.buffer, file.mimetype);

        const errors: { row: number; reason: string }[] = [];
        const validRows: { rowNumber: number; data: ValidatedRow }[] = [];

        rawRows.forEach((raw, index) => {
            const rowNumber = index + 1;
            try {
                validRows.push({ rowNumber, data: validateImportRow(raw) });
            } catch (err: any) {
                errors.push({ row: rowNumber, reason: err.message });
            }
        });

        if (validRows.length === 0) {
            return { imported: 0, skipped: rawRows.length, errors };
        }

        const categoryNames = [...new Set(validRows.map((r) => r.data.categoryName))];
        const categories = await this.importExportRepository.findCategoriesByNames(categoryNames);
        const categoryIdByName = new Map(categories.map((c: any) => [c.name, c.id]));

        const existing = await this.importExportRepository.findExistingByCandidates(
            validRows.map((r) => ({
                date: r.data.date,
                amount: r.data.amount,
                description: r.data.description,
            })),
        );
        const existingKeys = new Set(
            existing.map((t: any) => this.buildDedupKey(t.date, t.amount, t.description)),
        );

        const toInsert: Partial<Transaction>[] = [];
        const seenInThisFile = new Set<string>();

        for (const { rowNumber, data } of validRows) {
            const categoryId = categoryIdByName.get(data.categoryName);
            if (!categoryId) {
                errors.push({ row: rowNumber, reason: `Category "${data.categoryName}" not found` });
                continue;
            }

            const key = this.buildDedupKey(data.date, data.amount, data.description);

            if (existingKeys.has(key)) {
                errors.push({ row: rowNumber, reason: 'A record with the same date, amount and description already exists' });
                continue;
            }
            if (seenInThisFile.has(key)) {
                errors.push({ row: rowNumber, reason: 'Duplicate within the file' });
                continue;
            }
            seenInThisFile.add(key);

            toInsert.push({
                amount: data.amount,
                description: data.description,
                date: new Date(data.date),
                type: data.type,
                categoryId,
            } as Partial<Transaction>);
        }

        let imported = 0;
        if (toInsert.length > 0) {
            const dbTransaction = await this.importExportRepository.startTransaction();
            try {
                const created = await this.importExportRepository.bulkCreate(toInsert, dbTransaction);
                await dbTransaction.commit();
                imported = created.length;
            } catch (err: any) {
                await dbTransaction.rollback();
                errors.push({
                    row: 0,
                    reason: `Import aborted, no records were saved due to a database error: ${err.message}`,
                });
                imported = 0;
            }
        }

        return {
            imported,
            skipped: rawRows.length - imported,
            errors,
        };
    }

    private buildDedupKey(date: string | Date, amount: number | string, description: string): string {
        const dateStr = date instanceof Date ? date.toISOString().slice(0, 10) : date;
        return `${dateStr}|${Number(amount).toFixed(2)}|${description}`;
    }
}