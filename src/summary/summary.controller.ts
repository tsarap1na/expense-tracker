import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { SummaryService } from './summary.service';
import { QuerySummaryDto } from './query-summary.dto';

@ApiTags('summary')
@Controller('summary')
export class SummaryController {
    constructor(private readonly summaryService: SummaryService) {}

    @Get()
    @ApiOperation({ summary: 'Get income/expense/balance for a period' })
    getSummary(@Query() query: QuerySummaryDto) {
        return this.summaryService.getSummary(query);
    }
}