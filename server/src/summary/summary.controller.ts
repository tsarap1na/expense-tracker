import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { SummaryService } from './summary.service';
import { QuerySummaryDto } from './query-summary.dto';
import { JwtAuthGuard } from '@auth/guards/jwt-auth.guard';
import { CurrentUser } from '@auth/decorators/current-user.decorator';

@ApiTags('summary')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('summary')
export class SummaryController {
    constructor(private readonly summaryService: SummaryService) {}

    @Get()
    @ApiOperation({ summary: 'Get income/expense/balance for a period' })
    getSummary(@CurrentUser() user: { id: number }, @Query() query: QuerySummaryDto) {
        return this.summaryService.getSummary(user.id, query);
    }
}