import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import { TransactionType } from '@common/enums';
import { PeriodQueryDto } from './period-query.dto';

enum ReportTypeFilter {
    all = 'all',
}

export class CategoryReportQueryDto extends PeriodQueryDto {
    @ApiPropertyOptional({
        enum: [...Object.values(TransactionType), ReportTypeFilter.all],
        default: ReportTypeFilter.all,
    })
    @IsOptional()
    @IsEnum({ ...TransactionType, ...ReportTypeFilter })
    type?: TransactionType | ReportTypeFilter = ReportTypeFilter.all;
}