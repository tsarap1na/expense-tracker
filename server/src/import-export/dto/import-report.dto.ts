import { ApiProperty } from '@nestjs/swagger';
import { ImportErrorDto } from './import-error.dto';

export class ImportReportDto {
    @ApiProperty()
    imported!: number;

    @ApiProperty()
    skipped!: number;

    @ApiProperty({ type: [ImportErrorDto] })
    errors!: ImportErrorDto[];
}