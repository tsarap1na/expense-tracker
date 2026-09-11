import {
    Controller, Get, Post, Query, Res, UploadedFile, UseInterceptors, BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiConsumes, ApiBody, ApiOperation } from '@nestjs/swagger';
import type { Response } from 'express';
import { ImportExportService } from './import-export.service';
import { ExportQueryDto } from './dto/export-query.dto';

@ApiTags('import-export')
@Controller('transactions')
export class ImportExportController {
    constructor(private readonly importExportService: ImportExportService) {}

    @Get('export')
    @ApiOperation({ summary: 'Export transactions to JSON or CSV' })
    async export(@Query() query: ExportQueryDto, @Res() res: Response) {
        const { content, contentType, filename } = await this.importExportService.exportTransactions(query);
        res.set({
            'Content-Type': contentType,
            'Content-Disposition': `attachment; filename="${filename}"`,
        });
        res.send(content);
    }

    @Post('import')
    @ApiOperation({ summary: 'Import transactions from JSON or CSV file' })
    @ApiConsumes('multipart/form-data')
    @ApiBody({ schema: { type: 'object', properties: { file: { type: 'string', format: 'binary' } } } })
    @UseInterceptors(FileInterceptor('file'))
    async import(@UploadedFile() file: Express.Multer.File) {
        if (!file) {
            throw new BadRequestException('File is required');
        }
        return this.importExportService.importTransactions(file);
    }
}